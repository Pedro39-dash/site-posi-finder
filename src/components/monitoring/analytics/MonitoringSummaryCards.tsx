import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { SparklineChart } from "./SparklineChart";
import { DailyMetrics } from "@/services/monitoringAnalyticsService";

interface MonitoringSummaryCardsProps {
  totalKeywords: number;
  estimatedTraffic: number;
  changePercentageKeywords: number;
  changePercentageTraffic: number;
  dailyMetrics: DailyMetrics[];
  isLoading?: boolean;
}

export const MonitoringSummaryCards = ({
  totalKeywords,
  estimatedTraffic,
  changePercentageKeywords,
  changePercentageTraffic,
  dailyMetrics,
  isLoading = false,
}: MonitoringSummaryCardsProps) => {
  const keywordTrend = changePercentageKeywords > 0 ? 'up' : changePercentageKeywords < 0 ? 'down' : 'neutral';
  const trafficTrend = changePercentageTraffic > 0 ? 'up' : changePercentageTraffic < 0 ? 'down' : 'neutral';

  const keywordSparklineData = dailyMetrics.map(m => ({ value: m.totalKeywords }));
  const trafficSparklineData = dailyMetrics.map(m => ({ value: m.estimatedTraffic }));

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
            Total de Palavras-chave
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-4xl font-bold text-foreground">
              {totalKeywords.toLocaleString('pt-BR')}
            </h3>
            <div className={`flex items-center gap-1 text-sm font-medium ${
              keywordTrend === 'up' ? 'text-chart-2' : 
              keywordTrend === 'down' ? 'text-destructive' : 
              'text-muted-foreground'
            }`}>
              {keywordTrend === 'up' && <TrendingUp className="h-4 w-4" />}
              {keywordTrend === 'down' && <TrendingDown className="h-4 w-4" />}
              {Math.abs(changePercentageKeywords).toFixed(1)}%
            </div>
          </div>
          {keywordSparklineData.length > 0 && (
            <SparklineChart data={keywordSparklineData} trend={keywordTrend} />
          )}
        </CardContent>
      </Card>

      {/* Tráfego Estimado */}
      <Card className="border-l-4 border-l-chart-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Tráfego Estimado (mensal)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-4xl font-bold text-foreground">
              {estimatedTraffic.toLocaleString('pt-BR')}
            </h3>
            <div className={`flex items-center gap-1 text-sm font-medium ${
              trafficTrend === 'up' ? 'text-chart-2' : 
              trafficTrend === 'down' ? 'text-destructive' : 
              'text-muted-foreground'
            }`}>
              {trafficTrend === 'up' && <TrendingUp className="h-4 w-4" />}
              {trafficTrend === 'down' && <TrendingDown className="h-4 w-4" />}
              {Math.abs(changePercentageTraffic).toFixed(1)}%
            </div>
          </div>
          {trafficSparklineData.length > 0 && (
            <SparklineChart data={trafficSparklineData} trend={trafficTrend} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
