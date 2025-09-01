import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationPriority = 'low' | 'medium' | 'high';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  is_read: boolean;
  created_at: string;
  action_url?: string;
  metadata?: any;
  user_id: string;
  project_id?: string;
}

type DatabaseNotification = Database['public']['Tables']['notifications']['Row'];

// Type guards and casting utilities
const isValidNotificationType = (type: string): type is NotificationType => {
  return ['info', 'success', 'warning', 'error'].includes(type);
};

const isValidNotificationPriority = (priority: string): priority is NotificationPriority => {
  return ['low', 'medium', 'high'].includes(priority);
};

const castToNotification = (dbNotification: DatabaseNotification): Notification => {
  return {
    id: dbNotification.id,
    title: dbNotification.title,
    message: dbNotification.message,
    type: isValidNotificationType(dbNotification.type) ? dbNotification.type : 'info',
    priority: isValidNotificationPriority(dbNotification.priority) ? dbNotification.priority : 'medium',
    is_read: dbNotification.is_read || false,
    created_at: dbNotification.created_at,
    action_url: dbNotification.action_url || undefined,
    metadata: dbNotification.metadata || undefined,
    user_id: dbNotification.user_id,
    project_id: dbNotification.project_id || undefined,
  };
};

export class NotificationService {
  static async getUserNotifications(userId: string): Promise<{ success: boolean; notifications?: Notification[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        return { success: false, error: error.message };
      }

      const notifications = data.map(castToNotification);
      return { success: true, notifications };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async createNotification(
    userId: string,
    notification: Omit<Notification, 'id' | 'created_at' | 'user_id' | 'is_read'>
  ): Promise<{ success: boolean; notification?: Notification; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority,
          action_url: notification.action_url,
          metadata: notification.metadata,
          project_id: notification.project_id,
          is_read: false
        }])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, notification: castToNotification(data) };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async markAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async markAllAsRead(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Auto-notification for ranking changes
  static async createRankingChangeNotification(
    userId: string,
    projectId: string,
    keyword: string,
    oldPosition: number | null,
    newPosition: number | null
  ): Promise<{ success: boolean; error?: string }> {
    try {
      let type: NotificationType = 'info';
      let priority: NotificationPriority = 'medium';
      let title = '';
      let message = '';

      if (oldPosition === null && newPosition !== null) {
        // New ranking
        type = 'success';
        priority = 'low';
        title = 'Nova Posição Detectada';
        message = `A palavra-chave "${keyword}" agora está na posição ${newPosition}`;
      } else if (oldPosition !== null && newPosition !== null) {
        const change = oldPosition - newPosition;
        
        if (change > 0) {
          // Improved ranking
          type = 'success';
          priority = change >= 5 ? 'high' : 'medium';
          title = 'Melhoria no Ranking!';
          message = `"${keyword}" subiu ${change} posições (${oldPosition}° → ${newPosition}°)`;
        } else if (change < 0) {
          // Declined ranking
          type = 'warning';
          priority = Math.abs(change) >= 5 ? 'high' : 'medium';
          title = 'Queda no Ranking';
          message = `"${keyword}" caiu ${Math.abs(change)} posições (${oldPosition}° → ${newPosition}°)`;
        }
      } else if (oldPosition !== null && newPosition === null) {
        // Lost ranking
        type = 'error';
        priority = 'high';
        title = 'Posição Perdida';
        message = `A palavra-chave "${keyword}" saiu do ranking (era ${oldPosition}°)`;
      }

      if (title && message) {
        return await this.createNotification(userId, {
          title,
          message,
          type,
          priority,
          project_id: projectId,
          action_url: `/rankings?project=${projectId}`,
          metadata: {
            keyword,
            old_position: oldPosition,
            new_position: newPosition,
            change: oldPosition && newPosition ? oldPosition - newPosition : 0
          }
        });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}