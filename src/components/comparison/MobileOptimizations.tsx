import { useState, useEffect, useMemo } from "react";
import { ChevronDown, ChevronUp, Filter, Search, SortAsc, Eye, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CompetitorKeyword } from "@/services/competitorAnalysisService";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileOptimizationsProps {
  keywords: CompetitorKeyword[];
  onKeywordSelect: (keyword: CompetitorKeyword) => void;
  onExport?: () => void;
}

type SortField = 'keyword' | 'targetPosition' | 'difficulty' | 'potential';
type SortOrder = 'asc' | 'desc';

const MobileOptimizations = ({ keywords, onKeywordSelect, onExport }: MobileOptimizationsProps) => {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>('keyword');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = isMobile ? 5 : 10;

  // Filter and sort keywords
  const filteredAndSortedKeywords = useMemo(() => {
    let filtered = keywords.filter(keyword => {
      const matchesSearch = keyword.keyword.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || 
        (selectedCategory === 'opportunities' && (keyword.target_domain_position || 100) > 10 && (keyword.target_domain_position || 100) <= 20) ||
        (selectedCategory === 'winning' && (keyword.target_domain_position || 100) <= 10) ||
        (selectedCategory === 'losing' && (keyword.target_domain_position || 100) > 20);
      
      return matchesSearch && matchesCategory;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'keyword') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [keywords, searchQuery, sortField, sortOrder, selectedCategory]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedKeywords.length / itemsPerPage);
  const paginatedKeywords = filteredAndSortedKeywords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortField, sortOrder, selectedCategory]);

  const toggleCardExpansion = (keywordId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(keywordId)) {
      newExpanded.delete(keywordId);
    } else {
      newExpanded.add(keywordId);
    }
    setExpandedCards(newExpanded);
  };

  const getPositionColor = (position: number) => {
    if (position <= 10) return 'text-green-600 bg-green-50 border-green-200';
    if (position <= 20) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getBadgeVariant = (position: number) => {
    if (position <= 10) return 'default';
    if (position <= 20) return 'secondary';
    return 'destructive';
  };

  // Mobile-optimized filters component
  const MobileFilters = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>Filtros e Ordenação</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-full mt-6">
          <div className="space-y-6 pb-6">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar palavras-chave..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="winning">Vencendo (1-10)</SelectItem>
                  <SelectItem value="opportunities">Oportunidades (11-20)</SelectItem>
                  <SelectItem value="losing">Trabalho Necessário (21+)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="space-y-4">
              <label className="text-sm font-medium">Ordenação</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Campo</label>
                  <Select value={sortField} onValueChange={(value: SortField) => setSortField(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keyword">Palavra-chave</SelectItem>
                      <SelectItem value="targetPosition">Posição</SelectItem>
                      <SelectItem value="difficulty">Dificuldade</SelectItem>
                      <SelectItem value="potential">Potencial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Ordem</label>
                  <Select value={sortOrder} onValueChange={(value: SortOrder) => setSortOrder(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Crescente</SelectItem>
                      <SelectItem value="desc">Decrescente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );

  // Mobile-optimized keyword card
  const KeywordCard = ({ keyword }: { keyword: CompetitorKeyword }) => {
    const isExpanded = expandedCards.has(keyword.keyword);
    
    return (
      <Card className={`cursor-pointer transition-all duration-200 ${isExpanded ? 'ring-2 ring-primary/20' : ''}`}>
        <Collapsible 
          open={isExpanded} 
          onOpenChange={() => toggleCardExpansion(keyword.keyword)}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate mb-1">
                    {keyword.keyword}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={getBadgeVariant(keyword.target_domain_position || 100)}
                      className="text-xs"
                    >
                      #{keyword.target_domain_position || '100+'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {keyword.search_volume && keyword.search_volume > 1000 ? 'Alta' : 
                       keyword.search_volume && keyword.search_volume > 100 ? 'Média' : 'Baixa'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onKeywordSelect(keyword);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Competitors */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Concorrentes</h4>
                  <div className="space-y-2">
                    {keyword.competitor_positions.slice(0, 3).map((competitor) => (
                      <div key={competitor.domain} className="flex items-center justify-between text-sm">
                        <span className="truncate flex-1">{competitor.domain}</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getPositionColor(competitor.position || 100)}`}
                        >
                          #{competitor.position || '100+'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onKeywordSelect(keyword)}
                    className="flex-1"
                  >
                    Ver Detalhes
                  </Button>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Mobile Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">
            Análise de Keywords
          </h3>
          <p className="text-sm text-muted-foreground">
            {filteredAndSortedKeywords.length} de {keywords.length} palavras-chave
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <MobileFilters />
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="space-y-3">
        {paginatedKeywords.map((keyword) => (
          <KeywordCard key={keyword.keyword} keyword={keyword} />
        ))}
      </div>

      {/* Mobile Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Anterior
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Próxima
          </Button>
        </div>
      )}

      {filteredAndSortedKeywords.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
          <h3 className="text-lg font-medium mb-2">Nenhuma palavra-chave encontrada</h3>
          <p className="text-muted-foreground">
            Tente ajustar os filtros ou termos de busca
          </p>
        </div>
      )}
    </div>
  );
};

export default MobileOptimizations;