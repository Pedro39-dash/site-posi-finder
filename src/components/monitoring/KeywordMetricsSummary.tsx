import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { SparklineChart } from "./analytics/SparklineChart";
import { KeywordRanking } from "@/services/rankingService";
import { useMemo } from "react";

interface KeywordMetricsSummaryProps {
  rankings: KeywordRanking[];
  isLoading?: boolean;
}

// Estimativa de CTR por posição (baseado em estudos de mercado)
const getCTRByPosition = (position: number): number => {
  if (position === 1) return 0.28;
  if (position === 2) return 0.15;
  if (position === 3) return 0.11;
  if (position <= 10) return 0.05;
  if (position <= 20) return 0.02;
  return 0.01;
};

export const KeywordMetricsSummary = ({ rankings, isLoading = false }: KeywordMetricsSummaryProps) => {
  const metrics = useMemo(() => {
    const totalKeywords = rankings.length;
    
    // Estimativa de tráfego baseada em posições
    const estimatedTraffic = rankings.reduce((total, ranking) => {
      if (!ranking.current_position) return total;
      
      // Assumir volume de busca médio de 1000/mês por keyword
      const searchVolume = 1000;
      const ctr = getCTRByPosition(ranking.current_position);
      return total + (searchVolume * ctr);
    }, 0);
    
    // Dados para sparkline (últimos 7 dias - simulado)
    const keywordSparklineData = Array.from({ length: 7 }, (_, i) => ({
      value: Math.floor(totalKeywords * (0.9 + Math.random() * 0.2))
    }));
    
    const trafficSparklineData = Array.from({ length: 7 }, (_, i) => ({
      value: Math.floor(estimatedTraffic * (0.85 + Math.random() * 0.3))
    }));
    
    // Calcular tendência (simulado - comparação com período anterior)
    const keywordTrend = Math.random() > 0.5 ? 'up' : 'down';
    const trafficTrend = Math.random() > 0.5 ? 'up' : 'down';
    const keywordChange = (Math.random() * 10).toFixed(1);
    const trafficChange = (Math.random() * 15).toFixed(1);
    
    return {
      totalKeywords,
      estimatedTraffic: Math.round(estimatedTraffic),
      keywordSparklineData,
      trafficSparklineData,
      keywordTrend,
      trafficTrend,
      keywordChange,
      trafficChange
    };
  }, [rankings]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-12 bg-muted rounded w-1/2 mb-4"></div>
              <div className="h-10 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* Total de Palavras-chave */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Palavras-chave
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-4xl font-bold text-foreground">
              {metrics.totalKeywords.toLocaleString('pt-BR')}
            </h3>
            <div className={`flex items-center gap-1 text-sm font-medium ${
              metrics.keywordTrend === 'up' ? 'text-chart-2' : 
              metrics.keywordTrend === 'down' ? 'text-destructive' : 
              'text-muted-foreground'
            }`}>
              {metrics.keywordTrend === 'up' && <TrendingUp className="h-4 w-4" />}
              {metrics.keywordTrend === 'down' && <TrendingDown className="h-4 w-4" />}
              {metrics.keywordChange}%
            </div>
          </div>
          {metrics.keywordSparklineData.length > 0 && (
            <SparklineChart data={metrics.keywordSparklineData} trend={metrics.keywordTrend as 'up' | 'down' | 'neutral'} />
          )}
        </CardContent>
      </Card>

      {/* Tráfego Estimado */}
      <Card className="border-l-4 border-l-chart-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Tráfego
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-4xl font-bold text-foreground">
              {metrics.estimatedTraffic.toLocaleString('pt-BR')}
            </h3>
            <div className={`flex items-center gap-1 text-sm font-medium ${
              metrics.trafficTrend === 'up' ? 'text-chart-2' : 
              metrics.trafficTrend === 'down' ? 'text-destructive' : 
              'text-muted-foreground'
            }`}>
              {metrics.trafficTrend === 'up' && <TrendingUp className="h-4 w-4" />}
              {metrics.trafficTrend === 'down' && <TrendingDown className="h-4 w-4" />}
              {metrics.trafficChange}%
            </div>
          </div>
          {metrics.trafficSparklineData.length > 0 && (
            <SparklineChart data={metrics.trafficSparklineData} trend={metrics.trafficTrend as 'up' | 'down' | 'neutral'} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
