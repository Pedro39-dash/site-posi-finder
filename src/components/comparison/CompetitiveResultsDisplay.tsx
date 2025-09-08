import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Eye, RotateCcw, ArrowLeft, Filter, Download, Bell, Target, TrendingUp, Users, Trophy, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { CompetitorAnalysisService, CompetitiveAnalysisData, CompetitorKeyword } from '@/services/competitorAnalysisService';
import { KeywordDetailModal } from './KeywordDetailModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { EnhancedProgressTracker } from './EnhancedProgressTracker';
import { CompetitiveVisualization } from './CompetitiveVisualization';
import { PositionTrendChart } from './PositionTrendChart';
import { GuidedTour } from './GuidedTour';
import { ProductivityFeatures } from './ProductivityFeatures';
import { IntelligentNotifications } from './IntelligentNotifications';
import { useSupabaseCache } from '@/hooks/useSupabaseCache';
import { useOptimizedFilters } from './OptimizedFilterReducer';
import { ErrorBoundary } from './ErrorBoundary';
import { KeywordRow } from './OptimizedComponents';

interface CompetitiveResultsDisplayProps {
  analysisId: string;
  onBackToForm: () => void;
}

const CompetitiveResultsDisplay: React.FC<CompetitiveResultsDisplayProps> = ({ analysisId, onBackToForm }) => {
  const [selectedKeyword, setSelectedKeyword] = useState<CompetitorKeyword | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [reverifyingKeywords, setReverifyingKeywords] = useState<string[]>([]);
  const [showTour, setShowTour] = useState(false);
  const [showProductivityPanel, setShowProductivityPanel] = useState(false);
  
  const isMobile = useIsMobile();
  const itemsPerPage = isMobile ? 5 : 10;

  // Use optimized filter reducer
  const { filters, filterActions } = useOptimizedFilters();

  // Data fetching with stable caching (no auto-refresh)
  const {
    data: analysisData,
    loading,
    error,
    lastUpdated,
    refresh: refreshData,
  } = useSupabaseCache<CompetitiveAnalysisData | null>(
    `competitive-analysis-${analysisId}`,
    () => CompetitorAnalysisService.getAnalysisById(analysisId),
    {
      ttl: 10 * 60 * 1000, // 10 minutes - longer TTL for stability
      enableAutoRefresh: false, // Permanently disabled to prevent glitches
    }
  );

  // Check if user should see tour
  useEffect(() => {
    const tourCompleted = localStorage.getItem('comparison-tour-completed');
    const tourSkipped = localStorage.getItem('comparison-tour-skipped');
    
    if (!tourCompleted && !tourSkipped && analysisData?.status === 'completed') {
      setShowTour(true);
    }
  }, [analysisData?.status]);

  // Enhanced opportunity actions
  const handleOpportunityAction = useCallback((action: string, data: any) => {
    switch (action) {
      case 'focus-keywords':
        filterActions.setPositionRange(11, 20);
        filterActions.toggleOpportunities();
        toast.success("Filtros aplicados para keywords próximas da primeira página");
        break;
      case 'target-weak-competitors':
        filterActions.setCompetitionLevel(['low']);
        filterActions.setSort('keyword', 'asc');
        toast.success("Filtros aplicados para oportunidades de vitória rápida");
        break;
      case 'maintain-momentum':
        toast.success("Foque nestas keywords que estão em ascensão");
        break;
      case 'competitive-analysis':
        filterActions.setPositionRange(50, 100);
        filterActions.toggleLosing();
        toast.success("Visualizando keywords que precisam de atenção urgente");
        break;
    }
  }, [filterActions]);

  // Memoize keywords with stable reference
  const stableKeywords = useMemo(() => {
    return analysisData?.keywords || [];
  }, [JSON.stringify(analysisData?.keywords || [])]);

  // Filter and sort keywords with optimized memoization
  const filteredAndSortedKeywords = useMemo(() => {
    if (!stableKeywords.length) return [];
    
    let filtered = stableKeywords.filter(keyword => {
      // Search filter
      if (filters.search && !keyword.keyword.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      // Position range filter
      const position = keyword.target_domain_position;
      if (position && (position < filters.minPosition || position > filters.maxPosition)) {
        return false;
      }
      
      // Competition level filter
      if (filters.competitionLevel.length > 0 && !filters.competitionLevel.includes(keyword.competition_level || '')) {
        return false;
      }
      
      // Winning keywords (top 3 positions)
      if (filters.showWinning && (!position || position > 3)) {
        return false;
      }
      
      // Losing keywords (beyond page 1)
      if (filters.showLosing && (!position || position <= 10)) {
        return false;
      }
      
      // Opportunity keywords (positions 4-20 with low competition)
      if (filters.showOpportunities) {
        const hasOpportunity = position && position > 3 && position <= 20 && 
          keyword.competition_level === 'low';
        if (!hasOpportunity) return false;
      }
      
      return true;
    });

    // Sort keywords
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (filters.sortBy === 'keyword') {
        comparison = a.keyword.localeCompare(b.keyword);
      } else if (filters.sortBy === 'position') {
        const posA = a.target_domain_position || 999;
        const posB = b.target_domain_position || 999;
        comparison = posA - posB;
      }
      
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [stableKeywords, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedKeywords.length / itemsPerPage);
  const currentPageKeywords = filteredAndSortedKeywords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Handle re-verification of keywords
  const handleReverifyKeyword = useCallback(async (keyword: CompetitorKeyword) => {
    if (!analysisData) return;
    
    setReverifyingKeywords(prev => [...prev, keyword.keyword]);
    
    try {
      const result = await CompetitorAnalysisService.reverifyKeyword(
        analysisId,
        keyword.keyword,
        analysisData.target_domain
      );
      
      if (result.success) {
        // Reload analysis data to get updated position
        await refreshData();
        
        // Show toast notification with result
        const message = result.newPosition 
          ? `Posição atualizada: ${result.newPosition}ª para "${keyword.keyword}"`
          : `"${keyword.keyword}" não encontrado nos primeiros 50 resultados`;
        
        toast.success(message);
        console.log(`✅ Re-verification completed: ${message}`);
      } else {
        toast.error(`Erro ao verificar "${keyword.keyword}": ${result.error}`);
        console.error('❌ Re-verification failed:', result.error);
      }
    } catch (error) {
      toast.error(`Erro inesperado ao verificar "${keyword.keyword}"`);
      console.error('❌ Unexpected error during re-verification:', error);
    } finally {
      setReverifyingKeywords(prev => prev.filter(k => k !== keyword.keyword));
    }
  }, [analysisData, analysisId, refreshData]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4">
        <div className="container max-w-7xl mx-auto">
          <EnhancedProgressTracker
            status="analyzing"
            processedKeywords={0}
            totalKeywords={0}
            currentStage="setup"
            estimatedTimeRemaining={0}
            startTime={new Date().toISOString()}
          />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4">
        <div className="container max-w-7xl mx-auto">
          <Alert className="max-w-2xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Erro ao carregar dados da análise</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={refreshAnalysis}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Button>
                <Button variant="outline" size="sm" onClick={onBackToForm}>
                  Voltar
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // No data state
  if (!analysisData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4">
        <div className="container max-w-7xl mx-auto">
          <Alert className="max-w-2xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Nenhum dado encontrado para esta análise
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Analysis still processing
  if (analysisData.analysis.status !== 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4">
        <div className="container max-w-7xl mx-auto">
          <EnhancedProgressTracker
            status={analysisData.analysis.status}
            processedKeywords={analysisData.keywords?.length || 0}
            totalKeywords={analysisData.analysis.total_keywords}
            currentStage={analysisData.analysis.status === 'analyzing' ? 'processing' : 'setup'}
            estimatedTimeRemaining={Math.max(0, (analysisData.analysis.total_keywords - (analysisData.keywords?.length || 0)) * 2)}
            startTime={analysisData.analysis.created_at}
            errorMessage={analysisData.analysis.status === 'failed' ? 'Análise falhou' : undefined}
          />
        </div>
      </div>
    );
  }

  // Calculate metrics
  const getMetrics = () => {
    const keywords = analysisData.keywords;
    const firstPageCount = keywords.filter(k => (k.target_domain_position || 100) <= 10).length;
    const opportunityCount = keywords.filter(k => {
      const pos = k.target_domain_position || 100;
      return pos > 10 && pos <= 20;
    }).length;
    const totalPositions = keywords.reduce((sum, k) => sum + (k.target_domain_position || 100), 0);
    const avgPosition = Math.round(totalPositions / keywords.length);
    const gapCount = keywords.filter(k => {
      const bestCompetitor = Math.min(...k.competitor_positions.map(c => c.position || 100));
      return (k.target_domain_position || 100) > bestCompetitor;
    }).length;

    return {
      firstPageKeywords: firstPageCount,
      opportunityKeywords: opportunityCount,
      averagePosition: avgPosition,
      competitorGaps: gapCount
    };
  };

  const keywordMetrics = getMetrics();

  // Helper functions
  const extractDomain = (url: string) => {
    try {
      return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '');
    } catch {
      return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    }
  };

  const getBadgeVariant = (position: number) => {
    if (position <= 10) return 'default';
    if (position <= 20) return 'secondary';
    return 'destructive';
  };

  const getDifficultyVariant = (difficulty: string) => {
    switch (difficulty) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'outline';
    }
  };

  const getPotentialVariant = (potential: string) => {
    switch (potential) {
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4 animate-fade-in">
        <div className="container max-w-7xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Análise Competitiva - {analysisData.analysis.target_domain}
              </h1>
              <p className="text-muted-foreground">
                Comparação com {analysisData.competitors.length} concorrentes em {analysisData.keywords.length} palavras-chave
              </p>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProductivityPanel(!showProductivityPanel)}
                className={showProductivityPanel ? 'bg-primary/10' : ''}
              >
                <Filter className="h-4 w-4 mr-2" />
                Produtividade
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTour(true)}
              >
                <Play className="h-4 w-4 mr-2" />
                Tour
              </Button>
              
              <ExportReports analysisData={analysisData} />
            </div>
          </div>

          {/* Productivity Panel */}
          {showProductivityPanel && (
            <div className="animate-slide-in-right">
              <ProductivityFeatures
                currentFilters={filters}
                onFiltersChange={setFilters}
                onLoadAnalysis={(id) => {
                  // Handle loading previous analysis
                  toast.success("Recurso em desenvolvimento");
                }}
              />
            </div>
          )}

          {/* Intelligent Notifications */}
          <IntelligentNotifications
            analysisData={analysisData}
            onActionClick={handleOpportunityAction}
          />

          {/* Executive Summary */}
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Resumo Executivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p>
                  <strong>Situação do Mercado:</strong> Análise de {analysisData.keywords.length} palavras-chave 
                  contra {analysisData.competitors.length} concorrentes principais.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {keywordMetrics.firstPageKeywords}
                    </div>
                    <div className="text-sm text-muted-foreground">Primeira Página</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {keywordMetrics.opportunityKeywords}
                    </div>
                    <div className="text-sm text-muted-foreground">Oportunidades</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {keywordMetrics.averagePosition}
                    </div>
                    <div className="text-sm text-muted-foreground">Posição Média</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {keywordMetrics.competitorGaps}
                    </div>
                    <div className="text-sm text-muted-foreground">Gaps Competitivos</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visualizations */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <CompetitiveVisualization analysisData={analysisData} />
            <div className="space-y-6">
              <PositionTrendChart targetDomain={analysisData.analysis.target_domain} />
            </div>
          </div>

          {/* Keywords Analysis */}
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Análise Detalhada de Keywords
                </span>
                <Badge variant="secondary">
                  {filteredKeywords.length} de {analysisData.keywords.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isMobile ? (
                <MobileOptimizations
                  keywords={filteredKeywords}
                  onKeywordSelect={(keyword) => {
                    setSelectedKeyword(keyword);
                    setIsDetailModalOpen(true);
                  }}
                  onExport={() => {
                    // Trigger export functionality
                    toast.success("Export iniciado");
                  }}
                />
              ) : (
                <div className="space-y-6">
                  <AdvancedFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    keywordCount={analysisData.keywords.length}
                    filteredCount={filteredKeywords.length}
                  />

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Palavra-chave</TableHead>
                        <TableHead className="text-center">Sua Posição</TableHead>
                        <TableHead className="text-center">Melhor Concorrente</TableHead>
                        <TableHead className="text-center">Dificuldade</TableHead>
                        <TableHead className="text-center">Potencial</TableHead>
                        <TableHead className="text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentPageKeywords.map((keyword) => (
                        <TableRow key={keyword.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium">{keyword.keyword}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={getBadgeVariant(keyword.target_domain_position || 100)}>
                              {keyword.target_domain_position || '100+'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {(() => {
                              const bestCompetitor = keyword.competitor_positions
                                .sort((a, b) => (a.position || 100) - (b.position || 100))[0];
                              return bestCompetitor ? (
                                <div className="flex flex-col items-center gap-1">
                                  <Badge variant="outline" className="text-xs">
                                    #{bestCompetitor.position || '100+'}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                                    {extractDomain(bestCompetitor.domain)}
                                  </span>
                                </div>
                              ) : '-';
                            })()}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={getDifficultyVariant(keyword.competition_level)}>
                              {keyword.competition_level === 'high' ? 'Alta' : keyword.competition_level === 'medium' ? 'Média' : 'Baixa'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={getPotentialVariant(getKeywordPotential(keyword).improvementPotential)}>
                              {getKeywordPotential(keyword).improvementPotential === 'high' ? 'Alto' : 
                               getKeywordPotential(keyword).improvementPotential === 'medium' ? 'Médio' : 'Baixo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedKeyword(keyword);
                                      setIsDetailModalOpen(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Ver detalhes</TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleReverifyKeyword(keyword)}
                                    disabled={reverifyingKeywords.includes(keyword.keyword)}
                                  >
                                    <RefreshCw className={`h-4 w-4 ${reverifyingKeywords.includes(keyword.keyword) ? 'animate-spin' : ''}`} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Verificar novamente</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Mostrando {((currentPage - 1) * itemsPerPage) + 1} a{' '}
                        {Math.min(currentPage * itemsPerPage, filteredKeywords.length)} de{' '}
                        {filteredKeywords.length} resultados
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">
                          Página {currentPage} de {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Keyword Detail Modal */}
          <KeywordDetailModal
            keyword={selectedKeyword}
            isOpen={isDetailModalOpen}
            onClose={() => {
              setIsDetailModalOpen(false);
              setSelectedKeyword(null);
            }}
            targetDomain={analysisData.analysis.target_domain}
          />

          {/* Guided Tour */}
          <GuidedTour
            isOpen={showTour}
            onClose={() => setShowTour(false)}
            onComplete={() => {
              setShowTour(false);
              toast.success("Tour concluído! Explore todas as funcionalidades.");
            }}
          />
        </div>
      </div>
    </TooltipProvider>
  );
});

export default CompetitiveResultsDisplay;