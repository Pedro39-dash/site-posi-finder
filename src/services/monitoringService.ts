import { supabase } from '@/integrations/supabase/client';

export interface MonitoringSession {
  id: string;
  project_id: string;
  user_id: string;
  status: 'active' | 'paused' | 'stopped';
  monitoring_frequency: 'daily' | 'weekly' | 'monthly';
  last_check_at?: string;
  next_check_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  project_id?: string;
  type: 'ranking_change' | 'audit_complete' | 'alert_triggered' | 'system';
  title: string;
  message: string;
  is_read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  action_url?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface DashboardMetric {
  id: string;
  user_id: string;
  project_id?: string;
  metric_type: 'total_keywords' | 'avg_position' | 'visibility_score' | 'ranking_changes';
  current_value: number;
  previous_value?: number;
  change_percentage?: number;
  period_type: 'daily' | 'weekly' | 'monthly';
  recorded_at: string;
  metadata: Record<string, any>;
}

export class MonitoringService {
  // Monitoring Sessions
  static async createMonitoringSession(data: {
    project_id: string;
    monitoring_frequency: 'daily' | 'weekly' | 'monthly';
    metadata?: Record<string, any>;
  }) {
    try {
      const { data: result, error } = await supabase
        .from('monitoring_sessions')
        .insert({
          ...data,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          metadata: data.metadata || {}
        })
        .select()
        .single();

      return { success: !error, session: result, error: error?.message };
    } catch (error) {
      return { success: false, error: 'Erro ao criar sessão de monitoramento' };
    }
  }

  static async getMonitoringSessions(projectId?: string) {
    try {
      let query = supabase
        .from('monitoring_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      return { success: !error, sessions: data || [], error: error?.message };
    } catch (error) {
      return { success: false, sessions: [], error: 'Erro ao buscar sessões' };
    }
  }

  static async updateMonitoringSession(id: string, updates: Partial<MonitoringSession>) {
    try {
      const { data, error } = await supabase
        .from('monitoring_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      return { success: !error, session: data, error: error?.message };
    } catch (error) {
      return { success: false, error: 'Erro ao atualizar sessão' };
    }
  }

  // Notifications
  static async getNotifications(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      return { success: !error, notifications: data || [], error: error?.message };
    } catch (error) {
      return { success: false, notifications: [], error: 'Erro ao buscar notificações' };
    }
  }

  static async markNotificationAsRead(id: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      return { success: !error, error: error?.message };
    } catch (error) {
      return { success: false, error: 'Erro ao marcar notificação como lida' };
    }
  }

  static async getUnreadNotificationsCount() {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      return { success: !error, count: count || 0, error: error?.message };
    } catch (error) {
      return { success: false, count: 0, error: 'Erro ao contar notificações' };
    }
  }

  // Dashboard Metrics
  static async getDashboardMetrics(projectId?: string, period = 'daily') {
    try {
      let query = supabase
        .from('dashboard_metrics')
        .select('*')
        .eq('period_type', period)
        .order('recorded_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      return { success: !error, metrics: data || [], error: error?.message };
    } catch (error) {
      return { success: false, metrics: [], error: 'Erro ao buscar métricas' };
    }
  }

  static async calculateMetrics(projectId?: string, period = 'daily') {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      const { error } = await supabase.rpc('calculate_dashboard_metrics', {
        _user_id: user.data.user.id,
        _project_id: projectId,
        _period_type: period
      });

      return { success: !error, error: error?.message };
    } catch (error) {
      return { success: false, error: 'Erro ao calcular métricas' };
    }
  }

  // Real-time subscriptions
  static subscribeToNotifications(callback: (notification: Notification) => void) {
    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => callback(payload.new as Notification)
      )
      .subscribe();
  }

  static subscribeToMetrics(callback: (metric: DashboardMetric) => void) {
    return supabase
      .channel('dashboard_metrics')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dashboard_metrics'
        },
        (payload) => callback(payload.new as DashboardMetric)
      )
      .subscribe();
  }
}