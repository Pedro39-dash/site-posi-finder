import { TrendingUp, TrendingDown, Eye, AlertTriangle, Users, Trophy, Settings, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProjectsSection from "./ProjectsSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useMonitoring } from "@/contexts/MonitoringContext";
import { useProjects } from "@/contexts/ProjectContext";
import { useNavigate } from "react-router-dom";

interface DashboardOverviewProps {
  onViewModeChange?: (mode: 'search') => void;
}

const DashboardOverview = ({ onViewModeChange }: DashboardOverviewProps) => {
  const { user } = useAuth();
  const { sites } = useMonitoring();
  const { activeProject, projects } = useProjects();
  const navigate = useNavigate();

  // Métricas baseadas no projeto ativo
  const mockMetrics = activeProject ? {
    totalKeywords: activeProject.keywords.length || 47,
    averagePosition: 8.3,
    topPositions: Math.floor((activeProject.keywords.length || 47) * 0.25),
    competitorBeat: activeProject.competitors.length || 3,
    trendsUp: Math.floor((activeProject.keywords.length || 47) * 0.32),
    trendsDown: Math.floor((activeProject.keywords.length || 47) * 0.17),
    siteHealth: activeProject.currentScore || 92,
    monthlyProgress: +12.5,
    featuredKeyword: activeProject.keywords[0]?.keyword || "marketing digital"
  } : {
    totalKeywords: 0,
    averagePosition: 0,
    topPositions: 0,
    competitorBeat: 0,
    trendsUp: 0,
    trendsDown: 0,
    siteHealth: 0,
    monthlyProgress: 0,
    featuredKeyword: "Nenhuma palavra-chave"
  };

  const healthStatus = mockMetrics.siteHealth >= 90 ? 'excellent' : 
                      mockMetrics.siteHealth >= 75 ? 'good' : 'needs-attention';

  const healthColor = healthStatus === 'excellent' ? 'text-green-500' :
                      healthStatus === 'good' ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="space-y-6">
      {/* Active Project Header */}
      {activeProject ? (
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-6 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-primary/20 rounded-lg p-3">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-1">
                  {activeProject.name}
                </h1>
                <p className="text-muted-foreground flex items-center gap-2">
                  <span>{activeProject.mainDomain}</span>
                  <Badge variant="secondary" className="text-xs">
                    {activeProject.sector}
                  </Badge>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/20 text-primary">
                Projeto Ativo
              </Badge>
              {projects.length > 1 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/projects')}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Trocar Projeto
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-6 border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Bem-vindo, {user?.username}! 👋
              </h1>
              <p className="text-muted-foreground">
                Selecione um projeto para ver as métricas de SEO específicas.
              </p>
            </div>
            <Button onClick={() => navigate('/projects')}>
              Gerenciar Projetos
            </Button>
          </div>
        </div>
      )}

      {/* Main KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className="hover:shadow-card transition-all duration-300 cursor-pointer hover:scale-[1.02]"
          onClick={() => navigate('/rankings')}
        >
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

        <Card 
          className="hover:shadow-card transition-all duration-300 cursor-pointer hover:scale-[1.02]"
          onClick={() => navigate('/rankings')}
        >
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

        <Card 
          className="hover:shadow-card transition-all duration-300 cursor-pointer hover:scale-[1.02]"
          onClick={() => navigate('/rankings')}
        >
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

        <Card 
          className="hover:shadow-card transition-all duration-300 cursor-pointer hover:scale-[1.02]"
          onClick={() => navigate('/audit')}
        >
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
        <Card 
          className="hover:shadow-card transition-all duration-300 cursor-pointer"
          onClick={() => navigate('/rankings')}
        >
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

        <Card 
          className="hover:shadow-card transition-all duration-300 cursor-pointer"
          onClick={() => navigate('/monitoring')}
        >
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Progresso Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  +{mockMetrics.monthlyProgress}%
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  Palavra-chave em destaque:
                </p>
                <p className="font-semibold text-foreground">
                  "{mockMetrics.featuredKeyword}" 
                  <span className="text-green-500 text-sm ml-1">+8 posições</span>
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
            <button 
              onClick={() => onViewModeChange?.('search')}
              className="p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <Eye className="h-5 w-5 text-primary" />
                <span className="font-medium">Ver Posições</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Consultar posições atuais das suas palavras-chave
              </p>
            </button>
            
            <button 
              onClick={() => navigate('/comparison')}
              className="p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium">Comparar Concorrentes</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Ver como você está comparado à concorrência
              </p>
            </button>
            
            <button 
              onClick={() => navigate('/audit')}
              className="p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <span className="font-medium">Auditoria SEO</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Análise técnica completa do site
              </p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Projects Section - Moved to bottom */}
      <div className="border-t pt-6">
        <ProjectsSection />
      </div>

    </div>
  );
};

export default DashboardOverview;