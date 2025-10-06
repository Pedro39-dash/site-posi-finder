import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import { CompetitorKeyword } from '@/services/competitorAnalysisService';
import { calculateProjectedTraffic, generateTimeSeriesProjection, ImprovementType } from '@/utils/trafficProjection';

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
  
  const timeSeriesData = useMemo(
    () => generateTimeSeriesProjection(keywords, improvementType),
    [keywords, improvementType]
  );

  // Se não houver dados, não renderizar
  if (projection.current === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        Dados insuficientes para projeção
      </div>
    );
  }
  
  const todayIndex = timeSeriesData.findIndex(d => d.date === 'Hoje');

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
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={timeSeriesData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10 }}
              interval={Math.floor(timeSeriesData.length / 6)}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              formatter={(value: number) => [
                `${value?.toLocaleString('pt-BR')} visitas/mês`,
                ''
              ]}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            
            {/* Linha atual (sólida) */}
            <Line 
              type="monotone"
              dataKey="current"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              name="Tráfego Atual"
            />
            
            {/* Linha projetada (tracejada) */}
            <Line 
              type="monotone"
              dataKey="projected"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              connectNulls={false}
              name="Projeção"
            />
            
            {/* Referência vertical (hoje) */}
            {todayIndex >= 0 && (
              <ReferenceLine 
                x={timeSeriesData[todayIndex]?.date} 
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="3 3"
                label={{ 
                  value: 'Hoje', 
                  position: 'top', 
                  fontSize: 10,
                  fill: 'hsl(var(--muted-foreground))'
                }}
              />
            )}
          </LineChart>
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
