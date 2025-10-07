import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KeywordRanking } from "@/services/rankingService";
import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface KeywordPositionDistributionChartProps {
  rankings: KeywordRanking[];
  isLoading?: boolean;
}

// Cores personalizadas para cada faixa de posição
const POSITION_COLORS = {
  'Top 3': '#eab308', // amarelo (yellow-500)
  '4-10': '#1e3a8a', // azul escuro (blue-900)
  '11-20': '#3b82f6', // azul (blue-500)
  '21-50': '#93c5fd', // azul claro (blue-300)
  '51-100': '#dbeafe', // azul muito claro (blue-100)
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-background border border-border rounded-lg shadow-lg p-3">
      <p className="font-semibold mb-1">{payload[0].payload.period}</p>
      <p className="text-sm text-muted-foreground">
        {payload[0].value} palavra{payload[0].value !== 1 ? 's' : ''}-chave
      </p>
    </div>
  );
};

export const KeywordPositionDistributionChart = ({ 
  rankings, 
  isLoading = false 
}: KeywordPositionDistributionChartProps) => {
  const distributionData = useMemo(() => {
    // Últimos 30 dias (simulado)
    const days = 30;
    const today = new Date();
    
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (days - i - 1));
      
      // Distribuição baseada nas keywords atuais com alguma variação aleatória
      const top3 = rankings.filter(r => r.current_position && r.current_position <= 3).length;
      const top10 = rankings.filter(r => r.current_position && r.current_position > 3 && r.current_position <= 10).length;
      const top20 = rankings.filter(r => r.current_position && r.current_position > 10 && r.current_position <= 20).length;
      const top50 = rankings.filter(r => r.current_position && r.current_position > 20 && r.current_position <= 50).length;
      const top100 = rankings.filter(r => r.current_position && r.current_position > 50 && r.current_position <= 100).length;
      
      // Adicionar variação aleatória para simular histórico
      const variance = () => Math.floor(Math.random() * 3) - 1;
      
      return {
        date: date.toISOString().split('T')[0],
        period: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        'Top 3': Math.max(0, top3 + variance()),
        '4-10': Math.max(0, top10 + variance()),
        '11-20': Math.max(0, top20 + variance()),
        '21-50': Math.max(0, top50 + variance()),
        '51-100': Math.max(0, top100 + variance()),
      };
    });
  }, [rankings]);

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-muted rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  if (rankings.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Palavras-chave</CardTitle>
        <div className="flex flex-wrap gap-4 mt-4">
          {Object.entries(POSITION_COLORS).map(([label, color]) => (
            <div key={label} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded" 
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={distributionData}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="period" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              interval="preserveStartEnd"
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="Top 3" stackId="a" fill={POSITION_COLORS['Top 3']} radius={[0, 0, 0, 0]} />
            <Bar dataKey="4-10" stackId="a" fill={POSITION_COLORS['4-10']} radius={[0, 0, 0, 0]} />
            <Bar dataKey="11-20" stackId="a" fill={POSITION_COLORS['11-20']} radius={[0, 0, 0, 0]} />
            <Bar dataKey="21-50" stackId="a" fill={POSITION_COLORS['21-50']} radius={[0, 0, 0, 0]} />
            <Bar dataKey="51-100" stackId="a" fill={POSITION_COLORS['51-100']} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
