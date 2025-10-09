import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { RankingService, KeywordRanking } from '@/services/rankingService';
import { KeywordManager } from '@/components/monitoring/KeywordManager';
import { KeywordMetricsSummary } from '@/components/monitoring/KeywordMetricsSummary';
import { KeywordPositionDistributionChart } from '@/components/monitoring/KeywordPositionDistributionChart';
import { useProject } from '@/hooks/useProject';
import IntegrationStatusBanner from '@/components/integrations/IntegrationStatusBanner';
import { IntegrationService, ProjectIntegration } from '@/services/integrationService';

const Monitoring = () => {
  const [rankings, setRankings] = useState<KeywordRanking[]>([]);
  const { activeProject } = useProject();
  const [isLoading, setIsLoading] = useState(true);
  const [integrations, setIntegrations] = useState<ProjectIntegration[]>([]);

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
              <IntegrationStatusBanner 
                projectId={activeProject.id}
                integrations={integrations}
              />
            )}

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
              </>
            )}

            {/* Gerenciamento de Keywords */}
            <KeywordManager
              key={activeProject?.id}
              rankings={rankings}
              projectId={activeProject?.id || ''}
              onRankingsUpdate={loadRankings}
            />
          </main>
        </div>
      </div>
    </>
  );
};

export default Monitoring;
