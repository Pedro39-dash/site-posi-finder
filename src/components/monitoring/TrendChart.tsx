import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Evolução das Posições - {getDomainName(site.website)}
          </CardTitle>
          
          {trend && (
            <Badge 
              variant={trend.direction === 'up' ? 'default' : trend.direction === 'down' ? 'destructive' : 'secondary'}
              className={trend.direction === 'up' ? 'bg-accent text-accent-foreground' : ''}
            >
              {trend.direction === 'up' && `+${trend.percentage} posições`}
              {trend.direction === 'down' && `-${trend.percentage} posições`}
              {trend.direction === 'stable' && 'Estável'}
            </Badge>
          )}
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
        </div>
      </CardHeader>
      
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">
              Nenhum histórico disponível para "{selectedKeyword}"
            </p>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  reversed
                  domain={[1, 101]}
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Posição', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value: any, name: string) => [
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
                <Line 
                  type="monotone" 
                  dataKey="displayPosition" 
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {chartData.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            <p>
              Mostrando histórico de posições para "{selectedKeyword}" - 
              Valores menores indicam melhores posições
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrendChart;