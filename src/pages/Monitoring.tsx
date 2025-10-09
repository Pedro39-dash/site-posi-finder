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
import { Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Monitoring = () => {
  const [rankings, setRankings] = useState<KeywordRanking[]>([]);
  const { activeProject } = useProject();
  const [isLoading, setIsLoading] = useState(true);
  const [integrations, setIntegrations] = useState<ProjectIntegration[]>([]);
  const [selectedForChart, setSelectedForChart] = useState<string[]>([]);
  const [showIntegrationPrompt, setShowIntegrationPrompt] = useState(false);

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
    
    setIsLoading(true);
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

  useEffect(() => {
    console.log('🔄 [Monitoring] useEffect triggered:', {
      activeProjectId: activeProject?.id,
      activeProjectName: activeProject?.name,
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
  }, [activeProject?.id]);

  useEffect(() => {
    if (rankings.length > 0 && integrations.length > 0) {
      checkHistoryStatus();
    }
  }, [rankings, integrations]);

  return (
    <>
      <Helmet><title>Monitoramento SEO</title></Helmet>
      <div className="min-h-screen bg-background lg:pl-80">
        <div className="pt-16 lg:pt-0">
          <main className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">Monitoramento de Rankings</h1>
              <p className="text-muted-foreground">Acompanhe suas posições nos mecanismos de busca</p>
            </div>

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
                <KeywordPositionHistoryChart 
                  selectedKeywords={selectedForChart}
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
        selectedForChart={selectedForChart}
        onChartSelectionChange={setSelectedForChart}
      />
          </main>
        </div>
      </div>
    </>
  );
};

export default Monitoring;
