import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { CompetitorKeywordService, CompetitorKeywordSuggestion } from "@/services/competitorKeywordService";
import { Plus, Lightbulb, TrendingUp, Search, Target, Loader2 } from "lucide-react";

interface AdvancedKeywordSuggestionsProps {
  targetDomain: string;
  competitors: string[];
  baseKeywords: string[];
  onAddKeyword: (keyword: string) => void;
  existingKeywords: string[];
}

export default function AdvancedKeywordSuggestions({ 
  targetDomain,
  competitors,
  baseKeywords,
  onAddKeyword, 
  existingKeywords 
}: AdvancedKeywordSuggestionsProps) {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<CompetitorKeywordSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingKeywords, setAddingKeywords] = useState<Set<string>>(new Set());

  // Generate suggestions when dependencies change
  useEffect(() => {
    if (targetDomain && (competitors.length > 0 || baseKeywords.length > 0)) {
      generateSuggestions();
    }
  }, [targetDomain, competitors.join(','), baseKeywords.join(',')]);

  const generateSuggestions = async () => {
    setIsLoading(true);
    try {
      const result = await CompetitorKeywordService.generateCompetitorSuggestions(
        targetDomain,
        competitors,
        baseKeywords
      );
      
      if (result.success && result.suggestions) {
        // Filter out existing keywords
        const newSuggestions = result.suggestions.filter(
          suggestion => !existingKeywords.includes(suggestion.suggested_keyword)
        );
        setSuggestions(newSuggestions);
      } else {
        throw new Error(result.error || 'Falha ao gerar sugestões');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao gerar sugestões de keywords",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSuggestion = (suggestion: CompetitorKeywordSuggestion) => {
    setAddingKeywords(prev => new Set(prev).add(suggestion.id));
    onAddKeyword(suggestion.suggested_keyword);
    
    // Remove suggestion from list
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    
    // Remove from adding state after animation
    setTimeout(() => {
      setAddingKeywords(prev => {
        const next = new Set(prev);
        next.delete(suggestion.id);
        return next;
      });
    }, 300);
  };

  const getSourceTypeIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'semantic': return <Lightbulb className="h-4 w-4" />;
      case 'competitor': return <TrendingUp className="h-4 w-4" />;
      case 'content': return <Search className="h-4 w-4" />;
      case 'gap_analysis': return <Target className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getSourceTypeLabel = (sourceType: string) => {
    switch (sourceType) {
      case 'semantic': return 'Semântica';
      case 'competitor': return 'Concorrente';
      case 'content': return 'Conteúdo';
      case 'gap_analysis': return 'Oportunidade';
      default: return sourceType;
    }
  };

  const getSourceTypeColor = (sourceType: string) => {
    switch (sourceType) {
      case 'semantic': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'competitor': return 'bg-red-50 text-red-700 border-red-200';
      case 'content': return 'bg-green-50 text-green-700 border-green-200';
      case 'gap_analysis': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getGoogleSourceIcon = (googleSource?: string) => {
    switch (googleSource) {
      case 'related_searches': return '🔍';
      case 'people_also_ask': return '❓';
      case 'autocomplete': return '💬';
      default: return null;
    }
  };

  const getGoogleSourceLabel = (googleSource?: string) => {
    switch (googleSource) {
      case 'related_searches': return 'Do Google';
      case 'people_also_ask': return 'Dúvida comum';
      case 'autocomplete': return 'Autocompletar';
      default: return null;
    }
  };

  const getDifficultyColor = (difficulty?: number) => {
    if (!difficulty) return 'bg-muted text-muted-foreground';
    if (difficulty < 30) return 'bg-green-50 text-green-700 border-green-200';
    if (difficulty < 60) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const getDifficultyLabel = (difficulty?: number) => {
    if (!difficulty) return 'N/D';
    if (difficulty < 30) return 'Fácil';
    if (difficulty < 60) return 'Médio';
    return 'Difícil';
  };

  // Group suggestions by source type
  const suggestionsBySource = suggestions.reduce((acc, suggestion) => {
    if (!acc[suggestion.source_type]) {
      acc[suggestion.source_type] = [];
    }
    acc[suggestion.source_type].push(suggestion);
    return acc;
  }, {} as Record<string, CompetitorKeywordSuggestion[]>);

  // Sort each group by relevance score
  Object.keys(suggestionsBySource).forEach(sourceType => {
    suggestionsBySource[sourceType].sort((a, b) => b.relevance_score - a.relevance_score);
  });

  if (!targetDomain || (competitors.length === 0 && baseKeywords.length === 0)) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Sugestões Inteligentes de Keywords
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={generateSuggestions}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Lightbulb className="h-4 w-4 mr-2" />
            )}
            {isLoading ? 'Gerando...' : 'Atualizar'}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Sugestões baseadas em análise competitiva e semântica
        </p>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Analisando concorrência...</span>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma Sugestão Disponível</h3>
            <p className="text-muted-foreground">
              Adicione concorrentes ou palavras-chave base para gerar sugestões
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(suggestionsBySource).map(([sourceType, sourceSuggestions]) => (
              <div key={sourceType}>
                <div className="flex items-center gap-2 mb-4">
                  {getSourceTypeIcon(sourceType)}
                  <h3 className="font-semibold">
                    {getSourceTypeLabel(sourceType)} ({sourceSuggestions.length})
                  </h3>
                </div>
                
                <div className="grid gap-3">
                  {sourceSuggestions.map((suggestion) => {
                    const isAdding = addingKeywords.has(suggestion.id);
                    
                    return (
                      <div 
                        key={suggestion.id} 
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                              <span className="font-medium truncate">
                                {suggestion.suggested_keyword}
                              </span>
                            {/* <Badge 
                              variant="outline"
                              className={getSourceTypeColor(suggestion.source_type)}
                            >
                              {getSourceTypeLabel(suggestion.source_type)}
                            </Badge>
                            {suggestion.metadata?.google_source && (
                              <Badge variant="secondary" className="gap-1">
                                <span>{getGoogleSourceIcon(suggestion.metadata.google_source)}</span>
                                {getGoogleSourceLabel(suggestion.metadata.google_source)}
                              </Badge>
                            )} */}
                          </div>
                          
                          <div className="flex flex-col gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <span>Relevância:</span>
                              <Badge variant="outline">
                                {suggestion.relevance_score}%
                              </Badge>
                            </div>
                            
                            {suggestion.search_volume && (
                              <div className="flex items-center gap-1">
                                <span>Volume:</span>
                                <Badge variant="outline">
                                  {suggestion.search_volume.toLocaleString()}
                                </Badge>
                              </div>
                            )}
                            
                            {suggestion.difficulty_score && (
                              <div className="flex items-center gap-1">
                                <span>Dificuldade:</span>
                                <Badge 
                                  variant="outline"
                                  className={getDifficultyColor(suggestion.difficulty_score)}
                                >
                                  {getDifficultyLabel(suggestion.difficulty_score)}
                                </Badge>
                              </div>
                            )}
                            
                            {suggestion.competitor_domains && suggestion.competitor_domains.length > 0 && (
                              <div className="flex items-center gap-1">
                                <span>Concorrentes:</span>
                                <Badge variant="outline">
                                  {suggestion.competitor_domains.length}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          onClick={() => handleAddSuggestion(suggestion)}
                          disabled={isAdding}
                          className="shrink-0"
                        >
                          {isAdding ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4 mr-1" />
                          )}
                          Adicionar
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}