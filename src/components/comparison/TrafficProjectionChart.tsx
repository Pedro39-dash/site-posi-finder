import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import { CompetitorKeyword } from '@/services/competitorAnalysisService';
import { calculateProjectedTraffic, ImprovementType } from '@/utils/trafficProjection';

interface TrafficProjectionChartProps {
  keywords: CompetitorKeyword[];
  improvementType: ImprovementType;
  className?: string;
}

const TrafficProjectionChart: React.FC<TrafficProjectionChartProps> = ({
  keywords,
  improvementType,
  className = ''
}) => {
  const projection = calculateProjectedTraffic(keywords, improvementType);
  
  const chartData = [
    {
      name: 'Atual',
      value: projection.current,
      fill: 'hsl(var(--muted-foreground))'
    },
    {
      name: 'Projetado',
      value: projection.projected,
      fill: 'hsl(var(--primary))'
    }
  ];

  // Se não houver dados, não renderizar
  if (projection.current === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        Dados insuficientes para projeção
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Projeção de Tráfego com Melhorias
        </h4>
        {projection.increasePercentage > 0 && (
          <Badge variant="default" className="animate-pulse">
            +{projection.increasePercentage}%
          </Badge>
        )}
      </div>
      
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              width={70}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              formatter={(value: number) => [
                `${value.toLocaleString('pt-BR')} visitas/mês`,
                ''
              ]}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex flex-col">
          <span className="text-muted-foreground">Atual</span>
          <span className="font-semibold">{projection.current.toLocaleString('pt-BR')}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-muted-foreground">Projetado</span>
          <span className="font-semibold text-primary">
            {projection.projected.toLocaleString('pt-BR')}
          </span>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground italic">
        💡 Estimativa baseada em CTR real por posição × volume de busca
      </p>
    </div>
  );
};

export default TrafficProjectionChart;
