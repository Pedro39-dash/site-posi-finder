import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Target } from "lucide-react";
import DirectCompetitiveForm from "@/components/comparison/DirectCompetitiveForm";
import CompetitiveResultsDisplay from "@/components/comparison/CompetitiveResultsDisplay";
import { Button } from "@/components/ui/button";

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

    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Header with navigation */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            {state === 'results' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToForm}
                className="gap-2 absolute left-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            )}
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
              Análise Competitiva SEO
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {state === 'form' && "Configure sua análise competitiva com dados reais do Google"}
            {state === 'results' && "Resultados da análise competitiva"}
          </p>
        </div>
        
        <div className="flex items-center justify-between mb-8">
          <div></div>
          
          {state === 'results' && (
            <Button
              variant="outline"
              onClick={handleNewAnalysis}
              className="gap-2"
            >
              <Target className="h-4 w-4" />
              Nova Análise
            </Button>
          )}
        </div>

        {/* Direct Analysis Form */}
        {state === 'form' && (
          <DirectCompetitiveForm onAnalysisStarted={handleAnalysisStarted} />
        )}

        {/* Analysis Results */}
        {state === 'results' && analysisId && (
          <CompetitiveResultsDisplay 
            analysisId={analysisId} 
            onBackToForm={handleBackToForm}
          />
        )}
      </div>
    </div>
    </>
  );
};

export default Comparison;