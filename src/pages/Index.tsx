import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";
import HeroSection from "@/components/HeroSection";
import SearchForm from "@/components/SearchForm";
import ResultsDisplay from "@/components/ResultsDisplay";
import SimulationNotice from "@/components/SimulationNotice";
import HowItWorks from "@/components/HowItWorks";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import WelcomeOnboarding from "@/components/WelcomeOnboarding";

interface SearchResult {
  keyword: string;
  position: number | null;
  previousPosition?: number;
}

const Index = () => {
  const [searchResults, setSearchResults] = useState<{ website: string; results: SearchResult[] } | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'search'>('dashboard');

  // Check if user is new (first time accessing)
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

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
    setViewMode('search');
  };

  const handleBackToDashboard = () => {
    setViewMode('dashboard');
    setShowDashboard(false);
    setSearchResults(null);
  };

  return (
    <>
      <Helmet>
        <title>Dashboard SEO - Painel Exclusivo para Clientes</title>
        <meta 
          name="description" 
          content="Painel exclusivo para clientes da nossa consultoria SEO. Monitore posições, compare concorrentes e acompanhe o progresso do seu investimento em tempo real." 
        />
        <meta name="keywords" content="seo, posições google, ranking, palavras-chave, otimização, busca" />
        <link rel="canonical" href="/" />
      </Helmet>

      <div className="min-h-screen bg-background lg:pl-80">
        <div className="pt-16 lg:pt-0">
          {viewMode === 'dashboard' && !showDashboard ? (
            <main className="py-8">
              <div className="container mx-auto px-4">
                <DashboardOverview onViewModeChange={setViewMode} />
              </div>
            </main>
          ) : viewMode === 'search' && !showDashboard ? (
            <>
              <div className="container mx-auto px-4 py-4">
                <button
                  onClick={handleBackToDashboard}
                  className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao Dashboard
                </button>
              </div>
              
              <HeroSection />
              <HowItWorks />
              
              <section className="py-16 bg-secondary/50">
                <div className="container mx-auto px-4">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-foreground mb-4">
                      Verificar Posições Atuais
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                      Digite o URL do seu site e as palavras-chave que deseja consultar. 
                      Nossa ferramenta irá verificar sua posição atual nos resultados do Google.
                    </p>
                  </div>
                  
                  <SearchForm onSearch={handleSearch} />
                </div>
              </section>
            </>
          ) : (
            <main className="pt-8">
              <div className="container mx-auto px-4 mb-8">
                <button
                  onClick={handleBackToDashboard}
                  className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao Dashboard
                </button>
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
            </main>
          )}
        </div>
        
        {showOnboarding && (
          <WelcomeOnboarding onComplete={handleOnboardingComplete} />
        )}
      </div>
    </>
  );
};

export default Index;
