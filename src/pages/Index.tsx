import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Flame, ChartPie, FileText, Zap, Link as LinkIcon, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { ClientDashboard } from "@/components/dashboard/ClientDashboard";
import { DisplayDashboard } from "@/components/dashboard/DisplayDashboard";
import TrafficChart from "@/components/comparison/TrafficChart";
import { CompetitorAnalysisService, CompetitiveAnalysisData } from "@/services/competitorAnalysisService";
import { useProject } from "@/hooks/useProject";
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
  const { activeProject } = useProject();
  const [latestAnalysis, setLatestAnalysis] = useState<CompetitiveAnalysisData | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const navigate = useNavigate();

  // Buscar análise mais recente do projeto ativo
  useEffect(() => {
    const fetchLatestAnalysis = async () => {
      if (!activeProject?.id || !isAuthenticated) return;
      
      // Limpar dados antigos
      setLatestAnalysis(null);
      setLoadingAnalysis(true);
      try {
        const { success, analyses } = await CompetitorAnalysisService.getUserAnalyses(1);
        
        if (success && analyses && analyses.length > 0) {
          const latest = analyses[0];
          const { success: dataSuccess, data } = await CompetitorAnalysisService.getAnalysisData(latest.id);
          
          if (dataSuccess && data) {
            setLatestAnalysis(data);
          }
        }
      } catch (error) {
        console.error('Error fetching latest analysis:', error);
      } finally {
        setLoadingAnalysis(false);
      }
    };

    fetchLatestAnalysis();
  }, [activeProject?.id, isAuthenticated]);

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
    // Show role-specific dashboard
    if (isAdmin) {
      return <AdminDashboard />;
    } else if (isClient) {
      return <ClientDashboard />;
    } else if (isDisplay) {
      return <DisplayDashboard />;
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
      <section className="py-6 bg-[#080F10]">
            <div className="container mx-auto">
              <div className="flex justify-between">
                <h1 className="text-3xl font-medium text-foreground mb-4">
                  Painel exclusivo ITX Company de <span className="font-bold">monitoramento SEO/AIO</span>
                </h1>
                <p className="text-[#BAC9CB] mt-2">
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
                <p className="max-width-[1026px] text-[#BAC9CB] mt-2"> 
                  Analisamos seu site e elencamos as principais oportunidades de SEO encontradas. Trabalhe nessas otimizações
                  para melhorar seus posicionamentos e aumentar seu tráfego.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                {/* Card 1 - Otimização de Títulos */}
                <Card className="bg-[#151D1E] cursor-pointer border-l-4 border-l-red-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <FileText className="h-8 w-8 text-red-500 mb-2" />
                      <Badge variant="destructive" className="text-xs">Alta</Badge>
                    </div>
                    <CardTitle className="text-lg text-[#DCE4E5]">Títulos e Meta Descrições</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm mb-3 text-[#BAC9CB]">
                      5 páginas com títulos duplicados ou muito curtos detectadas
                    </CardDescription>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full bg-[#fff] text-zinc-950"
                      onClick={() => navigate('/audit')}
                    >
                      Corrigir Agora
                    </Button>
                  </CardContent>
                </Card>

                {/* Card 2 - Velocidade */}
                <Card className="bg-[#151D1E] cursor-pointer border-l-4 border-l-orange-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <Zap className="h-8 w-8 text-orange-500 mb-2" />
                      <Badge variant="destructive" className="text-xs">Alta</Badge>
                    </div>
                    <CardTitle className="text-lg text-[#DCE4E5]">Velocidade de Carregamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm mb-3 text-[#BAC9CB]">
                      Tempo atual: 4.2s (recomendado: &lt;2s). Comprima imagens e ative cache
                    </CardDescription>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full bg-[#fff] text-zinc-950"
                      onClick={() => navigate('/audit')}
                    >
                      Ver Detalhes
                    </Button>
                  </CardContent>
                </Card>

                {/* Card 3 - Link Building */}
                <Card className="bg-[#151D1E] cursor-pointer border-l-4 border-l-yellow-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <LinkIcon className="h-8 w-8 text-yellow-500 mb-2" />
                      <Badge variant="secondary" className="text-xs">Média</Badge>
                    </div>
                    <CardTitle className="text-lg text-[#DCE4E5]">Link Building Interno</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm mb-3 text-[#BAC9CB]">
                      12 páginas importantes com poucos links internos encontradas
                    </CardDescription>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full bg-[#fff] text-zinc-950"
                      onClick={() => navigate('/audit')}
                    >
                      Otimizar Links
                    </Button>
                  </CardContent>
                </Card>

                {/* Card 4 - Ver Todas */}
                {/* <Card className="bg-[#151D1E] cursor-pointer border-2 border-dashed border-primary/50 bg-secondary/30">
                  <CardHeader className="pb-3">
                    <ArrowRight className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg">Ver Todas as Sugestões</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm mb-3">
                      Acesse a auditoria completa com todas as oportunidades de melhoria
                    </CardDescription>
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full bg-[#22E8F7]"
                      onClick={() => navigate('/audit')}
                    >
                      Abrir Auditoria <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card> */}
              </div>
              <div className="mt-8">
                <div className="flex gap-2 items-center">
                <span className="text-blue-950 bg-blue-500 p-2"><ChartPie /></span>
                <h2>
                  Trafego estimado
                </h2>
              </div>
                <p className="max-width-[1026px] text-zinc-500 mt-2"> 
                  O tráfego orgânico estimado com projeção futura baseado nas suas últimas análises competitivas.
                </p>
                {loadingAnalysis ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
                      <p className="text-muted-foreground">Carregando dados...</p>
                    </div>
                  </div>
                ) : latestAnalysis ? (
                  <TrafficChart
                    domains={[
                      latestAnalysis.analysis.target_domain,
                      ...latestAnalysis.competitors.slice(0, 2).map(c => c.domain)
                    ]}
                    targetDomain={latestAnalysis.analysis.target_domain}
                    competitors={latestAnalysis.competitors}
                    keywords={latestAnalysis.keywords}
                    period={30}
                    projectionDays={30}
                  />
                ) : (
                  <Card className="mt-4">
                    <CardContent className="p-12 text-center">
                      <ChartPie className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Nenhuma análise competitiva encontrada ainda
                      </p>
                      <Button onClick={() => navigate('/comparison')}>
                        Criar Primeira Análise
                      </Button>
                    </CardContent>
                  </Card>
                )}
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
