import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { RankingService, KeywordRanking } from "@/services/rankingService";
import { useSimulatedData } from "@/hooks/useSimulatedData";
import { Plus, TrendingUp, TrendingDown, Minus, Monitor, Smartphone, Globe, Trash2, Download, Settings2, Clock, FlaskConical, Info, AlertCircle, RefreshCw } from "lucide-react";
import { KeywordIntentBadge } from "./KeywordIntentBadge";
import { PeriodSelector, PeriodOption } from "./filters/PeriodSelector";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { calculateKeywordRelevance, KeywordRelevance, filterRelevantKeywords } from "@/services/keywordRelevanceService";
import { PERIOD_LABELS } from "@/config/monitoringConfig";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RealtimeRankingService } from "@/services/realtimeRankingService";
import { useProject } from "@/hooks/useProject"; 


interface KeywordManagerProps {
  rankings: KeywordRanking[];
  projectId: string;
  onRankingsUpdate: () => void;
  selectedForChart: string[];
  onChartSelectionChange: (keywords: string[]) => void;
  period: PeriodOption;
  keywordRelevance?: Map<string, KeywordRelevance>;
  onRelevanceCalculated?: (relevance: Map<string, KeywordRelevance>) => void;
}

interface EnrichedRanking extends KeywordRanking {
  isRelevant?: boolean;
  relevanceReason?: string;
  totalDataPoints?: number;
  daysSinceLastCollection?: number;
  dataPointsInPeriod?: number;
}
export const KeywordManager = ({
  rankings,
  projectId,
  onRankingsUpdate,
  selectedForChart,
  onChartSelectionChange,
  period,
  keywordRelevance: externalRelevance,
  onRelevanceCalculated
}: KeywordManagerProps) => {
  const {
    toast
  } = useToast();
  const {
    isSimulatedMode
  } = useSimulatedData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddingKeyword, setIsAddingKeyword] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [searchEngine, setSearchEngine] = useState("google");
  const [device, setDevice] = useState("desktop");
  const [location, setLocation] = useState("brazil");
  const [showIrrelevantKeywords, setShowIrrelevantKeywords] = useState(true);
  const [internalRelevance, setInternalRelevance] = useState<Map<string, KeywordRelevance>>(new Map());
  const [isRealtimeCheck, setIsRealtimeCheck] = useState(false);
  const { activeProject } = useProject();
  
  const [visibleColumns, setVisibleColumns] = useState({
    chart: true,
    intent: true,
    previousPosition: true,
    estimatedTraffic: true,
    url: true,
    updated: true
  });

  // Usar relevância externa se disponível, senão usar interna
  const keywordRelevance = externalRelevance || internalRelevance;
  // Calcular relevância quando rankings, projectId ou período mudarem
  // useEffect(() => {
  //   const calculateRelevance = async () => {
  //     if (!projectId || rankings.length === 0) return;

  //     const keywords = rankings.map(r => r.keyword);
  //     const relevance = await calculateKeywordRelevance(projectId, keywords, period);
      
  //     setInternalRelevance(relevance);
  //     onRelevanceCalculated?.(relevance);
  //   };

  //   calculateRelevance();
  // }, [rankings, projectId, period]);

const [filteredKeywords, setFilteredKeywords] = useState<string[]>([]);

useEffect(() => {
    const calculateRelevance = async () => {
      if (!projectId || rankings.length === 0) return;
      const keywords = rankings.map(r => r.keyword);

      console.group('%c[KEYWORD_MANAGER][UseEffect] Cálculo de relevância', 'color: blue; font-weight: bold;');
      console.log('%c[PERIOD]', 'color: #5577aa', period);
      console.log('%c[TODAS AS KEYWORDS]', 'color: #2288bb', keywords);

      const relevance = await calculateKeywordRelevance(projectId, keywords, period);

      // Teste manual sempre retorna todas para 'today'
      const filtered = period === "today"
        ? keywords
        : filterRelevantKeywords(keywords, relevance, period);

      console.log('%c[FILTERED KEYWORDS]', 'color: green', filtered);
      setFilteredKeywords(filtered);

      setInternalRelevance(relevance);
      onRelevanceCalculated?.(relevance);
      console.groupEnd();
    };
    calculateRelevance();
  }, [rankings, projectId, period]);

