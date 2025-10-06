import { Helmet } from "react-helmet-async";
import { MonitoringSetup } from "@/components/monitoring/MonitoringSetup";
import { MonitoringCard } from "@/components/monitoring/MonitoringCard";
import TrendChart from "@/components/monitoring/TrendChart";
import SimulationNotice from "@/components/SimulationNotice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, TrendingUp, Clock, Globe } from "lucide-react";
import { useEffect, useState } from "react";
import { MonitoringService, MonitoringSession } from "@/services/monitoringService";
import { useProject } from "@/hooks/useProject";
import { useToast } from "@/hooks/use-toast";
import { MonitoringSummaryCards } from "@/components/monitoring/analytics/MonitoringSummaryCards";
import { KeywordPositionChart } from "@/components/monitoring/analytics/KeywordPositionChart";
import { PositionTrendsSection } from "@/components/monitoring/analytics/PositionTrendsSection";
import { DetailedSummaryCards } from "@/components/monitoring/analytics/DetailedSummaryCards";
import { PeriodSelector, PeriodOption } from "@/components/monitoring/filters/PeriodSelector";
import { PositionFilters, PositionRange } from "@/components/monitoring/filters/PositionFilters";
import { MonitoringAnalyticsService, KeywordMetrics, PositionDistribution, DailyMetrics, TrendData, SummaryStats } from "@/services/monitoringAnalyticsService";

const Monitoring = () => {
  const [sessions, setSessions] = useState<MonitoringSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { activeProject } = useProject();
  const { toast } = useToast();

  // Analytics state
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('30d');
  const [selectedPosition, setSelectedPosition] = useState<PositionRange>('all');
  const [keywordMetrics, setKeywordMetrics] = useState<KeywordMetrics>({
    totalKeywords: 0,
    estimatedTraffic: 0,
    previousTotalKeywords: 0,
    previousEstimatedTraffic: 0,
    changePercentageKeywords: 0,
    changePercentageTraffic: 0,
  });
  const [positionDistribution, setPositionDistribution] = useState<PositionDistribution[]>([]);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetrics[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    totalChanges: 0,
    improvements: 0,
    declines: 0,
    serpChanges: 0,
    newKeywords: 0,
    lostKeywords: 0,
  });
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const { success, sessions: data } = await MonitoringService.getMonitoringSessions(
        activeProject?.id
      );
      if (success) {
        setSessions(data);
      }
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    if (!activeProject?.id) return;
    
    setIsLoadingAnalytics(true);
    try {
      const days = parseInt(selectedPeriod.replace('d', ''));
      
      const [metrics, distribution, daily, trends, stats] = await Promise.all([
        MonitoringAnalyticsService.getKeywordMetrics(activeProject.id, days),
        MonitoringAnalyticsService.getPositionDistribution(activeProject.id, days),
        MonitoringAnalyticsService.getDailyMetrics(activeProject.id, days),
        MonitoringAnalyticsService.getTrendData(activeProject.id, days),
        MonitoringAnalyticsService.getSummaryStats(activeProject.id, days),
      ]);

      setKeywordMetrics(metrics);
      setPositionDistribution(distribution);
      setDailyMetrics(daily);
      setTrendData(trends);
      setSummaryStats(stats);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    loadSessions();
    loadAnalytics();
  }, [activeProject, selectedPeriod]);

  const handleSetupComplete = () => {
    loadSessions();
    toast({
      title: "Sucesso",
      description: "Monitoramento configurado com sucesso!",
    });
  };

  const handleStatusChange = async (id: string, status: 'active' | 'paused' | 'stopped') => {
    try {
      const { success } = await MonitoringService.updateMonitoringSession(id, { status });
      if (success) {
        loadSessions();
        toast({
          title: "Status atualizado",
          description: `Monitoramento ${status === 'active' ? 'iniciado' : status === 'paused' ? 'pausado' : 'parado'}`,
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do monitoramento",
        variant: "destructive"
      });
    }
  };

  const handleSettings = (session: MonitoringSession) => {
    toast({
      title: "Em breve",
      description: "Configurações avançadas em desenvolvimento",
    });
  };

  const getStats = () => {
    const activeSessions = sessions.filter(s => s.status === 'active').length;
    const totalSessions = sessions.length;
    const recentlyChecked = sessions.filter(s => 
      s.last_check_at && 
      Date.now() - new Date(s.last_check_at).getTime() < 24 * 60 * 60 * 1000
    ).length;

    return { activeSessions, totalSessions, recentlyChecked };
  };

  const stats = getStats();

  return (
    <>
      <Helmet>
        <title>Monitoramento SEO - SEO Dashboard</title>
        <meta 
          name="description" 
          content="Configure o monitoramento automático das posições SEO do seu site. Acompanhe a evolução das suas palavras-chave ao longo do tempo." 
        />
        <meta name="keywords" content="monitoramento seo, tracking posições, análise histórica, seo automático" />
        <link rel="canonical" href="/monitoring" />
      </Helmet>

      <div className="min-h-screen bg-background lg:pl-80">
        <div className="pt-16 lg:pt-0">
          <main className="container mx-auto px-4 py-8">
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-foreground flex items-center justify-center gap-3">
                  <Monitor className="h-10 w-10 text-primary" />
                  Monitoramento SEO
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Configure o acompanhamento automático das posições do seu site e 
                  monitore a evolução das suas palavras-chave ao longo do tempo.
                </p>
              </div>

              <SimulationNotice />

              {/* Header: Summary Cards */}
              <MonitoringSummaryCards
                totalKeywords={keywordMetrics.totalKeywords}
                estimatedTraffic={keywordMetrics.estimatedTraffic}
                changePercentageKeywords={keywordMetrics.changePercentageKeywords}
                changePercentageTraffic={keywordMetrics.changePercentageTraffic}
                dailyMetrics={dailyMetrics}
                isLoading={isLoadingAnalytics}
              />

              {/* Filters */}
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
                <PeriodSelector 
                  value={selectedPeriod} 
                  onChange={setSelectedPeriod} 
                />
                <PositionFilters 
                  value={selectedPosition} 
                  onChange={setSelectedPosition}
                />
              </div>

              {/* Main Chart */}
              <KeywordPositionChart 
                data={positionDistribution}
                isLoading={isLoadingAnalytics}
              />

              {/* Trends Section */}
              <PositionTrendsSection 
                data={trendData}
                isLoading={isLoadingAnalytics}
              />

              {/* Detailed Summary Cards */}
              <DetailedSummaryCards 
                stats={summaryStats}
                isLoading={isLoadingAnalytics}
              />

              {/* Stats Cards */}
              {sessions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Sessões Ativas</CardTitle>
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-primary">{stats.activeSessions}</div>
                      <p className="text-xs text-muted-foreground">
                        de {stats.totalSessions} total
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Monitoramentos</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-primary">{stats.totalSessions}</div>
                      <p className="text-xs text-muted-foreground">
                        configurados
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Verificações Recentes</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-primary">{stats.recentlyChecked}</div>
                      <p className="text-xs text-muted-foreground">
                        nas últimas 24h
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Setup Form */}
              <MonitoringSetup onSetupComplete={handleSetupComplete} />

              {/* Monitoring Sessions */}
              {sessions.length > 0 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-foreground">
                    Sessões de Monitoramento ({sessions.length})
                  </h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {sessions.map(session => (
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

              {sessions.length === 0 && !isLoading && (
                <Card className="text-center p-8">
                  <CardContent>
                    <Monitor className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma sessão de monitoramento</h3>
                    <p className="text-muted-foreground">
                      Configure seu primeiro monitoramento usando o formulário acima.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default Monitoring;