import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { fetchRankingHistory, getHistoryMaturity, calculateDaysSpan, HistoricalData } from "@/services/rankingHistoryService";

interface KeywordPositionHistoryChartProps {
  selectedKeywords: string[];
  projectId: string;
  isLoading?: boolean;
}

const KEYWORD_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function KeywordPositionHistoryChart({
  selectedKeywords,
  projectId,
  isLoading = false
}: KeywordPositionHistoryChartProps) {
  const [period, setPeriod] = useState<'month' | 'year'>('month');
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [visibleKeywords, setVisibleKeywords] = useState<Set<string>>(new Set());

  // Fetch historical data when keywords or period changes
  useEffect(() => {
    if (!projectId || selectedKeywords.length === 0) {
      setHistoricalData([]);
      return;
    }

    const loadHistory = async () => {
      setIsLoadingHistory(true);
      const days = period === 'month' ? 30 : 365;
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

  // Calculate maturity status
  const maturityStatus = useMemo(() => {
    if (historicalData.length === 0) return null;
    
    const allDataPoints = historicalData.flatMap(d => d.dataPoints);
    if (allDataPoints.length === 0) return null;
    
    const daysSpan = calculateDaysSpan(allDataPoints);
    return getHistoryMaturity(allDataPoints.length, daysSpan);
  }, [historicalData]);

  // Transform data for Recharts
  const chartData = useMemo(() => {
    if (historicalData.length === 0) return [];

    // Create a map of all unique dates
    const dateMap = new Map<string, any>();
    
    historicalData.forEach(keywordData => {
      if (!visibleKeywords.has(keywordData.keyword)) return;
      
      keywordData.dataPoints.forEach(point => {
        if (!dateMap.has(point.date)) {
          dateMap.set(point.date, { date: point.date });
        }
        dateMap.get(point.date)![keywordData.keyword] = point.position;
      });
    });

    return Array.from(dateMap.values()).sort((a, b) => {
      const [dayA, monthA, yearA] = a.date.split('/');
      const [dayB, monthB, yearB] = b.date.split('/');
      return new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime();
    });
  }, [historicalData, visibleKeywords]);

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
    if (!active || !payload) return null;

    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">{entry.value}ª posição</span>
          </div>
        ))}
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
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução de Rankings
            </CardTitle>
            <CardDescription>
              Histórico de posições das palavras-chave selecionadas
            </CardDescription>
          </div>
          {maturityStatus && (
            <Badge variant={maturityStatus.status === 'complete' ? 'default' : 'secondary'}>
              {maturityStatus.icon} {maturityStatus.message}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as 'month' | 'year')}>
            <TabsList>
              <TabsTrigger value="month">Mês</TabsTrigger>
              <TabsTrigger value="year">Ano</TabsTrigger>
            </TabsList>
          </Tabs>

          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">
              Ainda não há histórico disponível para as palavras-chave selecionadas
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  reversed
                  domain={[1, 100]}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  label={{ value: 'Posição', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  onClick={(e) => toggleKeywordVisibility(e.value)}
                  wrapperStyle={{ cursor: 'pointer' }}
                />
                {historicalData.map((keywordData, index) => (
                  visibleKeywords.has(keywordData.keyword) && (
                    <Line
                      key={keywordData.keyword}
                      type="monotone"
                      dataKey={keywordData.keyword}
                      stroke={KEYWORD_COLORS[index % KEYWORD_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      name={keywordData.keyword}
                    />
                  )
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}

          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Dica:</p>
            <p>Clique nos itens da legenda para mostrar/ocultar palavras-chave específicas no gráfico.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
