import React from "react";
import { Trophy, TrendingUp, Target, Users, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { calculateAdvancedScore, calculateOverallScore } from "@/utils/seoScoring";

export interface ComparisonResultEnhanced {
  keyword: string;
  results: {
    website: string;
    position: number | null;
    isWinner: boolean;
    isClient: boolean;
  }[];
}

interface CompetitiveOverviewProps {
  results: ComparisonResultEnhanced[];
  websites: string[];
}

interface CompetitorStats {
  domain: string;
  winsCount: number;
  averagePosition: number;
  topKeywords: string[];
}

const CompetitiveOverview = ({ results, websites }: CompetitiveOverviewProps) => {
  const clientDomain = websites[0];
  const competitorDomain = websites[1];

  // 1.1 Posição Média Competitiva
  const calculateAveragePositionDifference = () => {
    const comparisons = results.map(r => {
      const clientPos = r.results.find(res => res.website === clientDomain)?.position;
      const competitorPos = r.results.find(res => res.website === competitorDomain)?.position;
      
      if (!clientPos || !competitorPos) return null;
      return clientPos - competitorPos;
    }).filter(diff => diff !== null) as number[];

    if (comparisons.length === 0) return 0;
    return Math.round(comparisons.reduce((acc, diff) => acc + diff, 0) / comparisons.length);
  };

  // 1.2 Potencial de Tráfego Perdido
  const calculateTrafficPotential = () => {
    const opportunities = results.filter(r => {
      const clientPos = r.results.find(res => res.website === clientDomain)?.position;
      const competitorPos = r.results.find(res => res.website === competitorDomain)?.position;
      
      return clientPos && competitorPos && competitorPos < clientPos;
    });

    const totalKeywords = results.filter(r => {
      const clientPos = r.results.find(res => res.website === clientDomain)?.position;
      const competitorPos = r.results.find(res => res.website === competitorDomain)?.position;
      return clientPos && competitorPos;
    }).length;

    if (totalKeywords === 0) return 0;
    return Math.round((opportunities.length / totalKeywords) * 100);
  };

  // 1.3 Concorrentes Destaque
  const getCompetitorHighlights = (): CompetitorStats[] => {
    const competitorWins = results.filter(r => 
      r.results.find(res => res.website === competitorDomain)?.isWinner
    );

    const competitorPositions = results.map(r => 
      r.results.find(res => res.website === competitorDomain)?.position
    ).filter(pos => pos !== null) as number[];

    const averagePosition = competitorPositions.length > 0 
      ? Math.round(competitorPositions.reduce((a, b) => a + b, 0) / competitorPositions.length)
      : 0;

    const topKeywords = competitorWins.slice(0, 3).map(r => r.keyword);

    return [{
      domain: competitorDomain,
      winsCount: competitorWins.length,
      averagePosition,
      topKeywords
    }];
  };

  const positionDifference = calculateAveragePositionDifference();
  const trafficPotential = calculateTrafficPotential();
  const competitorHighlights = getCompetitorHighlights();

  const getDomainName = (url: string) => {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  };

  const getPositionDifferenceText = (diff: number) => {
    if (diff === 0) return "Posições empatadas";
    if (diff > 0) return `${Math.abs(diff)} posições atrás`;
    return `${Math.abs(diff)} posições à frente`;
  };

  const getPositionDifferenceColor = (diff: number) => {
    if (diff === 0) return "text-muted-foreground";
    if (diff > 0) return "text-destructive";
    return "text-accent";
  };

  const getTrafficPotentialColor = (potential: number) => {
    if (potential === 0) return "text-muted-foreground";
    if (potential <= 20) return "text-primary";
    if (potential <= 50) return "text-yellow-600";
    return "text-destructive";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Target className="h-6 w-6 text-primary" />
          Visão Geral Competitiva
        </h2>
        <p className="text-muted-foreground">
          Análise rápida da situação competitiva - foque no que realmente importa
        </p>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1.1 Posição Média Competitiva */}
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Posição Competitiva
            </CardTitle>
            <CardDescription>
              Diferença média vs. concorrente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className={`text-3xl font-bold ${getPositionDifferenceColor(positionDifference)}`}>
                {getPositionDifferenceText(positionDifference)}
              </div>
              <Progress 
                value={Math.max(0, Math.min(100, 50 + (positionDifference * -5)))} 
                className="mt-3 h-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                {positionDifference > 0 
                  ? "Há espaço para melhorar suas posições" 
                  : positionDifference < 0
                  ? "Você está superando o concorrente!"
                  : "Vocês estão bem equilibrados"
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 1.2 Potencial de Tráfego Perdido */}
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Potencial Perdido
            </CardTitle>
            <CardDescription>
              Tráfego que você poderia ter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className={`text-3xl font-bold ${getTrafficPotentialColor(trafficPotential)}`}>
                +{trafficPotential}%
              </div>
              <p className="text-sm text-muted-foreground">de tráfego orgânico</p>
              <Progress 
                value={trafficPotential} 
                className="mt-3 h-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                {trafficPotential === 0 
                  ? "Sem oportunidades imediatas identificadas"
                  : trafficPotential <= 20
                  ? "Algumas oportunidades de melhoria"
                  : trafficPotential <= 50
                  ? "Boas oportunidades disponíveis"
                  : "Muitas oportunidades de crescimento!"
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 1.3 Concorrentes Destaque */}
        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Concorrente Principal
            </CardTitle>
            <CardDescription>
              Análise do principal rival
            </CardDescription>
          </CardHeader>
          <CardContent>
            {competitorHighlights.map((competitor, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {getDomainName(competitor.domain)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Posição média: {competitor.averagePosition}ª
                    </p>
                  </div>
                  <Badge variant="destructive">
                    {competitor.winsCount} vitórias
                  </Badge>
                </div>
                
                {competitor.topKeywords.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Supera você em:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {competitor.topKeywords.map((keyword, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {keyword.length > 12 ? keyword.substring(0, 12) + "..." : keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Resumo Executivo */}
      <Card className="bg-accent/5 border-accent/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent" />
            Resumo Executivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Situação Atual:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• {results.length} palavras-chave analisadas</li>
                <li>• {results.filter(r => r.results.find(res => res.website === clientDomain)?.isWinner).length} vitórias suas</li>
                <li>• {results.filter(r => r.results.find(res => res.website === competitorDomain)?.isWinner).length} vitórias do concorrente</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Próximos Passos:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Analisar detalhes na tabela abaixo</li>
                <li>• Focar nas oportunidades de maior impacto</li>
                <li>• Implementar melhorias específicas por palavra-chave</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompetitiveOverview;