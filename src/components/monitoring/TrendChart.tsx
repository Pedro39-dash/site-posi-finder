import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { EnhancedChartContainer, CustomTooltip, CHART_COLORS, ChartGradients } from "@/components/ui/enhanced-chart";
import { useState } from "react";
import { MonitoredSite, useMonitoring } from "@/contexts/MonitoringContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp } from "lucide-react";

interface TrendChartProps {
  site: MonitoredSite;
}

const TrendChart = ({ site }: TrendChartProps) => {
  const [selectedKeyword, setSelectedKeyword] = useState<string>(site.keywords[0] || "");
  const { getSiteHistory } = useMonitoring();

  const getDomainName = (url: string) => {
    try {
      return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const getChartData = () => {
    if (!selectedKeyword) return [];
    
    const history = getSiteHistory(site.id, selectedKeyword)
      .slice(0, 30) // Last 30 checks
      .reverse(); // Oldest first for the chart
    
    return history.map(h => ({
      date: format(h.date, 'dd/MM', { locale: ptBR }),
      fullDate: format(h.date, 'dd/MM/yyyy HH:mm', { locale: ptBR }),
      position: h.position || null,
      displayPosition: h.position || 101, // Use 101 for not found to show at bottom
    }));
  };

  const chartData = getChartData();

  const getLatestTrend = () => {
    if (chartData.length < 2) return null;
    
    const latest = chartData[chartData.length - 1];
    const previous = chartData[chartData.length - 2];
    
    if (!latest.position || !previous.position) return null;
    
    const change = previous.position - latest.position; // Positive = improvement
    return {
      change,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      percentage: Math.abs(change),
    };
  };

  const trend = getLatestTrend();

  if (site.keywords.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-40">
          <p className="text-muted-foreground">Nenhuma palavra-chave configurada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Seletor de Keyword */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Monitoramento - {getDomainName(site.website)}</h3>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedKeyword} onValueChange={setSelectedKeyword}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Selecione uma palavra-chave" />
              </SelectTrigger>
              <SelectContent>
                {site.keywords.map(keyword => (
                  <SelectItem key={keyword} value={keyword}>
                    {keyword}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {trend && (
              <Badge 
                variant={trend.direction === 'up' ? 'default' : trend.direction === 'down' ? 'destructive' : 'secondary'}
                className={`animate-scale-in ${trend.direction === 'up' ? 'bg-accent text-accent-foreground' : ''}`}
              >
                {trend.direction === 'up' && `↗ +${trend.percentage}`}
                {trend.direction === 'down' && `↘ -${trend.percentage}`}
                {trend.direction === 'stable' && '→ Estável'}
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Gráfico */}
      <EnhancedChartContainer
        title={`Evolução: ${selectedKeyword}`}
        description="Histórico de posições nos últimos 30 monitoramentos"
        height={380}
        icon={<TrendingUp className="h-5 w-5" />}
        badge={trend ? {
          text: `${trend.direction === 'up' ? 'Melhorando' : trend.direction === 'down' ? 'Piorando' : 'Estável'}`,
          variant: trend.direction === 'up' ? 'default' : trend.direction === 'down' ? 'destructive' : 'secondary'
        } : undefined}
      >
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">
              Nenhum histórico disponível para "{selectedKeyword}"
            </p>
          </div>
        ) : (
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <ChartGradients />
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              reversed
              domain={[1, 101]}
              tick={{ fontSize: 11 }}
              label={{ value: 'Posição', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
              stroke="hsl(var(--muted-foreground))"
            />
            <CustomTooltip 
              formatter={(value: any) => [
                value === 101 ? 'Não encontrado' : `${value}ª posição`,
                'Posição'
              ]}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  return `Data: ${payload[0].payload.fullDate}`;
                }
                return label;
              }}
            />
            <Area
              type="monotone"
              dataKey="displayPosition"
              stroke={CHART_COLORS.primary}
              strokeWidth={3}
              fill="url(#primaryGradient)"
              dot={{ fill: CHART_COLORS.primary, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: CHART_COLORS.primary, strokeWidth: 2, fill: "hsl(var(--background))" }}
              animationDuration={1000}
              animationBegin={0}
            />
          </AreaChart>
        )}
      </EnhancedChartContainer>
      
      {chartData.length > 0 && (
        <Card className="p-4">
          <div className="text-sm text-muted-foreground space-y-1">
            <p>📊 Histórico de "{selectedKeyword}" - Valores menores = melhores posições</p>
            <p>📈 Última verificação: {chartData[chartData.length - 1]?.fullDate}</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TrendChart;