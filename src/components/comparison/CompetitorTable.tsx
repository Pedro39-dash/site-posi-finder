import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Download, ExternalLink, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { CompetitorDomain, CompetitorKeyword } from '@/services/competitorAnalysisService';
import { generateBacklinkEstimate, calculateTrafficEstimate, formatDomainDisplay } from '@/utils/domainEstimation';
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
    if (!selectedKeyword) return keywords;
    return keywords.filter(k => k.id === selectedKeyword.id);
  }, [keywords, selectedKeyword]);

  // Filter to show only top 10 competitors ahead of target domain for the selected keyword
  const filteredCompetitors = useMemo(() => {
    return getTop10CompetitorsAhead(competitors, filteredKeywords, targetDomain);
  }, [competitors, filteredKeywords, targetDomain]);

  // Calculate metrics for filtered competitors - memoized for stability
  const competitorMetrics = useMemo(() => {
    return filteredCompetitors.map(filtered => {
      const cleanDomain = filtered.domain;
      
      // Find keywords where this competitor appears (filtered by selected keyword)
      const competitorKeywords = filteredKeywords.filter(keyword => 
        keyword.competitor_positions?.some(pos => 
          pos.domain?.replace(/^https?:\/\//, '').replace(/^www\./, '') === cleanDomain
        )
      );
      
      // Count common keywords (where keyword is being analyzed for both target and competitor)
      const commonKeywords = competitorKeywords.length; // All keywords where competitor appears are being analyzed
      
      // Count different keywords (where only competitor ranks, target doesn't)
      const differentKeywords = competitorKeywords.filter(keyword => 
        !keyword.target_domain_position || keyword.target_domain_position === null
      ).length;
      
      // Calculate stable traffic estimate
      const estimatedTraffic = Math.round(calculateTrafficEstimate(competitorKeywords, cleanDomain, false));
      
      return {
        domain: cleanDomain,
        originalDomain: filtered.originalDomain,
        commonKeywords,
        differentKeywords,
        estimatedTraffic,
        averagePosition: filtered.averagePosition,
        detectedAutomatically: filtered.detectedAutomatically
      };
    });
  }, [filteredCompetitors, filteredKeywords]);

  // Add target domain to the table - memoized for stability
  const targetMetrics = useMemo(() => {
    const cleanTargetDomain = targetDomain.replace(/^https?:\/\//, '').replace(/^www\./, '');
    
    return {
      domain: cleanTargetDomain,
      originalDomain: targetDomain,
      commonKeywords: filteredKeywords.length, // Only selected keyword
      differentKeywords: 0, // Target domain doesn't have "different" keywords from itself
      estimatedTraffic: Math.round(calculateTrafficEstimate(filteredKeywords, cleanTargetDomain, true)),
      estimatedBacklinks: generateBacklinkEstimate(cleanTargetDomain, true),
      detectedAutomatically: false // Target domain is never detected automatically
    };
  }, [targetDomain, filteredKeywords]);

  // Calculate average position for summary (for selected keyword only)
  const averagePosition = useMemo(() => {
    const positionsWithValues = filteredKeywords.filter(k => k.target_domain_position && k.target_domain_position > 0);
    if (positionsWithValues.length === 0) return 0;
    return Math.round(positionsWithValues.reduce((sum, k) => sum + (k.target_domain_position || 0), 0) / positionsWithValues.length);
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
              <CardTitle>Top 10 Concorrentes à Frente</CardTitle>
              <Badge variant="outline" className="text-xs">
                {allMetrics.length} encontrados
              </Badge>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-xs">
                    <p className="font-medium mb-1">Filtro por Palavra-chave</p>
                    <p className="text-xs">
                      Mostrando concorrentes posicionados à frente do seu domínio para a palavra-chave selecionada.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Concorrente
              </Button>
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
                <TableHead className="text-center">Palavras-chave Comuns</TableHead>
                <TableHead className="text-center">Diferentes</TableHead>
                <TableHead className="text-center">Tráfego Est.</TableHead>
                <TableHead className="text-center">Posição Média</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginationData.currentPageItems.length > 0 ? (
                paginationData.currentPageItems.map((metrics, pageIndex) => {
                  const globalIndex = paginationData.startIndex + pageIndex;
                  return (
                    <TableRow key={metrics.domain}>
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
                                {formatDomainDisplay(metrics.domain).isPage && (
                                  <p className="text-orange-500 mt-1">
                                    ⚠️ Página específica analisada
                                  </p>
                                )}
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
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono">
                          {metrics.commonKeywords}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono">
                          {metrics.differentKeywords}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-mono text-sm">
                          {metrics.estimatedTraffic.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-mono text-sm">
                          {metrics.averagePosition ? `${metrics.averagePosition}º` : 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum concorrente encontrado à frente para esta palavra-chave.
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