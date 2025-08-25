import { useState } from "react";
import { Helmet } from "react-helmet-async";
import ComparisonForm from "@/components/comparison/ComparisonForm";
import ComparisonResults, { ComparisonResult } from "@/components/comparison/ComparisonResults";
import SimulationNotice from "@/components/SimulationNotice";

const Comparison = () => {
  const [comparisonResults, setComparisonResults] = useState<{
    websites: string[];
    results: ComparisonResult[];
  } | null>(null);

  // Enhanced mock function for domain comparison
  const generateComparisonResults = (websites: string[], keywords: string[]): ComparisonResult[] => {
    const cacheKey = `comparison_${websites.join('_')}_${keywords.join('_')}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const results: ComparisonResult[] = keywords.map(keyword => {
      const keywordResults = websites.map(website => {
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

  const handleComparison = (data: { websites: string[]; keywords: string[] }) => {
    const results = generateComparisonResults(data.websites, data.keywords);
    setComparisonResults({ websites: data.websites, results });
  };

  const handleNewComparison = () => {
    setComparisonResults(null);
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
            {!comparisonResults ? (
              <div className="space-y-8">
                <div className="text-center space-y-4">
                  <h1 className="text-4xl font-bold text-foreground">
                    Comparação de Domínios
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                    Compare as posições de múltiplos sites para as mesmas palavras-chave e 
                    descubra quem está dominando os resultados de busca.
                  </p>
                </div>
                
                <SimulationNotice />
                <ComparisonForm onCompare={handleComparison} />
              </div>
            ) : (
              <div className="space-y-8">
                <SimulationNotice />
                <ComparisonResults 
                  websites={comparisonResults.websites}
                  results={comparisonResults.results}
                  onNewComparison={handleNewComparison}
                />
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default Comparison;