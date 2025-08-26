import { useState } from "react";
import { Helmet } from "react-helmet-async";
import ComparisonFormEnhanced from "@/components/comparison/ComparisonFormEnhanced";
import ComparisonResultsEnhanced, { ComparisonResultEnhanced } from "@/components/comparison/ComparisonResultsEnhanced";
import CompetitiveAnalysisForm from "@/components/comparison/CompetitiveAnalysisForm";
import CompetitiveAnalysisResults from "@/components/comparison/CompetitiveAnalysisResults";
import SimulationNotice from "@/components/SimulationNotice";
import { useProjects } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Comparison = () => {
  const { projects } = useProjects();
  const [comparisonResults, setComparisonResults] = useState<{
    websites: string[];
    results: ComparisonResultEnhanced[];
    projectName?: string;
  } | null>(null);
  
  // State for real competitive analysis
  const [analysisId, setAnalysisId] = useState<string | null>(null);

  // Enhanced mock function for domain comparison
  const generateComparisonResults = (websites: string[], keywords: string[]): ComparisonResultEnhanced[] => {
    const cacheKey = `comparison_${websites.join('_')}_${keywords.join('_')}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const results: ComparisonResultEnhanced[] = keywords.map(keyword => {
      const keywordResults = websites.map((website, index) => {
        // More realistic position distribution
        const rand = Math.random();
        let position: number | null = null;
        
        // 20% not found, 15% in top 3, 25% in top 10, 40% beyond position 10
        if (rand > 0.20) {
          if (rand > 0.85) {
            position = Math.floor(Math.random() * 3) + 1; // Top 3
          } else if (rand > 0.60) {
            position = Math.floor(Math.random() * 7) + 4; // 4-10
          } else {
            position = Math.floor(Math.random() * 90) + 11; // 11-100
          }
        }

        return {
          website,
          position,
          isWinner: false, // Will be set below
          isClient: index === 0, // First website is always the client
        };
      });

      // Determine winner (best position)
      const validResults = keywordResults.filter(r => r.position !== null);
      if (validResults.length > 0) {
        const bestPosition = Math.min(...validResults.map(r => r.position!));
        const winner = keywordResults.find(r => r.position === bestPosition);
        if (winner) {
          winner.isWinner = true;
        }
      }

      return {
        keyword,
        results: keywordResults,
      };
    });

    // Cache results for 10 minutes
    localStorage.setItem(cacheKey, JSON.stringify(results));
    setTimeout(() => localStorage.removeItem(cacheKey), 10 * 60 * 1000);
    
    return results;
  };

  const handleComparison = (data: { websites: string[]; keywords: string[]; projectName?: string }) => {
    const results = generateComparisonResults(data.websites, data.keywords);
    setComparisonResults({ 
      websites: data.websites, 
      results,
      projectName: data.projectName 
    });
  };

  const handleNewComparison = () => {
    setComparisonResults(null);
  };

  const handleAnalysisStarted = (newAnalysisId: string) => {
    setAnalysisId(newAnalysisId);
  };

  const handleBackToAnalysisForm = () => {
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
            <div className="text-center space-y-4 mb-8">
              <h1 className="text-4xl font-bold text-foreground">
                Análise Competitiva
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Compare posições reais no Google ou use nossa simulação avançada para análise competitiva
              </p>
            </div>

            <Tabs defaultValue="real" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="real" className="gap-2">
                  <Badge variant="secondary">Novo</Badge>
                  Análise Real
                </TabsTrigger>
                <TabsTrigger value="simulation">
                  Simulação Avançada
                </TabsTrigger>
              </TabsList>

              <TabsContent value="real">
                {analysisId ? (
                  <CompetitiveAnalysisResults 
                    analysisId={analysisId} 
                    onBackToForm={handleBackToAnalysisForm}
                  />
                ) : (
                  <CompetitiveAnalysisForm onAnalysisStarted={handleAnalysisStarted} />
                )}
              </TabsContent>

              <TabsContent value="simulation">
                {!comparisonResults ? (
                  <div className="space-y-6">
                    <SimulationNotice />
                    <ComparisonFormEnhanced onCompare={handleComparison} />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <SimulationNotice />
                    <ComparisonResultsEnhanced
                      websites={comparisonResults.websites}
                      results={comparisonResults.results}
                      projectName={comparisonResults.projectName}
                      onNewComparison={handleNewComparison}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </>
  );
};

export default Comparison;