import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, FlaskConical, Info, AlertCircle } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { fetchRankingHistory, getHistoryMaturity, calculateDaysSpan, HistoricalData } from "@/services/rankingHistoryService";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSimulatedData } from "@/hooks/useSimulatedData";
import { PeriodSelector, PeriodOption } from "./filters/PeriodSelector";
import { KeywordRelevance } from "@/services/keywordRelevanceService";
import { PERIOD_LABELS } from "@/config/monitoringConfig";

interface KeywordPositionHistoryChartProps {
  selectedKeywords: string[];
  projectId: string;
  isLoading?: boolean;
  period: PeriodOption;
  keywordRelevance?: Map<string, KeywordRelevance>;
}

// Vibrant colors for better visibility
const KEYWORD_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#f97316', // Orange
];

export default function KeywordPositionHistoryChart({
  selectedKeywords,
  projectId,
  isLoading = false,
  period: periodProp,
  keywordRelevance
}: KeywordPositionHistoryChartProps) {
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [visibleKeywords, setVisibleKeywords] = useState<Set<string>>(new Set());
  const { isSimulatedMode } = useSimulatedData();

  const relevantKeywords = useMemo(() => {
    if (!keywordRelevance) return selectedKeywords;
    return selectedKeywords.filter(kw => keywordRelevance.get(kw)?.isRelevant !== false);
  }, [selectedKeywords, keywordRelevance]);

  const removedKeywords = useMemo(() => {
    return selectedKeywords.filter(kw => !relevantKeywords.includes(kw));
  }, [selectedKeywords, relevantKeywords]);

  useEffect(() => {
    if (!projectId || relevantKeywords.length === 0) {
      setHistoricalData([]);
      return;
    }

    const loadHistory = async () => {
      setIsLoadingHistory(true);
      
      // Convert PeriodOption to days
      let days = 7; // default
      switch (periodProp) {
        case 'today': days = 1; break;
        case '7d': days = 7; break;
        case '28d': days = 28; break;
        case '90d': days = 90; break;
        case '180d': days = 180; break;
        case '365d': days = 365; break;
        case '16m': days = 480; break;
      }
      
      const result = await fetchRankingHistory(projectId, relevantKeywords, days);
      
      if (result.success && result.data) {
        setHistoricalData(result.data);
        setVisibleKeywords(new Set(relevantKeywords));
      } else {
        setHistoricalData([]);
      }
      setIsLoadingHistory(false);
    };

    loadHistory();
  }, [projectId, relevantKeywords, periodProp]);

  // Calculate maturity status with data source detection
  const maturityStatus = useMemo(() => {
    if (historicalData.length === 0) return null;
    
    const allDataPoints = historicalData.flatMap(d => d.dataPoints);
    if (allDataPoints.length === 0) return null;
    
    const daysSpan = calculateDaysSpan(allDataPoints);
    
    // Detect data sources
    const sources = new Set<string>();
    allDataPoints.forEach(dp => {
      if (dp.metadata?.data_source) {
        sources.add(dp.metadata.data_source);
      }
    });

    const hasGSC = sources.has('search_console');
    const hasSerpAPI = sources.has('serpapi');
    
    let message = '';
    let status: 'complete' | 'consolidating' | 'building' = 'building';
    let icon = '🔵';

    if (daysSpan >= 300 && allDataPoints.length >= 60) {
      status = 'complete';
      icon = '✅';
      message = hasGSC ? 'Histórico completo - Search Console' : 'Histórico completo';
    } else if (daysSpan >= 60 && allDataPoints.length >= 20) {
      status = 'consolidating';
      icon = '🟢';
      message = hasGSC ? 'Histórico consolidado - GSC + SerpAPI' : 'Histórico consolidado';
    } else if (daysSpan >= 7) {
      status = 'building';
      icon = '🔵';
      message = hasSerpAPI ? `Construindo histórico (${daysSpan} dias - SerpAPI)` : `Construindo histórico (${daysSpan} dias)`;
    } else {
      status = 'building';
      icon = '⚪';
      message = 'Histórico limitado';
    }

    return {
      status,
      daysOfData: daysSpan,
      totalDataPoints: allDataPoints.length,
      message,
      icon,
      sources: Array.from(sources)
    };
  }, [historicalData]);

  // Transform data for Recharts with improved date formatting
  const chartData = useMemo(() => {
    if (historicalData.length === 0) return [];

    // Create a map with intelligent grouping by period
    const dateMap = new Map<string, any>();
    
    historicalData.forEach(keywordData => {
      if (!visibleKeywords.has(keywordData.keyword)) return;
      
      keywordData.dataPoints.forEach(point => {
        const parsedDate = parseISO(point.date);
        let groupKey: string;
        let formattedDate: string;
        let fullDate: string;
        
        // Map PeriodOption to grouping logic with consistent ISO format
        if (periodProp === 'today') {
          // Group by hour for today
          groupKey = format(parsedDate, 'yyyy-MM-dd-HH', { locale: ptBR });
          formattedDate = format(parsedDate, 'HH:mm', { locale: ptBR });
          fullDate = format(parsedDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
        } else if (periodProp === '7d' || periodProp === '28d' || periodProp === '90d') {
          // Group by day for short/medium periods
          groupKey = format(parsedDate, 'yyyy-MM-dd', { locale: ptBR });
          formattedDate = format(parsedDate, 'dd/MM', { locale: ptBR });
          fullDate = format(parsedDate, 'dd/MM/yyyy', { locale: ptBR });
        } else {
          // Group by week for long periods (180d, 365d, 16m)
          groupKey = format(parsedDate, 'yyyy-ww', { locale: ptBR });
          formattedDate = format(parsedDate, 'dd/MM', { locale: ptBR });
          fullDate = format(parsedDate, 'dd/MM/yyyy', { locale: ptBR });
        }
        
        if (!dateMap.has(groupKey)) {
          dateMap.set(groupKey, { 
            date: formattedDate,
            fullDate,
            sortKey: parsedDate.getTime(),
            metadata: new Map<string, any>()
          });
        }
        
        const mapEntry = dateMap.get(groupKey)!;
        const currentValue = mapEntry[keywordData.keyword];
        const currentTime = mapEntry.metadata.get(`${keywordData.keyword}_time`) || 0;
        
        // Use the most recent position for each group
        if (!currentValue || parsedDate.getTime() > currentTime) {
          mapEntry[keywordData.keyword] = point.position;
          mapEntry.metadata.set(`${keywordData.keyword}_time`, parsedDate.getTime());
          mapEntry.metadata.set(`${keywordData.keyword}_source`, point.metadata?.data_source || 'unknown');
          mapEntry.metadata.set(`${keywordData.keyword}_impressions`, point.metadata?.impressions);
          mapEntry.metadata.set(`${keywordData.keyword}_clicks`, point.metadata?.clicks);
        }
      });
    });

    return Array.from(dateMap.values())
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ sortKey, metadata, ...rest }) => ({
        ...rest,
        _metadata: metadata
      }));
  }, [historicalData, visibleKeywords, periodProp]);

  // Calculate dynamic Y-axis domain based on actual data
  const yAxisDomain = useMemo(() => {
    if (chartData.length === 0) return [1, 100];
    
    const allPositions = chartData.flatMap(d => 
      Object.entries(d)
        .filter(([key]) => key !== 'date' && key !== 'fullDate' && key !== '_metadata')
        .map(([_, value]) => value as number)
        .filter(val => typeof val === 'number' && !isNaN(val))
    );
    
    if (allPositions.length === 0) return [1, 100];
    
    const min = Math.min(...allPositions);
    const max = Math.max(...allPositions);
    
    // Add padding (10% of range, minimum 5 positions)
    const range = max - min;
    const padding = Math.max(5, Math.ceil(range * 0.1));
    
    const domainMin = Math.max(1, Math.floor((min - padding) / 10) * 10);
    const domainMax = Math.min(100, Math.ceil((max + padding) / 10) * 10);
    
    return [domainMin, domainMax];
  }, [chartData]);

  // Generate smart ticks for Y-axis
  const yAxisTicks = useMemo(() => {
    const [min, max] = yAxisDomain;
    const range = max - min;
    
    if (range <= 20) {
      // Show every 2 positions for small ranges
      return Array.from({ length: Math.floor(range / 2) + 1 }, (_, i) => min + i * 2);
    } else if (range <= 50) {
      // Show every 5 positions for medium ranges
      return Array.from({ length: Math.floor(range / 5) + 1 }, (_, i) => min + i * 5);
    } else {
      // Show every 10 positions for large ranges
      return Array.from({ length: Math.floor(range / 10) + 1 }, (_, i) => min + i * 10);
    }
  }, [yAxisDomain]);

  // Check if keywords have limited data
  const hasLimitedData = useMemo(() => {
    return historicalData.some(kw => kw.dataPoints.length < 3);
  }, [historicalData]);

  const missingKeywords = useMemo(() => {
    return selectedKeywords.filter(keyword => 
      !historicalData.some(hd => hd.keyword === keyword && hd.dataPoints.length > 0)
    );
  }, [selectedKeywords, historicalData]);

  const keywordsWithLimitedData = useMemo(() => {
    return historicalData.filter(kw => 
      kw.dataPoints.length === 1 && 
      kw.dataPoints[0]?.metadata?.is_current_only === true
    ).map(kw => kw.keyword);
  }, [historicalData]);

  const toggleKeywordVisibility = (keyword: string) => {
    setVisibleKeywords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyword)) {
        newSet.delete(keyword);
      } else {
        newSet.add(keyword);
      }
      return newSet;
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    // Get full date and metadata from the data point
    const dataPoint = chartData.find(d => d.date === label);
    const fullDate = dataPoint?.fullDate || label;
    const metadata = dataPoint?._metadata;

    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-4 min-w-[280px]">
        <p className="font-semibold mb-3 text-sm text-foreground">{fullDate}</p>
        {payload.map((entry: any, index: number) => {
          // Find the corresponding data point to get change info
          const dataPointIndex = chartData.findIndex(d => d.date === label);
          
          const keywordData = historicalData.find(k => k.keyword === entry.name);
          const isSinglePoint = keywordData?.dataPoints.length === 1 && 
                               keywordData?.dataPoints[0]?.metadata?.is_current_only === true;
          
          let change = 0;
          let isConstant = false;
          if (dataPointIndex > 0) {
            const currentPos = entry.value;
            const prevData = chartData[dataPointIndex - 1];
            const prevPos = prevData?.[entry.name];
            if (prevPos !== undefined && currentPos !== undefined) {
              change = prevPos - currentPos; // Positive = improvement (lower position number)
              isConstant = change === 0;
            }
          }
          
          const changeText = change === 0 ? '—' : change > 0 ? `+${change}` : `${change}`;
          const changeColor = change === 0 ? 'text-muted-foreground' : change > 0 ? 'text-green-500' : 'text-red-500';
          
          // Get metadata for this keyword
          const source = metadata?.get(`${entry.name}_source`);
          const impressions = metadata?.get(`${entry.name}_impressions`);
          const clicks = metadata?.get(`${entry.name}_clicks`);
          
          return (
            <div key={index} className="mb-3 last:mb-0 pb-3 last:pb-0 border-b last:border-b-0 border-border/50">
              <div className="flex items-center gap-2 mb-1">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="font-medium text-foreground">{entry.name}</span>
              </div>
              <div className="ml-5 space-y-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-foreground">
                    {entry.value}ª posição
                  </span>
                  {isSinglePoint ? (
                    <span className="text-xs text-amber-600 dark:text-amber-500 font-medium">
                      ⚠️ Sem histórico
                    </span>
                  ) : (
                    <>
                      <span className={`text-sm font-medium ${changeColor}`}>
                        ({changeText})
                      </span>
                      {isConstant && (
                        <span className="text-xs text-muted-foreground italic">
                          mantida
                        </span>
                      )}
                    </>
                  )}
                </div>
                {source && (
                  <div className="text-xs text-muted-foreground">
                    Fonte: {source === 'search_console' ? 'Google Search Console' : 'SerpAPI'}
                  </div>
                )}
                {(impressions !== undefined || clicks !== undefined) && (
                  <div className="text-xs text-muted-foreground">
                    {impressions !== undefined && `${impressions} impressões`}
                    {impressions !== undefined && clicks !== undefined && ' • '}
                    {clicks !== undefined && `${clicks} cliques`}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading || isLoadingHistory) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (selectedKeywords.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Evolução de Rankings
          </CardTitle>
          <CardDescription>
            Acompanhe a evolução das posições ao longo do tempo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma palavra-chave selecionada</h3>
            <p className="text-muted-foreground max-w-md">
              Selecione até 5 palavras-chave na tabela abaixo usando a coluna "Gráfico" 
              para visualizar sua evolução no tempo.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (selectedKeywords.length > 0 && relevantKeywords.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução de Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-amber-500/30 bg-amber-500/10">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              As keywords selecionadas não possuem dados suficientes para <strong>{PERIOD_LABELS[periodProp]}</strong>.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução de Rankings
            </CardTitle>
            <CardDescription>
              Histórico de posições das palavras-chave selecionadas ao longo do tempo
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isSimulatedMode && (
              <Alert className="mb-0 border-amber-500/30 bg-amber-500/10 py-2 px-3 inline-flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-amber-400" />
                <AlertDescription className="text-amber-300 text-xs p-0">
                  Modo teste ativo
                </AlertDescription>
              </Alert>
            )}
            {maturityStatus && !isSimulatedMode && (
              <Badge variant={
                maturityStatus.status === 'complete' ? 'default' : 
                maturityStatus.status === 'consolidating' ? 'secondary' : 
                'outline'
              }>
                {maturityStatus.icon} {maturityStatus.message}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {removedKeywords.length > 0 && (
          <Alert className="mb-4 border-amber-500/30 bg-amber-500/10">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              {removedKeywords.length === 1 ? (
                <>A keyword <strong>{removedKeywords[0]}</strong> foi removida do gráfico por não ter dados suficientes para <strong>{PERIOD_LABELS[periodProp]}</strong>.</>
              ) : (
                <>Keywords removidas por dados insuficientes: <strong>{removedKeywords.join(', ')}</strong></>
              )}
            </AlertDescription>
          </Alert>
        )}
        {missingKeywords.length > 0 && (
          <Alert variant="default" className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              {missingKeywords.length === 1 ? (
                <>A keyword <strong>{missingKeywords[0]}</strong> não possui dados históricos no período selecionado.</>
              ) : (
                <>As keywords <strong>{missingKeywords.slice(0, 3).join(', ')}{missingKeywords.length > 3 ? ` e mais ${missingKeywords.length - 3}` : ''}</strong> não possuem dados históricos no período selecionado.</>
              )}
              {' '}Isso pode indicar que essas keywords não estavam ativas ou não foram monitoradas nesse intervalo.
            </AlertDescription>
          </Alert>
        )}

        {keywordsWithLimitedData.length > 0 && (
          <Alert variant="default" className="mb-4 border-amber-600/50 bg-amber-50/50 dark:bg-amber-950/20">
            <Info className="h-4 w-4 text-amber-600 dark:text-amber-500" />
            <AlertDescription className="text-amber-900 dark:text-amber-200">
              {keywordsWithLimitedData.length === 1 ? (
                <>A keyword <strong>{keywordsWithLimitedData[0]}</strong> possui apenas a posição atual registrada no período.</>
              ) : (
                <>As keywords <strong>{keywordsWithLimitedData.slice(0, 3).join(', ')}{keywordsWithLimitedData.length > 3 ? ` e mais ${keywordsWithLimitedData.length - 3}` : ''}</strong> possuem apenas posições atuais.</>
              )}
              {' '}O histórico será mais completo com sincronizações frequentes do GSC.
            </AlertDescription>
          </Alert>
        )}
        <div className="space-y-4">
          <div className="flex flex-row gap-4">
            {/* Gráfico */}
            <div className="flex-1 h-96">
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Ainda não há histórico disponível para as palavras-chave selecionadas
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 150, left: 20, bottom: 5 }}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--border))"
                  opacity={0.5}
                />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  reversed
                  domain={yAxisDomain}
                  ticks={yAxisTicks}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  label={{ 
                    value: 'Posição', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { fill: 'hsl(var(--muted-foreground))', fontSize: 12 }
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine 
                  y={10} 
                  stroke="#10b981" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{ 
                    value: 'Top 10 (1ª Página)', 
                    position: 'right',
                    fill: '#10b981',
                    fontSize: 11,
                    fontWeight: 600
                  }}
                />
                {historicalData.map((keywordData, index) => {
                  if (!visibleKeywords.has(keywordData.keyword)) return null;
                  
                  const hasLimitedPoints = keywordData.dataPoints.length < 5;
                  const isSinglePoint = keywordData.dataPoints.length === 1;
                  const color = KEYWORD_COLORS[index % KEYWORD_COLORS.length];
                  
                  return (
                    <Line
                      key={keywordData.keyword}
                      type="monotone"
                      dataKey={keywordData.keyword}
                      stroke={color}
                      strokeWidth={isSinglePoint ? 0 : 3}
                      dot={{ 
                        r: isSinglePoint ? 8 : (hasLimitedPoints ? 6 : 4), 
                        strokeWidth: 2, 
                        fill: '#fff' 
                      }}
                      activeDot={{ r: 7, strokeWidth: 2 }}
                      connectNulls={!isSinglePoint}
                      name={keywordData.keyword}
                      label={isSinglePoint ? undefined : (props: any) => {
                        // Adicionar label apenas no último ponto
                        const isLastPoint = props.index === chartData.length - 1;
                        if (!isLastPoint || !props.value) return null;
                        
                        return (
                          <text 
                            x={props.x + 12} 
                            y={props.y} 
                            fill={color}
                            fontSize={12}
                            fontWeight={600}
                            dominantBaseline="middle"
                            className="select-none"
                          >
                            {props.value}º {keywordData.keyword}
                          </text>
                        );
                      }}
                    />
                  );
                })}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Dica:</p>
            <p>Clique nos itens da legenda para mostrar/ocultar palavras-chave específicas no gráfico.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
