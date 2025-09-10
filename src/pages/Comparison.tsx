import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Target, User } from "lucide-react";
import DirectCompetitiveForm from "@/components/comparison/DirectCompetitiveForm";
import CompetitiveResultsDisplay from "@/components/comparison/CompetitiveResultsDisplay";
import { HookErrorBoundary } from "@/components/comparison/HookErrorBoundary";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

type AnalysisState = 'form' | 'results';

const Comparison = () => {
  const { user, logout } = useAuth();
  
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

    <div className="min-h-screen bg-background dark:bg-background">
      <div className="flex w-full min-h-screen">
        {/* Fixed Sidebar */}
        <div className="fixed left-0 top-0 h-full w-64 bg-background border-r border-border z-40">
          <div className="flex flex-col h-full">
            {/* Logo Section */}
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">ITX COMPANY</h2>
              <p className="text-sm text-muted-foreground mt-1">SEO Dashboard</p>
            </div>
            
            {/* Navigation */}
            <div className="flex-1 p-4 space-y-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  ANÁLISES
                </p>
                <Button
                  variant="ghost"
                  className="w-full justify-start bg-muted text-foreground font-medium"
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
          <div className="bg-background border-b border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {state === 'results' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToForm}
                    className="gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </Button>
                )}
                <h1 className="text-2xl font-semibold text-foreground">
                  Análise Competitiva SEO
                </h1>
              </div>
              
              <div className="flex items-center gap-4">
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
                
                {/* User Profile Dropdown */}
                {user && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium hidden sm:inline-block">
                          {user.email?.split('@')[0]}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem>Perfil</DropdownMenuItem>
                      <DropdownMenuItem onClick={logout} className="text-destructive">
                        Sair
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="max-w-4xl mx-auto">
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
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Comparison;