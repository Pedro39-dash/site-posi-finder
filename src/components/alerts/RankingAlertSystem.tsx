import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationService } from '@/services/notificationService';
import { useToast } from '@/components/ui/use-toast';

export const RankingAlertSystem: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    // Subscribe to keyword ranking changes
    const channel = supabase
      .channel('ranking-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'keyword_rankings'
        },
        async (payload) => {
          const newData = payload.new as any;
          const oldData = payload.old as any;

          // Check if position actually changed
          if (newData.current_position !== oldData.current_position) {
            // Get project info to check if it belongs to current user
            const { data: project } = await supabase
              .from('projects')
              .select('user_id, name')
              .eq('id', newData.project_id)
              .single();

            if (project && project.user_id === user.id) {
              // Create notification for ranking change
              await NotificationService.createRankingChangeNotification(
                user.id,
                newData.project_id,
                newData.keyword,
                oldData.current_position,
                newData.current_position
              );

              // Show immediate toast for significant changes
              const change = oldData.current_position - newData.current_position;
              if (Math.abs(change) >= 5) {
                const isImprovement = change > 0;
                toast({
                  title: isImprovement ? '🎉 Grande Melhoria!' : '⚠️ Queda Significativa',
                  description: `"${newData.keyword}" ${isImprovement ? 'subiu' : 'caiu'} ${Math.abs(change)} posições`,
                  variant: isImprovement ? 'default' : 'destructive',
                });
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  // This component doesn't render anything, it just sets up subscriptions
  return null;
};