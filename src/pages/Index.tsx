import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import TrafficChart from '@/components/TrafficChart';
import CompetitorAnalysisService from '@/services/CompetitorAnalysisService';
import { ArrowRight } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { activeProject } = useProject();
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!activeProject?.id) {
      setLoading(false);
      return;
    }

    // LOG 1: Log activeProject.id before fetch
    console.log('[DEBUG] activeProject.id before fetch:', activeProject.id);

    const fetchLatestAnalysis = async () => {
      try {
        setLoading(true);
        const analyses = await CompetitorAnalysisService.getAnalysesByProject(activeProject.id);
        
        // LOG 2: Log analyses after getAnalysesByProject
        console.log('[DEBUG] analyses after fetch:', analyses);
        console.log('[DEBUG] analyses length:', analyses?.length);
        console.log('[DEBUG] analyses is array:', Array.isArray(analyses));
        
        // Validação: verificar se o array está ordenado corretamente
        if (analyses && analyses.length > 0) {
          console.log('[DEBUG] First analysis date:', analyses[0]?.created_at);
          console.log('[DEBUG] Last analysis date:', analyses[analyses.length - 1]?.created_at);
        }
        
        // LOG 5: Verificar se analyses está ordenado (mais recente primeiro)
        if (analyses && analyses.length > 1) {
          const isOrdered = analyses.every((curr, idx) => {
            if (idx === 0) return true;
            return new Date(analyses[idx - 1].created_at) >= new Date(curr.created_at);
          });
          console.log('[DEBUG] Is analyses ordered (newest first)?', isOrdered);
        }
        
        if (analyses && analyses.length > 0) {
          const latest = analyses[0];
          
          // LOG 3: Log latestAnalysis before render
          console.log('[DEBUG] latestAnalysis before render:', latest);
          console.log('[DEBUG] latestAnalysis.id:', latest?.id);
          console.log('[DEBUG] latestAnalysis.project_id:', latest?.project_id);
          console.log('[DEBUG] Does project_id match activeProject.id?', latest?.project_id === activeProject.id);
          
          setLatestAnalysis(latest);
        } else {
          // LOG 9: Tratamento para array vazio
          console.log('[DEBUG] No analyses found for this project');
          setLatestAnalysis(null);
        }
      } catch (error) {
        // LOG 10: Tratamento de erro no fetch
        console.error('[DEBUG] Error fetching analyses:', error);
        console.error('[DEBUG] Error details:', {
          message: error.message,
          stack: error.stack,
          projectId: activeProject.id
        });
        setLatestAnalysis(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestAnalysis();
  }, [isAuthenticated, activeProject?.id, navigate]); // LOG 7: Dependências corretas do useEffect

  // LOG 8: Log dos props do TrafficChart
  useEffect(() => {
    if (latestAnalysis) {
      console.log('[DEBUG] TrafficChart props:', {
        domains: latestAnalysis.domains,
        competitors: latestAnalysis.competitors,
        keywords: latestAnalysis.keywords,
        hasAllRequiredFields: !!(latestAnalysis.domains && latestAnalysis.competitors && latestAnalysis.keywords)
      });
    }
  }, [latestAnalysis]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando análise...</p>
        </div>
      </div>
    );
  }

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Nenhum projeto selecionado</h2>
          <p className="text-gray-600 mb-6">Selecione um projeto para visualizar as análises</p>
          <button
            onClick={() => navigate('/projects')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            Ver Projetos
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  // LOG 9: Mensagem amigável para array vazio
  if (!latestAnalysis) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Nenhuma análise encontrada</h2>
          <p className="text-gray-600 mb-6">
            Ainda não há análises disponíveis para o projeto <strong>{activeProject.name}</strong>.
            <br />
            Execute uma nova análise para visualizar os dados.
          </p>
          <button
            onClick={() => navigate('/monitoring')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            Iniciar Análise
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  // LOG 11: Console do navegador mostrará erros de TrafficChart se houver
  // LOG 12: Reatividade - o useEffect será disparado quando activeProject.id mudar
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-600">Projeto: {activeProject.name}</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Análise de Tráfego</h2>
        <TrafficChart
          domains={latestAnalysis.domains}
          competitors={latestAnalysis.competitors}
          keywords={latestAnalysis.keywords}
        />
      </div>
    </div>
  );
}