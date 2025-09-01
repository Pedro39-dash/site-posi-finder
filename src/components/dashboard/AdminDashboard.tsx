import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Settings, BarChart3, AlertTriangle, Eye, RefreshCcw } from 'lucide-react';
import { DashboardOverview } from './DashboardOverview';
import { MonitoringService } from '@/services/monitoringService';
import { UserService } from '@/services/userService';

interface AdminStats {
  totalClients: number;
  totalProjects: number;
  activeMonitoring: number;
  pendingAudits: number;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalClients: 0,
    totalProjects: 0,
    activeMonitoring: 0,
    pendingAudits: 0
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      // Carregar clientes
      const { success: clientsSuccess, clients } = await UserService.getAllClients();
      
      // Carregar notificações
      const { success: notifSuccess, notifications: notifData } = await MonitoringService.getNotifications(10);
      
      if (clientsSuccess && clients) {
        setStats(prev => ({ ...prev, totalClients: clients.length }));
      }
      
      if (notifSuccess) {
        setNotifications(notifData);
      }
      
      // Simular outras estatísticas (seria melhor buscar do banco)
      setStats(prev => ({
        ...prev,
        totalProjects: clients?.length ? clients.length * 2 : 0,
        activeMonitoring: Math.floor((clients?.length || 0) * 1.5),
        pendingAudits: Math.floor((clients?.length || 0) * 0.3)
      }));
      
    } catch (error) {
      console.error('Erro ao carregar dados admin:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema e gerenciamento de clientes
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Settings className="w-3 h-3" />
          Administrador
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalClients}</div>
                <p className="text-xs text-muted-foreground">
                  Clientes cadastrados no sistema
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Projetos</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProjects}</div>
                <p className="text-xs text-muted-foreground">
                  Projetos criados pelos clientes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monitoramento Ativo</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeMonitoring}</div>
                <p className="text-xs text-muted-foregrounde">
                  Sessões de monitoramento ativas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Auditorias Pendentes</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingAudits}</div>
                <p className="text-xs text-muted-foreground">
                  Auditorias aguardando processamento
                </p>
              </CardContent>
            </Card>
          </div>

          <DashboardOverview />
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Clientes</CardTitle>
              <CardDescription>
                Visualizar e gerenciar todos os clientes do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Interface de gerenciamento de clientes será implementada em breve
                </p>
                <Button variant="outline" className="mt-4" onClick={loadAdminData}>
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Atualizar Dados  
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status do Monitoramento</CardTitle>
              <CardDescription>
                Acompanhar todas as sessões de monitoramento do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Interface de monitoramento global será implementada em breve
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Notificações Recentes</CardTitle>
                <CardDescription>
                  Últimas notificações do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {notifications.length > 0 ? (
                  notifications.slice(0, 5).map((notification) => (
                    <div key={notification.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <AlertTriangle className="w-4 h-4 mt-0.5 text-yellow-500" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-xs text-muted-foreground">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhuma notificação encontrada
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status dos Serviços</CardTitle>
                <CardDescription>
                  Status atual dos serviços do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">API de Auditoria</span>
                  <Badge variant="outline" className="text-green-600">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-1" />
                    Online
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Monitoramento</span>
                  <Badge variant="outline" className="text-green-600">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-1" />
                    Online
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Análise Competitiva</span>
                  <Badge variant="outline" className="text-yellow-600">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1" />
                    Parcial
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Notificações</span>
                  <Badge variant="outline" className="text-green-600">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-1" />
                    Online
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};