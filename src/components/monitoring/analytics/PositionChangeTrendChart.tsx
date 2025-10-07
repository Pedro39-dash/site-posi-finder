import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { MonitoringAnalyticsService } from '@/services/monitoringAnalyticsService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface PositionChangeTrendChartProps {
  projectId: string;
  isLoading?: boolean;
}

type PeriodType = 'daily' | 'monthly';

export const PositionChangeTrendChart = ({ projectId, isLoading = false }: PositionChangeTrendChartProps) => {
  const [trendData, setTrendData] = useState<any[]>([]);
  const [period, setPeriod] = useState<PeriodType>('daily');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrendData = async () => {
      if (!projectId) return;
      
      setLoading(true);
      try {
        const days = period === 'daily' ? 30 : 365;
        const data = await MonitoringAnalyticsService.getTrendData(projectId, days);
        setTrendData(data);
      } catch (error) {
        console.error('Erro ao carregar dados de tendência:', error);
        setTrendData([]);
      } finally {
        setLoading(false);
      }
    };

    loadTrendData();
  }, [projectId, period]);

  const chartData = trendData.map(item => ({
    date: format(new Date(item.date), period === 'daily' ? 'dd MMM' : 'MMM yyyy', { locale: ptBR }),
    traffic: Math.round(item.traffic),
    improvements: item.improvements,
    declines: item.declines
  }));

  const latestData = trendData.length > 0 ? trendData[trendData.length - 1] : null;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm mb-2">{payload[0].payload.date}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading || loading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-[300px] w-full mb-4" />
        <Skeleton className="h-[200px] w-full" />
      </Card>
    );
  }

  if (trendData.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Tendência de alterações na posição</h3>
        <div className="flex items-center justify-center h-[400px] text-muted-foreground">
          <div className="text-center">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Sem dados de tendência disponíveis</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Tendência de alterações na posição</h3>
        <div className="flex gap-2">
          <Button
            variant={period === 'daily' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('daily')}
          >
            Diariamente
          </Button>
          <Button
            variant={period === 'monthly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('monthly')}
          >
            Mensalmente
          </Button>
        </div>
      </div>

      {/* Gráfico de Tráfego */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Tráfego</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="traffic"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#colorTraffic)"
              name="Tráfego"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de Melhorias/Pioras */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-muted-foreground">Melhorias</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-sm text-muted-foreground">Pioras</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="improvements" fill="hsl(142 76% 36%)" name="Melhorias" />
              <Bar dataKey="declines" fill="hsl(25 95% 53%)" name="Pioras" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Card de Destaque */}
        {latestData && (
          <div className="lg:col-span-1">
            <Card className="p-4 bg-muted/30 h-full">
              <div className="text-sm text-muted-foreground mb-2">
                {format(new Date(latestData.date), "dd 'de' MMMM", { locale: ptBR })}
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground">Tráfego</div>
                  <div className="text-2xl font-bold">{Math.round(latestData.traffic).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <div>
                    <div className="text-xs text-muted-foreground">Melhorias</div>
                    <div className="text-lg font-semibold">{latestData.improvements}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-orange-500" />
                  <div>
                    <div className="text-xs text-muted-foreground">Pioras</div>
                    <div className="text-lg font-semibold">{latestData.declines}</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Card>
  );
};
