import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, FlaskConical } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { fetchRankingHistory, getHistoryMaturity, calculateDaysSpan, HistoricalData } from "@/services/rankingHistoryService";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSimulatedData } from "@/hooks/useSimulatedData";

interface KeywordPositionHistoryChartProps {
  selectedKeywords: string[];
  projectId: string;
  isLoading?: boolean;
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
  isLoading = false
}: KeywordPositionHistoryChartProps) {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [visibleKeywords, setVisibleKeywords] = useState<Set<string>>(new Set());
  const { isSimulatedMode } = useSimulatedData();

  // Fetch historical data when keywords or period changes
  useEffect(() => {
    if (!projectId || selectedKeywords.length === 0) {
      setHistoricalData([]);
      return;
    }

    const loadHistory = async () => {
      setIsLoadingHistory(true);
      const days = period === 'day' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : 365;
      const result = await fetchRankingHistory(projectId, selectedKeywords, days);
      
      if (result.success && result.data) {
        setHistoricalData(result.data);
        // Initialize all keywords as visible
        setVisibleKeywords(new Set(selectedKeywords));
      } else {
        setHistoricalData([]);
      }
      setIsLoadingHistory(false);
    };

    loadHistory();
  }, [projectId, selectedKeywords, period]);

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
        const parsedDate = new Date(point.date);
        let groupKey: string;
        let formattedDate: string;
        
        if (period === 'day') {
          // Group by hour for daily view
          groupKey = `${parsedDate.getFullYear()}-${parsedDate.getMonth()}-${parsedDate.getDate()}-${parsedDate.getHours()}`;
          formattedDate = format(parsedDate, 'HH:mm', { locale: ptBR });
        } else if (period === 'week') {
          // Group by day for weekly view
          groupKey = `${parsedDate.getFullYear()}-${parsedDate.getMonth()}-${parsedDate.getDate()}`;
          formattedDate = format(parsedDate, 'dd/MM', { locale: ptBR });
        } else if (period === 'month') {
          // Group by day for monthly view
          groupKey = `${parsedDate.getFullYear()}-${parsedDate.getMonth()}-${parsedDate.getDate()}`;
          formattedDate = format(parsedDate, 'dd/MM', { locale: ptBR });
        } else {
          // Group by month for yearly view
          groupKey = `${parsedDate.getFullYear()}-${parsedDate.getMonth()}`;
          formattedDate = format(parsedDate, 'MMM/yy', { locale: ptBR });
        }
        
        if (!dateMap.has(groupKey)) {
          dateMap.set(groupKey, { 
            date: formattedDate, 
            sortKey: parsedDate.getTime(),
            groupKey 
          });
        }
        
        // Use the most recent position for each group
        const existing = dateMap.get(groupKey)![keywordData.keyword];
        if (!existing || parsedDate.getTime() > (dateMap.get(groupKey)!.latestTime || 0)) {
          dateMap.get(groupKey)![keywordData.keyword] = point.position;
          dateMap.get(groupKey)!.latestTime = parsedDate.getTime();
        }
      });
    });

    return Array.from(dateMap.values())
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ sortKey, groupKey, latestTime, ...rest }) => rest);
  }, [historicalData, visibleKeywords, period]);

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

    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-4">
        <p className="font-semibold mb-3 text-sm">{label}</p>
        {payload.map((entry: any, index: number) => {
          // Find the corresponding data point to get change info
          const keywordData = historicalData.find(d => d.keyword === entry.name);
          const dataPointIndex = chartData.findIndex(d => d.date === label);
          
          let change = 0;
          if (keywordData && dataPointIndex > 0) {
            const currentPos = entry.value;
            const prevData = chartData[dataPointIndex - 1];
            const prevPos = prevData?.[entry.name];
            if (prevPos !== undefined && currentPos !== undefined) {
              change = prevPos - currentPos; // Positive = improvement (lower position number)
            }
          }
          
          const changeText = change === 0 ? '—' : change > 0 ? `+${change}` : `${change}`;
          const changeColor = change === 0 ? 'text-muted-foreground' : change > 0 ? 'text-green-500' : 'text-red-500';
          
          return (
            <div key={index} className="flex items-center gap-2 text-sm mb-1.5">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="font-medium">{entry.name}:</span>
              <span className="font-semibold">
                {entry.value}ª
              </span>
              <span className={`text-xs font-medium ${changeColor}`}>
                ({changeText})
              </span>
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
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Período:</span>
            <ToggleGroup 
              type="single" 
              value={period} 
              onValueChange={(v) => v && setPeriod(v as 'day' | 'week' | 'month' | 'year')}
              className="justify-start"
            >
              <ToggleGroupItem value="day" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                Dia
              </ToggleGroupItem>
              <ToggleGroupItem value="week" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                Semana
              </ToggleGroupItem>
              <ToggleGroupItem value="month" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                Mês
              </ToggleGroupItem>
              <ToggleGroupItem value="year" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                Ano
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="flex flex-row gap-4">
            {/* Gráfico */}
            <div className="flex-1 h-96">
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Ainda não há histórico disponível para as palavras-chave selecionadas
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
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
                  domain={[1, 100]}
                  ticks={[1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
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
                {historicalData.map((keywordData, index) => (
                  visibleKeywords.has(keywordData.keyword) && (
                    <Line
                      key={keywordData.keyword}
                      type="monotone"
                      dataKey={keywordData.keyword}
                      stroke={KEYWORD_COLORS[index % KEYWORD_COLORS.length]}
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                      activeDot={{ r: 7, strokeWidth: 2 }}
                      connectNulls={true}
                      name={keywordData.keyword}
                    />
                  )
                ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Legendas ao lado do gráfico */}
            {chartData.length > 0 && (
              <div className="flex-shrink-0 w-48 flex flex-col gap-2 justify-center">
              {historicalData.map((keywordData, index) => {
                if (!visibleKeywords.has(keywordData.keyword)) return null;
                
                const lastDataPoint = chartData[chartData.length - 1];
                const lastPosition = lastDataPoint?.[keywordData.keyword];
                
                if (!lastPosition || typeof lastPosition !== 'number') return null;
                
                return (
                  <button
                    key={keywordData.keyword}
                    onClick={() => toggleKeywordVisibility(keywordData.keyword)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-all bg-secondary/80 hover:bg-secondary shadow-sm"
                  >
                    <div 
                      className="w-3 h-3 rounded-full border-2 border-background" 
                      style={{ backgroundColor: KEYWORD_COLORS[index % KEYWORD_COLORS.length] }}
                    />
                    <span className="text-sm font-medium whitespace-nowrap">
                      {keywordData.keyword}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {lastPosition}ª
                    </Badge>
                    </button>
                  );
                })}
              </div>
            )}
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
