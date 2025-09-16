import React, { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Eye, RotateCcw, ArrowLeft, Filter, Download, Bell, Target, TrendingUp, 
  Users, Trophy, Settings, AlertTriangle, RefreshCw, BarChart, 
  ChevronLeft, ChevronRight, MapPin, Calendar, Info
} from 'lucide-react';
import { toast } from 'sonner';
import { CompetitorAnalysisService, CompetitiveAnalysisData, CompetitorKeyword } from '@/services/competitorAnalysisService';
import KeywordDetailModal from './KeywordDetailModal';
import { useIsMobile } from '@/hooks/use-mobile';
import EnhancedProgressTracker from './EnhancedProgressTracker';
import CompetitiveVisualization from './CompetitiveVisualization';
import PositionVariationChart from './PositionVariationChart';
import CompetitorTable from './CompetitorTable';
import StrategicOpportunities from './StrategicOpportunities';
import GraphSelectionPanel from './GraphSelectionPanel';

import ProductivityFeatures from './ProductivityFeatures';
import IntelligentNotifications from './IntelligentNotifications';
import ExportReports from './ExportReports';
import AdvancedFilters from './AdvancedFilters';
import MobileOptimizations from './MobileOptimizations';
import { useSupabaseCache } from '@/hooks/useSupabaseCache';
import { useOptimizedFilters } from './OptimizedFilterReducer';
import { ErrorBoundary } from './ErrorBoundary';
import { HookErrorBoundary } from './HookErrorBoundary';
import { KeywordFilterProvider, useKeywordFilter } from '@/contexts/KeywordFilterContext';
import KeywordSelector from './KeywordSelector';
import { ManualPositionCorrection } from './ManualPositionCorrection';
import { getTop10CompetitorsAroundTarget } from '@/utils/competitorFiltering';
import { useStableKeywords } from '@/hooks/useStableKeywords';

interface CompetitiveResultsDisplayProps {
  analysisId: string;
  onBackToForm: () => void;
}

