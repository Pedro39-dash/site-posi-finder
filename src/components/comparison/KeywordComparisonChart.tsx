import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { CompetitorKeyword } from '@/services/competitorAnalysisService';
import { useDeepMemo } from '@/hooks/useDeepMemo';

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

  // Generate deterministic data for multiple keywords over time
  const chartData = useDeepMemo(() => {
    const data: KeywordData[] = [];
    
    for (let i = period; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dataPoint: KeywordData = {
        date: date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })
      };

      keywords.forEach((keyword, keywordIndex) => {
        const basePosition = keyword.target_domain_position || 50;
        
        // Create deterministic variation using sine wave based on keyword and day
        const keywordSeed = keyword.keyword.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const dayFactor = (period - i) / period;
        const sineWave = Math.sin((dayFactor * Math.PI * 4) + (keywordSeed / 100));
        
        // Add realistic SEO fluctuation (±3 positions)
        const variation = sineWave * 3;
        const position = Math.max(1, Math.min(100, Math.round(basePosition + variation)));
        
        dataPoint[keyword.keyword] = position;
      });

      data.push(dataPoint);
    }

    return data;
  }, [keywords, period]);

  // Fixed color palette for Recharts compatibility
  const colorPalette = [
    '#3B82F6', // Blue
    '#8B5CF6', // Purple  
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#10B981', // Emerald
    '#06B6D4', // Cyan
    '#EC4899', // Pink
    '#84CC16', // Lime
    '#F97316', // Orange
    '#6366F1'  // Indigo
  ];

  const getKeywordColor = (index: number) => {
    return colorPalette[index % colorPalette.length];
  };

  // Convert hex to rgba for transparency
  const hexToRgba = (hex: string, alpha: number = 0.1) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
                  backgroundColor: hexToRgba(getKeywordColor(index), 0.2),
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