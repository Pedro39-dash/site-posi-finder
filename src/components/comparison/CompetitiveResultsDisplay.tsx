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
  Users, Trophy, Settings, AlertTriangle, RefreshCw, Play, BarChart3, 
  ChevronLeft, ChevronRight 
} from 'lucide-react';
import { toast } from 'sonner';
import { CompetitorAnalysisService, CompetitiveAnalysisData, CompetitorKeyword } from '@/services/competitorAnalysisService';
import KeywordDetailModal from './KeywordDetailModal';
import { useIsMobile } from '@/hooks/use-mobile';
import EnhancedProgressTracker from './EnhancedProgressTracker';
import CompetitiveVisualization from './CompetitiveVisualization';
import PositionTrendChart from './PositionTrendChart';
import GuidedTour from './GuidedTour';
import ProductivityFeatures from './ProductivityFeatures';
import IntelligentNotifications from './IntelligentNotifications';
import ExportReports from './ExportReports';
import AdvancedFilters from './AdvancedFilters';
import MobileOptimizations from './MobileOptimizations';
import { useSupabaseCache } from '@/hooks/useSupabaseCache';
import { useOptimizedFilters } from './OptimizedFilterReducer';
import { ErrorBoundary } from './ErrorBoundary';
import { KeywordRow, PositionBadge, DifficultyBadge } from './OptimizedComponents';

interface CompetitiveResultsDisplayProps {
  analysisId: string;
  onBackToForm: () => void;
}

const CompetitiveResultsDisplay: React.FC<CompetitiveResultsDisplayProps> = memo(({ analysisId, onBackToForm }) => {
  const [selectedKeyword, setSelectedKeyword] = useState<CompetitorKeyword | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [reverifyingKeywords, setReverifyingKeywords] = useState<string[]>([]);
  const [showTour, setShowTour] = useState(false);
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

  // Verificar se deve mostrar o tour
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('competitive-analysis-tour');
    if (!hasSeenTour && analysisData) {
      setShowTour(true);
    }
  }, [analysisData]);

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

  // Keywords estáveis para evitar re-renders
  const stableKeywords = useMemo(() => {
    return analysisData?.keywords || [];
  }, [analysisData?.keywords]);

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
  }, [stableKeywords, searchTerm, competitionLevels, sortByField, sortDirection]);

  const filteredKeywords = filteredAndSortedKeywords;

  // Handler para reverificar palavra-chave - memoized with stable dependencies
  const targetDomain = useMemo(() => analysisData?.analysis.target_domain || '', [analysisData?.analysis.target_domain]);
  
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

  // Estados de loading, erro e dados vazios
  if (loading) {
    return (
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
    );
  }

  if (error) {
    return (
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
    );
  }

  if (!analysisData) {
    return (
      <Alert>
        <AlertDescription>Análise não encontrada.</AlertDescription>
      </Alert>
    );
  }

  // Verificar se a análise ainda está em progresso
  if (analysisData.analysis.status !== 'completed') {
    return (
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
    );
  }

  // Calcular métricas
  const getMetrics = useMemo(() => {
    const keywords = analysisData.keywords;
    const firstPageKeywords = keywords.filter(k => k.target_domain_position && k.target_domain_position <= 10).length;
    const opportunities = keywords.filter(k => !k.target_domain_position || k.target_domain_position > 10).length;
    const avgPosition = keywords.reduce((sum, k) => sum + (k.target_domain_position || 100), 0) / keywords.length;
    const competitorGaps = keywords.filter(k => k.competitor_positions?.some(c => c.position <= 10)).length;
    
    return {
      firstPageKeywords,
      opportunities,
      avgPosition: avgPosition.toFixed(1),
      competitorGaps
    };
  }, [analysisData.keywords]);

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

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onBackToForm}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold">Análise Competitiva</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowTour(true)}
            >
              <Play className="h-4 w-4 mr-2" />
              Tour
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Métricas Executivas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Target className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">1ª Página</p>
                  <p className="text-2xl font-bold">{getMetrics.firstPageKeywords}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Oportunidades</p>
                  <p className="text-2xl font-bold">{getMetrics.opportunities}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Posição Média</p>
                  <p className="text-2xl font-bold">{getMetrics.avgPosition}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foregreen">Concorrentes</p>
                  <p className="text-2xl font-bold">{analysisData.competitors.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visualizações */}
        <ErrorBoundary>
          <CompetitiveVisualization analysisData={analysisData} />
        </ErrorBoundary>

        {/* Filtros e Tabela */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Keywords Analisadas</CardTitle>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Buscar keyword..."
                  value={filters.search}
                  onChange={(e) => filterActions.setSearch(e.target.value)}
                  className="w-64"
                />
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => filterActions.setSort(value as any, filters.sortOrder)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keyword">Keyword</SelectItem>
                    <SelectItem value="position">Posição</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Posição</TableHead>
                    <TableHead>Dificuldade</TableHead>
                    <TableHead>Potencial</TableHead>
                    <TableHead>Concorrentes</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentPageKeywords.map((keyword) => (
                    <KeywordRow
                      key={keyword.id}
                      keyword={keyword}
                      reverifyingKeywords={reverifyingKeywords}
                      onViewDetails={(k) => {
                        setSelectedKeyword(k);
                        setIsDetailModalOpen(true);
                      }}
                      onReverify={handleReverifyKeyword}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Paginação */}
            {paginationData.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {paginationData.startIndex + 1} a {Math.min(paginationData.endIndex, filteredKeywords.length)} de {filteredKeywords.length} keywords
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Página {currentPage} de {paginationData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(paginationData.totalPages, prev + 1))}
                    disabled={currentPage === paginationData.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Detalhes */}
        {selectedKeyword && (
          <KeywordDetailModal
            keyword={selectedKeyword}
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            targetDomain={analysisData.analysis.target_domain}
          />
        )}

        {/* Tour Guiado */}
        <GuidedTour
          isOpen={showTour}
          onClose={() => setShowTour(false)}
          onComplete={() => {
            localStorage.setItem('competitive-analysis-tour', 'completed');
            toast.success("Tour concluído! Explore todas as funcionalidades.");
          }}
        />
      </div>
    </TooltipProvider>
  );
});

export default CompetitiveResultsDisplay;