const CompetitiveResultsDisplay: React.FC<CompetitiveResultsDisplayProps> = memo(({ analysisId, onBackToForm }) => {
  const { selectedKeyword } = useKeywordFilter();
  
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(30);
  const [currentPage, setCurrentPage] = useState(1);
  const [reverifyingKeywords, setReverifyingKeywords] = useState<string[]>([]);
  const [reverifyLoading, setReverifyLoading] = useState(false);
  
  const [showProductivityPanel, setShowProductivityPanel] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  const isMobile = useIsMobile();
  const itemsPerPage = isMobile ? 5 : 10;

  const { filters, filterActions } = useOptimizedFilters();

  // Cache da análise com TTL de 5 minutos e sem auto-refresh
  const {
    data: analysisData,
    loading,
    error,
    refresh
  } = useSupabaseCache<CompetitiveAnalysisData>(
    `competitive-analysis-${analysisId}`,
    () => CompetitorAnalysisService.getAnalysisData(analysisId).then(result => {
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to load analysis data');
      }
      return result.data;
    }),
    { ttl: 5 * 60 * 1000, enableAutoRefresh: false }
  );

  // ALL remaining hooks and memoized values (must be called consistently)

  // Handler para ações de oportunidade
  const handleOpportunityAction = useCallback((action: string, keyword?: string) => {
    switch (action) {
      case 'filter-high-potential':
        filterActions.setSearch('');
        break;
      case 'filter-low-competition':
        filterActions.setSearch('');
        break;
      case 'focus-keyword':
        if (keyword) {
          filterActions.setSearch(keyword);
        }
        break;
    }
  }, [filterActions]);

  // Keywords estáveis para evitar re-renders usando o hook customizado
  const stableKeywords = useStableKeywords(analysisData?.keywords);

  // Destructure filters for stable dependencies - use primitives only
  const searchTerm = filters.search;
  const competitionLevels = filters.competitionLevel;
  const sortByField = filters.sortBy;
  const sortDirection = filters.sortOrder;
  
  // Handler for reverifying positions
  const handleReverifyPositions = useCallback(async () => {
    if (!analysisData?.keywords?.length) {
      toast.error('Nenhuma palavra-chave encontrada para reverificar');
      return;
    }

    setReverifyLoading(true);
    
    try {
      const keywords = analysisData.keywords.slice(0, 3);
      const targetDomain = analysisData.analysis?.target_domain;
      
      if (!targetDomain) {
        toast.error('Domínio alvo não encontrado');
        return;
      }

      toast.info(`Iniciando reverificação de ${keywords.length} palavras-chave...`);
      
      let successCount = 0;
      
      for (const keyword of keywords) {
        try {
          const result = await CompetitorAnalysisService.reverifyKeyword(
            analysisId, 
            keyword.keyword, 
            targetDomain
          );
          
          if (result.success) {
            successCount++;  
          }
        } catch (error) {
          console.error(`Error reverifying "${keyword.keyword}":`, error);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (successCount > 0) {
        toast.success(`Reverificação concluída: ${successCount} palavras-chave atualizadas`);
        refresh();
      }
      
    } catch (error) {
      toast.error('Erro durante a reverificação das posições');
    } finally {
      setReverifyLoading(false);
    }
  }, [analysisData, analysisId, refresh]);
  
  // Keywords filtradas e ordenadas com dependências completamente estáveis
  const filteredAndSortedKeywords = useMemo(() => {
    if (!stableKeywords.length) return [];
    
    let filtered = stableKeywords;

    // Aplicar filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(keyword =>
        keyword.keyword.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar filtro de nível de competição baseado na dificuldade calculada
    if (competitionLevels.length > 0) {
      filtered = filtered.filter(keyword => {
        // Use standard difficulty calculation
        const difficulty = keyword.search_volume && keyword.search_volume > 1000 ? 'high' : 
                          keyword.search_volume && keyword.search_volume > 100 ? 'medium' : 'low';
        return competitionLevels.includes(difficulty);
      });
    }

    // Ordenação
    return [...filtered].sort((a, b) => {
      if (sortByField === 'position') {
        const posA = a.target_domain_position || 999;
        const posB = b.target_domain_position || 999;
        return sortDirection === 'asc' ? posA - posB : posB - posA;
      } else {
        return sortDirection === 'asc' 
            ? a.keyword.localeCompare(b.keyword)
            : b.keyword.localeCompare(a.keyword);
      }
    });
  }, [
    stableKeywords.length, // Use length instead of hash for simplicity
    searchTerm,
    competitionLevels.join(','), // Stringify array to primitive
    sortByField,
    sortDirection
  ]);

  const filteredKeywords = filteredAndSortedKeywords;

  // Handler para reverificar palavra-chave - memoized with stable dependencies
  const targetDomain = useMemo(() => analysisData?.analysis?.target_domain || '', [analysisData?.analysis?.target_domain]);
  
  const handleReverifyKeyword = useCallback(async (keyword: CompetitorKeyword) => {
    setReverifyingKeywords(prev => [...prev, keyword.keyword]);
    
    const result = await CompetitorAnalysisService.reverifyKeyword(
      analysisId, 
      keyword.keyword, 
      targetDomain
    );
    
    if (result.success) {
      toast.success(`Posição atualizada: ${keyword.keyword} - ${result.newPosition ? `${result.newPosition}º` : 'Não encontrada'}`);
      refresh(); // Atualizar os dados da análise
    } else {
      toast.error(`Erro ao reverificar ${keyword.keyword}: ${result.error}`);
    }
    
    setReverifyingKeywords(prev => prev.filter(k => k !== keyword.keyword));
  }, [analysisId, targetDomain, refresh]);

  // Calcular métricas - null-safe
  const getMetrics = useMemo(() => {
    if (!analysisData?.keywords || !Array.isArray(analysisData.keywords) || analysisData.keywords.length === 0) {
      return { firstPageKeywords: 0, opportunities: 0, avgPosition: 'N/A', competitorGaps: 0 };
    }
    
    const keywords = analysisData.keywords;
    const positionsWithValues = keywords.filter(k => k?.target_domain_position && k.target_domain_position > 0);
    
    const firstPageKeywords = keywords.filter(k => k?.target_domain_position && k.target_domain_position <= 10).length;
    const opportunities = keywords.filter(k => !k?.target_domain_position || k.target_domain_position > 10).length;
    const competitorGaps = keywords.filter(k => k?.competitor_positions?.some(c => c?.position <= 10)).length;
    
    // Calculate average only for keywords where domain actually ranks
    let avgPosition = 'N/A';
    if (positionsWithValues.length > 0) {
      const sum = positionsWithValues.reduce((sum, k) => sum + (k.target_domain_position || 0), 0);
      avgPosition = Math.round(sum / positionsWithValues.length).toString();
    }
    
    return {
      firstPageKeywords,
      opportunities,
      avgPosition,
      competitorGaps
    };
  }, [analysisData?.keywords]);

  // Paginação memoizada
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredKeywords.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return { totalPages, startIndex, endIndex };
  }, [filteredKeywords.length, itemsPerPage, currentPage]);

  // Keywords da página atual - memoizado para estabilidade
  const currentPageKeywords = useMemo(() => {
    return filteredKeywords.slice(paginationData.startIndex, paginationData.endIndex);
  }, [filteredKeywords, paginationData.startIndex, paginationData.endIndex]);

  // Determine what to render - NO EARLY RETURNS, only JSX conditionals
  console.log('CompetitiveResultsDisplay render state:', { loading, error, hasData: !!analysisData, status: analysisData?.analysis?.status });

  // Get all domains for the header - null-safe (showing 10 ahead + 10 behind)
  const allDomains = useMemo(() => {
    if (!analysisData?.analysis?.target_domain || !analysisData?.competitors || !analysisData?.keywords) {
      return [];
    }
    
    // Get filtered competitors (10 ahead + 10 behind)
    const filteredCompetitors = getTop10CompetitorsAroundTarget(
      analysisData.competitors, 
      analysisData.keywords, 
      analysisData.analysis.target_domain
    );
    
    // Always include target domain + filtered competitors
    const targetDomain = analysisData.analysis.target_domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
    const competitorDomains = filteredCompetitors.map(c => c.domain);
    
    return [targetDomain, ...competitorDomains];
  }, [analysisData?.analysis?.target_domain, analysisData?.competitors, analysisData?.keywords]);

  // Initialize selected domains when analysis data changes
  useEffect(() => {
    if (allDomains.length > 0 && selectedDomains.length === 0) {
      // Start with target domain + first 2 competitors (max 3 to start)
      const initialSelected = allDomains.slice(0, Math.min(3, allDomains.length));
      setSelectedDomains(initialSelected);
    }
  }, [allDomains, selectedDomains.length]);

  return (
    <KeywordFilterProvider>
      <HookErrorBoundary>
      <TooltipProvider>
        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onBackToForm}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </div>
            <div className="space-y-3">
              <Alert>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  Descobrindo concorrentes automaticamente baseado nas palavras-chave fornecidas...
                </AlertDescription>
              </Alert>
              <EnhancedProgressTracker 
                status="analyzing" 
                currentStage="analysis"
                estimatedTimeRemaining={120}
              />
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onBackToForm}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </div>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Erro ao carregar dados da análise. 
                <Button variant="link" className="p-0 h-auto ml-2" onClick={refresh}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Tentar novamente
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* No Data State */}
        {!loading && !error && !analysisData && (
          <Alert>
            <AlertDescription>Análise não encontrada.</AlertDescription>
          </Alert>
        )}

        {/* Analysis In Progress State */}
        {!loading && !error && analysisData && analysisData.analysis?.status !== 'completed' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onBackToForm}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </div>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                A análise ainda está em progresso. Por favor, aguarde alguns minutos.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Success State - Complete Analysis */}
        {!loading && !error && analysisData && analysisData.analysis?.status === 'completed' && (
          <div className="space-y-6">
            {/* New Header Design */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" onClick={onBackToForm}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleReverifyPositions}
                    disabled={reverifyLoading}
                    className="gap-2"
                  >
                    {reverifyLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        Reverificando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Reverificar Posições
                      </>
                    )}
                  </Button>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Rastreamento dos concorrentes</h1>
                    <p className="text-sm text-muted-foreground">Análise competitiva em tempo real</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <MapPin className="h-4 w-4 mr-2" />
                    Brasil
                  </Button>
                  <Select value={selectedPeriod.toString()} onValueChange={(value) => setSelectedPeriod(Number(value))}>
                    <SelectTrigger className="w-auto">
                      <Calendar className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">Últimos 30 dias</SelectItem>
                      <SelectItem value="60">Últimos 60 dias</SelectItem>
                      <SelectItem value="90">Últimos 90 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Analysis Summary Card - Moved here from CompetitorTable */}
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3 text-sm">Resumo da Análise</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">URL Analisada</p>
                      <p className="font-medium break-all">{analysisData?.analysis?.target_domain?.replace(/^https?:\/\//, '').replace(/^www\./, '') || 'N/A'}</p>
                    </div>
                    <div>
                       <p className="text-muted-foreground">Posição Média</p>
                        <p className="font-medium">
                          {(() => {
                            // Use filtered keywords based on selected keyword
                            const keywords = selectedKeyword 
                              ? stableKeywords.filter(k => k.id === selectedKeyword.id)
                              : stableKeywords;
                            const positionsWithValues = keywords.filter(k => k.target_domain_position && k.target_domain_position > 0);
                            
                            console.log('Average Position Debug:', {
                              selectedKeyword: selectedKeyword?.keyword,
                              totalKeywords: keywords.length,
                              keywordsWithPositions: positionsWithValues.length,
                              positions: positionsWithValues.map(k => ({keyword: k.keyword, position: k.target_domain_position}))
                            });
                            
                             if (positionsWithValues.length === 0) {
                               return (
                                 <div className="space-y-2">
                                   <span className="text-destructive flex items-center gap-1">
                                     Não rankeando
                                     <Tooltip>
                                       <TooltipTrigger>
                                         <Info className="h-3 w-3 text-muted-foreground" />
                                       </TooltipTrigger>
                                       <TooltipContent>
                                         <p>Domínio não foi encontrado nas primeiras 100 posições para {selectedKeyword ? `a palavra-chave "${selectedKeyword.keyword}"` : 'as palavras-chave analisadas'}</p>
                                       </TooltipContent>
                                     </Tooltip>
                                   </span>
                                   {/* Show manual position correction for keywords without position */}
                                   {keywords.filter(k => !k.target_domain_position).slice(0, 1).map(keyword => (
                                     <ManualPositionCorrection
                                       key={keyword.id}
                                       analysisId={analysisId}
                                       keyword={keyword.keyword}
                                       targetDomain={analysisData?.analysis?.target_domain || ''}
                                       currentPosition={keyword.target_domain_position}
                                       onPositionUpdated={(newPosition) => {
                                         // Trigger a refresh of the analysis data
                                         refresh();
                                       }}
                                     />
                                   ))}
                                 </div>
                               );
                             }
                            
                            const sum = positionsWithValues.reduce((sum, k) => sum + (k.target_domain_position || 0), 0);
                            const avg = Math.round(sum / positionsWithValues.length);
                            
                            console.log('Average Position Calculation:', {sum, count: positionsWithValues.length, avg});
                            
                            return (
                              <span className="flex items-center gap-1">
                                {avg}º
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-3 w-3 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Baseado em {positionsWithValues.length} palavra{positionsWithValues.length > 1 ? 's' : ''}-chave onde o domínio rankeia {selectedKeyword ? `para "${selectedKeyword.keyword}"` : ''}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </span>
                            );
                          })()}
                        </p>
                     </div>
                     <div>
                       <p className="text-muted-foreground">Palavra-chave Analisada</p>
                       <p className="font-medium">{selectedKeyword ? selectedKeyword.keyword : stableKeywords.length > 0 ? stableKeywords[0]?.keyword : 'N/A'}</p>
                     </div>
                    <div>
                      <p className="text-muted-foreground">Concorrentes Encontrados</p>
                      <p className="font-medium">{analysisData?.competitors?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
            {/* Keyword Filter Section */}
            <KeywordSelector keywords={analysisData?.keywords || []} />

            {/* Domain Selection Panel */}
            {allDomains.length > 0 && (
              <GraphSelectionPanel
                domains={allDomains}
                selectedDomains={selectedDomains}
                onSelectionChange={setSelectedDomains}
                targetDomain={analysisData?.analysis?.target_domain || ''}
                maxSelection={10}
                competitors={analysisData?.competitors || []}
              />
            )}
            </div>

            {/* Unified Competitor Analysis Block */}
            <div className="space-y-6">
              {/* Position Variation Chart - filtered by selected keyword */}
              <PositionVariationChart
                competitors={analysisData?.competitors || []}
                keywords={analysisData?.keywords || []}
                selectedDomains={selectedDomains}
                targetDomain={analysisData?.analysis?.target_domain || ''}
                period={selectedPeriod}
              />

              {/* Competitor Table */}
              <CompetitorTable 
                competitors={analysisData?.competitors || []}
                keywords={analysisData?.keywords || []}
                targetDomain={analysisData?.analysis?.target_domain || ''}
              />
            </div>

            {/* Share of Voice Block - 100% width */}
            <div className="w-full">
              <ErrorBoundary>
                <CompetitiveVisualization analysisData={analysisData} />
              </ErrorBoundary>
            </div>

            {/* Strategic Opportunities Block */}
            <div className="w-full">
              <ErrorBoundary>
                <StrategicOpportunities 
                  keywords={analysisData?.keywords || []}
                  targetDomain={analysisData?.analysis?.target_domain || ''}
                />
              </ErrorBoundary>
            </div>

            {/* Modal de Detalhes */}
            {selectedKeyword && (
              <KeywordDetailModal
                keyword={selectedKeyword}
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                targetDomain={analysisData?.analysis?.target_domain || ''}
              />
            )}
          </div>
        )}
       </TooltipProvider>
      </HookErrorBoundary>
    </KeywordFilterProvider>
  );
});

export default CompetitiveResultsDisplay;