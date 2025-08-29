import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { RankingService, KeywordRanking } from "@/services/rankingService";
import { Plus, TrendingUp, TrendingDown, Minus, Monitor, Smartphone, Globe } from "lucide-react";

interface RankingMonitorProps {
  rankings: KeywordRanking[];
  projectId: string;
  onRankingsUpdate: () => void;
}

export const RankingMonitor = ({ rankings, projectId, onRankingsUpdate }: RankingMonitorProps) => {
  const { toast } = useToast();
  const [isAddingKeyword, setIsAddingKeyword] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [searchEngine, setSearchEngine] = useState("google");
  const [device, setDevice] = useState("desktop");
  const [location, setLocation] = useState("brazil");

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

  const getPositionBadgeVariant = (position: number | null) => {
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
    <div className="space-y-6">
      {/* Add Keyword Dialog */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Keywords Monitoradas ({rankings.length})
            <Dialog>
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
                  <Input
                    placeholder="Digite a palavra-chave (ex: marketing digital)"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                  />
                  
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
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rankings.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma Keyword Monitorada</h3>
              <p className="text-muted-foreground mb-4">
                Adicione palavras-chave para começar a monitorar suas posições nos resultados de busca
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeira Keyword
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Keyword ao Monitoramento</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Digite a palavra-chave (ex: marketing digital)"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                    />
                    
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
          ) : (
            <div className="space-y-4">
              {rankings.map((ranking) => {
                const trend = getPositionTrend(ranking);
                return (
                  <div key={ranking.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{ranking.keyword}</span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {getDeviceIcon(ranking.device)}
                          <span>{ranking.search_engine}</span>
                          <span>•</span>
                          <span>{ranking.location}</span>
                        </div>
                      </div>
                      {ranking.url && (
                        <div className="text-xs text-muted-foreground truncate">
                          {ranking.url}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className={trend.color}>
                          {trend.icon}
                        </div>
                        {trend.change !== "0" && (
                          <span className={`text-xs ${trend.color}`}>
                            {trend.change}
                          </span>
                        )}
                      </div>
                      
                      <Badge variant={getPositionBadgeVariant(ranking.current_position)}>
                        {ranking.current_position ? `#${ranking.current_position}` : "N/R"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};