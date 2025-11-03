import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Search, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { ClientDashboard } from "@/components/dashboard/ClientDashboard";
import { DisplayDashboard } from "@/components/dashboard/DisplayDashboard";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { 
  generatePerformanceData, 
  filterDataByPeriod, 
  calculateSummary,
  PeriodFilter,
  PerformanceDataPoint 
} from "@/utils/keywordPerformanceSimulator";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { isAdmin, isClient, isDisplay, isLoading: roleLoading } = useRole();
  const { toast } = useToast();
  
  // Estados para a busca de performance
  const [keyword, setKeyword] = useState("");
  const [domain, setDomain] = useState("");
  const [period, setPeriod] = useState<PeriodFilter>("month");
  const [fullData, setFullData] = useState<PerformanceDataPoint[]>([]);
  const [filteredData, setFilteredData] = useState<PerformanceDataPoint[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Atualizar dados filtrados quando o período mudar
  useEffect(() => {
    if (fullData.length > 0) {
      const filtered = filterDataByPeriod(fullData, period);
      setFilteredData(filtered);
    }
  }, [period, fullData]);

  // Função para buscar performance
  const handleSearch = async () => {
    if (!keyword.trim() || !domain.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha palavra-chave e domínio.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    
    try {
      // Simular delay de busca
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Gerar dados determinísticos
      const data = await generatePerformanceData(keyword.trim(), domain.trim());
      setFullData(data);
      
      // Filtrar por período atual
      const filtered = filterDataByPeriod(data, period);
      setFilteredData(filtered);
      
      setHasSearched(true);
      
      toast({
        title: "Busca concluída",
        description: `Posições SERP carregadas para "${keyword}" em ${domain}`,
      });
    } catch (error) {
      toast({
        title: "Erro na busca",
        description: "Não foi possível gerar os dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Função para limpar busca
  const handleClear = () => {
    setKeyword("");
    setDomain("");
    setPeriod("month");
    setFullData([]);
    setFilteredData([]);
    setHasSearched(false);
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

  // Calcular resumo
  const summary = filteredData.length > 0 ? calculateSummary(filteredData) : null;

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
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Busca de Posição na SERP
            </h1>
            <p className="text-muted-foreground">
              Analise o histórico de posições no Google de qualquer palavra-chave em um domínio específico
            </p>
          </div>

          {/* Formulário de Busca */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Buscar Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="keyword">Palavra-chave</Label>
                  <Input
                    id="keyword"
                    placeholder="Ex: marketing digital"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domain">Domínio</Label>
                  <Input
                    id="domain"
                    placeholder="Ex: exemplo.com.br"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSearch} 
                  disabled={isSearching}
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
                    Limpar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

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
          {hasSearched && filteredData.length > 0 && (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>
                    Posição na SERP — {keyword} em {domain}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={filteredData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={(value) => {
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
                          const date = new Date(value);
                          return `Data: ${date.toLocaleDateString('pt-BR')}`;
                        }}
                        formatter={(value: number) => [`${value}`, 'Posição']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="position" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Resumo */}
              {summary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Posição Atual
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground">
                        {summary.current}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Último dia do período
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Melhor Posição
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground">
                        {summary.best}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Menor posição no período
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Ganho de Posições
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-3xl font-bold flex items-center gap-2 ${
                        summary.percentageChange > 0 
                          ? 'text-green-500' 
                          : summary.percentageChange < 0 
                            ? 'text-red-500' 
                            : 'text-muted-foreground'
                      }`}>
                        {summary.percentageChange > 0 && <TrendingUp className="h-6 w-6" />}
                        {summary.percentageChange < 0 && <TrendingDown className="h-6 w-6" />}
                        {summary.percentageChange === 0 && <Minus className="h-6 w-6" />}
                        {summary.percentageChange > 0 ? '+' : ''}{summary.percentageChange}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Início vs. Fim (positivo = melhora)
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}

          {/* Estado vazio */}
          {!hasSearched && (
            <Card>
              <CardContent className="py-16 text-center">
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Faça sua primeira busca
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Digite uma palavra-chave e um domínio para visualizar o histórico simulado de posições na SERP do Google.
                  Os dados são gerados de forma determinística, garantindo consistência entre buscas.
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
