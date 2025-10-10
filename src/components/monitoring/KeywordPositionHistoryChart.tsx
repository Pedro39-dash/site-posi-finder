import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Text } from "recharts";
import { format, parseISO, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

// --- INÍCIO: Dependências integradas para resolver erros de importação ---

// Substituição para "@/components/ui/..."
const Card = ({ children, className = '' }) => <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm ${className}`}>{children}</div>;
const CardHeader = ({ children, className = '' }) => <div className={`p-6 ${className}`}>{children}</div>;
const CardTitle = ({ children, className = '' }) => <h3 className={`text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100 ${className}`}>{children}</h3>;
const CardDescription = ({ children, className = '' }) => <p className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}>{children}</p>;
const CardContent = ({ children, className = '' }) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;
const Skeleton = ({ className = '' }) => <div className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-700 ${className}`} />;
const Alert = ({ children, className = '' }) => <div className={`relative w-full rounded-lg border p-4 [&>svg]:absolute [&>svg]:text-foreground [&>svg]:left-4 [&>svg]:top-4 [&>svg+div]:translate-y-[-3px] [&:has(svg)]:pl-11 ${className}`}>{children}</div>;
const AlertDescription = ({ children, className = '' }) => <div className={`text-sm [&_p]:leading-relaxed ${className}`}>{children}</div>;
const Badge = ({ children, ...props }) => <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${props.variant === 'secondary' ? 'border-transparent bg-gray-100 text-gray-800' : 'border-transparent bg-blue-100 text-blue-800'}`}>{children}</span>;

// Substituição para "lucide-react"
const TrendingUp = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
const FlaskConical = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.31"/><path d="M14 9.31V2"/><path d="M10 13.31S6 16 6 18a4 4 0 0 0 8 0c0-2-4-4.69-4-4.69"/><path d="M14 13.31S18 16 18 18a4 4 0 0 1-8 0c0-2 4-4.69 4-4.69"/></svg>;
const Info = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>;
const AlertCircle = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>;

// Substituição para "@/config/monitoringConfig"
const PERIOD_LABELS = {
  '24h': 'Últimas 24 horas', '7d': 'Últimos 7 dias', '28d': 'Últimos 28 dias',
  '90d': 'Últimos 90 dias', '180d': 'Últimos 180 dias', '365d': 'Último ano', '16m': 'Últimos 16 meses',
};

// Substituição para "@/hooks/useSimulatedData"
const useSimulatedData = () => ({ isSimulatedMode: false });

// Substituição para "@/services/rankingHistoryService"
const calculateDaysSpan = (dataPoints) => {
    if (dataPoints.length < 2) return 1;
    const dates = dataPoints.map(dp => parseISO(dp.date).getTime());
    return Math.round((Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24)) + 1;
};

const generateSimulatedDataForFetch = (keywords, days) => {
    return keywords.map(keyword => {
        const dataPoints = [];
        let lastPosition = 10 + Math.random() * 40;
        const dataDays = days * (Math.random() * 0.4 + 0.6); 
        for (let i = 0; i < dataDays; i++) {
            const date = subDays(new Date(), i);
            const change = (Math.random() - 0.48) * 5;
            let newPosition = Math.round(lastPosition + change);
            if (newPosition < 1) newPosition = 1;
            if (newPosition > 100) newPosition = 100;
            const source = Math.random() > 0.3 ? 'serpapi' : 'search_console';
            dataPoints.push({ 
                date: date.toISOString(), 
                position: newPosition,
                metadata: {
                    data_source: source,
                    impressions: Math.floor(Math.random() * 500),
                    clicks: Math.floor(Math.random() * 50),
                }
            });
            lastPosition = newPosition;
        }
        return { keyword, dataPoints: dataPoints.reverse() };
    });
};

const fetchRankingHistory = async (projectId, keywords, days) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    if (!keywords || keywords.length === 0) {
        return { success: true, data: [] };
    }
    const data = generateSimulatedDataForFetch(keywords, days);
    return { success: true, data };
};

// --- FIM: Dependências integradas ---

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
}) {
  const [historicalData, setHistoricalData] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [visibleKeywords, setVisibleKeywords] = useState(new Set());
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
      
      let days = 7; // default
      // ALTERAÇÃO: Ajustado o switch para usar '24h' em vez de 'today' para consistência
      switch (periodProp) {
        case '24h': days = 1; break;
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

  const maturityStatus = useMemo(() => {
    if (historicalData.length === 0) return null;
    const allDataPoints = historicalData.flatMap(d => d.dataPoints);
    if (allDataPoints.length === 0) return null;
    const daysSpan = calculateDaysSpan(allDataPoints);
    const sources = new Set();
    allDataPoints.forEach(dp => {
      if (dp.metadata?.data_source) {
        sources.add(dp.metadata.data_source);
      }
    });

    const hasGSC = sources.has('search_console');
    const hasSerpAPI = sources.has('serpapi');
    
    let message = '';
    let status = 'building';
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

  const chartData = useMemo(() => {
    if (historicalData.length === 0) return [];
    const dateMap = new Map();
    historicalData.forEach(keywordData => {
      if (!visibleKeywords.has(keywordData.keyword)) return;
      keywordData.dataPoints.forEach(point => {
        const parsedDate = parseISO(point.date);
        let groupKey, formattedDate, fullDate;
        
        // ALTERAÇÃO: Removido o conflito de merge, mantendo a lógica para '24h'.
        if (periodProp === '24h') {
          groupKey = format(parsedDate, 'yyyy-MM-dd-HH', { locale: ptBR });
          formattedDate = format(parsedDate, 'HH:mm', { locale: ptBR });
          fullDate = format(parsedDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
        } else if (periodProp === '7d' || periodProp === '28d' || periodProp === '90d') {
          groupKey = format(parsedDate, 'yyyy-MM-dd', { locale: ptBR });
          formattedDate = format(parsedDate, 'dd/MM', { locale: ptBR });
          fullDate = format(parsedDate, 'dd/MM/yyyy', { locale: ptBR });
        } else {
          groupKey = format(parsedDate, 'yyyy-ww', { locale: ptBR });
          formattedDate = format(parsedDate, 'dd/MM', { locale: ptBR });
          fullDate = format(parsedDate, 'dd/MM/yyyy', { locale: ptBR });
        }
        
        if (!dateMap.has(groupKey)) {
          dateMap.set(groupKey, { 
            date: formattedDate,
            fullDate,
            sortKey: parsedDate.getTime(),
            metadata: new Map()
          });
        }
        
        const mapEntry = dateMap.get(groupKey);
        const currentValue = mapEntry[keywordData.keyword];
        const currentTime = mapEntry.metadata.get(`${keywordData.keyword}_time`) || 0;
        
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

  // ALTERAÇÃO: Otimização do hook `lastDataPointIndices`
  const lastDataPointIndices = useMemo(() => {
    const indices = new Map();
    if (chartData.length === 0) return indices;

    const visibleKeywordNames = Array.from(visibleKeywords);
    // Inicializa o mapa com as keywords visíveis
    visibleKeywordNames.forEach(kw => indices.set(kw, -1));

    // Itera uma vez sobre os dados do gráfico para encontrar o último índice de cada keyword
    chartData.forEach((dataPoint, index) => {
      visibleKeywordNames.forEach(keyword => {
        if (dataPoint[keyword] != null) {
          indices.set(keyword, index);
        }
      });
    });
    
    return indices;
  }, [chartData, visibleKeywords]);

  const yAxisDomain = useMemo(() => {
    if (chartData.length === 0) return [1, 100];
    const allPositions = chartData.flatMap(d => Object.entries(d).filter(([key]) => !['date', 'fullDate', '_metadata'].includes(key)).map(([_, value]) => value).filter(val => typeof val === 'number' && !isNaN(val)));
    if (allPositions.length === 0) return [1, 100];
    const min = Math.min(...allPositions);
    const max = Math.max(...allPositions);
    const range = max - min;
    const padding = Math.max(5, Math.ceil(range * 0.1));
    const domainMin = Math.max(1, Math.floor((min - padding) / 10) * 10);
    const domainMax = Math.min(100, Math.ceil((max + padding) / 10) * 10);
    return [domainMin, domainMax];
  }, [chartData]);

  const yAxisTicks = useMemo(() => {
    const [min, max] = yAxisDomain;
    const range = max - min;
    if (range <= 20) return Array.from({ length: Math.floor(range / 2) + 1 }, (_, i) => min + i * 2);
    if (range <= 50) return Array.from({ length: Math.floor(range / 5) + 1 }, (_, i) => min + i * 5);
    return Array.from({ length: Math.floor(range / 10) + 1 }, (_, i) => min + i * 10);
  }, [yAxisDomain]);

  const missingKeywords = useMemo(() => {
    return selectedKeywords.filter(keyword => !historicalData.some(hd => hd.keyword === keyword && hd.dataPoints.length > 0));
  }, [selectedKeywords, historicalData]);

  const keywordsWithLimitedData = useMemo(() => {
    return historicalData.filter(kw => kw.dataPoints.length === 1 && kw.dataPoints[0]?.metadata?.is_current_only === true).map(kw => kw.keyword);
  }, [historicalData]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const dataPoint = chartData.find(d => d.date === label);
    const fullDate = dataPoint?.fullDate || label;
    const metadata = dataPoint?._metadata;

    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 min-w-[280px]">
        <p className="font-semibold mb-3 text-sm text-gray-800 dark:text-gray-100">{fullDate}</p>
        {payload.map((entry, index) => {
          const dataPointIndex = chartData.findIndex(d => d.date === label);
          const keywordData = historicalData.find(k => k.keyword === entry.name);
          const isSinglePoint = keywordData?.dataPoints.length === 1 && keywordData?.dataPoints[0]?.metadata?.is_current_only === true;
          
          let change = 0;
          let isConstant = false;
          if (dataPointIndex > 0) {
            const currentPos = entry.value;
            const prevData = chartData[dataPointIndex - 1];
            const prevPos = prevData?.[entry.name];
            if (prevPos !== undefined && currentPos !== undefined) {
              change = prevPos - currentPos;
              isConstant = change === 0;
            }
          }
          
          const changeText = change === 0 ? '—' : change > 0 ? `+${change}` : `${change}`;
          const changeColor = change === 0 ? 'text-gray-500' : change > 0 ? 'text-green-500' : 'text-red-500';
          
          const source = metadata?.get(`${entry.name}_source`);
          const impressions = metadata?.get(`${entry.name}_impressions`);
          const clicks = metadata?.get(`${entry.name}_clicks`);
          
          return (
            <div key={index} className="mb-3 last:mb-0 pb-3 last:pb-0 border-b border-gray-200 dark:border-gray-700/50 last:border-b-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="font-medium text-gray-800 dark:text-gray-200">{entry.name}</span>
              </div>
              <div className="ml-5 space-y-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-50">{entry.value}ª posição</span>
                  {isSinglePoint ? (
                    <span className="text-xs text-amber-600 dark:text-amber-500 font-medium">⚠️ Sem histórico</span>
                  ) : (
                    <>
                      <span className={`text-sm font-medium ${changeColor}`}>({changeText})</span>
                      {isConstant && (<span className="text-xs text-gray-400 italic">mantida</span>)}
                    </>
                  )}
                </div>
                {source && (<div className="text-xs text-gray-500 dark:text-gray-400">Fonte: {source === 'search_console' ? 'Google Search Console' : 'SerpAPI'}</div>)}
                {(impressions !== undefined || clicks !== undefined) && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
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
          <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Evolução de Rankings</CardTitle>
          <CardDescription>Acompanhe a evolução das posições ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-center">
            <TrendingUp className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma palavra-chave selecionada</h3>
            <p className="text-gray-500 max-w-md">Selecione até 5 palavras-chave na tabela abaixo usando a coluna "Gráfico" para visualizar sua evolução no tempo.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (selectedKeywords.length > 0 && relevantKeywords.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Evolução de Rankings</CardTitle></CardHeader>
        <CardContent>
          <Alert className="border-amber-500/30 bg-amber-500/10">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">As keywords selecionadas não possuem dados suficientes para <strong>{PERIOD_LABELS[periodProp]}</strong>.</AlertDescription>
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
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Evolução de Rankings</CardTitle>
            <CardDescription>Histórico de posições das palavras-chave selecionadas ao longo do tempo</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isSimulatedMode && (<Alert className="mb-0 border-amber-500/30 bg-amber-500/10 py-2 px-3 inline-flex items-center gap-2"><FlaskConical className="h-4 w-4 text-amber-400" /><AlertDescription className="text-amber-300 text-xs p-0">Modo teste ativo</AlertDescription></Alert>)}
            {maturityStatus && !isSimulatedMode && (<Badge variant={maturityStatus.status === 'complete' ? 'default' : maturityStatus.status === 'consolidating' ? 'secondary' : 'outline'}>{maturityStatus.icon} {maturityStatus.message}</Badge>)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {removedKeywords.length > 0 && (<Alert className="mb-4 border-amber-500/30 bg-amber-500/10"><AlertCircle className="h-4 w-4 text-amber-600" /><AlertDescription className="text-amber-800 dark:text-amber-200">{removedKeywords.length === 1 ? (<>A keyword <strong>{removedKeywords[0]}</strong> foi removida do gráfico por não ter dados suficientes para <strong>{PERIOD_LABELS[periodProp]}</strong>.</>) : (<>Keywords removidas por dados insuficientes: <strong>{removedKeywords.join(', ')}</strong></>)}</AlertDescription></Alert>)}
        {missingKeywords.length > 0 && (<Alert variant="default" className="mb-4"><Info className="h-4 w-4" /><AlertDescription>{missingKeywords.length === 1 ? (<>A keyword <strong>{missingKeywords[0]}</strong> não possui dados históricos no período selecionado.</>) : (<>As keywords <strong>{missingKeywords.slice(0, 3).join(', ')}{missingKeywords.length > 3 ? ` e mais ${missingKeywords.length - 3}` : ''}</strong> não possuem dados históricos no período selecionado.</>)}{' '}Isso pode indicar que essas keywords não estavam ativas ou não foram monitoradas nesse intervalo.</AlertDescription></Alert>)}
        {keywordsWithLimitedData.length > 0 && (<Alert variant="default" className="mb-4 border-amber-600/50 bg-amber-50/50 dark:bg-amber-950/20"><Info className="h-4 w-4 text-amber-600 dark:text-amber-500" /><AlertDescription className="text-amber-900 dark:text-amber-200">{keywordsWithLimitedData.length === 1 ? (<>A keyword <strong>{keywordsWithLimitedData[0]}</strong> possui apenas a posição atual registrada no período.</>) : (<>As keywords <strong>{keywordsWithLimitedData.slice(0, 3).join(', ')}{keywordsWithLimitedData.length > 3 ? ` e mais ${keywordsWithLimitedData.length - 3}` : ''}</strong> possuem apenas posições atuais.</>)}{' '}O histórico será mais completo com sincronizações frequentes do GSC.</AlertDescription></Alert>)}
        
        <div className="space-y-4">
          <div className="flex flex-row gap-4">
            <div className="flex-1 h-96">
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">Ainda não há histórico disponível para as palavras-chave selecionadas</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 150, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214.3 31.8% 91.4%)" opacity={0.5} />
                    <XAxis dataKey="date" stroke="hsl(215 20.2% 65.1%)" fontSize={12} tick={{ fill: 'hsl(215 20.2% 65.1%)' }} />
                    <YAxis reversed domain={yAxisDomain} ticks={yAxisTicks} stroke="hsl(215 20.2% 65.1%)" fontSize={12} tick={{ fill: 'hsl(215 20.2% 65.1%)' }} label={{ value: 'Posição', angle: -90, position: 'insideLeft', style: { fill: 'hsl(215 20.2% 65.1%)', fontSize: 12 } }} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={10} stroke="#10b981" strokeDasharray="5 5" strokeWidth={2} label={{ value: 'Top 10 (1ª Página)', position: 'right', fill: '#10b981', fontSize: 11, fontWeight: 600 }} />
                    
                    {historicalData.map((keywordData, index) => {
                      if (!visibleKeywords.has(keywordData.keyword)) return null;
                      
                      const hasLimitedPoints = keywordData.dataPoints.length < 5;
                      const isSinglePoint = keywordData.dataPoints.length === 1;
                      const color = KEYWORD_COLORS[index % KEYWORD_COLORS.length];
                      const lastValidIndex = lastDataPointIndices.get(keywordData.keyword);
                      
                      return (
                        <Line
                          key={keywordData.keyword}
                          type="monotone"
                          dataKey={keywordData.keyword}
                          stroke={color}
                          strokeWidth={isSinglePoint ? 0 : 3}
                          dot={{ r: isSinglePoint ? 8 : (hasLimitedPoints ? 6 : 4), strokeWidth: 2, fill: '#fff' }}
                          activeDot={{ r: 7, strokeWidth: 2 }}
                          connectNulls={!isSinglePoint}
                          name={keywordData.keyword}
                          label={(props) => {
                            if (props.index !== lastValidIndex || props.value == null) {
                                return null;
                            }
                            
                            // ALTERAÇÃO: Truncar o texto da keyword se for muito longo
                            const maxLabelLength = 15;
                            const labelText = keywordData.keyword.length > maxLabelLength 
                                ? `${keywordData.keyword.substring(0, maxLabelLength)}...` 
                                : keywordData.keyword;
                                
                            return (
                                <text x={props.x} y={props.y} dy={4} dx={8} fill={color} fontSize={12} fontWeight={600} textAnchor="start" className="select-none">
                                    {props.value}º {labelText}
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
          <div className="text-sm text-gray-500">
            <p className="font-medium mb-1">Dica:</p>
            <p>Passe o mouse sobre os pontos do gráfico para mais detalhes sobre a posição em cada data.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}