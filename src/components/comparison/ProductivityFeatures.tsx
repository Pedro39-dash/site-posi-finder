import { useState, useEffect } from "react";
import { Clock, Bookmark, History, Filter, Search, Star, Trash2, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { FilterState } from "./AdvancedFilters";

interface SavedFilter {
  id: string;
  name: string;
  filters: FilterState;
  createdAt: Date;
  isDefault?: boolean;
}

interface AnalysisHistory {
  id: string;
  name: string;
  domain: string;
  competitors: string[];
  keywordCount: number;
  completedAt: Date;
  isBookmarked?: boolean;
}

interface ProductivityFeaturesProps {
  currentFilters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onLoadAnalysis?: (analysisId: string) => void;
}

const ProductivityFeatures = ({ 
  currentFilters, 
  onFiltersChange, 
  onLoadAnalysis 
}: ProductivityFeaturesProps) => {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistory[]>([]);
  const [filterName, setFilterName] = useState("");
  const [searchHistory, setSearchHistory] = useState("");

  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = () => {
    // Load from localStorage
    const savedFiltersData = localStorage.getItem('comparison-saved-filters');
    const historyData = localStorage.getItem('comparison-analysis-history');
    
    if (savedFiltersData) {
      setSavedFilters(JSON.parse(savedFiltersData));
    }
    
    if (historyData) {
      setAnalysisHistory(JSON.parse(historyData));
    }
  };

  const saveCurrentFilters = () => {
    if (!filterName.trim()) {
      toast.error("Digite um nome para o filtro");
      return;
    }

    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: filterName,
      filters: currentFilters,
      createdAt: new Date()
    };

    const updatedFilters = [...savedFilters, newFilter];
    setSavedFilters(updatedFilters);
    localStorage.setItem('comparison-saved-filters', JSON.stringify(updatedFilters));
    
    setFilterName("");
    toast.success("Filtro salvo com sucesso");
  };

  const loadFilter = (filter: SavedFilter) => {
    onFiltersChange(filter.filters);
    toast.success(`Filtro "${filter.name}" aplicado`);
  };

  const deleteFilter = (filterId: string) => {
    const updatedFilters = savedFilters.filter(f => f.id !== filterId);
    setSavedFilters(updatedFilters);
    localStorage.setItem('comparison-saved-filters', JSON.stringify(updatedFilters));
    toast.success("Filtro removido");
  };

  const setDefaultFilter = (filterId: string) => {
    const updatedFilters = savedFilters.map(f => ({
      ...f,
      isDefault: f.id === filterId
    }));
    setSavedFilters(updatedFilters);
    localStorage.setItem('comparison-saved-filters', JSON.stringify(updatedFilters));
    toast.success("Filtro padrão definido");
  };

  const toggleBookmark = (analysisId: string) => {
    const updatedHistory = analysisHistory.map(h => 
      h.id === analysisId ? { ...h, isBookmarked: !h.isBookmarked } : h
    );
    setAnalysisHistory(updatedHistory);
    localStorage.setItem('comparison-analysis-history', JSON.stringify(updatedHistory));
    
    const analysis = updatedHistory.find(h => h.id === analysisId);
    toast.success(analysis?.isBookmarked ? "Análise favoritada" : "Favorito removido");
  };

  const clearHistory = () => {
    setAnalysisHistory([]);
    localStorage.removeItem('comparison-analysis-history');
    toast.success("Histórico limpo");
  };

  const filteredHistory = analysisHistory.filter(h => 
    searchHistory === "" || 
    h.name.toLowerCase().includes(searchHistory.toLowerCase()) ||
    h.domain.toLowerCase().includes(searchHistory.toLowerCase())
  );

  const bookmarkedAnalyses = filteredHistory.filter(h => h.isBookmarked);
  const recentAnalyses = filteredHistory
    .filter(h => !h.isBookmarked)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Saved Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filtros Salvos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Save Current Filter */}
          <div className="flex gap-2">
            <Input
              placeholder="Nome do filtro"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={saveCurrentFilters}
              disabled={!filterName.trim()}
              size="sm"
            >
              Salvar
            </Button>
          </div>

          {/* Saved Filters List */}
          {savedFilters.length > 0 && (
            <div className="space-y-2">
              {savedFilters.map((filter) => (
                <div key={filter.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{filter.name}</span>
                    {filter.isDefault && (
                      <Badge variant="secondary" className="text-xs">Padrão</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => loadFilter(filter)}
                    >
                      Aplicar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDefaultFilter(filter.id)}
                    >
                      <Star className={`h-4 w-4 ${filter.isDefault ? 'fill-primary text-primary' : ''}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteFilter(filter.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis History */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5" />
              Histórico de Análises
            </CardTitle>
            {analysisHistory.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearHistory}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search History */}
          {analysisHistory.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar no histórico..."
                value={searchHistory}
                onChange={(e) => setSearchHistory(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          {/* Bookmarked Analyses */}
          {bookmarkedAnalyses.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Bookmark className="h-4 w-4" />
                Favoritos
              </h4>
              {bookmarkedAnalyses.map((analysis) => (
                <HistoryItem
                  key={analysis.id}
                  analysis={analysis}
                  onToggleBookmark={toggleBookmark}
                  onLoad={onLoadAnalysis}
                />
              ))}
            </div>
          )}

          {bookmarkedAnalyses.length > 0 && recentAnalyses.length > 0 && (
            <Separator />
          )}

          {/* Recent Analyses */}
          {recentAnalyses.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recentes
              </h4>
              {recentAnalyses.map((analysis) => (
                <HistoryItem
                  key={analysis.id}
                  analysis={analysis}
                  onToggleBookmark={toggleBookmark}
                  onLoad={onLoadAnalysis}
                />
              ))}
            </div>
          )}

          {filteredHistory.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nenhuma análise encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface HistoryItemProps {
  analysis: AnalysisHistory;
  onToggleBookmark: (id: string) => void;
  onLoad?: (id: string) => void;
}

const HistoryItem = ({ analysis, onToggleBookmark, onLoad }: HistoryItemProps) => {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">{analysis.name}</span>
          <Badge variant="outline" className="text-xs">
            {analysis.keywordCount} keywords
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          <span>{analysis.domain}</span>
          <span className="mx-2">vs</span>
          <span>{analysis.competitors.slice(0, 2).join(", ")}</span>
          {analysis.competitors.length > 2 && (
            <span> +{analysis.competitors.length - 2}</span>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {new Date(analysis.completedAt).toLocaleString('pt-BR')}
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        {onLoad && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onLoad(analysis.id)}
          >
            Carregar
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onToggleBookmark(analysis.id)}
        >
          <Bookmark className={`h-4 w-4 ${analysis.isBookmarked ? 'fill-primary text-primary' : ''}`} />
        </Button>
      </div>
    </div>
  );
};

export default ProductivityFeatures;