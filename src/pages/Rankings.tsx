import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { ArrowUpDown, TrendingUp, TrendingDown, Target, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjects } from "@/contexts/ProjectContext";

interface RankingData {
  keyword: string;
  currentPosition: number;
  previousPosition: number | null;
  change: number;
  searchVolume: number;
  difficulty: 'easy' | 'medium' | 'hard';
  trend: 'up' | 'down' | 'stable';
}

const Rankings = () => {
  const { activeProject } = useProjects();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTrend, setFilterTrend] = useState("all");
  const [sortBy, setSortBy] = useState("position");

  // Mock data baseada no projeto ativo
  const mockRankings: RankingData[] = activeProject ? 
    activeProject.keywords.map((kw, index) => ({
      keyword: kw.keyword,
      currentPosition: Math.floor(Math.random() * 50) + 1,
      previousPosition: Math.floor(Math.random() * 50) + 1,
      change: Math.floor(Math.random() * 21) - 10, // -10 to +10
      searchVolume: Math.floor(Math.random() * 5000) + 100,
      difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as 'easy' | 'medium' | 'hard',
      trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable'
    })) : [];

  // Filtros e ordenação
  const filteredAndSortedRankings = mockRankings
    .filter(ranking => {
      const matchesSearch = ranking.keyword.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTrend = filterTrend === "all" || ranking.trend === filterTrend;
      return matchesSearch && matchesTrend;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "position":
          return a.currentPosition - b.currentPosition;
        case "change":
          return b.change - a.change;
        case "volume":
          return b.searchVolume - a.searchVolume;
        default:
          return a.keyword.localeCompare(b.keyword);
      }
    });

  const getPositionBadgeVariant = (position: number) => {
    if (position <= 3) return "default";
    if (position <= 10) return "secondary";
    return "outline";
  };

  const getTrendIcon = (trend: string, change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'hard': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  // Métricas resumo
  const topPositions = filteredAndSortedRankings.filter(r => r.currentPosition <= 10).length;
  const improvingKeywords = filteredAndSortedRankings.filter(r => r.change > 0).length;
  const decliningKeywords = filteredAndSortedRankings.filter(r => r.change < 0).length;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Posições & Rankings - {activeProject?.name || 'SEO Dashboard'}</title>
        <meta name="description" content="Visualize e analise as posições das suas palavras-chave nos resultados de busca" />
      </Helmet>

      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Target className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Posições & Rankings</h1>
          </div>
          <p className="text-muted-foreground">
            {activeProject ? `Palavras-chave do projeto: ${activeProject.name}` : 'Selecione um projeto para ver os rankings'}
          </p>
        </div>

        {activeProject ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Palavras-chave
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-bold text-foreground">
                    {filteredAndSortedRankings.length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Top 10 Posições
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-bold text-primary">{topPositions}</div>
                  <p className="text-sm text-muted-foreground">
                    {((topPositions / filteredAndSortedRankings.length) * 100).toFixed(1)}% do total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Melhorando
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-bold text-green-500">{improvingKeywords}</div>
                  <p className="text-sm text-muted-foreground">Palavras em alta</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Declinando
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-bold text-red-500">{decliningKeywords}</div>
                  <p className="text-sm text-muted-foreground">Palavras em queda</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar palavra-chave..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterTrend} onValueChange={setFilterTrend}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar por tendência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as tendências</SelectItem>
                  <SelectItem value="up">Melhorando</SelectItem>
                  <SelectItem value="down">Declinando</SelectItem>
                  <SelectItem value="stable">Estável</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="position">Posição</SelectItem>
                  <SelectItem value="change">Mudança</SelectItem>
                  <SelectItem value="volume">Volume de busca</SelectItem>
                  <SelectItem value="keyword">Palavra-chave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rankings Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Rankings Detalhados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredAndSortedRankings.map((ranking, index) => (
                    <div
                      key={ranking.keyword}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-center min-w-[80px]">
                          <Badge variant={getPositionBadgeVariant(ranking.currentPosition)} className="mb-1">
                            #{ranking.currentPosition}
                          </Badge>
                          <div className="flex items-center justify-center gap-1">
                            {getTrendIcon(ranking.trend, ranking.change)}
                            <span className={`text-xs ${ranking.change > 0 ? 'text-green-500' : ranking.change < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                              {ranking.change > 0 ? `+${ranking.change}` : ranking.change}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="font-medium text-foreground mb-1">
                            {ranking.keyword}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Vol: {ranking.searchVolume.toLocaleString()}</span>
                            <span className={getDifficultyColor(ranking.difficulty)}>
                              Dif: {ranking.difficulty}
                            </span>
                            {ranking.previousPosition && (
                              <span>Anterior: #{ranking.previousPosition}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {filteredAndSortedRankings.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm || filterTrend !== "all" ? 
                      "Nenhuma palavra-chave encontrada com os filtros aplicados." :
                      "Nenhuma palavra-chave cadastrada para este projeto."
                    }
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum projeto selecionado
              </h3>
              <p className="text-muted-foreground mb-6">
                Selecione um projeto para visualizar as posições das palavras-chave.
              </p>
              <Button onClick={() => window.history.back()}>
                Voltar ao Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Rankings;