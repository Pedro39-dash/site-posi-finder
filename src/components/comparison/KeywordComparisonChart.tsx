import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { CompetitorKeyword } from '@/services/competitorAnalysisService';

interface KeywordData {
  date: string;
  [keyword: string]: number | string;
}

interface KeywordComparisonChartProps {
  keywords: CompetitorKeyword[];
  targetDomain: string;
  period?: number;
}

const KeywordComparisonChart: React.FC<KeywordComparisonChartProps> = ({
  keywords,
  targetDomain,
  period = 30
}) => {
  const [hiddenKeywords, setHiddenKeywords] = useState<Set<string>>(new Set());

  // Generate data for multiple keywords over time
  const chartData = useMemo(() => {
    const data: KeywordData[] = [];
    
    for (let i = period; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dataPoint: KeywordData = {
        date: date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })
      };

      keywords.forEach(keyword => {
        const basePosition = keyword.target_domain_position || 50;
        // Add some realistic variation to simulate daily changes
        const variation = (Math.random() - 0.5) * 6; // ±3 positions
        const position = Math.max(1, Math.min(100, basePosition + variation));
        dataPoint[keyword.keyword] = Math.round(position);
      });

      data.push(dataPoint);
    }

    return data;
  }, [keywords, period]);

  // Get colors for each keyword
  const getKeywordColor = (index: number) => {
    const colors = [
      'hsl(var(--primary))',
      'hsl(var(--secondary))',
      'hsl(var(--accent))',
      '#8B5CF6', '#F59E0B', '#EF4444', '#10B981', '#06B6D4', '#EC4899', '#84CC16'
    ];
    return colors[index % colors.length];
  };

  const toggleKeywordVisibility = (keyword: string) => {
    const newHidden = new Set(hiddenKeywords);
    if (newHidden.has(keyword)) {
      newHidden.delete(keyword);
    } else {
      newHidden.add(keyword);
    }
    setHiddenKeywords(newHidden);
  };

  const visibleKeywords = keywords.filter(k => !hiddenKeywords.has(k.keyword));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Comparação de Posições por Palavra-chave
          <Badge variant="outline">{visibleKeywords.length} de {keywords.length} visíveis</Badge>
        </CardTitle>
        
        {/* Keyword Legend with Toggle */}
        <div className="flex flex-wrap gap-2 mt-4">
          {keywords.map((keyword, index) => {
            const isHidden = hiddenKeywords.has(keyword.keyword);
            return (
              <Button
                key={keyword.id}
                variant={isHidden ? "outline" : "secondary"}
                size="sm"
                onClick={() => toggleKeywordVisibility(keyword.keyword)}
                className="h-8 text-xs gap-1"
                style={!isHidden ? { 
                  backgroundColor: getKeywordColor(index) + '20',
                  borderColor: getKeywordColor(index),
                  color: getKeywordColor(index)
                } : {}}
              >
                {isHidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {keyword.keyword}
                <Badge variant="outline" className="ml-1 text-xs">
                  {keyword.target_domain_position || "?"}
                </Badge>
              </Button>
            );
          })}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                fontSize={12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                domain={[1, 'dataMax']}
                reversed
                fontSize={12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                label={{ value: 'Posição', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                labelFormatter={(value) => `Data: ${value}`}
                formatter={(value: any, name: string) => [
                  `Posição ${value}`, 
                  name
                ]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              
              {visibleKeywords.map((keyword, index) => (
                <Line
                  key={keyword.id}
                  type="monotone"
                  dataKey={keyword.keyword}
                  stroke={getKeywordColor(index)}
                  strokeWidth={2}
                  dot={{ fill: getKeywordColor(index), strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: getKeywordColor(index) }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
          <p>💡 Posições menores são melhores. Clique nas palavras-chave acima para ocultar/mostrar no gráfico.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default KeywordComparisonChart;