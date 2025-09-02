import React, { useState, useMemo } from "react";
import { Eye, ArrowUpDown, Filter, Search, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPositionCategory, calculateKeywordDifficulty } from "@/utils/seoScoring";

export interface ComparisonResultEnhanced {
  keyword: string;
  results: {
    website: string;
    position: number | null;
    isWinner: boolean;
    isClient: boolean;
  }[];
}

interface CompetitiveDetailedTableProps {
  results: ComparisonResultEnhanced[];
  websites: string[];
  onKeywordDetails: (keyword: string) => void;
}

type SortField = 'keyword' | 'myPosition' | 'competitorPosition' | 'difficulty' | 'potential';
type SortOrder = 'asc' | 'desc';
type FilterType = 'all' | 'winning' | 'losing' | 'opportunities';

const CompetitiveDetailedTable = ({ results, websites, onKeywordDetails }: CompetitiveDetailedTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>('potential');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filter, setFilter] = useState<FilterType>('all');

  const clientDomain = websites[0];
  const competitorDomain = websites[1];

  const getDomainName = (url: string) => {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  };

  // Calcular dados enriquecidos para cada palavra-chave
  const enrichedResults = useMemo(() => {
    return results.map(result => {
      const clientResult = result.results.find(r => r.website === clientDomain);
      const competitorResult = result.results.find(r => r.website === competitorDomain);
      
      const clientPosition = clientResult?.position;
      const competitorPosition = competitorResult?.position;

      // Calcular dificuldade de superação
      const competitorPositions = [competitorPosition].filter(p => p !== null) as number[];
      const difficulty = calculateKeywordDifficulty(competitorPositions);

      // Calcular potencial (diferença de posições + fatores adicionais)
      let potential = 0;
      if (clientPosition && competitorPosition) {
        const positionDiff = clientPosition - competitorPosition;
        if (positionDiff > 0) {
          // Quanto maior a diferença, maior o potencial
          potential = Math.min(100, positionDiff * 5);
          // Bonus para posições do concorrente no top 10
          if (competitorPosition <= 10) potential += 20;
          // Bonus extra para top 3
          if (competitorPosition <= 3) potential += 30;
        }
      } else if (!clientPosition && competitorPosition) {
        // Se não ranqueamos mas o concorrente sim, potencial alto
        potential = Math.min(100, 50 + (11 - competitorPosition) * 5);
      }

      return {
        ...result,
        clientPosition,
        competitorPosition,
        difficulty,
        potential: Math.round(potential),
        isWinning: clientResult?.isWinner || false,
        isOpportunity: competitorPosition && clientPosition && competitorPosition < clientPosition
      };
    });
  }, [results, clientDomain, competitorDomain]);

  // Filtrar e ordenar resultados
  const filteredAndSortedResults = useMemo(() => {
    let filtered = enrichedResults;

    // Aplicar filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(result => 
        result.keyword.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar filtro de tipo
    switch (filter) {
      case 'winning':
        filtered = filtered.filter(result => result.isWinning);
        break;
      case 'losing':
        filtered = filtered.filter(result => !result.isWinning && result.competitorPosition);
        break;
      case 'opportunities':
        filtered = filtered.filter(result => result.isOpportunity);
        break;
    }

    // Aplicar ordenação
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortField) {
        case 'keyword':
          aVal = a.keyword.toLowerCase();
          bVal = b.keyword.toLowerCase();
          break;
        case 'myPosition':
          aVal = a.clientPosition || 999;
          bVal = b.clientPosition || 999;
          break;
        case 'competitorPosition':
          aVal = a.competitorPosition || 999;
          bVal = b.competitorPosition || 999;
          break;
        case 'difficulty':
          aVal = a.difficulty.score;
          bVal = b.difficulty.score;
          break;
        case 'potential':
          aVal = a.potential;
          bVal = b.potential;
          break;
      }

      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    return filtered;
  }, [enrichedResults, searchTerm, filter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    return <ArrowUpDown className={`h-4 w-4 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />;
  };

  const getPositionText = (position: number | null) => {
    return position ? `${position}ª` : "Não encontrado";
  };

  const getPositionBadgeVariant = (position: number | null) => {
    return getPositionCategory(position).badgeVariant;
  };

  const getDifficultyBadge = (difficulty: ReturnType<typeof calculateKeywordDifficulty>) => {
    const variants = {
      'low': 'default' as const,
      'medium': 'secondary' as const,
      'high': 'destructive' as const,
      'very-high': 'destructive' as const
    };

    const labels = {
      'low': 'Baixa',
      'medium': 'Média',
      'high': 'Alta',
      'very-high': 'Muito Alta'
    };

    return (
      <Badge variant={variants[difficulty.difficulty]} className="text-xs">
        {labels[difficulty.difficulty]}
      </Badge>
    );
  };

  const getPotentialBadge = (potential: number) => {
    if (potential === 0) return <Badge variant="outline" className="text-xs">Sem potencial</Badge>;
    if (potential <= 30) return <Badge variant="secondary" className="text-xs">Baixo</Badge>;
    if (potential <= 60) return <Badge variant="default" className="text-xs">Médio</Badge>;
    return <Badge variant="destructive" className="text-xs">Alto</Badge>;
  };

  const getStats = () => {
    const total = filteredAndSortedResults.length;
    const winning = filteredAndSortedResults.filter(r => r.isWinning).length;
    const opportunities = filteredAndSortedResults.filter(r => r.isOpportunity).length;
    return { total, winning, opportunities };
  };

  const stats = getStats();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Análise Detalhada por Palavra-chave
        </CardTitle>
        <CardDescription>
          Explore cada palavra-chave individualmente e identifique oportunidades específicas
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filtros e Busca */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar palavra-chave..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={filter} onValueChange={(value: FilterType) => setFilter(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas ({results.length})</SelectItem>
              <SelectItem value="winning">Vitórias ({enrichedResults.filter(r => r.isWinning).length})</SelectItem>
              <SelectItem value="losing">Perdendo ({enrichedResults.filter(r => !r.isWinning && r.competitorPosition).length})</SelectItem>
              <SelectItem value="opportunities">Oportunidades ({enrichedResults.filter(r => r.isOpportunity).length})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Estatísticas */}
        <div className="flex flex-wrap gap-4 p-4 bg-accent/5 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.winning}</div>
            <div className="text-sm text-muted-foreground">Vitórias</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">{stats.opportunities}</div>
            <div className="text-sm text-muted-foreground">Oportunidades</div>
          </div>
        </div>

        {/* Tabela */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-accent/20"
                  onClick={() => handleSort('keyword')}
                >
                  <div className="flex items-center gap-2">
                    Palavra-chave
                    {getSortIcon('keyword')}
                  </div>
                </TableHead>
                
                <TableHead 
                  className="text-center cursor-pointer hover:bg-accent/20"
                  onClick={() => handleSort('myPosition')}
                >
                  <div className="flex items-center justify-center gap-2">
                    {getDomainName(clientDomain)}
                    {getSortIcon('myPosition')}
                  </div>
                  <div className="text-xs text-muted-foreground font-normal">
                    (Seu site)
                  </div>
                </TableHead>
                
                <TableHead 
                  className="text-center cursor-pointer hover:bg-accent/20"
                  onClick={() => handleSort('competitorPosition')}
                >
                  <div className="flex items-center justify-center gap-2">
                    {getDomainName(competitorDomain)}
                    {getSortIcon('competitorPosition')}
                  </div>
                  <div className="text-xs text-muted-foreground font-normal">
                    (Concorrente)
                  </div>
                </TableHead>
                
                <TableHead 
                  className="text-center cursor-pointer hover:bg-accent/20"
                  onClick={() => handleSort('difficulty')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Dificuldade
                    {getSortIcon('difficulty')}
                  </div>
                </TableHead>
                
                <TableHead 
                  className="text-center cursor-pointer hover:bg-accent/20"
                  onClick={() => handleSort('potential')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Potencial
                    {getSortIcon('potential')}
                  </div>
                </TableHead>
                
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {filteredAndSortedResults.map((result) => (
                <TableRow key={result.keyword} className="hover:bg-accent/5">
                  <TableCell className="font-medium">
                    <div>
                      {result.keyword}
                      {result.isOpportunity && (
                        <AlertCircle className="inline-block ml-2 h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <Badge variant={getPositionBadgeVariant(result.clientPosition)}>
                      {getPositionText(result.clientPosition)}
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <Badge variant={getPositionBadgeVariant(result.competitorPosition)}>
                      {getPositionText(result.competitorPosition)}
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    {getDifficultyBadge(result.difficulty)}
                  </TableCell>
                  
                  <TableCell className="text-center">
                    {getPotentialBadge(result.potential)}
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onKeywordDetails(result.keyword)}
                      className="gap-2 text-xs"
                    >
                      <Eye className="h-3 w-3" />
                      Ver Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredAndSortedResults.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma palavra-chave encontrada com os filtros aplicados.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompetitiveDetailedTable;