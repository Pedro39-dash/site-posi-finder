import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Lock, 
  Crown, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Globe,
  Zap,
  Star
} from "lucide-react";

interface DisplayDashboardProps {
  onViewModeChange?: (mode: 'search') => void;
}

export const DisplayDashboard: React.FC<DisplayDashboardProps> = ({ onViewModeChange }) => {
  const limitedMetrics = [
    {
      title: "Demonstração - Keywords",
      value: "***", 
      note: "Upgrade para ver dados reais",
      icon: Target,
      locked: true
    },
    {
      title: "Posições de Exemplo",
      value: "Simulação",
      note: "3 verificações gratuitas restantes",
      icon: BarChart3,
      locked: false
    },
    {
      title: "Análise Limitada",
      value: "Básica",
      note: "Upgrade para análise completa",
      icon: TrendingUp,
      locked: true
    },
    {
      title: "Acesso Display",
      value: "Demo",
      note: "Funcionalidades reduzidas",
      icon: Globe,
      locked: true
    }
  ];

  const demoFeatures = [
    {
      title: "Auditoria SEO Completa",
      description: "Análise de 52+ critérios técnicos",
      available: false,
      icon: BarChart3
    },
    {
      title: "Monitoramento 24/7",
      description: "Tracking automático de posições",
      available: false,
      icon: TrendingUp  
    },
    {
      title: "Análise de Concorrentes",
      description: "Compare com seus competidores",
      available: false,
      icon: Globe
    },
    {
      title: "Pesquisa Básica",
      description: "3 verificações por dia",
      available: true,
      icon: Target
    }
  ];

  const upgradeReasons = [
    "Auditorias SEO ilimitadas",
    "Monitoramento automático 24/7",
    "Histórico completo de posições",
    "Análise competitiva avançada", 
    "Relatórios personalizados",
    "Suporte prioritário"
  ];

  return (
    <div className="space-y-8">
      {/* Header com CTA de Upgrade */}
      <div className="bg-gradient-primary rounded-lg p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Modo Demonstração</h1>
            </div>
            <p className="text-white/90">
              Você está usando uma versão limitada. Faça upgrade para acessar todas as funcionalidades!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="lg" className="text-primary font-semibold">
              <Crown className="h-4 w-4 mr-2" />
              Fazer Upgrade
            </Button>
          </div>
        </div>
      </div>

      {/* Métricas Limitadas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {limitedMetrics.map((metric, index) => (
          <Card key={index} className={`border-l-4 ${metric.locked ? 'border-l-muted' : 'border-l-primary/30'} relative`}>
            {metric.locked && (
              <div className="absolute top-2 right-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className={`h-5 w-5 ${metric.locked ? 'text-muted-foreground' : 'text-primary'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{metric.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{metric.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Funcionalidades Disponíveis vs Bloqueadas */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Funcionalidades Disponíveis
            </CardTitle>
            <CardDescription>
              O que você pode usar agora
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {demoFeatures.map((feature, index) => (
              <div key={index} className={`flex items-start gap-3 p-3 rounded-lg ${
                feature.available ? 'bg-primary/10' : 'bg-muted/30'
              }`}>
                <div className={`p-2 rounded-full ${
                  feature.available ? 'bg-primary/20' : 'bg-muted'
                }`}>
                  <feature.icon className={`h-4 w-4 ${
                    feature.available ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                </div>
                <div className="flex-1">
                  <h4 className={`font-medium ${
                    feature.available ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {feature.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                  {feature.available ? (
                    <Badge variant="default" className="mt-2 text-xs">Disponível</Badge>
                  ) : (
                    <Badge variant="outline" className="mt-2 text-xs">
                      <Lock className="h-3 w-3 mr-1" />
                      Bloqueado
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            
            <div className="pt-4 border-t">
              <Button 
                onClick={() => onViewModeChange?.('search')} 
                className="w-full"
                variant="outline"
              >
                Testar Pesquisa Gratuita
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Upgrade para Pro
            </CardTitle>
            <CardDescription>
              Desbloqueie o poder completo da plataforma
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-primary">R$ 97</div>
              <div className="text-sm text-muted-foreground">por mês</div>
            </div>

            <div className="space-y-3">
              {upgradeReasons.map((reason, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-accent flex-shrink-0" />
                  <span className="text-sm text-foreground">{reason}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 space-y-2">
              <Button className="w-full" size="lg">
                <Crown className="h-4 w-4 mr-2" />
                Começar Teste Grátis
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                7 dias grátis • Cancele quando quiser
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demonstração de Resultados */}
      <Card>
        <CardHeader>
          <CardTitle>Prévia de Resultados</CardTitle>
          <CardDescription>
            Exemplo do que você veria com acesso completo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 opacity-60 relative">
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded z-10">
              <div className="text-center">
                <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-muted-foreground">
                  Faça upgrade para ver dados reais
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  Desbloquear
                </Button>
              </div>
            </div>
            
            {/* Mock blurred content */}
            <div className="blur-sm">
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
                <div>
                  <div className="font-medium">consultoria seo</div>
                  <div className="text-sm text-muted-foreground">Posição anterior: 8</div>
                </div>
                <div className="text-2xl font-bold">#3</div>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
                <div>
                  <div className="font-medium">marketing digital</div>
                  <div className="text-sm text-muted-foreground">Posição anterior: 15</div>
                </div>
                <div className="text-2xl font-bold">#12</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};