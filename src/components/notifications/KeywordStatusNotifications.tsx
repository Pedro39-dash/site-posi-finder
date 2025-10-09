import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bell } from "lucide-react";

interface KeywordStatusNotificationsProps {
  projectId: string;
}

export const KeywordStatusNotifications = ({ projectId }: KeywordStatusNotificationsProps) => {
  const { toast } = useToast();

  useEffect(() => {
    if (!projectId) return;

    // Subscribe to new notifications for this project
    const channel = supabase
      .channel(`notifications-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          const notification = payload.new as any;
          
          // Only show ranking alerts
          if (notification.type === 'ranking_alert') {
            toast({
              title: notification.title,
              description: notification.message,
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, toast]);

  return null; // This is a notification-only component
};
