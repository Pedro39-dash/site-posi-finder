import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Search, 
  BarChart3, 
  Globe,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";
import { useProject } from "@/hooks/useProject";
import { useNavigate } from "react-router-dom";

interface ClientDashboardProps {
  onViewModeChange?: (mode: 'search') => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ onViewModeChange }) => {
  const { activeProject, isLoading } = useProject();
  const navigate = useNavigate();

  // Mock data baseado no projeto ativo
  const projectMetrics = [
    {
      title: "Keywords Monitoradas",
      value: activeProject?.focus_keywords?.length || 0,
      change: "+2 esta semana", 
      icon: Target,
      trend: "up"
    },
    {
      title: "Posição Média",
      value: "12.5",
      change: "-3.2 vs mês anterior",
      icon: BarChart3,
      trend: "up"
    },
    {
      title: "Top 10 Posições",
      value: "23",
      change: "+5 este mês",
      icon: TrendingUp,
      trend: "up"
    },
    {
      title: "Concorrentes",
      value: activeProject?.competitor_domains?.length || 0,
      change: "Sem alterações",
      icon: Globe,
      trend: "stable"
    }
  ];

  const keywordPerformance = [
    { keyword: "consultoria seo", position: 3, previousPosition: 5, trend: "up" },
    { keyword: "agencia digital", position: 8, previousPosition: 12, trend: "up" },
    { keyword: "marketing digital", position: 15, previousPosition: 15, trend: "stable" },
    { keyword: "otimização google", position: 22, previousPosition: 18, trend: "down" },
  ];

  const quickActions = [
    {
      title: "Nova Pesquisa de Posições",
      description: "Verificar posições atuais das keywords",
      action: () => onViewModeChange?.('search'),
      icon: Search,
      color: "bg-primary"
    },
    {
      title: "Auditoria SEO",
      description: "Análise completa do seu site",
      action: () => navigate('/audit'),
      icon: BarChart3,
      color: "bg-accent"
    },
    {
      title: "Comparar Concorrentes",
      description: "Análise competitiva detalhada", 
      action: () => navigate('/comparison'),
      icon: Globe,
      color: "bg-gradient-primary"
    }
  ];

  if (isLoading) {
    return <div className="flex justify-center p-8">Carregando dashboard...</div>;
  }

  if (!activeProject) {
    return (
      <div className="text-center py-12">
        <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Nenhum projeto ativo
        </h2>
        <p className="text-muted-foreground mb-6">
          Crie ou selecione um projeto para começar a monitorar seu SEO
        </p>
        <Button onClick={() => navigate('/projects')}>
          Gerenciar Projetos
        </Button>
      </div>
    );
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-3 w-3 text-accent" />;
      case 'down': return <ArrowDown className="h-3 w-3 text-destructive" />;
      default: return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header do projeto */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{activeProject.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{activeProject.domain}</Badge>
            <Badge variant="secondary">{activeProject.market_segment || 'Geral'}</Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/projects')}>
            Trocar Projeto
          </Button>
          <Button onClick={() => onViewModeChange?.('search')}>
            Nova Pesquisa
          </Button>
        </div>
      </div>

      {/* Métricas do Projeto */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {projectMetrics.map((metric, index) => (
          <Card key={index} className="border-l-4 border-l-primary/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">{metric.value}</span>
                {getTrendIcon(metric.trend)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{metric.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Conteúdo Principal */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="actions">Ações Rápidas</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Evolução das Posições
                </CardTitle>
                <CardDescription>
                  Progresso das suas keywords nos últimos 30 dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center bg-muted/20 rounded">
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Gráfico de evolução</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Posições</CardTitle>
                <CardDescription>
                  Onde suas keywords estão rankeando
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Top 3</span>
                    <span className="text-2xl font-bold text-accent">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Top 10</span>
                    <span className="text-2xl font-bold text-primary">8</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Top 50</span>
                    <span className="text-2xl font-bold text-muted-foreground">15</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Não rankeando</span>
                    <span className="text-2xl font-bold text-destructive">2</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Keyword</CardTitle>
              <CardDescription>
                Acompanhe o desempenho individual de cada palavra-chave
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {keywordPerformance.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{item.keyword}</span>
                        <span className="text-sm text-muted-foreground">
                          Posição anterior: {item.previousPosition}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <span className="text-2xl font-bold text-foreground">#{item.position}</span>
                          {getTrendIcon(item.trend)}
                        </div>
                      </div>
                      <Badge variant={
                        item.position <= 3 ? 'default' : 
                        item.position <= 10 ? 'secondary' : 'outline'
                      }>
                        {item.position <= 3 ? 'Excelente' : 
                         item.position <= 10 ? 'Bom' : 'Melhorar'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {quickActions.map((action, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow" onClick={action.action}>
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 ${action.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <action.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};