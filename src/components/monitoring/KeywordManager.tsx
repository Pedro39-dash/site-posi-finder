import { useState, useMemo } from "react";
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
import { Plus, TrendingUp, TrendingDown, Minus, Monitor, Smartphone, Globe, Trash2, Download, Settings2, Tag, Clock, X, FlaskConical } from "lucide-react";
import { KeywordIntentBadge } from "./KeywordIntentBadge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
interface KeywordManagerProps {
  rankings: KeywordRanking[];
  projectId: string;
  onRankingsUpdate: () => void;
  selectedForChart: string[];
  onChartSelectionChange: (keywords: string[]) => void;
}
export const KeywordManager = ({
  rankings,
  projectId,
  onRankingsUpdate,
  selectedForChart,
  onChartSelectionChange
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
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState({
    chart: true,
    intent: true,
    previousPosition: true,
    estimatedTraffic: true,
    url: true,
    updated: true
  });
  const filteredRankings = useMemo(() => {
    if (!projectId || projectId === '') {
      return [];
    }
    return rankings.filter(r => r.project_id === projectId);
  }, [rankings, projectId]);
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
  const toggleSelectAll = () => {
    if (selectedKeywords.length === filteredRankings.length) {
      setSelectedKeywords([]);
    } else {
      setSelectedKeywords(filteredRankings.map(r => r.id));
    }
  };
  const toggleSelectKeyword = (id: string) => {
    setSelectedKeywords(prev => prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]);
  };
  const toggleChartSelection = (keyword: string) => {
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
  const handleBulkDelete = async () => {
    const count = selectedKeywords.length;
    if (!confirm(`Tem certeza que deseja remover ${count} keyword(s)?`)) return;
    try {
      for (const id of selectedKeywords) {
        await RankingService.deleteKeyword(id);
      }
      toast({
        title: "Keywords Removidas",
        description: `${count} keyword(s) foram removidas com sucesso`
      });
      setSelectedKeywords([]);
      onRankingsUpdate();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao remover keywords",
        variant: "destructive"
      });
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
  return <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Gerenciar Keywords ({filteredRankings.length})</CardTitle>
          <div className="flex items-center gap-2">
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
      </CardHeader>
      <CardContent>
        {isSimulatedMode && <Alert className="mb-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
            <FlaskConical className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>Modo Teste Ativo:</strong> Os dados de posicionamento (posição, volume, tendência) são simulados. As keywords exibidas são suas keywords reais.
            </AlertDescription>
          </Alert>}

        {selectedKeywords.length > 0 && <div className="flex items-center gap-2 mb-4 p-4 bg-muted rounded-lg">
            <span className="font-medium">{selectedKeywords.length} selecionada(s)</span>
            <Button variant="outline" size="sm" onClick={() => setSelectedKeywords([])}>
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
            <Button variant="outline" size="sm">
              <Tag className="h-4 w-4 mr-1" />
              Adicionar tag
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-1" />
              Remover
            </Button>
          </div>}

        {filteredRankings.length === 0 ? <div className="text-center py-12">
            <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma Keyword Monitorada</h3>
            <p className="text-muted-foreground mb-4">
              Adicione palavras-chave para começar a monitorar suas posições nos resultados de busca
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeira Keyword
            </Button>
          </div> : <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.chart && <TableHead className="w-12 text-center">
                      <TrendingUp className="h-4 w-4 mx-auto" />
                    </TableHead>}
                  <TableHead className="w-[40px]">
                    <Checkbox checked={selectedKeywords.length === filteredRankings.length} onCheckedChange={toggleSelectAll} />
                  </TableHead>
                  {visibleColumns.intent && <TableHead className="w-[50px]">Int.</TableHead>}
                  <TableHead>Palavra-chave</TableHead>
                  {visibleColumns.previousPosition && <TableHead className="text-center">Posição Anterior</TableHead>}
                  <TableHead className="text-center">Posição Atual</TableHead>
                  <TableHead className="text-center">Diferença</TableHead>
                  {visibleColumns.estimatedTraffic && <TableHead className="text-center">Tráfego Est.</TableHead>}
                  {visibleColumns.url && <TableHead>URL</TableHead>}
                  {visibleColumns.updated && <TableHead className="text-right">Atualizado</TableHead>}
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRankings.map(ranking => {
              const trend = getPositionTrend(ranking);
              return <TableRow key={ranking.id}>
                      {visibleColumns.chart && <TableCell className="text-center">
                          <Checkbox checked={selectedForChart.includes(ranking.keyword)} onCheckedChange={() => toggleChartSelection(ranking.keyword)} />
                        </TableCell>}
                      <TableCell>
                        <Checkbox checked={selectedKeywords.includes(ranking.id)} onCheckedChange={() => toggleSelectKeyword(ranking.id)} />
                      </TableCell>
                      {visibleColumns.intent && <TableCell>
                          <KeywordIntentBadge keyword={ranking.keyword} />
                        </TableCell>}
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {ranking.keyword}
                          {ranking.data_source === 'search_console' && <Badge variant="outline" className="text-xs">
                              GSC
                            </Badge>}
                        </div>
                      </TableCell>
                      {visibleColumns.previousPosition && <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Badge variant="outline">
                              {ranking.previous_position ? `#${ranking.previous_position}` : "N/R"}
                            </Badge>
                            {isSimulatedMode && ranking.data_source === 'simulated_overlay' && <Badge variant="outline" className="text-[10px] px-1 h-4 border-amber-400 text-amber-700 dark:border-amber-600 dark:text-amber-400">
                                SIM
                              </Badge>}
                          </div>
                        </TableCell>}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Badge variant={getPositionBadgeVariant(ranking.current_position)}>
                            {ranking.current_position ? `#${ranking.current_position}` : "N/R"}
                          </Badge>
                          {isSimulatedMode && ranking.data_source === 'simulated_overlay' && <Badge variant="outline" className="text-[10px] px-1 h-4 border-amber-400 text-amber-700 dark:border-amber-600 dark:text-amber-400">
                              SIM
                            </Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <div className={trend.color}>
                            {trend.icon}
                          </div>
                          {trend.change !== "0" && <span className={`text-xs font-medium ${trend.color}`}>
                              {trend.change}
                            </span>}
                        </div>
                      </TableCell>
                      {visibleColumns.estimatedTraffic && <TableCell className="text-center font-medium">
                          {calculateEstimatedTraffic(ranking).toLocaleString('pt-BR')}
                        </TableCell>}
                      {visibleColumns.url && <TableCell className="text-sm text-muted-foreground">
                          {formatUrl(ranking.url)}
                        </TableCell>}
                      {visibleColumns.updated && <TableCell className="text-right text-sm text-muted-foreground">
                          <div className="flex items-center justify-end gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(ranking.updated_at), {
                      addSuffix: true,
                      locale: ptBR
                    })}
                          </div>
                        </TableCell>}
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteKeyword(ranking.id, ranking.keyword)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>;
            })}
              </TableBody>
            </Table>
          </div>}
      </CardContent>
    </Card>;
};