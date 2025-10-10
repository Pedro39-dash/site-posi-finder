import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { RankingService, KeywordRanking } from '@/services/rankingService';
import { KeywordManager } from '@/components/monitoring/KeywordManager';
import { KeywordMetricsSummary } from '@/components/monitoring/KeywordMetricsSummary';
import KeywordPositionHistoryChart from '@/components/monitoring/KeywordPositionHistoryChart';
import { useProject } from '@/hooks/useProject';
import IntegrationStatusBanner from '@/components/integrations/IntegrationStatusBanner';
import { IntegrationService, ProjectIntegration } from '@/services/integrationService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, Download, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { GSCKeywordImportModal } from '@/components/monitoring/GSCKeywordImportModal';
import { useToast } from '@/hooks/use-toast';
import { PeriodSelector, PeriodOption } from '@/components/monitoring/filters/PeriodSelector';
import { KeywordStatusNotifications } from '@/components/notifications/KeywordStatusNotifications';
import { KeywordRelevance } from '@/services/keywordRelevanceService';

const Monitoring = () => {
  const [rankings, setRankings] = useState<KeywordRanking[]>([]);
  const { activeProject } = useProject();
  const [isLoading, setIsLoading] = useState(true);
  const [integrations, setIntegrations] = useState<ProjectIntegration[]>([]);
  const [selectedForChart, setSelectedForChart] = useState<string[]>([]);
  const [showIntegrationPrompt, setShowIntegrationPrompt] = useState(false);
  const [showGSCImportModal, setShowGSCImportModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('28d');
  const [keywordRelevance, setKeywordRelevance] = useState<Map<string, KeywordRelevance>>(new Map());
  const { toast } = useToast();

  const loadRankings = async () => {
    if (!activeProject) {
      console.log('⚠️ [loadRankings] No active project');
      return;
    }
    
    const currentProjectId = activeProject.id;
    console.log('🔄 [loadRankings] Iniciando carregamento:', {
      projectId: currentProjectId,
      projectName: activeProject.name,
      period: selectedPeriod,
      timestamp: Date.now()
    });
    
    setIsLoading(true);
    try {
      const result = await RankingService.getProjectRankings(currentProjectId, selectedPeriod);
      
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
    } finally {
      setIsLoading(false);
    }
  };


  const loadIntegrations = async () => {
    if (!activeProject) return;
    const result = await IntegrationService.getProjectIntegrations(activeProject.id);
    if (result.success && result.integrations) {
      setIntegrations(result.integrations);
    }
  };

  const checkHistoryStatus = async () => {
    if (!activeProject?.id || rankings.length === 0) return;

    const { count } = await supabase
      .from('ranking_history')
      .select('*', { count: 'exact', head: true })
      .in('keyword_ranking_id', rankings.map(r => r.id));

    const hasGSC = IntegrationService.hasIntegration(integrations, 'search_console');

    if ((count || 0) < 7 && !hasGSC && rankings.length > 0) {
      setShowIntegrationPrompt(true);
    }
  };

  const handleManualSync = async () => {
    if (!activeProject?.id) return;

    const hasGSC = IntegrationService.hasIntegration(integrations, 'search_console');
    if (!hasGSC) {
      toast({
        title: "Integração necessária",
        description: "Conecte o Google Search Console para sincronizar dados históricos",
        variant: "destructive"
      });
      return;
    }

    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-search-console', {
        body: { 
          projectId: activeProject.id,
          period: selectedPeriod 
        }
      });

      if (error) throw error;

      const inactive = data.inactive || 0;
      const synced = data.synced || 0;
      
      toast({
        title: "Sincronização concluída",
        description: `${synced} keywords ativas${inactive > 0 ? `, ${inactive} inativas` : ''}`,
      });

      // Reload rankings after sync
      await loadRankings();
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast({
        title: "Erro na sincronização",
        description: "Falha ao sincronizar dados do Search Console",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    console.log('🔄 [Monitoring] useEffect triggered:', {
      activeProjectId: activeProject?.id,
      activeProjectName: activeProject?.name,
      selectedPeriod: selectedPeriod,
      timestamp: Date.now()
    });
    
    // LIMPEZA SÍNCRONA E IMEDIATA: limpar dados antigos ANTES de qualquer operação
    console.log('🧹 [Monitoring] Limpando dados do projeto anterior');
    setRankings([]);
    setIntegrations([]);
    
    // Early return se não houver projeto ativo
    if (!activeProject || !activeProject.id) {
      console.log('⚠️ [Monitoring] No active project, skipping data load');
      setIsLoading(false);
      return;
    }
    
    // Carregar dados do novo projeto
    console.log('📥 [Monitoring] Carregando dados para projeto:', activeProject.id);
    loadRankings();
    loadIntegrations();
  }, [activeProject?.id, selectedPeriod]);

  useEffect(() => {
    if (rankings.length > 0 && integrations.length > 0) {
      checkHistoryStatus();
    }
  }, [rankings, integrations]);

  // Auto-open GSC import modal on first connection
  useEffect(() => {
    const checkFirstGSCConnection = async () => {
      if (!activeProject?.id) return;

      const hasGSC = IntegrationService.hasIntegration(integrations, 'search_console');
      const hasKeywords = rankings.length > 0;

      // If GSC is connected and no keywords exist, auto-open modal
      if (hasGSC && !hasKeywords) {
        const lastShown = localStorage.getItem(`gsc-import-shown-${activeProject.id}`);
        
        if (!lastShown) {
          setTimeout(() => {
            setShowGSCImportModal(true);
            localStorage.setItem(`gsc-import-shown-${activeProject.id}`, 'true');
          }, 1000);
        }
      }
    };

    checkFirstGSCConnection();
  }, [activeProject, integrations, rankings]);

  return (
    <>
      <Helmet><title>Monitoramento SEO</title></Helmet>
      {activeProject && <KeywordStatusNotifications projectId={activeProject.id} />}
      <div className="min-h-screen bg-background pl-4">
        <div className="pt-16 lg:pt-0">
          <main className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">Monitoramento de Rankings</h1>
              <p className="text-muted-foreground">Acompanhe suas posições nos mecanismos de busca</p>
            </div>

            {/* Botões de Sincronização do GSC */}
            {activeProject && IntegrationService.hasIntegration(integrations, 'search_console') && (
              <div className="flex gap-2 mb-4">
                <Button 
                  onClick={() => setShowGSCImportModal(true)}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Importar Keywords
                </Button>
                <Button 
                  onClick={handleManualSync}
                  variant="outline"
                  disabled={isSyncing || rankings.length === 0}
                  className="flex-1"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Sincronizando...' : 'Sincronizar Histórico'}
                </Button>
              </div>
            )}

            {/* Banner de Integração */}
            {activeProject && (
              <>
                <IntegrationStatusBanner 
                  projectId={activeProject.id}
                  integrations={integrations}
                />

                {showIntegrationPrompt && (
                  <Alert className="mb-6">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Maximize seu histórico de dados</AlertTitle>
                    <AlertDescription>
                      <p className="mb-3">
                        Conecte o Google Search Console para importar até <strong>16 meses</strong> de dados históricos.
                        Sem a integração, construiremos o histórico a partir de hoje usando SerpAPI.
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => IntegrationService.startOAuthFlow(activeProject.id, 'search_console')}
                        >
                          Conectar Search Console
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setShowIntegrationPrompt(false)}
                        >
                          Continuar sem integração
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            {/* Métricas de Keywords */}
            {activeProject && (
              <>
                <KeywordMetricsSummary
                  rankings={rankings}
                  projectId={activeProject.id}
                  isLoading={isLoading}
                />
                
                {/* Seletor de Período */}
                <div className="mb-4">
                  <PeriodSelector value={selectedPeriod} onChange={setSelectedPeriod} />
                </div>

                <KeywordPositionHistoryChart 
                  selectedKeywords={selectedForChart}
                  projectId={activeProject.id}
                  isLoading={isLoading}
                  period={selectedPeriod}
                  keywordRelevance={keywordRelevance}
                />
              </>
            )}

            {/* Gerenciamento de Keywords */}
      <KeywordManager
        key={activeProject?.id}
        rankings={rankings}
        projectId={activeProject?.id || ''}
        onRankingsUpdate={loadRankings}
        selectedForChart={selectedForChart}
        onChartSelectionChange={setSelectedForChart}
        period={selectedPeriod}
        keywordRelevance={keywordRelevance}
        onRelevanceCalculated={setKeywordRelevance}
      />

      {/* Modal de Importação GSC */}
      <GSCKeywordImportModal
        isOpen={showGSCImportModal}
        onClose={() => setShowGSCImportModal(false)}
        projectId={activeProject?.id || ''}
        onImportComplete={() => {
          loadRankings();
          setShowGSCImportModal(false);
        }}
        autoSelectTop50={rankings.length === 0}
      />
          </main>
        </div>
      </div>
    </>
  );
};

export default Monitoring;
