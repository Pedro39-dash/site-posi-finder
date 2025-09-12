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
  ChevronLeft, ChevronRight, MapPin, Calendar
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
import { KeywordRow, PositionBadge, DifficultyBadge } from './OptimizedComponents';
// Removed useDeepMemo import to avoid hook instability

interface CompetitiveResultsDisplayProps {
  analysisId: string;
  onBackToForm: () => void;
}

const CompetitiveResultsDisplay: React.FC<CompetitiveResultsDisplayProps> = memo(({ analysisId, onBackToForm }) => {
  // ALL hooks must be called first - no early returns before this point
  // State for domain selection in chart
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  
  const [selectedKeyword, setSelectedKeyword] = useState<CompetitorKeyword | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [reverifyingKeywords, setReverifyingKeywords] = useState<string[]>([]);
  
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

  // Keywords estáveis para evitar re-renders - usando apenas valores primitivos
  const keywords = analysisData?.keywords || [];
  const keywordsLength = keywords.length;
  const keywordsHash = useMemo(() => {
    return keywords.map(k => `${k.id}-${k.keyword}-${k.target_domain_position}`).join('|');
  }, [keywords]);
  
  const stableKeywords = useMemo(() => {
    return keywords.map(keyword => ({
      ...keyword,
      search_volume: keyword.search_volume || 0,
      target_domain_position: keyword.target_domain_position || null,
      competitor_positions: keyword.competitor_positions || []
    }));
  }, [keywordsHash]);

  // Destructure filters for stable dependencies - use primitives only
  const searchTerm = filters.search;
  const competitionLevels = filters.competitionLevel;
  const sortByField = filters.sortBy;
  const sortDirection = filters.sortOrder;
  
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
    keywordsHash, // Use hash instead of stableKeywords array
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
      return { firstPageKeywords: 0, opportunities: 0, avgPosition: '0.0', competitorGaps: 0 };
    }
    
    const keywords = analysisData.keywords;
    const firstPageKeywords = keywords.filter(k => k?.target_domain_position && k.target_domain_position <= 10).length;
    const opportunities = keywords.filter(k => !k?.target_domain_position || k.target_domain_position > 10).length;
    const avgPosition = keywords.reduce((sum, k) => sum + (k?.target_domain_position || 100), 0) / keywords.length;
    const competitorGaps = keywords.filter(k => k?.competitor_positions?.some(c => c?.position <= 10)).length;
    
    return {
      firstPageKeywords,
      opportunities,
      avgPosition: avgPosition.toFixed(1),
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

  // Get all domains for the header - null-safe
  const allDomains = useMemo(() => {
    if (!analysisData?.analysis?.target_domain || !analysisData?.competitors) {
      return [];
    }
    
    const domains = [analysisData.analysis.target_domain];
    analysisData.competitors.forEach(comp => {
      if (comp?.domain && !domains.includes(comp.domain)) {
        domains.push(comp.domain);
      }
    });
    return domains;
  }, [analysisData?.analysis?.target_domain, analysisData?.competitors]);

  // Initialize selected domains when analysis data changes
  useEffect(() => {
    if (allDomains.length > 0 && selectedDomains.length === 0) {
      // Start with target domain + first 2 competitors (max 3 to start)
      const initialSelected = allDomains.slice(0, Math.min(3, allDomains.length));
      setSelectedDomains(initialSelected);
    }
  }, [allDomains, selectedDomains.length]);

  return (
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
            <EnhancedProgressTracker 
              status="analyzing" 
              currentStage="analysis"
              estimatedTimeRemaining={120}
            />
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
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    Últimos 30 dias
                  </Button>
                </div>
              </div>
              
              {/* Domain Selection Panel */}
              {allDomains.length > 0 && (
                <GraphSelectionPanel
                  domains={allDomains}
                  selectedDomains={selectedDomains}
                  onSelectionChange={setSelectedDomains}
                  targetDomain={analysisData?.analysis?.target_domain || ''}
                  maxSelection={10}
                />
              )}
            </div>

            {/* Unified Competitor Analysis Block */}
            <div className="space-y-6">
              {/* Competitor Table */}
              <CompetitorTable 
                competitors={analysisData?.competitors || []}
                keywords={analysisData?.keywords || []}
                targetDomain={analysisData?.analysis?.target_domain || ''}
              />

              {/* Position Variation Chart */}
              <PositionVariationChart 
                domains={allDomains}
                selectedDomains={selectedDomains}
                targetDomain={analysisData?.analysis?.target_domain || ''}
              />
            </div>

            {/* Two Column Layout for Visualizations */}
            <div className="grid gap-6 lg:grid-cols-2">
              <ErrorBoundary>
                <CompetitiveVisualization analysisData={analysisData} />
              </ErrorBoundary>
              
              <div className="space-y-6">
                <StrategicOpportunities 
                  keywords={analysisData?.keywords || []}
                  targetDomain={analysisData?.analysis?.target_domain || ''}
                />
              </div>
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
  );
});

export default CompetitiveResultsDisplay;