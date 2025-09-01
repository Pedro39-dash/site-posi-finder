import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationService, Notification } from '@/services/notificationService';

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
      setupRealtimeSubscription();
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { success, notifications: loadedNotifications, error } = await NotificationService.getUserNotifications(user.id);
      
      if (success && loadedNotifications) {
        setNotifications(loadedNotifications);
        setUnreadCount(loadedNotifications.filter(n => !n.is_read).length);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;

    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Reload notifications when new ones arrive
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationId: string) => {
    const { success } = await NotificationService.markAsRead(notificationId);
    
    if (success) {
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    return success;
  };

  const markAllAsRead = async () => {
    if (!user) return false;
    
    const { success } = await NotificationService.markAllAsRead(user.id);
    
    if (success) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
    
    return success;
  };

  const createNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'user_id' | 'is_read'>) => {
    if (!user) return { success: false };
    
    return await NotificationService.createNotification(user.id, notification);
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    createNotification,
  };
};