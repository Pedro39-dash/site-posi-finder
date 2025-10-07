import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { MonitoringService, MonitoringSession } from '@/services/monitoringService';
import { KeywordMetricsService } from '@/services/keywordMetricsService';
import { MonitoringAnalyticsService } from '@/services/monitoringAnalyticsService';
import { quickWinsService } from '@/services/quickWinsService';
import { KeywordDiscoveryService } from '@/services/keywordDiscoveryService';
import { RankingService, KeywordRanking } from '@/services/rankingService';
import { supabase } from '@/integrations/supabase/client';
import { MonitoringSetup } from '@/components/monitoring/MonitoringSetup';
import { MonitoringCard } from '@/components/monitoring/MonitoringCard';
import SimulationNotice from '@/components/SimulationNotice';
import { ScheduleManager } from '@/components/monitoring/ScheduleManager';
import { KeywordSuggestions } from '@/components/ranking/KeywordSuggestions';
import { KeywordManager } from '@/components/monitoring/KeywordManager';
import { MonitoringSummaryCards } from '@/components/monitoring/analytics/MonitoringSummaryCards';
import { KeywordPositionChart } from '@/components/monitoring/analytics/KeywordPositionChart';
import { PositionTrendsSection } from '@/components/monitoring/analytics/PositionTrendsSection';
import { KeywordMetricsSummary } from '@/components/monitoring/KeywordMetricsSummary';
import { KeywordPositionDistributionChart } from '@/components/monitoring/KeywordPositionDistributionChart';
import { PositionChangeTrendChart } from '@/components/monitoring/analytics/PositionChangeTrendChart';
import { DetailedSummaryCards } from '@/components/monitoring/analytics/DetailedSummaryCards';
import { QuickWinsCards } from '@/components/monitoring/insights/QuickWinsCards';
import { AdvancedFiltersPanel } from '@/components/monitoring/filters/AdvancedFiltersPanel';
import { PeriodSelector } from '@/components/monitoring/filters/PeriodSelector';
import { TopPagesTable } from '@/components/monitoring/tables/TopPagesTable';
import { KeywordDetailsTable } from '@/components/monitoring/tables/KeywordDetailsTable';
import { KeywordAnalysisModal } from '@/components/monitoring/analytics/KeywordAnalysisModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProject } from '@/hooks/useProject';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Search as SearchIcon, Globe, TrendingUp, Clock, Monitor } from 'lucide-react';

