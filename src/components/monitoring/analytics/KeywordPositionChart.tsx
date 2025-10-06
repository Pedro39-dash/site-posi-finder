import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PositionDistribution } from "@/services/monitoringAnalyticsService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface KeywordPositionChartProps {
  data: PositionDistribution[];
  isLoading?: boolean;
}

export const KeywordPositionChart = ({ data, isLoading = false }: KeywordPositionChartProps) => {
  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] bg-muted rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Distribuição de Posições</CardTitle>
          <CardDescription>Evolução das palavras-chave por faixa de posição</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            Sem dados disponíveis para o período selecionado
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(d => ({
    date: format(new Date(d.date), 'dd/MM', { locale: ptBR }),
    fullDate: d.date,
    'Top 3': d.top3,
    'Top 10': d.top10 - d.top3,
    'Top 20': d.top20 - d.top10,
    'Top 50': d.top50 - d.top20,
    'Top 100': d.top100 - d.top50,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{label}</p>
          {payload.reverse().map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <span className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded" 
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}:
              </span>
              <span className="font-medium">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Distribuição de Posições</CardTitle>
        <CardDescription>
          Evolução das palavras-chave por faixa de posição ao longo do tempo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
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
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Bar dataKey="Top 3" stackId="a" fill="hsl(var(--chart-1))" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Top 10" stackId="a" fill="hsl(var(--chart-2))" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Top 20" stackId="a" fill="hsl(var(--chart-3))" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Top 50" stackId="a" fill="hsl(var(--chart-4))" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Top 100" stackId="a" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
