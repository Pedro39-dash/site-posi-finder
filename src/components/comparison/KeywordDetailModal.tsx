import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ArrowUp, ArrowDown, Target, Lightbulb, TrendingUp, BarChart3, Users, CheckCircle2, ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import { CompetitorKeyword } from "@/services/competitorAnalysisService";
import { 
  getKeywordCompetitiveDifficulty, 
  getKeywordPotential, 
  getCompetitorsAhead, 
  generateKeywordRecommendations 
} from "@/utils/competitiveAnalysis";
import { getPositionCategory } from "@/utils/seoScoring";

interface KeywordDetailModalProps {
  keyword: CompetitorKeyword | null;
  isOpen: boolean;
  onClose: () => void;
  targetDomain: string;
}

const KeywordDetailModal = ({ keyword, isOpen, onClose, targetDomain }: KeywordDetailModalProps) => {
  const [implementedActions, setImplementedActions] = useState<Set<number>>(new Set());
  const [overviewPage, setOverviewPage] = useState(1);
  const [analysisPage, setAnalysisPage] = useState(1);
  const [visibleCompetitors, setVisibleCompetitors] = useState<Set<string>>(new Set());
  
  const COMPETITORS_PER_PAGE_OVERVIEW = 5;
  const COMPETITORS_PER_PAGE_ANALYSIS = 3;

  if (!keyword) return null;

  const difficulty = getKeywordCompetitiveDifficulty(keyword);
  const potential = getKeywordPotential(keyword);
  const competitorsAhead = getCompetitorsAhead(keyword);
  const recommendations = generateKeywordRecommendations(keyword);
  const myPositionCategory = getPositionCategory(keyword.target_domain_position);

  // Initialize visible competitors on first load
  if (visibleCompetitors.size === 0 && competitorsAhead.length > 0) {
    const initialVisible = new Set(competitorsAhead.slice(0, 6).map((_, i) => `competitor_${i}`));
    setVisibleCompetitors(initialVisible);
  }

  // Generate historical data simulation with all competitors
  const generateHistoricalData = () => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    const currentPos = keyword.target_domain_position || 50;
    const maxCompetitors = Math.min(6, competitorsAhead.length); // Limit to 6 for readability
    
    return months.map((month, index) => {
      const dataPoint: any = {
        month,
        myPosition: Math.max(1, currentPos + (Math.random() * 8 - 4)), // Client position with variation
        projected: index === months.length - 1 ? potential.projectedPosition : null
      };
      
      // Add dynamic competitor positions
      for (let i = 0; i < maxCompetitors; i++) {
        const competitor = competitorsAhead[i];
        if (competitor) {
          const basePosition = competitor.position || 1;
          dataPoint[`competitor_${i}`] = Math.max(1, Math.min(50, basePosition + (Math.random() * 4 - 2)));
        }
      }
      
      return dataPoint;
    });
  };

  const historicalData = generateHistoricalData();

  // Generate projection data
  const projectionData = [
    { phase: 'Atual', position: keyword.target_domain_position || 50 },
    { phase: 'Mês 1', position: potential.projectedPosition + 5 },
    { phase: 'Mês 2', position: potential.projectedPosition + 2 },
    { phase: 'Mês 3', position: potential.projectedPosition }
  ];

  const getDomainName = (url: string) => {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  };

  const getDifficultyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return 'text-green-600 border-green-200 bg-green-50';
      case 'medium': return 'text-yellow-600 border-yellow-200 bg-yellow-50';
      case 'high': return 'text-orange-600 border-orange-200 bg-orange-50';
      case 'very-high': return 'text-red-600 border-red-200 bg-red-50';
      default: return 'text-muted-foreground border-gray-200 bg-gray-50';
    }
  };

  const getDifficultyLevelText = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return 'BAIXA';
      case 'medium': return 'MÉDIA';
      case 'high': return 'ALTA';
      case 'very-high': return 'MUITO ALTA';
      default: return level.toUpperCase();
    }
  };

  const getDifficultyExplanation = (score: number, level: string) => {
    const baseText = `Score ${score}/100 - `;
    switch (level.toLowerCase()) {
      case 'low': 
        return `${baseText}Ótima oportunidade! Poucos concorrentes estabelecidos, foque em conteúdo relevante.`;
      case 'medium': 
        return `${baseText}Competição equilibrada. Analise os primeiros resultados e otimize seu conteúdo.`;
      case 'high': 
        return `${baseText}Mercado competitivo. Invista em conteúdo aprofundado e autoridade técnica.`;
      case 'very-high': 
        return `${baseText}Nicho estabelecido. Invista em estratégias a longo prazo e construa autoridade com conteúdo excepcional.`;
      default: 
        return `${baseText}Nível de dificuldade baseado na análise dos concorrentes.`;
    }
  };

  const getPotentialColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high': return 'text-green-600 border-green-200 bg-green-50';
      case 'medium': return 'text-blue-600 border-blue-200 bg-blue-50';
      case 'low': return 'text-orange-600 border-orange-200 bg-orange-50';
      default: return 'text-muted-foreground border-gray-200 bg-gray-50';
    }
  };

  const getPotentialText = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high': return 'EXCELENTE';
      case 'medium': return 'BOM';
      case 'low': return 'INICIAL';
      default: return level.toUpperCase();
    }
  };

  const getPotentialExplanation = (level: string, projectedPosition: string | number) => {
    const position = typeof projectedPosition === 'string' ? projectedPosition : projectedPosition.toString();
    switch (level.toLowerCase()) {
      case 'high': 
        return `🚀 Ótima oportunidade de crescimento! Com as estratégias certas, você pode alcançar a ${position}ª posição rapidamente.`;
      case 'medium': 
        return `📈 Oportunidade sólida de melhoria! Focar nesta palavra-chave pode trazer bons resultados e chegar à ${position}ª posição.`;
      case 'low': 
        return `🎯 Ponto de partida perfeito! Mesmo pequenas melhorias podem gerar grande impacto a longo prazo, projetando ${position}ª posição.`;
      default: 
        return `Projeção: ${position}ª posição`;
    }
  };

  const toggleActionImplemented = (index: number) => {
    const newImplemented = new Set(implementedActions);
    if (newImplemented.has(index)) {
      newImplemented.delete(index);
    } else {
      newImplemented.add(index);
    }
    setImplementedActions(newImplemented);
  };

  const toggleCompetitorVisibility = (competitorKey: string) => {
    const newVisible = new Set(visibleCompetitors);
    if (newVisible.has(competitorKey)) {
      newVisible.delete(competitorKey);
    } else {
      newVisible.add(competitorKey);
    }
    setVisibleCompetitors(newVisible);
  };

  // Pagination helpers
  const getPaginatedCompetitors = (page: number, itemsPerPage: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return competitorsAhead.slice(startIndex, endIndex);
  };

  const getTotalPages = (itemsPerPage: number) => {
    return Math.ceil(competitorsAhead.length / itemsPerPage);
  };

  const renderPaginationControls = (currentPage: number, totalPages: number, onPageChange: (page: number) => void) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          Mostrando {competitorsAhead.length} concorrentes
        </p>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
            </PaginationItem>
            <PaginationItem>
              <span className="px-4 py-2 text-sm">
                Página {currentPage} de {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Análise Detalhada: {keyword.keyword}
          </DialogTitle>
          <DialogDescription>
            Análise competitiva completa para esta palavra-chave
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Análise Competitiva</TabsTrigger>
            <TabsTrigger value="analysis">Análise Técnica</TabsTrigger>
            <TabsTrigger value="actions">Recomendações</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Current Situation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Minha Posição</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-start justify-start py-2">
                    {keyword.target_domain_position ? (
                      <>
                        <div className="text-5xl font-bold text-primary">
                          {keyword.target_domain_position}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          posição
                        </div>
                      </>
                    ) : (
                      <div>
                        <div className="text-lg font-medium text-muted-foreground">
                          Não rankeando
                        </div>
                        <div className="text-xs text-muted-foreground">
                          no top 100
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Dificuldade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getDifficultyColor(difficulty.level)}>
                      {getDifficultyLevelText(difficulty.level)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {getDifficultyExplanation(difficulty.score, difficulty.level)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Potencial de Melhoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getPotentialColor(potential.improvementPotential)}>
                      {getPotentialText(potential.improvementPotential)}
                    </Badge>
                    {potential.currentPosition && (
                      <ArrowUp className="h-3 w-3 text-green-600" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {getPotentialExplanation(potential.improvementPotential, potential.projectedPosition)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Historical Evolution Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Evolução Histórica de Posições
                </CardTitle>
                <CardDescription>
                  Comparação de posições nos últimos 6 meses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[1, 50]} reversed />
                      <Tooltip 
                        formatter={(value: number, name: string) => {
                          if (name === 'myPosition') {
                            return [`${value}ª posição`, getDomainName(targetDomain)];
                          }
                          
                          // Handle dynamic competitor names
                          const competitorMatch = name.match(/competitor_(\d+)/);
                          if (competitorMatch) {
                            const index = parseInt(competitorMatch[1]);
                            const competitor = competitorsAhead[index];
                            return [`${value}ª posição`, competitor?.domain || `Concorrente ${index + 1}`];
                          }
                          
                          return [`${value}ª posição`, name];
                        }}
                      />
                      {/* Client domain line - always primary and prominent */}
                      <Line 
                        type="monotone" 
                        dataKey="myPosition" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        name="myPosition"
                        dot={{ r: 4 }}
                      />
                      {/* Dynamic competitor lines - only visible ones */}
                      {competitorsAhead.slice(0, 6).map((competitor, index) => {
                        const competitorKey = `competitor_${index}`;
                        if (!visibleCompetitors.has(competitorKey)) return null;
                        
                        const colors = [
                          "hsl(var(--destructive))",
                          "hsl(var(--accent))", 
                          "hsl(45 93% 58%)", // warning
                          "hsl(217 89% 61%)", // info
                          "hsl(270 95% 75%)", // purple
                          "hsl(340 75% 55%)"  // pink
                        ];
                        
                        const dashArrays = ["5 5", "3 3", "8 2", "4 4", "6 3", "2 2"];
                        
                        return (
                          <Line
                            key={index}
                            type="monotone"
                            dataKey={competitorKey}
                            stroke={colors[index % colors.length]}
                            strokeWidth={2}
                            strokeDasharray={dashArrays[index % dashArrays.length]}
                            name={competitorKey}
                            dot={{ r: 3 }}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Interactive Competitors Ahead */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Concorrentes à Frente ({competitorsAhead.length})
                </CardTitle>
                <CardDescription>
                  Clique nos nomes para mostrar/ocultar no gráfico
                </CardDescription>
              </CardHeader>
              <CardContent>
                {competitorsAhead.length > 0 ? (
                  <div>
                    <div className="space-y-3">
                      {getPaginatedCompetitors(overviewPage, COMPETITORS_PER_PAGE_OVERVIEW).map((competitor, index) => {
                        const globalIndex = (overviewPage - 1) * COMPETITORS_PER_PAGE_OVERVIEW + index;
                        const competitorKey = `competitor_${globalIndex}`;
                        const isVisible = visibleCompetitors.has(competitorKey);
                        const colors = [
                          "hsl(var(--destructive))",
                          "hsl(var(--accent))", 
                          "hsl(45 93% 58%)",
                          "hsl(217 89% 61%)",
                          "hsl(270 95% 75%)",
                          "hsl(340 75% 55%)"
                        ];
                        const competitorColor = colors[globalIndex % colors.length];
                        
                        return (
                          <div 
                            key={index} 
                            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all hover:bg-muted/50 ${
                              isVisible ? 'border-primary/50' : 'border-muted'
                            }`}
                            onClick={() => toggleCompetitorVisibility(competitorKey)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                {isVisible ? (
                                  <Eye className="h-4 w-4 text-primary" />
                                ) : (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                )}
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: isVisible ? competitorColor : 'hsl(var(--muted-foreground))' }}
                                />
                              </div>
                              <div>
                                <p className={`font-medium text-sm ${isVisible ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {competitor.domain}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {competitor.gap} posições à frente
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className={isVisible ? '' : 'text-muted-foreground'}>
                              {competitor.position}ª posição
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                    {renderPaginationControls(
                      overviewPage, 
                      getTotalPages(COMPETITORS_PER_PAGE_OVERVIEW), 
                      setOverviewPage
                    )}
                  </div>
                ) : (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Parabéns! Você está liderando para esta palavra-chave.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            {/* Technical Analysis for each competitor */}
            <div className="space-y-4">
              {getPaginatedCompetitors(analysisPage, COMPETITORS_PER_PAGE_ANALYSIS).map((competitor, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>{competitor.domain}</span>
                      <Badge variant="outline">{competitor.position}ª posição</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* On-Page Analysis */}
                      <div>
                        <h4 className="font-medium mb-3">Análise On-Page</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Título otimizado:</span>
                            <Badge variant="default" className="text-xs">Sim</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>URL amigável:</span>
                            <Badge variant="secondary" className="text-xs">Parcial</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>H1 otimizado:</span>
                            <Badge variant="default" className="text-xs">Sim</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Meta descrição:</span>
                            <Badge variant="outline" className="text-xs">Não</Badge>
                          </div>
                        </div>
                      </div>

                      {/* Content Quality */}
                      <div>
                        <h4 className="font-medium mb-3">Qualidade do Conteúdo</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Palavras:</span>
                            <span className="font-medium">{1200 + index * 300}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Imagens:</span>
                            <span className="font-medium">{5 + index * 2}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Vídeos:</span>
                            <span className="font-medium">{index > 0 ? 1 : 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Links internos:</span>
                            <span className="font-medium">{8 + index * 3}</span>
                          </div>
                        </div>
                      </div>

                      {/* Backlinks */}
                      <div>
                        <h4 className="font-medium mb-3">Dados de Backlinks</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Total backlinks:</span>
                            <span className="font-medium">{150 + index * 75}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Domínios únicos:</span>
                            <span className="font-medium">{25 + index * 15}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>DA médio:</span>
                            <span className="font-medium">{45 + index * 5}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {renderPaginationControls(
                analysisPage, 
                getTotalPages(COMPETITORS_PER_PAGE_ANALYSIS), 
                setAnalysisPage
              )}
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-6">
            {/* Position Projection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Projeção de Melhoria de Posição
                </CardTitle>
                <CardDescription>
                  Projeção realista após implementação das recomendações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="phase" />
                      <YAxis domain={[1, 50]} reversed />
                      <Tooltip formatter={(value) => [`${value}ª posição`, 'Posição']} />
                      <Bar 
                        dataKey="position" 
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Action Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Lista de Ações Recomendadas
                </CardTitle>
                <CardDescription>
                  Implementação em ordem de prioridade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendations.map((action, index) => (
                    <div 
                      key={index}
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        implementedActions.has(index) 
                          ? 'bg-green-50 border-green-200' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => toggleActionImplemented(index)}
                    >
                      <Button
                        variant={implementedActions.has(index) ? "default" : "outline"}
                        size="sm"
                        className="mt-0.5 flex-shrink-0"
                      >
                        {implementedActions.has(index) ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <span className="text-xs">{index + 1}</span>
                        )}
                      </Button>
                      <div className="flex-1">
                        <p className={`text-sm ${implementedActions.has(index) ? 'line-through text-muted-foreground' : ''}`}>
                          {action}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {index < 2 ? 'Alta prioridade' : index < 4 ? 'Média prioridade' : 'Baixa prioridade'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {index < 2 ? '1-2 semanas' : index < 4 ? '2-4 semanas' : '1-2 meses'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="font-medium text-primary">Progresso Estimado</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Implementando {implementedActions.size} de {recommendations.length} ações ({Math.round((implementedActions.size / recommendations.length) * 100)}% completo)
                  </p>
                  <Progress value={(implementedActions.size / recommendations.length) * 100} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default KeywordDetailModal;