import { useState } from "react";
import HeroSection from "@/components/HeroSection";
import SearchForm from "@/components/SearchForm";
import ResultsDisplay from "@/components/ResultsDisplay";
import SimulationNotice from "@/components/SimulationNotice";

interface SearchResult {
  keyword: string;
  position: number | null;
  previousPosition?: number;
}

const Index = () => {
  const [searchResults, setSearchResults] = useState<{ website: string; results: SearchResult[] } | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);

  // Enhanced mock function with realistic position distribution and caching
  const generateMockResults = (website: string, keywords: string[]): SearchResult[] => {
    const cacheKey = `seo_results_${website}_${keywords.join('_')}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const results = keywords.map(keyword => {
      // More realistic position distribution
      const rand = Math.random();
      let position: number | null = null;
      
      // 15% not found, 10% in top 3, 25% in top 10, 50% beyond position 10
      if (rand > 0.15) {
        if (rand > 0.85) {
          position = Math.floor(Math.random() * 3) + 1; // Top 3
        } else if (rand > 0.60) {
          position = Math.floor(Math.random() * 7) + 4; // 4-10
        } else {
          position = Math.floor(Math.random() * 90) + 11; // 11-100
        }
      }

      // Generate previous position for trend calculation
      const previousPosition = position && Math.random() > 0.3 
        ? Math.max(1, position + (Math.floor(Math.random() * 20) - 10))
        : undefined;

      return {
        keyword,
        position,
        previousPosition,
      };
    });

    // Cache results for 5 minutes
    localStorage.setItem(cacheKey, JSON.stringify(results));
    setTimeout(() => localStorage.removeItem(cacheKey), 5 * 60 * 1000);
    
    return results;
  };

  const handleSearch = (data: { website: string; keywords: string[] }) => {
    const results = generateMockResults(data.website, data.keywords);
    setSearchResults({ website: data.website, results });
    setShowDashboard(true);
  };

  const handleNewSearch = () => {
    setShowDashboard(false);
    setSearchResults(null);
  };

  return (
    <div className="min-h-screen">
      {!showDashboard ? (
        <>
          <HeroSection />
          
          <section className="py-16 bg-background">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Comece Agora</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Digite o URL do seu site e as palavras-chave que você quer rastrear para descobrir sua posição atual no Google.
                </p>
              </div>
              
              <SearchForm onSearch={handleSearch} />
            </div>
          </section>
        </>
      ) : (
        <div className="min-h-screen bg-background">
          <div className="bg-gradient-hero text-white py-16">
            <div className="container mx-auto px-4 text-center">
              <h1 className="text-4xl font-bold mb-4">Resultados da Análise SEO</h1>
              <p className="text-xl opacity-90 mb-6">
                Posições encontradas para suas palavras-chave
              </p>
              <button 
                onClick={handleNewSearch}
                className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-lg backdrop-blur-sm transition-all"
              >
                Nova Pesquisa
              </button>
            </div>
          </div>
          
          <div className="py-16">
            <div className="container mx-auto px-4">
              <SimulationNotice />
              {searchResults && (
                <ResultsDisplay 
                  website={searchResults.website} 
                  results={searchResults.results} 
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
