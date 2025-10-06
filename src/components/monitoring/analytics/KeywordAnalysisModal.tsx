import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Award,
  Target,
  Lightbulb,
  ExternalLink,
  Clock,
  Eye,
  MousePointer
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { keywordAnalysisService, type KeywordAnalysisData, type CompetitorPosition, type RelatedKeyword, type OptimizationSuggestion, type SignificantChange } from "@/services/keywordAnalysisService";

interface KeywordAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keywordRankingId: string | null;
  keywordName?: string;
}

export const KeywordAnalysisModal = ({ 
  open, 
  onOpenChange, 
  keywordRankingId,
  keywordName 
}: KeywordAnalysisModalProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [analysis, setAnalysis] = useState<KeywordAnalysisData | null>(null);
  const [historicalData, setHistoricalData] = useState<{ date: string; position: number }[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorPosition[]>([]);
  const [relatedKeywords, setRelatedKeywords] = useState<RelatedKeyword[]>([]);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [changes, setChanges] = useState<SignificantChange[]>([]);

  useEffect(() => {
    if (open && keywordRankingId) {
      loadData();
    }
  }, [open, keywordRankingId]);

  const loadData = async () => {
    if (!keywordRankingId) return;
    
    setIsLoading(true);
    try {
      const [analysisData, historyData, competitorsData, relatedData, suggestionsData, changesData] = await Promise.all([
        keywordAnalysisService.getKeywordAnalysis(keywordRankingId),
        keywordAnalysisService.getHistoricalData(keywordRankingId, 90),
        keywordAnalysisService.getCompetitorPositions(keywordName || '', ''),
        keywordAnalysisService.getRelatedKeywords(keywordName || ''),
        keywordAnalysisService.getOptimizationSuggestions(keywordRankingId),
        keywordAnalysisService.getSignificantChanges(keywordRankingId, 30)
      ]);

      setAnalysis(analysisData);
      setHistoricalData(historyData);
      setCompetitors(competitorsData);
      setRelatedKeywords(relatedData);
      setSuggestions(suggestionsData);
      setChanges(changesData);
    } catch (error) {
      console.error('Error loading keyword analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingDown className="h-4 w-4 text-destructive" />;
    if (change < 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive"; className: string }> = {
      high: { variant: 'destructive', className: '' },
      medium: { variant: 'secondary', className: 'bg-orange-100 text-orange-800 hover:bg-orange-200' },
      low: { variant: 'secondary', className: '' }
    };
    
    return variants[priority] || variants.medium;
  };

  if (!keywordRankingId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Análise: {analysis?.keyword || keywordName || 'Carregando...'}
          </DialogTitle>
          <DialogDescription>
            Análise detalhada de performance e oportunidades de otimização
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-8">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        ) : !analysis ? (
          <div className="py-8 text-center text-muted-foreground">
            Não foi possível carregar os dados da análise
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="serp">SERP</TabsTrigger>
              <TabsTrigger value="suggestions">Otimização</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription className="text-xs">Posição Atual</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{analysis.currentPosition}ª</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription className="text-xs">Melhor Posição</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">{analysis.bestPosition}ª</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription className="text-xs">Posição Média</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{analysis.averagePosition}ª</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription className="text-xs">CTR Estimado</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{analysis.estimatedCTR}%</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Histórico de Posições (90 dias)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis reversed domain={[1, 100]} fontSize={12} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="position" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-sm">Volume de Busca</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analysis.estimatedSearchVolume.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">Buscas mensais estimadas</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <MousePointer className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-sm">Tráfego Estimado</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analysis.estimatedTraffic.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">Cliques mensais estimados</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-sm">Dispositivo</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary" className="text-base">{analysis.device}</Badge>
                    <p className="text-xs text-muted-foreground mt-2">{analysis.location}</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* SERP Tab */}
            <TabsContent value="serp" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Principais Concorrentes</CardTitle>
                  <CardDescription>Domínios competindo por esta palavra-chave</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {competitors.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum concorrente identificado ainda
                    </p>
                  ) : (
                    competitors.map((comp, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge className="text-lg font-bold w-10 justify-center">
                            {comp.position}
                          </Badge>
                          <div>
                            <div className="font-medium">{comp.domain}</div>
                            <a 
                              href={comp.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                            >
                              {comp.url.substring(0, 50)}...
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Keywords Relacionadas</CardTitle>
                  <CardDescription>Oportunidades de expansão de conteúdo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {relatedKeywords.map((kw, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{kw.keyword}</div>
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          <span>Vol: {kw.searchVolume?.toLocaleString() || 'N/A'}</span>
                          <span>Dif: {kw.difficulty || 'N/A'}</span>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {kw.relevanceScore}% relevante
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Suggestions Tab */}
            <TabsContent value="suggestions" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Sugestões de Otimização
                  </CardTitle>
                  <CardDescription>
                    Ações recomendadas para melhorar o posicionamento
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {suggestions.map((sug, idx) => {
                    const badgeProps = getPriorityBadge(sug.priority);
                    return (
                      <div key={idx} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge {...badgeProps}>
                                {sug.priority === 'high' ? 'Alta' : sug.priority === 'medium' ? 'Média' : 'Baixa'}
                              </Badge>
                              <Badge variant="outline">{sug.category}</Badge>
                            </div>
                            <h4 className="font-semibold">{sug.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {sug.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Mudanças Significativas
                  </CardTitle>
                  <CardDescription>
                    Alterações importantes de posição nos últimos 30 dias
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {changes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhuma mudança significativa detectada
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {changes.map((change, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                          <div className="text-sm font-medium min-w-[80px]">
                            {change.date}
                          </div>
                          <Separator orientation="vertical" className="h-8" />
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-base">
                              {change.oldPosition}ª
                            </Badge>
                            {getChangeIcon(change.change)}
                            <Badge variant="outline" className="text-base">
                              {change.newPosition}ª
                            </Badge>
                          </div>
                          <div className="flex-1 text-sm text-muted-foreground">
                            {change.change > 0 ? `Caiu ${change.change} posições` : `Subiu ${Math.abs(change.change)} posições`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
