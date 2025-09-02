import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Target, Zap } from "lucide-react";
import ComparisonFormEnhanced from "@/components/comparison/ComparisonFormEnhanced";
import CompetitiveAnalysisForm from "@/components/comparison/CompetitiveAnalysisForm";
import CompetitiveAnalysisResults from "@/components/comparison/CompetitiveAnalysisResults";
import CompetitiveOverview from "@/components/comparison/CompetitiveOverview";
import CompetitiveDetailedTable from "@/components/comparison/CompetitiveDetailedTable";
import KeywordAnalysisModal from "@/components/comparison/KeywordAnalysisModal";
import SimulationNotice from "@/components/SimulationNotice";
import { useProjects } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface ComparisonResultEnhanced {
  keyword: string;
  results: {
    website: string;
    position: number | null;
    isWinner: boolean;
    isClient: boolean;
  }[];
}

type AnalysisMode = 'selection' | 'real' | 'simulation';
type AnalysisState = 'form' | 'results' | 'details';

const Comparison = () => {
  const { projects } = useProjects();
  
  // Main state management
  const [mode, setMode] = useState<AnalysisMode>('selection');
  const [state, setState] = useState<AnalysisState>('form');
  
  // Real analysis state
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  
  // Simulation state
  const [comparisonResults, setComparisonResults] = useState<{
    websites: string[];
    results: ComparisonResultEnhanced[];
    projectName?: string;
  } | null>(null);

  // Keyword analysis modal state
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);

  // Enhanced mock function for domain comparison - CORRECTED DATA GENERATION
  const generateComparisonResults = (websites: string[], keywords: string[]): ComparisonResultEnhanced[] => {
    const cacheKey = `comparison_${websites.join('_')}_${keywords.join('_')}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const results: ComparisonResultEnhanced[] = keywords.map(keyword => {
      // Distribuição mais realística de posições
      const getRealisticPosition = () => {
        const rand = Math.random();
        if (rand < 0.15) return Math.floor(Math.random() * 3) + 1; // Top 3 (15%)
        if (rand < 0.35) return Math.floor(Math.random() * 7) + 4; // 4-10 (20%)
        if (rand < 0.55) return Math.floor(Math.random() * 10) + 11; // 11-20 (20%)
        if (rand < 0.75) return Math.floor(Math.random() * 30) + 21; // 21-50 (20%)
        return null; // Não ranqueia (25%)
      };

      const clientPosition = getRealisticPosition();
      const competitorPosition = getRealisticPosition();
      
      // Criar resultados para ambos os websites
      const websiteResults = websites.map((website, index) => {
        const position = index === 0 ? clientPosition : competitorPosition;
        return {
          website,
          position,
          isWinner: false, // Será definido abaixo
          isClient: index === 0,
        };
      });

      // Determinar vencedor
      const validResults = websiteResults.filter(r => r.position !== null);
      if (validResults.length > 0) {
        const bestPosition = Math.min(...validResults.map(r => r.position!));
        const winner = websiteResults.find(r => r.position === bestPosition);
        if (winner) {
          winner.isWinner = true;
        }
      }

      return {
        keyword,
        results: websiteResults,
      };
    });

    // Cache results for 10 minutes
    localStorage.setItem(cacheKey, JSON.stringify(results));
    setTimeout(() => localStorage.removeItem(cacheKey), 10 * 60 * 1000);
    
    return results;
  };

  // Handler functions
  const handleModeSelection = (selectedMode: AnalysisMode) => {
    setMode(selectedMode);
    setState('form');
    // Reset states
    setAnalysisId(null);
    setComparisonResults(null);
    setSelectedKeyword(null);
  };

  const handleSimulationResults = (data: { websites: string[]; keywords: string[]; projectName?: string }) => {
    const results = generateComparisonResults(data.websites, data.keywords);
    setComparisonResults({ 
      websites: data.websites, 
      results,
      projectName: data.projectName 
    });
    setState('results');
  };

  const handleRealAnalysisStarted = (newAnalysisId: string) => {
    setAnalysisId(newAnalysisId);
    setState('results');
  };

  const handleBackToForm = () => {
    setState('form');
    setAnalysisId(null);
    setComparisonResults(null);
  };

  const handleNewAnalysis = () => {
    setMode('selection');
    setState('form');
    setAnalysisId(null);
    setComparisonResults(null);
    setSelectedKeyword(null);
  };

  const handleKeywordDetails = (keyword: string) => {
    setSelectedKeyword(keyword);
  };

  const handleCloseKeywordModal = () => {
    setSelectedKeyword(null);
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
                {mode !== 'selection' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNewAnalysis}
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
                    {mode === 'selection' && "Escolha o tipo de análise que deseja realizar"}
                    {mode === 'real' && "Análise com dados reais do Google"}
                    {mode === 'simulation' && "Simulação avançada para demonstração"}
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

            {/* Mode Selection */}
            {mode === 'selection' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50"
                  onClick={() => handleModeSelection('real')}
                >
                  <CardHeader className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Target className="h-6 w-6 text-primary" />
                      <Badge variant="secondary">Novo</Badge>
                    </div>
                    <CardTitle className="text-2xl">Análise Real</CardTitle>
                    <CardDescription>
                      Dados reais extraídos diretamente do Google
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Posições reais no Google</li>
                      <li>• Identificação automática de concorrentes</li>
                      <li>• Análise baseada nas suas auditorias</li>
                      <li>• Oportunidades específicas</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50"
                  onClick={() => handleModeSelection('simulation')}
                >
                  <CardHeader className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Zap className="h-6 w-6 text-amber-500" />
                    </div>
                    <CardTitle className="text-2xl">Simulação Avançada</CardTitle>
                    <CardDescription>
                      Demonstração com dados simulados realísticos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Comparação entre 2 sites</li>
                      <li>• Palavras-chave personalizadas</li>
                      <li>• Análise competitiva detalhada</li>
                      <li>• Insights e recomendações</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Real Analysis Flow */}
            {mode === 'real' && (
              <>
                {state === 'form' && (
                  <CompetitiveAnalysisForm onAnalysisStarted={handleRealAnalysisStarted} />
                )}
                {state === 'results' && analysisId && (
                  <CompetitiveAnalysisResults 
                    analysisId={analysisId} 
                    onBackToForm={handleBackToForm}
                  />
                )}
              </>
            )}

            {/* Simulation Analysis Flow */}
            {mode === 'simulation' && (
              <>
                {state === 'form' && (
                  <div className="space-y-6">
                    <SimulationNotice />
                    <ComparisonFormEnhanced onCompare={handleSimulationResults} />
                  </div>
                )}
                {state === 'results' && comparisonResults && (
                  <div className="space-y-8">
                    <SimulationNotice />
                    
                    {/* Etapa 1: Visão Geral da Situação */}
                    <CompetitiveOverview 
                      results={comparisonResults.results}
                      websites={comparisonResults.websites}
                    />
                    
                    {/* Etapa 2: Tabela de Análise Detalhada */}
                    <CompetitiveDetailedTable
                      results={comparisonResults.results}
                      websites={comparisonResults.websites}
                      onKeywordDetails={handleKeywordDetails}
                    />
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Etapa 3: Modal de Análise Aprofundada */}
      {selectedKeyword && comparisonResults && (
        <KeywordAnalysisModal
          isOpen={!!selectedKeyword}
          onClose={handleCloseKeywordModal}
          keyword={selectedKeyword}
          results={comparisonResults.results}
          websites={comparisonResults.websites}
        />
      )}
    </>
  );
};

export default Comparison;