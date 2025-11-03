import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Search, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { ClientDashboard } from "@/components/dashboard/ClientDashboard";
import { DisplayDashboard } from "@/components/dashboard/DisplayDashboard";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { 
  getSeries,
  filterDataByPeriod, 
  calculateSummary,
  clearAllSavedData,
  PeriodFilter,
  PerformanceDataPoint,
  SeriesData
} from "@/utils/keywordPerformanceSimulator";
import { useToast } from "@/hooks/use-toast";
import { KeywordManager } from "@/components/serp/KeywordManager";
import { CompetitorManager } from "@/components/serp/CompetitorManager";
import { SeriesLegend, SeriesItem } from "@/components/serp/SeriesLegend";
import { SummaryCards, SeriesSummary } from "@/components/serp/SummaryCards";

const Index = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { isAdmin, isClient, isDisplay, isLoading: roleLoading } = useRole();
  const { toast } = useToast();
  
  // Estados principais
  const [mainDomain, setMainDomain] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [period, setPeriod] = useState<PeriodFilter>("month");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Estados de séries e visualização
  const [allSeries, setAllSeries] = useState<Map<string, SeriesData>>(new Map());
  const [activeSeries, setActiveSeries] = useState<Set<string>>(new Set());
  const [selectedSummaryId, setSelectedSummaryId] = useState<string | undefined>();

  // Gerar ID único para série
  const getSeriesId = (keyword: string, domain: string) => 
    `${keyword.toLowerCase()}::${domain.toLowerCase()}`;

  // Função para buscar performance
  const handleSearch = async () => {
    if (keywords.length === 0 || !mainDomain.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Adicione pelo menos uma palavra-chave e informe o domínio principal.",
        variant: "destructive",
      });
      return;
    }

    const totalSeries = keywords.length * (1 + competitors.length);
    if (totalSeries > 8) {
      toast({
        title: "Limite excedido",
        description: "Máximo de 8 séries simultâneas (palavras-chave × domínios).",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    
    try {
      const newSeries = new Map<string, SeriesData>();
      const newActive = new Set<string>();
      
      // Gerar séries para todas as combinações
      for (const kw of keywords) {
        const domains = [mainDomain, ...competitors];
        
        for (const dom of domains) {
          const id = getSeriesId(kw, dom);
          const series = await getSeries(kw, dom);
          newSeries.set(id, series);
          newActive.add(id);
        }
      }
      
      setAllSeries(newSeries);
      setActiveSeries(newActive);
      setHasSearched(true);
      
      toast({
        title: "Dados carregados",
        description: `${newSeries.size} série(s) carregada(s) com sucesso`,
      });
    } catch (error) {
      toast({
        title: "Erro na busca",
        description: "Não foi possível carregar os dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Função para limpar busca
  const handleClear = () => {
    setMainDomain("");
    setKeywords([]);
    setCompetitors([]);
    setPeriod("month");
    setAllSeries(new Map());
    setActiveSeries(new Set());
    setHasSearched(false);
    setSelectedSummaryId(undefined);
  };

  // Função para limpar dados salvos
  const handleClearSavedData = () => {
    clearAllSavedData();
    handleClear();
    toast({
      title: "Dados limpos",
      description: "Todas as simulações salvas foram removidas.",
    });
  };

  // Toggle de série no gráfico
  const handleToggleSeries = (id: string) => {
    setActiveSeries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Toggle de todas as séries
  const handleToggleAll = () => {
    const allActive = legendItems.every(item => activeSeries.has(item.id));
    if (allActive) {
      setActiveSeries(new Set());
    } else {
      setActiveSeries(new Set(legendItems.map(item => item.id)));
    }
  };

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

  // Preparar dados do gráfico
  const chartData = hasSearched ? (() => {
    const activeSeriesArray = Array.from(activeSeries)
      .map(id => allSeries.get(id))
      .filter((s): s is SeriesData => s !== undefined);

    if (activeSeriesArray.length === 0) return [];

    // Filtrar e agregar cada série
    const filtered = activeSeriesArray.map(series => ({
      id: getSeriesId(series.keyword, series.domain),
      data: filterDataByPeriod(series.dailySeries, period),
      color: series.color,
    }));

    // Combinar em estrutura única por data
    const dateMap = new Map<string, any>();
    
    filtered.forEach(({ id, data, color }) => {
      data.forEach(point => {
        if (!dateMap.has(point.date)) {
          dateMap.set(point.date, { 
            date: point.date, 
            label: point.label,
            aggregationType: point.aggregationType 
          });
        }
        dateMap.get(point.date)![id] = point.position;
      });
    });

    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  })() : [];

  // Preparar dados da legenda
  const legendItems: SeriesItem[] = Array.from(allSeries.values()).map(series => {
    const id = getSeriesId(series.keyword, series.domain);
    return {
      id,
      keyword: series.keyword,
      domain: series.domain,
      color: series.color,
      active: activeSeries.has(id),
      isMain: series.domain === mainDomain,
    };
  });

  // Preparar sumários
  const summaries: SeriesSummary[] = Array.from(activeSeries)
    .map(id => {
      const series = allSeries.get(id);
      if (!series) return null;
      
      const filtered = filterDataByPeriod(series.dailySeries, period);
      const summary = calculateSummary(filtered);
      
      return {
        id,
        keyword: series.keyword,
        domain: series.domain,
        color: series.color,
        current: summary.current,
        best: summary.best,
        positionGain: summary.percentageChange,
      };
    })
    .filter((s): s is SeriesSummary => s !== null);

  return (
    <>
      <Helmet>
        <title>Busca de Posição na SERP - ITX Company</title>
        <meta 
          name="description" 
          content="Analise a posição de palavras-chave na SERP do Google para qualquer domínio com dados simulados determinísticos." 
        />
        <meta name="keywords" content="seo, palavras-chave, serp, posição google, ranking, análise" />
        <link rel="canonical" href="/" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Cabeçalho */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Busca de Posição na SERP
              </h1>
              <p className="text-muted-foreground">
                Analise e compare posições no Google com dados simulados persistentes
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Limpar dados salvos
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso apagará todas as simulações salvas. Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearSavedData}>
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Formulário de Busca */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Configurar Busca
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="main-domain">Domínio Principal</Label>
                <Input
                  id="main-domain"
                  placeholder="Ex: meusite.com.br"
                  value={mainDomain}
                  onChange={(e) => setMainDomain(e.target.value)}
                />
              </div>

              <KeywordManager
                keywords={keywords}
                onAdd={(kw) => setKeywords([...keywords, kw.toLowerCase()])}
                onRemove={(kw) => setKeywords(keywords.filter(k => k !== kw))}
              />

              <CompetitorManager
                competitors={competitors}
                onAdd={(comp) => setCompetitors([...competitors, comp.toLowerCase()])}
                onRemove={(comp) => setCompetitors(competitors.filter(c => c !== comp))}
                disabled={keywords.length === 0}
              />

              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={handleSearch} 
                  disabled={isSearching || keywords.length === 0 || !mainDomain.trim()}
                  className="flex-1 md:flex-none"
                >
                  {isSearching ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent mr-2" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Buscar
                    </>
                  )}
                </Button>
                {hasSearched && (
                  <Button 
                    onClick={handleClear} 
                    variant="outline"
                  >
                    Nova Busca
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bloco de Métricas */}
          {hasSearched && summaries.length > 0 && (
            <div className="mb-6">
              <SummaryCards
                summaries={summaries}
                selectedId={selectedSummaryId}
                onSelectSeries={setSelectedSummaryId}
              />
            </div>
          )}

          {/* Filtro de Período */}
          {hasSearched && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground mr-2">Período:</span>
                  <Button
                    variant={period === 'day' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPeriod('day')}
                  >
                    Dia
                  </Button>
                  <Button
                    variant={period === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPeriod('week')}
                  >
                    Semana
                  </Button>
                  <Button
                    variant={period === 'month' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPeriod('month')}
                  >
                    Mês
                  </Button>
                  <Button
                    variant={period === '3months' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPeriod('3months')}
                  >
                    3 Meses
                  </Button>
                  <Button
                    variant={period === '6months' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPeriod('6months')}
                  >
                    6 Meses
                  </Button>
                  <Button
                    variant={period === '12months' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPeriod('12months')}
                  >
                    12 Meses
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gráfico */}
          {hasSearched && allSeries.size > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  Posição na SERP ao longo do tempo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeSeries.size > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={(value) => {
                          const point = chartData.find(d => d.date === value);
                          if (point?.label) return point.label;
                          const date = new Date(value);
                          return `${date.getDate()}/${date.getMonth() + 1}`;
                        }}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        domain={[1, 100]}
                        reversed
                        label={{ value: 'Posição (1 é melhor)', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))' } }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--popover-foreground))',
                        }}
                        labelFormatter={(value) => {
                          const point = chartData.find(d => d.date === value);
                          if (point?.label) return point.label;
                          const date = new Date(value);
                          const aggregationType = point?.aggregationType || 'daily';
                          
                          if (aggregationType === 'daily') {
                            return date.toLocaleDateString('pt-BR');
                          } else if (aggregationType === 'weekly') {
                            return `Semana — ${date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`;
                          } else {
                            return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                          }
                        }}
                      />
                      {Array.from(activeSeries).map(id => {
                        const series = allSeries.get(id);
                        if (!series) return null;
                        return (
                          <Line
                            key={id}
                            type="monotone"
                            dataKey={id}
                            stroke={series.color}
                            strokeWidth={2}
                            dot={{ fill: series.color, r: 2 }}
                            name={`${series.keyword} — ${series.domain}`}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    Ative pelo menos uma série na legenda
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Lista de Séries */}
          {hasSearched && allSeries.size > 0 && (
            <SeriesLegend
              series={legendItems}
              onToggle={handleToggleSeries}
              onToggleAll={handleToggleAll}
            />
          )}

          {/* Estado vazio */}
          {!hasSearched && (
            <Card>
              <CardContent className="py-16 text-center">
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Configure sua análise
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Adicione palavras-chave, defina seu domínio principal e, opcionalmente, 
                  inclua concorrentes para comparação. Os dados são simulados de forma 
                  determinística e persistidos localmente para consistência.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default Index;
