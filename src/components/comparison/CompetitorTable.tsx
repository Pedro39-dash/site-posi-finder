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

  // Calculate metrics for each competitor - memoized for stability
  const competitorMetrics = useMemo(() => {
    return competitors.map(competitor => {
      const cleanDomain = competitor.domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
      
      // Find keywords where this competitor appears
      const competitorKeywords = keywords.filter(keyword => 
        keyword.competitor_positions?.some(pos => 
          pos.domain?.replace(/^https?:\/\//, '').replace(/^www\./, '') === cleanDomain
        )
      );
      
      // Count common keywords (where both target and competitor appear)
      const commonKeywords = competitorKeywords.filter(keyword => 
        keyword.target_domain_position && keyword.target_domain_position > 0
      ).length;
      
      // Count different keywords (where only competitor appears)
      const differentKeywords = competitorKeywords.filter(keyword => 
        !keyword.target_domain_position || keyword.target_domain_position === 0
      ).length;
      
      // Calculate stable traffic estimate
      const estimatedTraffic = Math.round(calculateTrafficEstimate(competitorKeywords, cleanDomain, false));
      
      // Calculate average position for this competitor
      const competitorPositions = keywords
        .map(keyword => {
          const position = keyword.competitor_positions?.find(pos => 
            pos.domain?.replace(/^https?:\/\//, '').replace(/^www\./, '') === cleanDomain
          );
          return position?.position;
        })
        .filter((pos): pos is number => pos !== undefined && pos > 0);
      
      const averagePosition = competitorPositions.length > 0 
        ? Math.round(competitorPositions.reduce((sum, pos) => sum + pos, 0) / competitorPositions.length)
        : null;
      
      return {
        domain: cleanDomain,
        originalDomain: competitor.domain,
        commonKeywords,
        differentKeywords,
        estimatedTraffic,
        averagePosition,
        detectedAutomatically: competitor.detected_automatically
      };
    });
  }, [competitors, keywords]);

  // Add target domain to the table - memoized for stability
  const targetMetrics = useMemo(() => {
    const cleanTargetDomain = targetDomain.replace(/^https?:\/\//, '').replace(/^www\./, '');
    
    return {
      domain: cleanTargetDomain,
      originalDomain: targetDomain,
      commonKeywords: keywords.filter(k => k.target_domain_position && k.target_domain_position > 0).length,
      differentKeywords: 0, // Target domain doesn't have "different" keywords from itself
      estimatedTraffic: Math.round(calculateTrafficEstimate(keywords, cleanTargetDomain, true)),
      estimatedBacklinks: generateBacklinkEstimate(cleanTargetDomain, true),
      detectedAutomatically: false // Target domain is never detected automatically
    };
  }, [targetDomain, keywords]);

  // Calculate average position for summary
  const averagePosition = useMemo(() => {
    const positionsWithValues = keywords.filter(k => k.target_domain_position && k.target_domain_position > 0);
    if (positionsWithValues.length === 0) return 0;
    return Math.round(positionsWithValues.reduce((sum, k) => sum + (k.target_domain_position || 0), 0) / positionsWithValues.length);
  }, [keywords]);

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
              <CardTitle>Concorrentes Rastreados</CardTitle>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-xs">
                    <p className="font-medium mb-1">Análise por URL Específica</p>
                    <p className="text-xs">
                      Esta análise compara URLs específicas, não sites inteiros. 
                      Os dados mostram métricas estimadas baseadas nas páginas encontradas durante a pesquisa.
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
              {paginationData.currentPageItems.map((metrics, pageIndex) => {
                const globalIndex = paginationData.startIndex + pageIndex;
                return (
                  <TableRow key={metrics.domain}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'][globalIndex] || '#d084d0' }}
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
              })}
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