const Monitoring = () => {
  const [sessions, setSessions] = useState<MonitoringSession[]>([]);
  const [rankings, setRankings] = useState<KeywordRanking[]>([]);
  const { activeProject } = useProject();
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState<any>('30d');
  const [advancedFilters, setAdvancedFilters] = useState<any>({});
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(null);
  const [selectedKeywordName, setSelectedKeywordName] = useState<string>('');
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isCheckingRankings, setIsCheckingRankings] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  // Analytics state
  const [keywordMetrics, setKeywordMetrics] = useState<any>({});
  const [positionDistribution, setPositionDistribution] = useState<any>([]);
  const [dailyMetrics, setDailyMetrics] = useState<any>([]);
  const [trendData, setTrendData] = useState<any>([]);
  const [summaryStats, setSummaryStats] = useState<any>({});
  const [keywordDetails, setKeywordDetails] = useState<any>([]);
  const [pageMetrics, setPageMetrics] = useState<any>([]);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [isLoadingTables, setIsLoadingTables] = useState(true);
  const [quickWinsData, setQuickWinsData] = useState<any>(null);
  const [isLoadingQuickWins, setIsLoadingQuickWins] = useState(true);
  const [discoveryStats, setDiscoveryStats] = useState<any>(null);

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
    setIsLoadingAnalytics(true);
    try {
      // Mock data loading
      setTimeout(() => {
        setKeywordMetrics({ totalKeywords: 120, estimatedTraffic: 5000 });
        setPositionDistribution([{ position: '1-3', count: 30 }, { position: '4-10', count: 40 }]);
        setDailyMetrics([{ date: '2024-01-01', traffic: 150 }, { date: '2024-01-02', traffic: 180 }]);
        setTrendData([{ date: '2024-01-01', position: 5 }, { date: '2024-01-02', position: 4 }]);
        setSummaryStats({ totalChanges: 15, improvements: 8, declines: 7 });
        setIsLoadingAnalytics(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadTables = async () => {
    setIsLoadingTables(true);
    try {
      // Mock data loading
      setTimeout(() => {
        setKeywordDetails([{ keyword: 'example keyword', position: 5, traffic: 50 }]);
        setPageMetrics([{ url: 'example.com', keywords: 10, traffic: 100 }]);
        setIsLoadingTables(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading tables:', error);
    }
  };

  const loadQuickWins = async () => {
    setIsLoadingQuickWins(true);
    try {
      // Mock data loading
      setTimeout(() => {
        setQuickWinsData({ quickWins: 5, atRisk: 3, featuredSnippet: 2, cannibalization: 1 });
        setIsLoadingQuickWins(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading quick wins:', error);
    }
  };

  const loadRankings = async () => {
    if (!activeProject) {
      console.log('⚠️ [loadRankings] No active project');
      return;
    }
    
    const currentProjectId = activeProject.id;
    console.log('🔄 [loadRankings] Iniciando carregamento:', {
      projectId: currentProjectId,
      projectName: activeProject.name,
      timestamp: Date.now()
    });
    
    try {
      const result = await RankingService.getProjectRankings(currentProjectId);
      
      // Log DETALHADO do resultado da API
      console.log('📥 [loadRankings] Resposta da API:', {
        success: result.success,
        count: result.rankings?.length || 0,
        rankings: result.rankings?.map(r => ({
          keyword: r.keyword,
          project_id: r.project_id
        }))
      });
      
      // Verificar se ainda estamos no mesmo projeto
      if (activeProject?.id !== currentProjectId) {
        console.log('⚠️ [loadRankings] Project changed during API call, ignoring results');
        return;
      }
      
      if (result.success) {
        console.log('✅ [loadRankings] Atualizando estado com', result.rankings?.length || 0, 'rankings');
        setRankings(result.rankings || []);
      }
    } catch (error) {
      console.error('❌ [loadRankings] Error:', error);
    }
  };

  const loadSuggestions = async () => {
    if (!activeProject) return;
    try {
      const stats = await KeywordDiscoveryService.getDiscoveryStats(activeProject.id);
      // Get pending suggestions from the database
      const { data } = await supabase
        .from('keyword_suggestions')
        .select('*')
        .eq('project_id', activeProject.id)
        .eq('status', 'pending')
        .order('relevance_score', { ascending: false });
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  useEffect(() => {
    console.log('🔄 [Monitoring] useEffect triggered:', {
      activeProjectId: activeProject?.id,
      activeProjectName: activeProject?.name,
      timestamp: Date.now()
    });
    
    // LIMPEZA SÍNCRONA E IMEDIATA: limpar TODOS os dados antigos ANTES de qualquer operação
    console.log('🧹 [Monitoring] Limpando dados do projeto anterior');
    setSessions([]);
    setRankings([]);
    setSuggestions([]);
    setKeywordMetrics({});
    setPositionDistribution([]);
    setDailyMetrics([]);
    setTrendData([]);
    setSummaryStats({});
    setKeywordDetails([]);
    setPageMetrics([]);
    setQuickWinsData(null);
    
    // Early return se não houver projeto ativo
    if (!activeProject || !activeProject.id) {
      console.log('⚠️ [Monitoring] No active project, skipping data load');
      return;
    }
    
    // Carregar dados do novo projeto
    console.log('📥 [Monitoring] Carregando dados para projeto:', activeProject.id);
    loadSessions();
    loadAnalytics();
    loadTables();
    loadQuickWins();
    loadRankings();
    loadSuggestions();
  }, [activeProject?.id, selectedPeriod]);

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

  const handleCheckRankings = async () => {
    if (!activeProject) return;
    setIsCheckingRankings(true);
    try {
      const { data } = await supabase.functions.invoke('check-rankings', {
        body: { project_id: activeProject.id }
      });
      toast({ title: 'Posições atualizadas', description: data.message });
    } catch (error) {
      toast({ title: 'Erro', variant: 'destructive' });
    } finally {
      setIsCheckingRankings(false);
    }
  };

  const handleDiscoverKeywords = async () => {
    if (!activeProject) return;
    setIsDiscovering(true);
    try {
      await KeywordDiscoveryService.discoverKeywords(activeProject.id);
      await loadSuggestions();
      toast({ title: 'Descoberta concluída' });
    } catch (error) {
      toast({ title: 'Erro', variant: 'destructive' });
    } finally {
      setIsDiscovering(false);
    }
  };

  return (
    <>
      <Helmet><title>Monitoramento SEO</title></Helmet>
      <div className="min-h-screen bg-background lg:pl-80">
        <div className="pt-16 lg:pt-0">
          <main className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-4xl font-bold mb-2">Monitoramento de Rankings</h1>
                <p className="text-muted-foreground">Acompanhe suas posições nos mecanismos de busca</p>
              </div>
              <Button onClick={handleCheckRankings} disabled={isCheckingRankings}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isCheckingRankings ? 'animate-spin' : ''}`} />
                {isCheckingRankings ? 'Verificando...' : 'Verificar Posições Agora'}
              </Button>
            </div>

            {/* Métricas de Keywords */}
            {activeProject && (
              <>
                <KeywordMetricsSummary 
                  rankings={rankings}
                  projectId={activeProject.id}
                  isLoading={isLoading}
                />
                <KeywordPositionDistributionChart 
                  rankings={rankings}
                  isLoading={isLoading}
                />
                <PositionChangeTrendChart
                  projectId={activeProject.id}
                  isLoading={isLoading}
                />
              </>
            )}

            {/* Gerenciamento de Keywords */}
            <KeywordManager
              key={activeProject?.id}
              rankings={rankings}
              projectId={activeProject?.id || ''}
              onRankingsUpdate={loadRankings}
            />

            {/* Descoberta de Keywords */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SearchIcon className="w-5 h-5" />
                  Descoberta de Keywords
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <Button onClick={handleDiscoverKeywords} disabled={isDiscovering}>
                    {isDiscovering ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Descobrindo...
                      </>
                    ) : (
                      <>
                        <SearchIcon className="h-4 w-4 mr-2" />
                        Descobrir Novas Keywords
                      </>
                    )}
                  </Button>
                  {suggestions.length > 0 && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {suggestions.length} sugestões disponíveis
                    </Badge>
                  )}
                </div>
                
                {suggestions.length > 0 && (
                  <KeywordSuggestions
                    suggestions={suggestions}
                    projectId={activeProject?.id || ''}
                    onSuggestionsUpdate={loadSuggestions}
                  />
                )}
              </CardContent>
            </Card>

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
          </main>
        </div>
      </div>
    </>
  );
};

export default Monitoring;
