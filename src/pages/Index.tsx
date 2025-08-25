import { useState } from "react";
import HeroSection from "@/components/HeroSection";
import SearchForm from "@/components/SearchForm";
import ResultsDisplay from "@/components/ResultsDisplay";

interface SearchResult {
  keyword: string;
  position: number | null;
  previousPosition?: number;
}

const Index = () => {
  const [searchResults, setSearchResults] = useState<{ website: string; results: SearchResult[] } | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);

  // Mock function to simulate API call for position checking
  const generateMockResults = (keywords: string[]): SearchResult[] => {
    return keywords.map(keyword => ({
      keyword,
      position: Math.random() > 0.2 ? Math.floor(Math.random() * 100) + 1 : null,
      previousPosition: Math.random() > 0.5 ? Math.floor(Math.random() * 100) + 1 : undefined,
    }));
  };

  const handleSearch = (data: { website: string; keywords: string[] }) => {
    const results = generateMockResults(data.keywords);
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