const filteredRankings = useMemo(() => {
    if (!projectId || projectId === '') {
      console.log('%c[KEYWORD_MANAGER][filteredRankings] Sem projectId, retornando vazio', 'color: orange');
      return [];
    }
    const filtered = rankings.filter(r => r.project_id === projectId);
    console.groupCollapsed('%c[KEYWORD_MANAGER][filteredRankings] Filtro por projectId', 'color: orange');
    console.log({ projectId, totalRankings: rankings.length, filteredCount: filtered.length, keywords: filtered.map(r => r.keyword) });
    console.groupEnd();
    return filtered;
  }, [rankings, projectId]);

  // Enriquecer rankings com informações de relevância
  const enrichedRankings = useMemo<EnrichedRanking[]>(() => {
    return filteredRankings.map(r => {
      const relevance = keywordRelevance.get(r.keyword);
      return {
        ...r,
        isRelevant: relevance?.isRelevant ?? true,
        relevanceReason: relevance?.relevanceReason,
        totalDataPoints: relevance?.totalDataPoints,
        daysSinceLastCollection: relevance?.daysSinceLastCollection,
        dataPointsInPeriod: relevance?.dataPointsInPeriod
      };
    });
  }, [filteredRankings, keywordRelevance]);
  
  // Separar keywords ativas e inativas
  const activeRankings = useMemo(() => {
    const active = enrichedRankings.filter(r => !r.tracking_status || r.tracking_status === 'active');
    console.log('%c[KEYWORD_MANAGER][activeRankings] Ativas:', 'color: #bb77aa', active.map(r => r.keyword));
    return active;
  }, [enrichedRankings]);
  
  const inactiveRankings = useMemo(() => 
    enrichedRankings.filter(r => r.tracking_status === 'inactive' || r.tracking_status === 'missing'),
    [enrichedRankings]
  );




  // Filtrar rankings exibidos baseado no toggle
  // const displayedActiveRankings = useMemo(() => {
  //   if (showIrrelevantKeywords) {
  //     console.log('🔍 [KeywordManager] Mostrando todas (incluindo irrelevantes):', activeRankings.length);
  //     return activeRankings;
  //   }
  //   const relevant = activeRankings.filter(r => r.isRelevant);
  //   console.log('🔍 [KeywordManager] Filtro de relevância:', {
  //     totalActive: activeRankings.length,
  //     relevantCount: relevant.length,
  //     hiddenCount: activeRankings.length - relevant.length,
  //     irrelevantKeywords: activeRankings.filter(r => !r.isRelevant).map(r => r.keyword)
  //   });
  //   return relevant;
  // }, [activeRankings, showIrrelevantKeywords]);

  const displayedActiveRankings = useMemo(() => {
    const filteredKeywordSet = new Set(filteredKeywords);
    const filtered = activeRankings.filter(r => filteredKeywordSet.has(r.keyword));
    console.log('%c[KEYWORD_MANAGER][displayedActiveRankings] Rankings mostrados:', 'color: #66aa66', filtered.map(r => r.keyword));
    return filtered;
  }, [activeRankings, filteredKeywords]);



  // Contar keywords sem relevância
  const irrelevantCount = useMemo(() => 
    activeRankings.filter(r => !r.isRelevant).length,
    [activeRankings]
  );
  if (!projectId || projectId === '') {
    return <Card>
        <CardHeader>
          <Skeleton className="h-8 w-[200px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>;
  }

  // Utility functions
  const calculateEstimatedTraffic = (ranking: KeywordRanking): number => {
    if (!ranking.current_position) return 0;
    const ctrMap: Record<number, number> = {
      1: 0.32,
      2: 0.17,
      3: 0.11,
      4: 0.08,
      5: 0.06,
      6: 0.05,
      7: 0.04,
      8: 0.03,
      9: 0.03,
      10: 0.02
    };
    const ctr = ctrMap[ranking.current_position] || 0.01;
    const searchVolume = (ranking.metadata as any)?.search_volume || 1000;
    return Math.round(searchVolume * ctr);
  };
  const toggleChartSelection = (keyword: string, isRelevant: boolean = true) => {
    if (!isRelevant) {
      toast({
        title: "Keyword sem dados suficientes",
        description: `"${keyword}" não possui dados relevantes para o período de ${PERIOD_LABELS[period]}`,
        variant: "destructive"
      });
      return;
    }

    if (selectedForChart.includes(keyword)) {
      onChartSelectionChange(selectedForChart.filter(k => k !== keyword));
    } else {
      if (selectedForChart.length >= 5) {
        toast({
          title: "Limite atingido",
          description: "Você pode selecionar no máximo 5 palavras-chave para o gráfico",
          variant: "destructive"
        });
        return;
      }
      onChartSelectionChange([...selectedForChart, keyword]);
    }
  };
  const exportToCSV = () => {
    const headers = ['Palavra-chave', 'Intenção', 'Posição Anterior', 'Posição Atual', 'Diferença', 'Tráfego Estimado', 'URL', 'Buscador', 'Dispositivo', 'Localização'];
    const rows = filteredRankings.map(r => {
      const diff = r.previous_position && r.current_position ? r.previous_position - r.current_position : 0;
      return [r.keyword, 'Informacional', r.previous_position || 'N/R', r.current_position || 'N/R', diff, calculateEstimatedTraffic(r), r.url || '', r.search_engine, r.device, r.location].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], {
      type: 'text/csv'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keywords-${new Date().toISOString()}.csv`;
    a.click();
    toast({
      title: "Exportado",
      description: "Dados exportados com sucesso"
    });
  };
  const formatUrl = (url: string | null): string => {
    if (!url) return 'N/A';
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.length > 30 ? urlObj.pathname.substring(0, 30) + '...' : urlObj.pathname;
      return path || '/';
    } catch {
      return url.substring(0, 30) + '...';
    }
  };
  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return;
    setIsAddingKeyword(true);
    try {
      const result = await RankingService.addKeywordToTracking({
        projectId,
        keyword: newKeyword.trim(),
        searchEngine,
        device,
        location
      });
      if (result.success) {
        toast({
          title: "Keyword Adicionada",
          description: `"${newKeyword}" foi adicionada ao monitoramento`
        });
        setNewKeyword("");
        setIsDialogOpen(false);
        onRankingsUpdate();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao adicionar keyword ao monitoramento",
        variant: "destructive"
      });
    } finally {
      setIsAddingKeyword(false);
    }
  };
  const handleDeleteKeyword = async (keywordId: string, keyword: string) => {
    if (!confirm(`Tem certeza que deseja remover "${keyword}" do monitoramento?`)) {
      return;
    }
    try {
      const result = await RankingService.deleteKeyword(keywordId);
      if (result.success) {
        toast({
          title: "Keyword Removida",
          description: `"${keyword}" foi removida do monitoramento`
        });
        onRankingsUpdate();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao remover keyword",
        variant: "destructive"
      });
    }
  };
  const getPositionTrend = (ranking: KeywordRanking) => {
    if (!ranking.current_position || !ranking.previous_position) {
      return {
        icon: <Minus className="h-4 w-4" />,
        color: "text-muted-foreground",
        change: 0
      };
    }
    const change = ranking.previous_position - ranking.current_position;
    if (change > 0) {
      return {
        icon: <TrendingUp className="h-4 w-4" />,
        color: "text-green-600",
        change: `+${change}`
      };
    } else if (change < 0) {
      return {
        icon: <TrendingDown className="h-4 w-4" />,
        color: "text-red-600",
        change: change.toString()
      };
    } else {
      return {
        icon: <Minus className="h-4 w-4" />,
        color: "text-muted-foreground",
        change: "0"
      };
    }
  };
  const getPositionBadgeVariant = (position: number | null): "default" | "secondary" | "outline" | "destructive" => {
    if (!position) return "secondary";
    if (position <= 3) return "default";
    if (position <= 10) return "secondary";
    if (position <= 20) return "outline";
    return "destructive";
  };
  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'desktop':
        return <Monitor className="h-4 w-4" />;
      default:
      return <Globe className="h-4 w-4" />;
    }
  };

  // const handleRealtimeCheck = async () => {
  //   if (!projectId || !activeProject || displayedActiveRankings.length === 0) {
  //     toast({
  //       title: "Erro",
  //       description: "Selecione um projeto e adicione keywords primeiro",
  //       variant: "destructive"
  //     });
  //     return;
  //   }
    
  //   setIsRealtimeCheck(true);
  //   try {
  //     const keywords = displayedActiveRankings.map(r => r.keyword);
  //     const targetDomain = activeProject.domain;
      
  //     console.log(`🚀 Iniciando verificação em tempo real de ${keywords.length} keywords...`);
      
  //     await RealtimeRankingService.checkKeywordsRealtime(
  //       projectId,
  //       keywords,
  //       targetDomain,
  //       (current, total) => {
  //         console.log(`⏳ Progresso: ${current}/${total} keywords verificadas`);
  //       }
  //     );
      
  //     toast({
  //       title: "Verificação concluída",
  //       description: `${keywords.length} palavras-chave atualizadas via SerpAPI`
  //     });
      
  //     // Recarregar rankings
  //     onRankingsUpdate();
  //   } catch (error) {
  //     console.error('❌ Erro na verificação em tempo real:', error);
  //     toast({
  //       title: "Erro na verificação",
  //       description: "Falha ao buscar posições em tempo real",
  //       variant: "destructive"
  //     });
  //   } finally {
  //     setIsRealtimeCheck(false);
  //   }
  // };
  const handleRealtimeCheck = async () => {
  if (!projectId || !activeProject || displayedActiveRankings.length === 0) {
    toast({
      title: "Erro",
      description: "Selecione um projeto e adicione keywords primeiro",
      variant: "destructive"
    });
    return;
  }
  
  setIsRealtimeCheck(true);
  try {
    const keywords = displayedActiveRankings.map(r => r.keyword);
    const targetDomain = activeProject.domain;

    // Checa no banco (paralelo para todas as keywords)
    const positionsBanco = await Promise.all(
      keywords.map(kw => RankingService.getTodayKeywordPosition(projectId, kw))
    );

    // Separa as keywords que não têm posição salva hoje
    const keywordsSemPosicaoHoje = keywords.filter((kw, idx) => !positionsBanco[idx]);
    
    if (keywordsSemPosicaoHoje.length === 0) {
      toast({
        title: "Verificação não necessária",
        description: "Todas as keywords já possuem posição registrada hoje.",
      });
      setIsRealtimeCheck(false);
      return;
    }

    // Só consulta SerpAPI para as que faltam
    await RealtimeRankingService.checkKeywordsRealtime(
      projectId,
      keywordsSemPosicaoHoje,
      targetDomain,
      (current, total) => {
        console.log(`⏳ Progresso: ${current}/${total} keywords verificadas`);
      }
    );

    toast({
      title: "Verificação concluída",
      description: `${keywordsSemPosicaoHoje.length} palavras-chave atualizadas via SerpAPI`
    });

    // Recarregar rankings
    onRankingsUpdate();
  } catch (error) {
    console.error('❌ Erro na verificação em tempo real:', error);
    toast({
      title: "Erro na verificação",
      description: "Falha ao buscar posições em tempo real",
      variant: "destructive"
    });
  } finally {
    setIsRealtimeCheck(false);
  }
};

  const getRealtimeRankings = async () => {
  try {
    if (!projectId || filteredKeywords.length === 0 || !activeProject?.domain) {
      console.log('[API][RealtimeRanking] Dados insuficientes para consulta');
      return;
    }

    // Chamada para a API de verificação de rankings em tempo real
    await RealtimeRankingService.checkKeywordsRealtime(
      projectId,
      filteredKeywords,
      activeProject.domain,
      (current, total) => {
        console.log(`[API][RealtimeRanking] Progresso: ${current}/${total} keywords verificadas`);
      }
    );

    // Dispara atualização no componente pai (sem argumento)
    if (typeof onRankingsUpdate === 'function') {
      onRankingsUpdate();
      console.log('[API][RealtimeRanking] Solicitação de atualização enviada ao pai');
    }

  } catch (error) {
    console.error('[API][RealtimeRanking] Erro ao consultar posições em tempo real:', error);
  }
};

  return <TooltipProvider>
    <Card className="bg-red-600">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle>
            Gerenciar Keywords ({activeRankings.length} ativas
            {inactiveRankings.length > 0 && ` • ${inactiveRankings.length} inativas`}
            {irrelevantCount > 0 && (
              <Badge variant="outline" className="ml-2 text-xs border-amber-500 text-amber-700 dark:text-amber-400">
                {irrelevantCount} sem dados
              </Badge>
            )})
          </CardTitle>
          <div className="flex items-center gap-4">
            {/* Toggle para mostrar/ocultar keywords irrelevantes */}
            {irrelevantCount > 0 && (
              <div className="flex items-center gap-2">
                <Switch 
                  id="show-irrelevant" 
                  checked={showIrrelevantKeywords}
                  onCheckedChange={setShowIrrelevantKeywords}
                />
                <Label htmlFor="show-irrelevant" className="text-sm cursor-pointer">
                  Mostrar sem dados ({irrelevantCount})
                </Label>
              </div>
            )}
            <div className="flex items-center gap-2">
              {period === 'today' && (
                <Button 
                  onClick={handleRealtimeCheck}
                  disabled={isRealtimeCheck || displayedActiveRankings.length === 0}
                  variant="default"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRealtimeCheck ? 'animate-spin' : ''}`} />
                  {isRealtimeCheck ? 'Verificando...' : 'Verificar Agora'}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Keyword
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Keyword ao Monitoramento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Palavra-chave</label>
                    <Input placeholder="Ex: marketing digital" value={newKeyword} onChange={e => setNewKeyword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddKeyword()} />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Buscador</label>
                      <Select value={searchEngine} onValueChange={setSearchEngine}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="google">Google</SelectItem>
                          <SelectItem value="bing">Bing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Dispositivo</label>
                      <Select value={device} onValueChange={setDevice}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="desktop">Desktop</SelectItem>
                          <SelectItem value="mobile">Mobile</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Localização</label>
                      <Select value={location} onValueChange={setLocation}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="brazil">Brasil</SelectItem>
                          <SelectItem value="portugal">Portugal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button onClick={handleAddKeyword} disabled={isAddingKeyword || !newKeyword.trim()} className="w-full">
                    {isAddingKeyword ? "Adicionando..." : "Adicionar ao Monitoramento"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </div>
      </CardHeader>
     
      <CardContent>
      <h3 className="text-lg font-semibold mb-3">Posições atuais das Keywords Monitoradas:</h3>
        <ul>
          {displayedActiveRankings.map(ranking => (
            <li key={ranking.id}>
              <strong>{ranking.keyword}:</strong> {ranking.current_position ?? 'N/R'}
            </li>
          ))}
        </ul>
    </CardContent>

    </Card>
  </TooltipProvider>;
};