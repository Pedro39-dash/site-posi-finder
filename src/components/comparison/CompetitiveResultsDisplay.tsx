import React, { useState, useMemo } from "react";
import { Trophy, RefreshCw, AlertTriangle, TrendingUp, Eye, BarChart3, HelpCircle, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CompetitorAnalysisService, CompetitiveAnalysisData, CompetitorKeyword } from "@/services/competitorAnalysisService";
import { calculateCompetitiveMetrics, getKeywordCompetitiveDifficulty, getKeywordPotential, getCompetitorsAhead, getGapAnalysis, getCTRByPosition } from "@/utils/competitiveAnalysis";
import KeywordDetailModal from "./KeywordDetailModal";
import PositionTrendChart from "./PositionTrendChart";
import AdvancedFilters, { FilterState } from "./AdvancedFilters";
import CompetitiveVisualization from "./CompetitiveVisualization";
import ExportReports from "./ExportReports";
import EnhancedProgressTracker from "./EnhancedProgressTracker";
import { useSupabaseCache } from "@/hooks/useSupabaseCache";
import { CacheService } from "@/services/cacheService";

interface CompetitiveResultsDisplayProps {
  analysisId: string;
  onBackToForm: () => void;
}

const CompetitiveResultsDisplay = ({ analysisId, onBackToForm }: CompetitiveResultsDisplayProps) => {
  const [selectedKeyword, setSelectedKeyword] = useState<CompetitorKeyword | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [reverifyingKeywords, setReverifyingKeywords] = useState<string[]>([]);
  
  // Advanced filters state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    positionRange: [1, 100],
    opportunityTypes: [],
    competitionLevel: [],
    sortBy: 'keyword',
    sortOrder: 'asc',
    showOnlyWinning: false,
    showOnlyLosing: false,
    showOnlyOpportunities: false
  });
  
  const itemsPerPage = 10;

  // Use enhanced cache hook
  const {
    data: analysisData,
    loading,
    error,
    refresh: refreshAnalysis,
    lastUpdated
  } = useSupabaseCache(
    `analysis_${analysisId}`,
    () => CompetitorAnalysisService.getAnalysisData(analysisId).then(result => {
      if (!result.success) throw new Error(result.error || 'Failed to load analysis');
      return result.data!;
    }),
    {
      ttl: CacheService.ANALYSIS_TTL,
      enableAutoRefresh: true,
      refreshInterval: 30000
    }
  );

  // Filter and sort keywords
  const filteredKeywords = useMemo(() => {
    if (!analysisData?.keywords) return [];
    
    let filtered = [...analysisData.keywords];
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(k => 
        k.keyword.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply position range filter
    filtered = filtered.filter(k => {
      const position = k.target_domain_position;
      if (!position) return filters.positionRange[0] === 1; // Include "not found" if range starts from 1
      return position >= filters.positionRange[0] && position <= filters.positionRange[1];
    });
    
    // Apply status filters
    if (filters.showOnlyWinning) {
      filtered = filtered.filter(k => k.target_domain_position && k.target_domain_position <= 3);
    }
    
    if (filters.showOnlyLosing) {
      filtered = filtered.filter(k => !k.target_domain_position || k.target_domain_position > 20);
    }
    
    if (filters.showOnlyOpportunities) {
      filtered = filtered.filter(k => {
        const hasOpportunity = analysisData.opportunities?.some(o => o.keyword === k.keyword);
        return hasOpportunity;
      });
    }
    
    // Apply competition level filter
    if (filters.competitionLevel.length > 0) {
      filtered = filtered.filter(k => 
        k.competition_level && filters.competitionLevel.includes(k.competition_level)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sortBy) {
        case 'position':
          aValue = a.target_domain_position || 999;
          bValue = b.target_domain_position || 999;
          break;
        case 'difficulty':
          aValue = getKeywordCompetitiveDifficulty(a).score;
          bValue = getKeywordCompetitiveDifficulty(b).score;
          break;
        case 'opportunity':
          const aOpp = analysisData.opportunities?.find(o => o.keyword === a.keyword);
          const bOpp = analysisData.opportunities?.find(o => o.keyword === b.keyword);
          aValue = aOpp?.priority_score || 0;
          bValue = bOpp?.priority_score || 0;
          break;
        case 'competition':
          aValue = a.competition_level || 'unknown';
          bValue = b.competition_level || 'unknown';
          break;
        default:
          aValue = a.keyword.toLowerCase();
          bValue = b.keyword.toLowerCase();
      }
      
      if (filters.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return filtered;
  }, [analysisData, filters]);

  const handleReverifyKeyword = async (keyword: CompetitorKeyword) => {
    if (!analysisData) return;
    
    setReverifyingKeywords(prev => [...prev, keyword.keyword]);
    
    try {
      const result = await CompetitorAnalysisService.reverifyKeyword(
        analysisId,
        keyword.keyword,
        analysisData.analysis.target_domain
      );
      
      if (result.success) {
        // Reload analysis data to get updated position
        await refreshAnalysis();
        
        // Show toast notification with result
        const message = result.newPosition 
          ? `Posição atualizada: ${result.newPosition}ª para "${keyword.keyword}"`
          : `"${keyword.keyword}" não encontrado nos primeiros 50 resultados`;
        
        console.log(`✅ Re-verification completed: ${message}`);
      } else {
        console.error('❌ Re-verification failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Error during re-verification:', error);
    } finally {
      setReverifyingKeywords(prev => prev.filter(k => k !== keyword.keyword));
    }
  };

  // Pagination helpers for new filtered keywords
  const getPaginatedKeywords = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredKeywords.slice(startIndex, endIndex);
  };

  if (loading && !analysisData) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto" />
          <h2 className="text-2xl font-bold">Carregando Análise...</h2>
          <p className="text-muted-foreground">
            Aguarde enquanto coletamos os dados
          </p>
        </div>
      </div>
    );
  }

  if (error || !analysisData) {
    return (
      <div className="space-y-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="space-y-2">
            <p>{error || 'Não foi possível carregar os dados da análise'}</p>
          </AlertDescription>
        </Alert>
        <div className="flex gap-2 justify-center">
          <Button onClick={refreshAnalysis} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Tentar Novamente
          </Button>
          <Button onClick={onBackToForm} variant="outline">
            Voltar ao Formulário
          </Button>
        </div>
      </div>
    );
  }

  const { analysis, competitors, keywords, opportunities } = analysisData;

  // Calculate enhanced competitive metrics
  const competitiveMetrics = calculateCompetitiveMetrics(keywords, competitors);

  // Show enhanced progress tracker if analysis is still running
  if (analysis.status === 'analyzing' || analysis.status === 'pending') {
    const metadata = analysis.metadata || {};
    const totalKeywords = metadata.total_keywords || 0;
    const processedKeywords = metadata.processed_keywords || 0;
    
    return (
      <div className="space-y-8">
        <EnhancedProgressTracker
          status={analysis.status}
          processedKeywords={processedKeywords}
          totalKeywords={totalKeywords}
          currentStage="keyword_analysis"
          estimatedTimeRemaining={Math.max(0, (totalKeywords - processedKeywords) * 2)} // 2 seconds per keyword estimate
          startTime={analysis.created_at}
          metadata={metadata}
        />
      </div>
    );
  }

  // Show error state if analysis failed
  if (analysis.status === 'failed') {
    return (
      <div className="space-y-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            A análise falhou: {analysis.metadata?.error || 'Erro desconhecido'}
          </AlertDescription>
        </Alert>
        <Button onClick={onBackToForm} variant="outline">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  // Calculate key metrics
  const topCompetitor = competitors[0];
  const referenceCompetitors = competitors.filter(c => !c.detected_automatically);
  
  // Use the new reference competitor wins from metrics
  const keywordWins = competitiveMetrics.referenceCompetitorWins;
  
  const competitorWins = keywords.filter(k => 
    k.competitor_positions.some(cp => 
      !k.target_domain_position || (k.target_domain_position && cp.position < k.target_domain_position)
    )
  ).length;

  // Calculate quick opportunities based on high potential keywords
  const quickOpportunities = keywords.filter(k => {
    const potential = getKeywordPotential(k);
    return potential.improvementPotential === 'high' && k.target_domain_position && k.target_domain_position > 10;
  }).length;
  
  // Calculate traffic potential for quick opportunities only
  const quickOpportunityTraffic = keywords.filter(k => {
    const potential = getKeywordPotential(k);
    return potential.improvementPotential === 'high' && k.target_domain_position && k.target_domain_position > 10;
  }).reduce((acc, k) => {
    const myPosition = k.target_domain_position;
    const bestCompetitorPos = Math.min(...k.competitor_positions.map(cp => cp.position));
    if (myPosition && bestCompetitorPos < myPosition) {
      const volume = k.search_volume || 100;
      const currentCTR = getCTRByPosition(myPosition);
      const potentialCTR = getCTRByPosition(bestCompetitorPos);
      return acc + ((potentialCTR - currentCTR) * volume / 100);
    }
    return acc;
  }, 0);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getDomainName = (url: string) => {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  };

  const getPositionBadgeVariant = (position: number | null) => {
    if (!position) return "outline";
    if (position <= 3) return "default";
    if (position <= 10) return "secondary";
    return "outline";
  };

  const getDifficultyVariant = (level: string) => {
    switch (level) {
      case 'low': return 'default';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
      case 'very-high': return 'destructive';
      default: return 'outline';
    }
  };

  const getPotentialVariant = (level: string) => {
    switch (level) {
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const handleViewDetails = (keyword: CompetitorKeyword) => {
    setSelectedKeyword(keyword);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Header with Export Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Análise Competitiva - {analysis.target_domain}</h1>
        </div>
        <ExportReports analysisData={analysisData} />
      </div>

      {/* Executive Summary */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="text-center">
          <CardDescription className="text-base">
            {(() => {
              const gapAnalysis = getGapAnalysis(competitiveMetrics.averagePositionGap, keywords.length);
              return (
          <div className="space-y-2">
            <p className="text-lg font-medium">
              Situação no Mercado: <span className={`${gapAnalysis.color}`}>{gapAnalysis.description}</span>
            </p>
                  <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                    {gapAnalysis.recommendation}
                  </p>
                </div>
              );
            })()}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Simplified Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(() => {
          const gapAnalysis = getGapAnalysis(competitiveMetrics.averagePositionGap, keywords.length);
          return (
            <Card className={`${gapAnalysis.borderColor} ${gapAnalysis.bgColor}`}>
              <CardContent className="p-6">
                <div className="text-center space-y-3">
                  <BarChart3 className={`h-12 w-12 mx-auto ${gapAnalysis.color}`} />
                  <div>
                    <p className={`text-3xl font-bold ${gapAnalysis.color}`}>
                      {competitiveMetrics.averagePositionGap > 0 ? '+' : ''}{competitiveMetrics.averagePositionGap}
                    </p>
                    <div className="flex items-center gap-1 justify-center">
                      <p className="text-sm font-medium text-muted-foreground">Distância da Concorrência</p>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Quantas posições, em média, você está atrás dos seus principais concorrentes nas palavras-chave analisadas</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {gapAnalysis.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <Trophy className="h-12 w-12 mx-auto text-primary" />
              <div>
                <p className="text-3xl font-bold text-primary">
                  {keywordWins}
                </p>
                <div className="flex items-center gap-1 justify-center">
                  <p className="text-sm font-medium text-muted-foreground">Você está melhor em {keywordWins} palavras</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Palavras-chave onde você está melhor posicionado que todos os {referenceCompetitors.length > 0 ? 'concorrentes de referência especificados' : 'concorrentes encontrados na análise'}
                          {referenceCompetitors.length > 0 && (
                            <span className="block mt-1 text-xs text-muted-foreground">
                              Comparando apenas com: {referenceCompetitors.map(c => c.domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]).join(', ')}
                            </span>
                          )}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {((keywordWins / keywords.length) * 100).toFixed(1)}% do total analisado
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-secondary/20 bg-secondary/5">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <TrendingUp className="h-12 w-12 mx-auto text-secondary-foreground" />
              <div>
                <p className="text-3xl font-bold text-secondary-foreground">
                  0
                </p>
                <div className="flex items-center gap-1 justify-center">
                  <p className="text-sm font-medium text-muted-foreground">Posições Ganhas (30 dias)</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Tracking histórico será implementado em breve. Este valor mostrará quantas posições você ganhou nos últimos 30 dias</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Funcionalidade em desenvolvimento
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Competitive Visualization */}
      <CompetitiveVisualization analysisData={analysisData} />

      {/* Position Trend Chart */}
      <PositionTrendChart targetDomain={analysis.target_domain} />

      {/* Keywords Analysis with Advanced Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Análise Detalhada por Palavra-chave</CardTitle>
              <CardDescription>
                {filteredKeywords.length} palavra{filteredKeywords.length !== 1 ? 's' : ''}-chave encontrada{filteredKeywords.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Advanced Filters Component */}
          <AdvancedFilters
            filters={filters}
            onFiltersChange={setFilters}
            keywordCount={keywords.length}
            filteredCount={filteredKeywords.length}
          />

          <div className="overflow-x-auto mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">Palavra-chave</TableHead>
                  <TableHead className="text-center w-20">Posição</TableHead>
                  <TableHead className="text-center w-32">1º Lugar</TableHead>
                  <TableHead className="text-center w-28">Dificuldade</TableHead>
                  <TableHead className="text-center w-28">Potencial</TableHead>
                  <TableHead className="text-center w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getPaginatedKeywords().map((keyword) => {
                  const competitorsAhead = getCompetitorsAhead(keyword);
                  const difficulty = getKeywordCompetitiveDifficulty(keyword);
                  const potential = getKeywordPotential(keyword);
                  const myPosition = keyword.target_domain_position;
                  const isWinning = competitorsAhead.length === 0 && myPosition;
                  
                  return (
                    <TableRow key={keyword.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <p className="font-medium">{keyword.keyword}</p>
                          {keyword.search_volume && (
                            <Badge variant="outline" className="text-xs">
                              {formatNumber(keyword.search_volume)}/mês
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-center font-medium">
                                {myPosition ? myPosition : '-'}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                              {myPosition ? (
                                <p>Você está na posição {myPosition} para "{keyword.keyword}"</p>
                              ) : (
                                <div className="space-y-2">
                                  <p className="font-medium">Não rankeando no top 100</p>
                                  <p className="text-sm">
                                    "{keyword.keyword}" representa uma oportunidade de crescimento com {keyword.search_volume ? `${keyword.search_volume.toLocaleString()} buscas mensais` : 'potencial de tráfego inexplorado'}.
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    💡 Seus concorrentes já estão rankeando - analise suas estratégias!
                                  </p>
                                </div>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                        <TableCell className="text-center">
                          <div className="text-center">
                            {(() => {
                              const firstPlace = competitorsAhead.find(comp => comp.position === 1);
                              if (firstPlace) {
                                return <span className="font-medium">{firstPlace.domain}</span>;
                              } else if (myPosition === 1) {
                                return <span className="text-muted-foreground">Você está em 1º</span>;
                              } else {
                                return <span className="text-muted-foreground">-</span>;
                              }
                            })()}
                          </div>
                         </TableCell>
                       <TableCell className="text-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge 
                                variant={getDifficultyVariant(difficulty.level)}
                                className="text-xs cursor-help"
                              >
                                {difficulty.level === 'low' ? 'Fácil' : 
                                 difficulty.level === 'medium' ? 'Médio' : 
                                 difficulty.level === 'high' ? 'Difícil' : 'Muito Difícil'}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{difficulty.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                       </TableCell>
                       <TableCell className="text-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge 
                                  variant={getPotentialVariant(potential.improvementPotential)}
                                  className="text-xs cursor-help"
                                >
                                  {potential.improvementPotential === 'high' ? 'Alto' :
                                   potential.improvementPotential === 'medium' ? 'Médio' : 'Baixo'}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{potential.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                       <TableCell className="text-center">
                        <div className="flex gap-1 justify-center">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleViewDetails(keyword)}
                            className="text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Detalhes
                          </Button>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleReverifyKeyword(keyword)}
                                  className="text-xs"
                                  disabled={reverifyingKeywords.includes(keyword.keyword)}
                                >
                                  {reverifyingKeywords.includes(keyword.keyword) ? (
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-3 w-3" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Re-verificar posição atual desta palavra-chave</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            {/* Pagination Controls */}
            {(() => {
              const totalPages = Math.ceil(filteredKeywords.length / itemsPerPage);
              
              if (totalPages <= 1) return null;
              
              return (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages} ({filteredKeywords.length} resultados)
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = i + Math.max(1, currentPage - 2);
                        if (pageNum > totalPages) return null;
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Keyword Detail Modal */}
      <KeywordDetailModal
        keyword={selectedKeyword}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        targetDomain={analysis.target_domain}
      />
    </div>
  );
};

export default CompetitiveResultsDisplay;