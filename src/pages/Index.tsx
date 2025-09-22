import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Flame, ChartPie } from "lucide-react";
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
      <section className="py-6">
            <div className="container mx-auto">
              <div className="flex justify-between">
                <h1 className="text-3xl font-medium text-foreground mb-4">
                  Painel exclusivo ITX Company de <span className="font-bold">monitoramento SEO/AIO</span>
                </h1>
                <p className="text-zinc-500 mt-2">
                  Obtenha um prognóstico assertivo do seu site com relação a busca orgânica do Google.
                </p>
              </div>
              <div className="mt-8">
                <div className="flex gap-2 items-center">
                  <span className="text-yellow-950 bg-yellow-500 p-2"><Flame /></span>
                  <h2>
                    Sugestões de SEO/AIO
                  </h2>
                </div>
                <p className="max-width-[1026px] text-zinc-500 mt-2"> 
                  Analisamos seu site e elencamos as principais oportunidades de SEO encontradas. Trabalhe nessas otimizações
                  para melhorar seus posicionamentos e aumentar seu tráfego.
                </p>
              </div>
              <div className="flex justify-between mt-6 gap-6">
                <div className="w-[326px] h-[211px] bg-zinc-900 p-2">
                  <p>Sugestão 1</p>
                </div>
                <div className="w-[326px] h-[211px] bg-zinc-900 p-2">
                  <p>Sugestão 2</p>
                </div>
                <div className="w-[326px] h-[211px] bg-zinc-900 p-2">
                  <p>Sugestão 3</p>
                </div>
              </div>
              <div className="mt-8">
                <div className="flex gap-2 items-center">
                <span className="text-blue-950 bg-blue-500 p-2"><ChartPie /></span>
                <h2>
                  Trafego estimado
                </h2>
              </div>
                <p className="max-width-[1026px] text-zinc-500 mt-2"> 
                  O tráfego orgânico estimado total que seu site recebeu de AGO 19, 2025 a SET 18, 2025.
                </p>
                  <svg
                    width="400"
                    height="300"
                    viewBox="0 0 1400 300"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fill="none"
                      stroke="#4285F4"
                      strokeWidth="2"
                      d="M12,240.12L26.912087912087912,247.07999999999998L41.824175824175825,239.25L56.73626373626374,238.38L71.64835164835165,244.47L86.56043956043956,239.25L101.47252747252747,238.38L116.38461538461539,243.6L131.2967032967033,240.12L146.2087912087912,241.86L161.12087912087912,243.6L176.03296703296704,246.21L190.94505494505495,242.73L205.85714285714286,241.86L220.76923076923077,225.33L235.6813186813187,233.16L250.5934065934066,241.86L265.50549450549454,236.64L280.4175824175824,238.38L295.3296703296703,227.07L310.24175824175825,222.72L325.1538461538462,227.94L340.0659340659341,228.81L354.97802197802196,227.07L369.8901098901099,225.33L384.80219780219784,208.8L399.7142857142857,213.15L414.6263736263736,218.37L429.53846153846155,220.11L444.4505494505495,219.24L459.3626373626374,214.89L474.27472527472526,226.2L489.1868131868132,220.98000000000002L504.09890109890114,202.71L519.0109890109891,208.8L533.9230769230769,227.07L548.8351648351648,220.11L563.7472527472528,225.33L578.6593406593406,225.33L593.5714285714286,220.98000000000002L608.4835164835165,217.5L623.3956043956044,224.45999999999998L638.3076923076924,229.68L653.2197802197802,225.33L668.1318681318681,229.68L683.0439560439561,220.98000000000002L697.9560439560439,231.42000000000002L712.8681318681319,207.93L727.7802197802198,219.24L742.6923076923077,224.45999999999998L757.6043956043957,213.15L772.5164835164835,218.37L787.4285714285714,226.2L802.3406593406594,230.55L817.2527472527472,229.68L832.1648351648352,220.98000000000002L847.0769230769231,204.45L861.989010989011,195.75L876.901098901099,150.51L891.8131868131868,177.48000000000002L906.7252747252747,153.99L921.6373626373627,120.06L936.5494505494505,123.54000000000002L951.4615384615385,147.89999999999998L966.3736263736264,114.83999999999997L981.2857143,121.80000000000001L996.1978021978023,124.41L1011.1098901098901,92.22000000000003L1026.0219780219782,55.68000000000001L1040.934065934066,51.329999999999984L1055.8461538461538,160.95L1070.7582417582419,177.48000000000002L1085.6703296703297,174L1100.5824175824175,201.84L1115.4945054945056,192.27L1130.4065934065934,185.31L1145.3186813186812,169.65L1160.2307692307693,178.35000000000002L1175.142857142857,175.74L1190.0549450549452,158.34L1204.967032967033,136.58999999999997L1219.8791208791208,169.65L1234.7912087912089,142.68L1249.7032967032967,138.33L1264.6153846153848,187.05L1279.5274725274726,160.95L1294.4395604395604,209.67000000000002L1309.3516483516485,215.76L1324.2637362637363,236.64L1339.1758241758241,255.78L1354.0879120879122,256.65L1369,255.78"
                    />
                  </svg>
              </div>
          
              
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
