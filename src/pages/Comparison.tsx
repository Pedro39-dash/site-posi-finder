import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Target } from "lucide-react";
import DirectCompetitiveForm from "@/components/comparison/DirectCompetitiveForm";
import CompetitiveResultsDisplay from "@/components/comparison/CompetitiveResultsDisplay";
import { HookErrorBoundary } from "@/components/comparison/HookErrorBoundary";
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

    <div className="min-h-screen bg-sidebar-background dark">
      <div className="flex w-full min-h-screen">
        {/* Fixed Sidebar */}
        <div className="fixed left-0 top-0 h-full w-64 bg-sidebar-primary border-r border-sidebar-border z-40">
          <div className="flex flex-col h-full">
            {/* Logo Section */}
            <div className="p-6 border-b border-sidebar-border">
              <h2 className="text-xl font-bold text-sidebar-foreground">ITX COMPANY</h2>
              <p className="text-sm text-sidebar-muted-foreground mt-1">SEO Dashboard</p>
            </div>
            
            {/* Navigation */}
            <div className="flex-1 p-4 space-y-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-sidebar-muted-foreground uppercase tracking-wider mb-3">
                  ANÁLISES
                </p>
                <Button
                  variant="ghost"
                  className="w-full justify-start bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                >
                  <Target className="mr-2 h-4 w-4" />
                  Análise Competitiva
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 ml-64">
          {/* Top Navigation */}
          <div className="bg-sidebar-primary border-b border-sidebar-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {state === 'results' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToForm}
                    className="gap-2 text-sidebar-muted-foreground hover:text-sidebar-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </Button>
                )}
                <h1 className="text-2xl font-semibold text-sidebar-foreground">
                  Análise Competitiva SEO
                </h1>
              </div>
              
              {state === 'results' && (
                <Button
                  variant="outline"
                  onClick={handleNewAnalysis}
                  className="gap-2 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <Target className="h-4 w-4" />
                  Nova Análise
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-8 bg-sidebar-background">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <p className="text-sidebar-muted-foreground">
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
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Comparison;