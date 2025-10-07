import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Play, Pause, BarChart3, Bell, TrendingUp } from 'lucide-react';
import { DashboardOverview } from './DashboardOverview';
import { MonitoringCard } from '../monitoring/MonitoringCard';
import { MonitoringSetup } from '../monitoring/MonitoringSetup';
import { MonitoringService, MonitoringSession, Notification } from '@/services/monitoringService';
import { useProject } from '@/hooks/useProject';
import { useToast } from '@/hooks/use-toast';

export const ClientDashboard: React.FC = () => {
  const [monitoringSessions, setMonitoringSessions] = useState<MonitoringSession[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { activeProject } = useProject();
  const { toast } = useToast();

  useEffect(() => {
    // Limpar dados antigos
    setMonitoringSessions([]);
    setNotifications([]);
    setUnreadCount(0);
    
    if (activeProject) {
      loadClientData();
    }
  }, [activeProject?.id]);

  const loadClientData = async () => {
    setIsLoading(true);
    try {
      // Carregar sessões de monitoramento
      const { success: sessionSuccess, sessions } = await MonitoringService.getMonitoringSessions(
        activeProject?.id
      );
      
      // Carregar notificações
      const { success: notifSuccess, notifications: notifData } = await MonitoringService.getNotifications(10);
      
      // Contar notificações não lidas
      const { success: countSuccess, count } = await MonitoringService.getUnreadNotificationsCount();
      
      if (sessionSuccess) {
        setMonitoringSessions(sessions);
      }
      
      if (notifSuccess) {
        setNotifications(notifData);
      }
      
      if (countSuccess) {
        setUnreadCount(count);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do cliente:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (sessionId: string, newStatus: 'active' | 'paused' | 'stopped') => {
    try {
      const { success, error } = await MonitoringService.updateMonitoringSession(sessionId, {
        status: newStatus
      });

      if (success) {
        toast({
          title: "Sucesso",
          description: `Status do monitoramento alterado para ${newStatus}`,
        });
        loadClientData();
      } else {
        toast({
          title: "Erro",
          description: error || "Erro ao alterar status",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao alterar status",
        variant: "destructive",
      });
    }
  };

  const handleSettings = (session: MonitoringSession) => {
    // TODO: Implementar modal de configurações
    toast({
      title: "Em desenvolvimento",
      description: "Modal de configurações será implementado em breve",
    });
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { success } = await MonitoringService.markNotificationAsRead(notificationId);
      if (success) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meu Dashboard</h1>
          <p className="text-muted-foreground">
            {activeProject ? `Projeto ativo: ${activeProject.name}` : 'Selecione um projeto'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Bell className="w-3 h-3" />
              {unreadCount}
            </Badge>
          )}
          <Badge variant="outline" className="flex items-center gap-1">
            <User className="w-3 h-3" />
            Cliente
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <DashboardOverview />
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          {monitoringSessions.length === 0 ? (
            <MonitoringSetup onSetupComplete={loadClientData} />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Sessões de Monitoramento</h2>
                <Button variant="outline" onClick={loadClientData}>
                  Atualizar
                </Button>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                {monitoringSessions.map((session) => (
                  <MonitoringCard
                    key={session.id}
                    session={session}
                    onStatusChange={handleStatusChange}
                    onSettings={handleSettings}
                  />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {unreadCount} não lidas
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Acompanhe todas as atualizações dos seus projetos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      !notification.is_read ? 'bg-muted/50' : ''
                    }`}
                    onClick={() => !notification.is_read && markNotificationAsRead(notification.id)}
                  >
                    <div className="mt-1">
                      {notification.type === 'ranking_change' && <TrendingUp className="w-4 h-4 text-blue-500" />}
                      {notification.type === 'audit_complete' && <BarChart3 className="w-4 h-4 text-green-500" />}
                      {notification.type === 'alert_triggered' && <Bell className="w-4 h-4 text-yellow-500" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{notification.title}</p>
                        {!notification.is_read && (
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(notification.created_at)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {notification.priority}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma notificação encontrada
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios</CardTitle>
              <CardDescription>
                Gere e baixe relatórios detalhados dos seus projetos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Sistema de relatórios será implementado em breve
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};