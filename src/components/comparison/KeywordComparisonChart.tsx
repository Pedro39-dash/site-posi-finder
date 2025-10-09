import React, { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { CompetitorKeyword } from '@/services/competitorAnalysisService';
import { useDeepMemo } from '@/hooks/useDeepMemo';
import { fetchRankingHistory, getHistoryMaturity, calculateDaysSpan } from '@/services/rankingHistoryService';
import { useProject } from '@/hooks/useProject';
import HistoryMaturityBadge from './HistoryMaturityBadge';

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
  const { activeProject } = useProject();
  const [hiddenKeywords, setHiddenKeywords] = useState<Set<string>>(new Set());
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Fetch historical data
  useEffect(() => {
    const loadHistory = async () => {
      if (!activeProject?.id) {
        setIsLoadingHistory(false);
        return;
      }

      setIsLoadingHistory(true);
      const keywordList = keywords.map(k => k.keyword);
      const result = await fetchRankingHistory(activeProject.id, keywordList, period);
      
      if (result.success && result.data) {
        setHistoricalData(result.data);
      }
      setIsLoadingHistory(false);
    };

    loadHistory();
  }, [activeProject?.id, keywords, period]);

  // Generate data for multiple keywords over time
  const chartData = useDeepMemo(() => {
    const data: KeywordData[] = [];
    const hasHistoricalData = historicalData.length > 0;

    // Create date range
    const dates: string[] = [];
    for (let i = period; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }));
    }

    // Build historical data map
    const historicalMap = new Map<string, Map<string, number>>();
    historicalData.forEach(keywordHistory => {
      keywordHistory.dataPoints.forEach((point: any) => {
        if (!historicalMap.has(point.date)) {
          historicalMap.set(point.date, new Map());
        }
        historicalMap.get(point.date)!.set(keywordHistory.keyword, point.position);
      });
    });

    // Generate chart data
    dates.forEach((date, i) => {
      const dataPoint: KeywordData = { date };

      keywords.forEach((keyword) => {
        const historicalPosition = historicalMap.get(date)?.get(keyword.keyword);
        
        if (historicalPosition !== undefined) {
          // Use real historical data
          dataPoint[keyword.keyword] = historicalPosition;
        } else {
          // Use projection based on current position
          const basePosition = keyword.target_domain_position || 50;
          const keywordSeed = keyword.keyword.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const dayFactor = i / period;
          const sineWave = Math.sin((dayFactor * Math.PI * 4) + (keywordSeed / 100));
          const variation = sineWave * 3;
          dataPoint[keyword.keyword] = Math.max(1, Math.min(100, Math.round(basePosition + variation)));
        }
      });

      data.push(dataPoint);
    });

    return { data, hasHistoricalData };
  }, [keywords, period, historicalData]);

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

  // Calculate maturity
  const totalDataPoints = historicalData.reduce((sum, h) => sum + h.dataPoints.length, 0);
  const daysSpan = historicalData.length > 0 && totalDataPoints > 0
    ? calculateDaysSpan(historicalData[0]?.dataPoints || [])
    : 0;
  const maturity = getHistoryMaturity(totalDataPoints, daysSpan);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Comparação de Posições por Palavra-chave
          <Badge variant="outline">{visibleKeywords.length} de {keywords.length} visíveis</Badge>
          <HistoryMaturityBadge maturity={maturity} />
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
            <LineChart data={chartData.data} margin={{ top: 10, right: 180, left: 20, bottom: 5 }}>
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

        {/* Legendas empilhadas no topo direito */}
        {chartData.data.length > 0 && (
          <div className="absolute top-0 right-0 flex flex-col gap-2" style={{ marginTop: '10px', marginRight: '10px' }}>
            {visibleKeywords.map((keyword, index) => {
              const lastDataPoint = chartData.data[chartData.data.length - 1];
              const lastPosition = lastDataPoint?.[keyword.keyword];
              
              if (!lastPosition || typeof lastPosition !== 'number') return null;
              
              return (
                <button
                  key={keyword.id}
                  onClick={() => toggleKeywordVisibility(keyword.keyword)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-all bg-secondary/80 hover:bg-secondary shadow-sm"
                >
                  <div 
                    className="w-3 h-3 rounded-full border-2 border-background" 
                    style={{ backgroundColor: getKeywordColor(index) }}
                  />
                  <span className="text-sm font-medium whitespace-nowrap">
                    {keyword.keyword}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {lastPosition}ª
                  </Badge>
                </button>
              );
            })}
          </div>
        )}
        
        <div className="mt-4 text-sm text-muted-foreground">
          {chartData.hasHistoricalData ? (
            <p>💡 <strong>Dados reais:</strong> O gráfico combina posições reais coletadas com projeções. Continue fazendo análises para enriquecer o histórico!</p>
          ) : (
            <p>💡 Posições menores são melhores. Clique nas palavras-chave acima para ocultar/mostrar. Faça mais análises para construir histórico real!</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KeywordComparisonChart;