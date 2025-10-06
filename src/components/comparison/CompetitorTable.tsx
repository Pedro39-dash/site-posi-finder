import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Download, ExternalLink, ChevronLeft, ChevronRight, Info, AlertCircle } from 'lucide-react';
import { CompetitorDomain, CompetitorKeyword } from '@/services/competitorAnalysisService';
import { formatDomainDisplay } from '@/utils/domainEstimation';
import { getTop10CompetitorsAhead, getDomainColor } from '@/utils/competitorFiltering';
import { useKeywordFilter } from '@/contexts/KeywordFilterContext';

interface CompetitorTableProps {
  competitors: CompetitorDomain[];
  keywords: CompetitorKeyword[];
  targetDomain: string;
}

const CompetitorTable: React.FC<CompetitorTableProps> = ({ 
  competitors, 
  keywords, 
  targetDomain 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const { selectedKeyword } = useKeywordFilter();

  // Filter keywords to only the selected one
  const filteredKeywords = useMemo(() => {
    // If no keyword is selected, use all keywords
    if (!selectedKeyword) return keywords;
    return keywords.filter(k => k.id === selectedKeyword.id);
  }, [keywords, selectedKeyword]);

  console.log('CompetitorTable Debug:', {
    selectedKeyword: selectedKeyword?.keyword || 'none',
    totalKeywords: keywords.length,
    filteredKeywords: filteredKeywords.length,
    targetDomain
  });

  // Filter to show competitors around target domain position (excluding target position)
  const filteredCompetitors = useMemo(() => {
    return getTop10CompetitorsAhead(competitors, filteredKeywords, targetDomain);
  }, [competitors, filteredKeywords, targetDomain]);

  // Calculate metrics for filtered competitors - memoized for stability
  const competitorMetrics = useMemo(() => {
    // We only work with the selected keyword (filteredKeywords should be 1 keyword)
    if (filteredKeywords.length === 0) return [];
    
    const keywordData = filteredKeywords[0]; // Always 1 keyword when filtered
    const targetPosition = keywordData.target_domain_position || null;
    
    return filteredCompetitors.map(filtered => {
      const cleanDomain = filtered.domain;
      
      // Find competitor's data for this keyword
      const competitorData = keywordData.competitor_positions?.find(
        pos => pos.domain?.replace(/^https?:\/\//, '').replace(/^www\./, '') === cleanDomain
      );
      
      const competitorPosition = competitorData?.position || null;
      
      // Calculate position difference (negative = competitor ahead, positive = we're ahead)
      const positionDifference = competitorPosition && targetPosition 
        ? competitorPosition - targetPosition 
        : null;
      
      // Determine status
      let status: 'ahead' | 'behind' | 'equal' | 'no-rank' = 'no-rank';
      if (positionDifference !== null) {
        if (positionDifference < 0) status = 'ahead'; // Competitor is ahead (lower position)
        else if (positionDifference > 0) status = 'behind'; // We're ahead
        else status = 'equal';
      }
      
      return {
        domain: cleanDomain,
        originalDomain: filtered.originalDomain,
        position: competitorPosition,
        positionDifference,
        rankedUrl: competitorData?.url || '',
        rankedTitle: competitorData?.title || competitorData?.url || '',
        status,
        detectedAutomatically: filtered.detectedAutomatically
      };
    });
  }, [filteredCompetitors, filteredKeywords]);

  // Get target domain position for display
  const targetPosition = useMemo(() => {
    if (filteredKeywords.length === 0) return null;
    return filteredKeywords[0].target_domain_position || null;
  }, [filteredKeywords]);

  const allMetrics = competitorMetrics; // Only show competitors, not target domain

  // Pagination logic
  const paginationData = useMemo(() => {
    const totalItems = allMetrics.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return { 
      totalPages, 
      totalItems,
      startIndex, 
      endIndex,
      currentPageItems: allMetrics.slice(startIndex, endIndex)
    };
  }, [allMetrics, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= paginationData.totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Análise de Concorrentes</CardTitle>
              <Badge variant="outline" className="text-xs">
                {allMetrics.length} concorrentes
              </Badge>
              {targetPosition && (
                <Badge variant="default" className="text-xs">
                  Sua posição: {targetPosition}º
                </Badge>
              )}
              {!selectedKeyword && (
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">Selecione uma palavra-chave para ver a análise detalhada de concorrentes</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domínio</TableHead>
                <TableHead className="text-center">Posição</TableHead>
                <TableHead className="text-center">
                  <Tooltip>
                    <TooltipTrigger className="flex items-center justify-center gap-1 cursor-help">
                      Diferença
                      <Info className="h-3 w-3" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Diferença de posições em relação ao seu domínio</p>
                      <p className="text-xs text-muted-foreground mt-1">Negativo = concorrente à frente</p>
                    </TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead>Página Ranqueada</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginationData.currentPageItems.length > 0 ? (
                paginationData.currentPageItems.map((metrics, pageIndex) => {
                  const globalIndex = paginationData.startIndex + pageIndex;
                  
                  // Badge variants based on status
                  const getStatusBadge = () => {
                    switch (metrics.status) {
                      case 'ahead':
                        return { variant: 'destructive' as const, text: '🔴 À Frente' };
                      case 'behind':
                        return { variant: 'default' as const, text: '🟢 Atrás' };
                      case 'equal':
                        return { variant: 'secondary' as const, text: '⚪ Igual' };
                      default:
                        return { variant: 'outline' as const, text: 'N/A' };
                    }
                  };
                  
                  const statusBadge = getStatusBadge();
                  
                  return (
                    <TableRow key={metrics.domain}>
                      {/* Domínio */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getDomainColor(globalIndex) }}
                          />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="font-medium cursor-help hover:text-primary">
                                {formatDomainDisplay(metrics.domain).display}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs">
                                <p className="font-medium">URL Analisada:</p>
                                <p className="text-muted-foreground break-all">
                                  {formatDomainDisplay(metrics.originalDomain || metrics.domain).fullUrl}
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                          {!metrics.detectedAutomatically && (
                            <Badge variant="outline" className="ml-2 text-xs border-primary text-primary whitespace-nowrap">
                              Concorrente Mencionado
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      
                      {/* Posição Exata */}
                      <TableCell className="text-center">
                        {metrics.position ? (
                          <Badge 
                            variant={metrics.position <= 3 ? 'default' : 'outline'}
                            className="font-mono"
                          >
                            {metrics.position}º
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">N/A</span>
                        )}
                      </TableCell>
                      
                      {/* Diferença de Posição */}
                      <TableCell className="text-center">
                        {metrics.positionDifference !== null ? (
                          <Badge 
                            variant={
                              metrics.positionDifference < 0 
                                ? 'destructive' 
                                : metrics.positionDifference > 0 
                                  ? 'default' 
                                  : 'secondary'
                            }
                            className="font-mono"
                          >
                            {metrics.positionDifference > 0 ? '+' : ''}{metrics.positionDifference}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      
                      {/* Página Ranqueada */}
                      <TableCell>
                        {metrics.rankedUrl ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 text-sm cursor-help hover:text-primary">
                                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate max-w-[250px]">
                                  {metrics.rankedTitle}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-md">
                              <p className="text-xs font-medium mb-1">{metrics.rankedTitle}</p>
                              <p className="text-xs text-muted-foreground break-all">{metrics.rankedUrl}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-muted-foreground text-sm">URL não disponível</span>
                        )}
                      </TableCell>
                      
                      {/* Status Badge */}
                      <TableCell className="text-center">
                        <Badge variant={statusBadge.variant}>
                          {statusBadge.text}
                        </Badge>
                      </TableCell>
                      
                      {/* Ações */}
                      <TableCell className="text-center">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          disabled={!metrics.rankedUrl}
                          onClick={() => metrics.rankedUrl && window.open(metrics.rankedUrl, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {selectedKeyword 
                      ? `Nenhum concorrente encontrado para "${selectedKeyword.keyword}".`
                      : 'Selecione uma palavra-chave para ver a análise de concorrentes.'
                    }
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {paginationData.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {paginationData.startIndex + 1} a {Math.min(paginationData.endIndex, paginationData.totalItems)} de {paginationData.totalItems} domínios
            </div>
            
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="gap-1 pl-2.5"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                </PaginationItem>
                
                {Array.from({ length: paginationData.totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={page === currentPage}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= paginationData.totalPages}
                    className="gap-1 pr-2.5"
                  >
                    Próximo
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
    </TooltipProvider>
  );
};

export default CompetitorTable;