import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Settings, BarChart3, AlertTriangle, Eye, RefreshCcw, Flame, ChartPie, FileText, Zap, Link as LinkIcon, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardOverview } from './DashboardOverview';
import { MonitoringService } from '@/services/monitoringService';
import { UserService } from '@/services/userService';
import TrafficChart from '@/components/comparison/TrafficChart';
import { CompetitorAnalysisService, CompetitiveAnalysisData } from '@/services/competitorAnalysisService';
import { useProject } from '@/hooks/useProject';

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
  const [latestAnalysis, setLatestAnalysis] = useState<CompetitiveAnalysisData | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const { activeProject } = useProject();
  const navigate = useNavigate();

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    const fetchLatestAnalysis = async () => {
      if (!activeProject?.id) return;
      
      setLatestAnalysis(null);
      setLoadingAnalysis(true);
      try {
        const { success, analyses } = await CompetitorAnalysisService.getUserAnalyses(1);
        
        if (success && analyses && analyses.length > 0) {
          const latest = analyses[0];
          const { success: dataSuccess, data } = await CompetitorAnalysisService.getAnalysisData(latest.id);
          
          if (dataSuccess && data) {
            setLatestAnalysis(data);
          }
        }
      } catch (error) {
        console.error('Error fetching latest analysis:', error);
      } finally {
        setLoadingAnalysis(false);
      }
    };

    fetchLatestAnalysis();
  }, [activeProject?.id]);

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
          <section className="py-6">
            <div className="container mx-auto">
              <div className="flex justify-between">
                <h1 className="text-3xl font-medium text-foreground mb-4">
                  Painel exclusivo {activeProject?.name || 'ITX Company'} de <span className="font-bold">monitoramento SEO/AIO</span>
                </h1>
                <p className="text-zinc-500 mt-2">
                  Obtenha um prognóstico assertivo do seu site com relação a busca orgânica do Google.
                </p>
              </div>
              <div className="mt-8">
                <div className="flex gap-2 items-center">
                  <span className="text-yellow-950 bg-yellow-500 p-2"><Flame /></span>
                  <h2>
                    Sugestões de SEO/AIO
                  </h2>
                </div>
                <p className="max-width-[1026px] text-zinc-500 mt-2"> 
                  Analisamos seu site e elencamos as principais oportunidades de SEO encontradas. Trabalhe nessas otimizações
                  para melhorar seus posicionamentos e aumentar seu tráfego.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-red-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <FileText className="h-8 w-8 text-red-500 mb-2" />
                      <Badge variant="destructive" className="text-xs">Alta</Badge>
                    </div>
                    <CardTitle className="text-lg">Títulos e Meta Descrições</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm mb-3">
                      5 páginas com títulos duplicados ou muito curtos detectadas
                    </CardDescription>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => navigate('/audit')}
                    >
                      Corrigir Agora
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-orange-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <Zap className="h-8 w-8 text-orange-500 mb-2" />
                      <Badge variant="destructive" className="text-xs">Alta</Badge>
                    </div>
                    <CardTitle className="text-lg">Velocidade de Carregamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm mb-3">
                      Tempo atual: 4.2s (recomendado: &lt;2s). Comprima imagens e ative cache
                    </CardDescription>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => navigate('/audit')}
                    >
                      Ver Detalhes
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-yellow-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <LinkIcon className="h-8 w-8 text-yellow-500 mb-2" />
                      <Badge variant="secondary" className="text-xs">Média</Badge>
                    </div>
                    <CardTitle className="text-lg">Link Building Interno</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm mb-3">
                      12 páginas importantes com poucos links internos encontradas
                    </CardDescription>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => navigate('/audit')}
                    >
                      Otimizar Links
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-dashed border-primary/50 bg-secondary/30">
                  <CardHeader className="pb-3">
                    <ArrowRight className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg">Ver Todas as Sugestões</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm mb-3">
                      Acesse a auditoria completa com todas as oportunidades de melhoria
                    </CardDescription>
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full"
                      onClick={() => navigate('/audit')}
                    >
                      Abrir Auditoria <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
              <div className="mt-8">
                <div className="flex gap-2 items-center">
                  <span className="text-blue-950 bg-blue-500 p-2"><ChartPie /></span>
                  <h2>
                    Trafego estimado
                  </h2>
                </div>
                <p className="max-width-[1026px] text-zinc-500 mt-2"> 
                  O tráfego orgânico estimado com projeção futura baseado nas suas últimas análises competitivas.
                </p>
                {loadingAnalysis ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
                      <p className="text-muted-foreground">Carregando dados...</p>
                    </div>
                  </div>
                ) : latestAnalysis ? (
                  <TrafficChart
                    domains={[
                      latestAnalysis.analysis.target_domain,
                      ...latestAnalysis.competitors.slice(0, 2).map(c => c.domain)
                    ]}
                    targetDomain={latestAnalysis.analysis.target_domain}
                    competitors={latestAnalysis.competitors}
                    keywords={latestAnalysis.keywords}
                    period={30}
                    projectionDays={30}
                  />
                ) : (
                  <Card className="mt-4">
                    <CardContent className="p-12 text-center">
                      <ChartPie className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Nenhuma análise competitiva encontrada ainda
                      </p>
                      <Button onClick={() => navigate('/comparison')}>
                        Criar Primeira Análise
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </section>
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