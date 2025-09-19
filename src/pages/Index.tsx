import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Flame } from "lucide-react";
import WelcomeOnboarding from "@/components/WelcomeOnboarding";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { ClientDashboard } from "@/components/dashboard/ClientDashboard";
import { DisplayDashboard } from "@/components/dashboard/DisplayDashboard";
// import HeroSection from "@/components/HeroSection";
import SearchForm from "@/components/SearchForm";
import ResultsDisplay from "@/components/ResultsDisplay";
import SimulationNotice from "@/components/SimulationNotice";
// import HowItWorks from "@/components/HowItWorks";

interface SearchResult {
  keyword: string;
  position: number | null;
  previousPosition?: number;
}

const Index = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { isAdmin, isClient, isDisplay, isLoading: roleLoading } = useRole();
  const [viewMode, setViewMode] = useState<'search' | 'onboarding'>('search');

  if (isLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // If authenticated, show role-specific dashboard
  if (isAuthenticated) {
    if (viewMode === 'onboarding') {
      return <WelcomeOnboarding onComplete={() => setViewMode('search')} />;
    }
    
    // Show role-specific dashboard
    if (isAdmin) {
      return <AdminDashboard />;
    } else if (isClient) {
      return <ClientDashboard />;
    } else if (isDisplay) {
      return <DisplayDashboard onViewModeChange={setViewMode} />;
    }
  }

  // Enhanced mock function with realistic position distribution and caching
  const generateMockResults = (website: string, keywords: string[]) => {
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
    // This would be the search functionality for public users
    console.log('Search functionality would be implemented here');
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
      <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="flex justify-between">
                <h1 className="text-3xl font-medium text-foreground mb-4">
                  Painel exclusivo ITX Company de <span className="font-bold">monitoramento SEO/AIO</span>
                </h1>
                <p className="text-zinc-500">
                  Obtenha um prognóstico assertivo do seu site com relação a busca orgânica do Google.
                </p>
              </div>
              <div>
                <div> 
                  <h2>
                    Sugestões de SEO/AIO
                  </h2>
                </div>
                <p> 
                  Analisamos seu site e elencamos as principais oportunidades de SEO encontradas. Trabalhe nessas otimizações
                  para melhorar seus posicionamentos e aumentar seu tráfego.
                </p>
              </div>
              
              <SearchForm onSearch={handleSearch} />
            </div>
          </section>

      {/* <div className="bg-background">
        <div className="pt-16 lg:pt-0">
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
        </div>
      </div> */}
    </>
  );
};

export default Index;
