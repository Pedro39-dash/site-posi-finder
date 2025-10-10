import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Flame, ChartPie, FileText, Zap, Link as LinkIcon, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardOverview } from './DashboardOverview';
import { MonitoringCard } from '../monitoring/MonitoringCard';
import { MonitoringSetup } from '../monitoring/MonitoringSetup';
import { MonitoringService, MonitoringSession, Notification } from '@/services/monitoringService';
import { useProject } from '@/hooks/useProject';
import { useToast } from '@/hooks/use-toast';
import TrafficChart from '@/components/comparison/TrafficChart';
import { CompetitorAnalysisService, CompetitiveAnalysisData } from '@/services/competitorAnalysisService';

interface ClientStats {
  totalKeywords: number;
  topPositions: number;
  recentChanges: number;
  nextCheck: string;
}

export const ClientDashboard: React.FC = () => {
  const [monitoringSessions, setMonitoringSessions] = useState<MonitoringSession[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<ClientStats>({
    totalKeywords: 0,
    topPositions: 0,
    recentChanges: 0,
    nextCheck: 'N/A'
  });
  const [latestAnalysis, setLatestAnalysis] = useState<CompetitiveAnalysisData | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const { activeProject } = useProject();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Limpar dados antigos
    setMonitoringSessions([]);
    setNotifications([]);
    setUnreadCount(0);
    
    if (activeProject) {
      loadClientData();
    }
  }, [activeProject?.id]);

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
        
        // Calcular estatísticas do cliente
        const activeSessions = sessions.filter(s => s.status === 'active');
        const nextCheckDate = activeSessions.length > 0 && activeSessions[0].next_check_at
          ? new Date(activeSessions[0].next_check_at).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })
          : 'N/A';
        
        setStats({
          totalKeywords: sessions.length * 10, // Estimativa
          topPositions: Math.floor(sessions.length * 3), // Estimativa
          recentChanges: Math.floor(sessions.length * 2), // Estimativa
          nextCheck: nextCheckDate
        });
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
    </div>
  );
};