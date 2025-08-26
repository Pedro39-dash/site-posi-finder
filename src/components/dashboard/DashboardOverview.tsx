import { TrendingUp, TrendingDown, Eye, AlertTriangle, Users, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useMonitoring } from "@/contexts/MonitoringContext";

const DashboardOverview = () => {
  const { user } = useAuth();
  const { sites } = useMonitoring();

  // Mock data simulando métricas do cliente
  const mockMetrics = {
    totalKeywords: 47,
    averagePosition: 8.3,
    topPositions: 12,
    competitorBeat: 3,
    trendsUp: 15,
    trendsDown: 8,
    siteHealth: 92,
    monthlyProgress: +12.5
  };

  const healthStatus = mockMetrics.siteHealth >= 90 ? 'excellent' : 
                      mockMetrics.siteHealth >= 75 ? 'good' : 'needs-attention';

  const healthColor = healthStatus === 'excellent' ? 'text-green-500' :
                      healthStatus === 'good' ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-6 border border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Bem-vindo, {user?.username}! 👋
            </h1>
            <p className="text-muted-foreground">
              Aqui está um resumo do desempenho SEO dos seus projetos em nossa consultoria.
            </p>
          </div>
          <div className="hidden md:block">
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              Cliente Premium
            </Badge>
          </div>
        </div>
      </div>

      {/* Main KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-card transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Palavras-chave Monitoradas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-foreground">{mockMetrics.totalKeywords}</div>
            <p className="text-sm text-green-500 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +5 este mês
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-card transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Posição Média
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-foreground">{mockMetrics.averagePosition}</div>
            <p className="text-sm text-green-500 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              Melhorou 2.1 posições
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-card transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Top 10 Posições
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-foreground">{mockMetrics.topPositions}</div>
            <p className="text-sm text-green-500 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +3 este mês
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-card transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Saúde do Site
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className={`text-2xl font-bold ${healthColor}`}>
              {mockMetrics.siteHealth}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {healthStatus === 'excellent' ? 'Excelente' : 
               healthStatus === 'good' ? 'Bom' : 'Precisa Atenção'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Tendências Positivas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Palavras em Alta</span>
                <span className="font-semibold text-green-500">{mockMetrics.trendsUp}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Palavras em Queda</span>
                <span className="font-semibold text-red-500">{mockMetrics.trendsDown}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Concorrentes Superados</span>
                <span className="font-semibold text-primary">{mockMetrics.competitorBeat}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Progresso Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  +{mockMetrics.monthlyProgress}%
                </div>
                <p className="text-sm text-muted-foreground">
                  Melhoria geral nas posições
                </p>
              </div>
              <div className="bg-secondary/50 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                  style={{ width: `${Math.min(mockMetrics.monthlyProgress * 2, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <button className="p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors text-left">
              <div className="flex items-center gap-3 mb-2">
                <Eye className="h-5 w-5 text-primary" />
                <span className="font-medium">Ver Posições</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Consultar posições atuais das suas palavras-chave
              </p>
            </button>
            
            <button className="p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors text-left">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium">Comparar Concorrentes</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Ver como você está comparado à concorrência
              </p>
            </button>
            
            <button className="p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors text-left">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <span className="font-medium">Auditoria SEO</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Verificar saúde técnica do seu site
              </p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;