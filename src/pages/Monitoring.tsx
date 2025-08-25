import { Helmet } from "react-helmet-async";
import { useMonitoring } from "@/contexts/MonitoringContext";
import MonitoringSetup from "@/components/monitoring/MonitoringSetup";
import MonitoringCard from "@/components/monitoring/MonitoringCard";
import TrendChart from "@/components/monitoring/TrendChart";
import SimulationNotice from "@/components/SimulationNotice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, TrendingUp, Clock, Globe } from "lucide-react";

const Monitoring = () => {
  const { sites } = useMonitoring();

  const getStats = () => {
    const activeSites = sites.filter(s => s.status === 'active').length;
    const totalKeywords = sites.reduce((acc, site) => acc + site.keywords.length, 0);
    const recentlyChecked = sites.filter(s => 
      s.lastCheck && 
      Date.now() - s.lastCheck.getTime() < 24 * 60 * 60 * 1000
    ).length;

    return { activeSites, totalKeywords, recentlyChecked };
  };

  const stats = getStats();

  return (
    <>
      <Helmet>
        <title>Monitoramento SEO - SEO Dashboard</title>
        <meta 
          name="description" 
          content="Configure o monitoramento automático das posições SEO do seu site. Acompanhe a evolução das suas palavras-chave ao longo do tempo." 
        />
        <meta name="keywords" content="monitoramento seo, tracking posições, análise histórica, seo automático" />
        <link rel="canonical" href="/monitoring" />
      </Helmet>

      <div className="min-h-screen bg-background lg:pl-80">
        <div className="pt-16 lg:pt-0">
          <main className="container mx-auto px-4 py-8">
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-foreground flex items-center justify-center gap-3">
                  <Monitor className="h-10 w-10 text-primary" />
                  Monitoramento SEO
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Configure o acompanhamento automático das posições do seu site e 
                  monitore a evolução das suas palavras-chave ao longo do tempo.
                </p>
              </div>

              <SimulationNotice />

              {/* Stats Cards */}
              {sites.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Sites Ativos</CardTitle>
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-primary">{stats.activeSites}</div>
                      <p className="text-xs text-muted-foreground">
                        de {sites.length} total
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Palavras-chave</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-primary">{stats.totalKeywords}</div>
                      <p className="text-xs text-muted-foreground">
                        sendo monitoradas
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Verificações Recentes</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-primary">{stats.recentlyChecked}</div>
                      <p className="text-xs text-muted-foreground">
                        nas últimas 24h
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Setup Form */}
              <MonitoringSetup />

              {/* Monitored Sites */}
              {sites.length > 0 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-foreground">
                    Sites Monitorados ({sites.length})
                  </h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {sites.map(site => (
                      <MonitoringCard key={site.id} site={site} />
                    ))}
                  </div>

                  {/* Trend Charts */}
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-foreground">
                      Gráficos de Evolução
                    </h2>
                    
                    {sites.map(site => (
                      <TrendChart key={site.id} site={site} />
                    ))}
                  </div>
                </div>
              )}

              {sites.length === 0 && (
                <Card className="text-center p-8">
                  <CardContent>
                    <Monitor className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum site sendo monitorado</h3>
                    <p className="text-muted-foreground">
                      Configure seu primeiro monitoramento usando o formulário acima.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default Monitoring;