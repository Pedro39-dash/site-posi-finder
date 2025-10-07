import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { RankingService, KeywordRanking } from "@/services/rankingService";
import { Plus, TrendingUp, TrendingDown, Minus, Monitor, Smartphone, Globe, Trash2 } from "lucide-react";

interface KeywordManagerProps {
  rankings: KeywordRanking[];
  projectId: string;
  onRankingsUpdate: () => void;
}

export const KeywordManager = ({ rankings, projectId, onRankingsUpdate }: KeywordManagerProps) => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddingKeyword, setIsAddingKeyword] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [searchEngine, setSearchEngine] = useState("google");
  const [device, setDevice] = useState("desktop");
  const [location, setLocation] = useState("brazil");

  // ✅ useMemo DEVE vir ANTES de qualquer return condicional
  const filteredRankings = useMemo(() => {
    // Proteção interna: se não há projectId, retornar array vazio
    if (!projectId || projectId === '') {
      return [];
    }
    
    const filtered = rankings.filter(r => r.project_id === projectId);
    
    console.log('🔍 [KeywordManager] Filtrando rankings:', {
      projectId,
      totalRankings: rankings.length,
      filteredCount: filtered.length,
      allProjectIds: [...new Set(rankings.map(r => r.project_id))],
      filteredKeywords: filtered.map(r => ({ keyword: r.keyword, project_id: r.project_id }))
    });
    
    return filtered;
  }, [rankings, projectId]);

  // ✅ AGORA podemos fazer o early return para skeleton
  if (!projectId || projectId === '') {
    console.warn('⚠️ [KeywordManager] projectId inválido:', projectId);
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-[200px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

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
      return { icon: <Minus className="h-4 w-4" />, color: "text-muted-foreground", change: 0 };
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
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'desktop': return <Monitor className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Gerenciar Keywords ({filteredRankings.length})</CardTitle>
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
                  <Input
                    placeholder="Ex: marketing digital"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                  />
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
                
                <Button 
                  onClick={handleAddKeyword}
                  disabled={isAddingKeyword || !newKeyword.trim()}
                  className="w-full"
                >
                  {isAddingKeyword ? "Adicionando..." : "Adicionar ao Monitoramento"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {filteredRankings.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma Keyword Monitorada</h3>
            <p className="text-muted-foreground mb-4">
              Adicione palavras-chave para começar a monitorar suas posições nos resultados de busca
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeira Keyword
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Keyword</TableHead>
                <TableHead>Buscador</TableHead>
                <TableHead>Dispositivo</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead className="text-center">Tendência</TableHead>
                <TableHead className="text-center">Posição</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRankings.map((ranking) => {
                const trend = getPositionTrend(ranking);
                return (
                  <TableRow key={ranking.id}>
                    <TableCell className="font-medium">{ranking.keyword}</TableCell>
                    <TableCell className="capitalize">{ranking.search_engine}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getDeviceIcon(ranking.device)}
                        <span className="capitalize">{ranking.device}</span>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{ranking.location}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className={trend.color}>
                          {trend.icon}
                        </div>
                        {trend.change !== "0" && (
                          <span className={`text-xs font-medium ${trend.color}`}>
                            {trend.change}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getPositionBadgeVariant(ranking.current_position)}>
                        {ranking.current_position ? `#${ranking.current_position}` : "N/R"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteKeyword(ranking.id, ranking.keyword)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};