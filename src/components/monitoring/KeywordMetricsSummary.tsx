import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { SparklineChart } from "./analytics/SparklineChart";
import { KeywordRanking } from "@/services/rankingService";
import { MonitoringAnalyticsService } from "@/services/monitoringAnalyticsService";
import { useMemo, useState, useEffect } from "react";

interface KeywordMetricsSummaryProps {
  rankings: KeywordRanking[];
  projectId: string;
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

export const KeywordMetricsSummary = ({ rankings, projectId, isLoading = false }: KeywordMetricsSummaryProps) => {
  const [realMetrics, setRealMetrics] = useState<any>(null);
  const [dailyData, setDailyData] = useState<any[]>([]);

  useEffect(() => {
    const loadRealMetrics = async () => {
      if (!projectId) return;
      
      try {
        // Buscar métricas reais (últimos 30 dias vs 30 dias anteriores)
        const metricsData = await MonitoringAnalyticsService.getKeywordMetrics(projectId, 30);
        setRealMetrics(metricsData);
        
        // Buscar dados diários para sparklines (últimos 7 dias)
        const dailyMetricsData = await MonitoringAnalyticsService.getDailyMetrics(projectId, 7);
        setDailyData(dailyMetricsData);
      } catch (error) {
        console.error('Erro ao carregar métricas reais:', error);
      }
    };
    
    loadRealMetrics();
  }, [projectId]);

  const metrics = useMemo(() => {
    if (!realMetrics) {
      return {
        totalKeywords: 0,
        estimatedTraffic: 0,
        keywordSparklineData: [],
        trafficSparklineData: [],
        keywordTrend: 'neutral',
        trafficTrend: 'neutral',
        keywordChange: '0',
        trafficChange: '0'
      };
    }

    // Determinar tendências baseadas nas mudanças reais
    const keywordTrend = realMetrics.changePercentageKeywords > 0 ? 'up' : 
                        realMetrics.changePercentageKeywords < 0 ? 'down' : 'neutral';
    const trafficTrend = realMetrics.changePercentageTraffic > 0 ? 'up' : 
                        realMetrics.changePercentageTraffic < 0 ? 'down' : 'neutral';
    
    // Preparar dados de sparkline dos últimos 7 dias
    const keywordSparklineData = dailyData.map(day => ({
      value: day.totalKeywords
    }));
    
    const trafficSparklineData = dailyData.map(day => ({
      value: day.estimatedTraffic
    }));
    
    return {
      totalKeywords: realMetrics.totalKeywords,
      estimatedTraffic: Math.round(realMetrics.estimatedTraffic),
      keywordSparklineData,
      trafficSparklineData,
      keywordTrend,
      trafficTrend,
      keywordChange: Math.abs(realMetrics.changePercentageKeywords).toFixed(1),
      trafficChange: Math.abs(realMetrics.changePercentageTraffic).toFixed(1)
    };
  }, [realMetrics, dailyData]);

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
