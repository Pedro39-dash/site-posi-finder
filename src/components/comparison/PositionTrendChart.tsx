import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface PositionTrendChartProps {
  targetDomain: string;
}

const PositionTrendChart = ({ targetDomain }: PositionTrendChartProps) => {
  // Simulated data for the last 30 days - in a real app this would come from historical data
  const trendData = Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    const basePosition = 15;
    const variation = Math.sin(i * 0.2) * 3 + Math.random() * 2 - 1;
    const yourPosition = Math.max(1, Math.min(100, Math.round(basePosition + variation)));
    
    // Competitor positions with some variation
    const competitor1 = Math.max(1, Math.min(100, Math.round(8 + Math.sin(i * 0.15) * 2 + Math.random() * 1.5)));
    const competitor2 = Math.max(1, Math.min(100, Math.round(12 + Math.cos(i * 0.18) * 2.5 + Math.random() * 1.5)));
    
    return {
      day: `Dia ${day}`,
      dayNumber: day,
      yourPosition,
      competitor1,
      competitor2,
    };
  });

  const currentPosition = trendData[trendData.length - 1]?.yourPosition || 15;
  const initialPosition = trendData[0]?.yourPosition || 15;
  const positionChange = initialPosition - currentPosition; // Positive = improvement
  const isImproving = positionChange > 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}ª posição
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isImproving ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
              Gráfico de Posição Média (30 dias)
            </CardTitle>
            <CardDescription>
              Evolução das posições médias para todas as palavras-chave monitoradas
            </CardDescription>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${isImproving ? 'text-green-600' : 'text-red-600'}`}>
              {isImproving ? '+' : ''}{positionChange.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">
              {isImproving ? 'posições ganhas' : 'posições perdidas'}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="dayNumber" 
                tickFormatter={(value) => `${value}`}
                className="text-xs fill-muted-foreground"
              />
              <YAxis 
                reversed
                domain={[1, 'dataMax + 5']}
                tickFormatter={(value) => `${value}º`}
                className="text-xs fill-muted-foreground"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="yourPosition"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                name="Sua Posição Média"
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="competitor1"
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Concorrente Principal"
              />
              <Line
                type="monotone"
                dataKey="competitor2"
                stroke="#f97316"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={false}
                name="2º Concorrente"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          <p>💡 <strong>Dica:</strong> Posições menores são melhores. O gráfico mostra a evolução da sua posição média em comparação com os principais concorrentes.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PositionTrendChart;