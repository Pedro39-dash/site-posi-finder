import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import DirectCompetitiveForm from "@/components/comparison/DirectCompetitiveForm";
import CompetitiveResultsDisplay from "@/components/comparison/CompetitiveResultsDisplay";
import { HookErrorBoundary } from "@/components/comparison/HookErrorBoundary";
import { KeywordFilterProvider } from "@/contexts/KeywordFilterContext";
import { useActiveProject } from "@/contexts/ActiveProjectContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw } from "lucide-react";

type AnalysisState = 'form' | 'results';

const Comparison = () => {
  const { activeProject } = useActiveProject();
  
  // Main state management
  const [state, setState] = useState<AnalysisState>('form');
  const [isChangingProject, setIsChangingProject] = useState(false);
  
  // Real analysis state
  const [analysisId, setAnalysisId] = useState<string | null>(null);

  // Reset state when active project changes
  useEffect(() => {
    console.log('🎯 Comparison montou/atualizou com projeto:', {
      id: activeProject?.id,
      name: activeProject?.name,
      timestamp: Date.now()
    });
    
    if (activeProject?.id) {
      console.log('🔄 Comparison: Projeto ativo mudou para:', activeProject.name);
      console.log('📌 Resetando estado da página Comparison');
      
      setIsChangingProject(true);
      setState('form');
      setAnalysisId(null);
      
      // Remove indicator after brief delay
      setTimeout(() => setIsChangingProject(false), 500);
    }
    console.log('latestAnalysis:', latestAnalysis);
  }, [activeProject?.id]);

  // Handler functions
  const handleAnalysisStarted = (newAnalysisId: string) => {
    setAnalysisId(newAnalysisId);
    setState('results');
  };

  const handleBackToForm = () => {
    setState('form');
    setAnalysisId(null);
  };

  const handleNewAnalysis = () => {
    setState('form');
    setAnalysisId(null);
  };

  return (
    <>
      <Helmet>
        <title>Comparação de Domínios - SEO Dashboard</title>
        <meta 
          name="description" 
          content="Compare as posições SEO de múltiples sites para as mesmas palavras-chave. Analise a concorrência e descubra oportunidades de otimização." 
        />
        <meta name="keywords" content="comparação seo, análise concorrência, posições google, ranking sites" />
        <link rel="canonical" href="/comparison" />
      </Helmet>

      {/* Content with full width and proper padding */}
      <div className="p-8">
        <div className="mb-8">
          <p className="text-muted-foreground">
            {state === 'form' && "Configure sua análise competitiva com dados reais do Google"}
            {state === 'results' && "Resultados da análise competitiva"}
          </p>
        </div>

        {/* Project change indicator */}
        {isChangingProject && (
          <Alert className="mb-6">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Carregando dados do projeto {activeProject?.name}...
            </AlertDescription>
          </Alert>
        )}

        {/* Direct Analysis Form */}
        {state === 'form' && (
          <DirectCompetitiveForm 
            onAnalysisStarted={handleAnalysisStarted} 
          />
        )}

        {/* Analysis Results */}
        {state === 'results' && analysisId && (
          <KeywordFilterProvider>
            <HookErrorBoundary>
              <CompetitiveResultsDisplay 
                analysisId={analysisId} 
                onBackToForm={handleBackToForm}
              />
            </HookErrorBoundary>
          </KeywordFilterProvider>
        )}
      </div>
    </>
  );
};

export default Comparison;