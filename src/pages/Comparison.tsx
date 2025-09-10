import { useState } from "react";
import { Helmet } from "react-helmet-async";
import DirectCompetitiveForm from "@/components/comparison/DirectCompetitiveForm";
import CompetitiveResultsDisplay from "@/components/comparison/CompetitiveResultsDisplay";
import { HookErrorBoundary } from "@/components/comparison/HookErrorBoundary";

type AnalysisState = 'form' | 'results';

const Comparison = () => {
  // Main state management
  const [state, setState] = useState<AnalysisState>('form');
  
  // Real analysis state
  const [analysisId, setAnalysisId] = useState<string | null>(null);

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

        {/* Direct Analysis Form */}
        {state === 'form' && (
          <DirectCompetitiveForm onAnalysisStarted={handleAnalysisStarted} />
        )}

        {/* Analysis Results */}
        {state === 'results' && analysisId && (
          <HookErrorBoundary>
            <CompetitiveResultsDisplay 
              analysisId={analysisId} 
              onBackToForm={handleBackToForm}
            />
          </HookErrorBoundary>
        )}
      </div>
    </>
  );
};

export default Comparison;