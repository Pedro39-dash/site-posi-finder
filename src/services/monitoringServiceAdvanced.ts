import { supabase } from "@/integrations/supabase/client";

export interface MonitoringConfig {
  id?: string;
  project_id: string;
  user_id: string;
  monitoring_type: string;
  frequency: string;
  is_active: boolean;
  last_run_at?: string;
  next_run_at?: string;
  settings: any;
  created_at?: string;
  updated_at?: string;
}

export interface MonitoringLog {
  id: string;
  config_id: string;
  execution_type: string;
  status: string;
  results: any;
  error_message?: string;
  execution_time_ms?: number;
  executed_at: string;
}

export interface AutoMonitoringResults {
  total_keywords: number;
  updated: number;
  no_change: number;
  errors: number;
  notifications_created: number;
}

export class MonitoringServiceAdvanced {
  static async getProjectConfigs(projectId: string) {
    const { data, error } = await supabase
      .from('monitoring_configs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    return { success: !error, configs: data || [], error };
  }

  static async createMonitoringConfig(config: Omit<MonitoringConfig, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('monitoring_configs')
      .insert(config)
      .select()
      .single();

    if (!error && data) {
      // Agendar o job automaticamente
      await this.scheduleMonitoringJob(data.id, config.frequency);
    }

    return { success: !error, config: data, error };
  }

  static async updateMonitoringConfig(configId: string, updates: Partial<MonitoringConfig>) {
    const { data, error } = await supabase
      .from('monitoring_configs')
      .update(updates)
      .eq('id', configId)
      .select()
      .single();

    // Se a frequência foi alterada, reagendar o job
    if (!error && updates.frequency) {
      await this.scheduleMonitoringJob(configId, updates.frequency);
    }

    return { success: !error, config: data, error };
  }

  static async deleteMonitoringConfig(configId: string) {
    const { error } = await supabase
      .from('monitoring_configs')
      .delete()
      .eq('id', configId);

    return { success: !error, error };
  }

  static async getMonitoringLogs(configId: string, limit: number = 50) {
    const { data, error } = await supabase
      .from('monitoring_logs')
      .select('*')
      .eq('config_id', configId)
      .order('executed_at', { ascending: false })
      .limit(limit);

    return { success: !error, logs: data || [], error };
  }

  static async triggerManualMonitoring(configId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('auto-monitoring', {
        body: {
          config_id: configId,
          timestamp: new Date().toISOString(),
          manual_trigger: true
        }
      });

      return { success: !error, results: data, error };
    } catch (error: any) {
      console.error('Erro ao executar monitoramento manual:', error);
      return { success: false, error: error.message };
    }
  }

  private static async scheduleMonitoringJob(configId: string, frequency: string) {
    try {
      const { error } = await supabase.rpc('schedule_monitoring_job', {
        _config_id: configId,
        _frequency: frequency
      });

      if (error) {
        console.error('Erro ao agendar job de monitoramento:', error);
      }
    } catch (error) {
      console.error('Erro ao chamar função de agendamento:', error);
    }
  }

  static async getMonitoringStats(projectId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('monitoring_logs')
      .select(`
        *,
        monitoring_configs!inner(project_id)
      `)
      .eq('monitoring_configs.project_id', projectId)
      .gte('executed_at', startDate.toISOString());

    if (error) {
      return { success: false, stats: null, error };
    }

    const stats = {
      total_executions: data.length,
      successful_executions: data.filter(log => log.status === 'completed').length,
      failed_executions: data.filter(log => log.status === 'failed').length,
      average_execution_time: data.reduce((sum, log) => sum + (log.execution_time_ms || 0), 0) / data.length,
      total_keywords_monitored: data.reduce((sum, log) => {
        const results = log.results as any;
        return sum + (results?.total_keywords || 0);
      }, 0),
      total_notifications_created: data.reduce((sum, log) => {
        const results = log.results as any;
        return sum + (results?.notifications_created || 0);
      }, 0)
    };

    return { success: true, stats, error: null };
  }

  static async runPageSpeedAnalysis(url: string, projectId?: string, strategy: 'mobile' | 'desktop' = 'desktop') {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.functions.invoke('pagespeed-analysis', {
        body: {
          url,
          strategy,
          project_id: projectId,
          user_id: user?.id
        }
      });

      return { success: !error, results: data, error };
    } catch (error: any) {
      console.error('Erro na análise PageSpeed:', error);
      return { success: false, error: error.message };
    }
  }

  static async getPerformanceHistory(projectId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('audit_reports')
      .select('*')
      .eq('project_id', projectId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      return { success: false, history: [], error };
    }

    const performanceHistory = data
      .filter(report => {
        const metadata = report.metadata as any;
        return metadata?.type === 'pagespeed_analysis';
      })
      .map(report => {
        const metadata = report.metadata as any;
        return {
          date: report.created_at,
          performance_score: metadata?.metrics?.performance_score || 0,
          seo_score: metadata?.metrics?.seo_score || 0,
          accessibility_score: metadata?.metrics?.accessibility_score || 0,
          best_practices_score: metadata?.metrics?.best_practices_score || 0,
          core_web_vitals: metadata?.core_web_vitals
        };
      });

    return { success: true, history: performanceHistory, error: null };
  }

  static async enableAutomaticMonitoring(projectId: string, settings: {
    ranking_frequency?: string;
    performance_frequency?: string;
    seo_frequency?: string;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const configs = [];
    
    // Configurar monitoramento de ranking
    if (settings.ranking_frequency) {
      configs.push({
        project_id: projectId,
        user_id: user.id,
        monitoring_type: 'ranking' as const,
        frequency: settings.ranking_frequency as any,
        is_active: true,
        settings: {
          check_all_keywords: true,
          alert_threshold: 5,
          create_notifications: true
        }
      });
    }

    // Configurar monitoramento de performance
    if (settings.performance_frequency) {
      configs.push({
        project_id: projectId,
        user_id: user.id,
        monitoring_type: 'performance' as const,
        frequency: settings.performance_frequency as any,
        is_active: true,
        settings: {
          strategies: ['desktop', 'mobile'],
          metrics: ['performance', 'seo', 'accessibility', 'best-practices'],
          alert_on_degradation: true
        }
      });
    }

    // Criar configurações em batch
    const results = await Promise.all(
      configs.map(config => this.createMonitoringConfig(config))
    );

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return {
      success: failed.length === 0,
      created_configs: successful.length,
      failed_configs: failed.length,
      configs: successful.map(r => r.config),
      errors: failed.map(r => r.error)
    };
  }
}