import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Target } from "lucide-react";
import DirectCompetitiveForm from "@/components/comparison/DirectCompetitiveForm";
import CompetitiveAnalysisResults from "@/components/comparison/CompetitiveAnalysisResults";
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

      <div className="min-h-screen bg-background lg:pl-80">
        <div className="pt-16 lg:pt-0">
          <main className="container mx-auto px-4 py-8">
            
            {/* Header with navigation */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                {state === 'results' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToForm}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </Button>
                )}
                <div>
                  <h1 className="text-4xl font-bold text-foreground">
                    Análise Competitiva SEO
                  </h1>
                  <p className="text-muted-foreground mt-2">
                    {state === 'form' && "Configure sua análise competitiva com dados reais ou simulação"}
                    {state === 'results' && "Resultados da análise competitiva"}
                  </p>
                </div>
              </div>
              
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
              <CompetitiveAnalysisResults 
                analysisId={analysisId} 
                onBackToForm={handleBackToForm}
              />
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default Comparison;