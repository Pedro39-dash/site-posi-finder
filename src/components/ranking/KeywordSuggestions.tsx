import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { RankingService, KeywordSuggestion } from "@/services/rankingService";
import { Check, X, Lightbulb, TrendingUp, Search } from "lucide-react";

interface KeywordSuggestionsProps {
  suggestions: KeywordSuggestion[];
  projectId: string;
  onSuggestionsUpdate: () => void;
}

export const KeywordSuggestions = ({ suggestions, projectId, onSuggestionsUpdate }: KeywordSuggestionsProps) => {
  const { toast } = useToast();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const handleSuggestionAction = async (suggestionId: string, action: 'accepted' | 'rejected') => {
    setProcessingIds(prev => new Set(prev).add(suggestionId));
    
    try {
      const result = await RankingService.updateSuggestionStatus(suggestionId, action);
      
      if (result.success) {
        toast({
          title: action === 'accepted' ? "Sugestão Aceita" : "Sugestão Rejeitada",
          description: `A sugestão foi ${action === 'accepted' ? 'aceita' : 'rejeitada'} com sucesso`
        });
        onSuggestionsUpdate();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: `Falha ao ${action === 'accepted' ? 'aceitar' : 'rejeitar'} a sugestão`,
        variant: "destructive"
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(suggestionId);
        return newSet;
      });
    }
  };

  const getSourceTypeIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'semantic': return <Lightbulb className="h-4 w-4" />;
      case 'competitor': return <TrendingUp className="h-4 w-4" />;
      case 'content': return <Search className="h-4 w-4" />;
      case 'trends': return <TrendingUp className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getSourceTypeLabel = (sourceType: string) => {
    switch (sourceType) {
      case 'semantic': return 'Semântica';
      case 'competitor': return 'Concorrente';
      case 'content': return 'Conteúdo';
      case 'trends': return 'Tendências';
      default: return sourceType;
    }
  };

  const getSourceTypeColor = (sourceType: string) => {
    switch (sourceType) {
      case 'semantic': return 'bg-blue-100 text-blue-800';
      case 'competitor': return 'bg-red-100 text-red-800';
      case 'content': return 'bg-green-100 text-green-800';
      case 'trends': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: number | null) => {
    if (!difficulty) return 'bg-gray-100 text-gray-800';
    if (difficulty < 30) return 'bg-green-100 text-green-800';
    if (difficulty < 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getDifficultyLabel = (difficulty: number | null) => {
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
  }, {} as Record<string, KeywordSuggestion[]>);

  // Sort each group by relevance score
  Object.keys(suggestionsBySource).forEach(sourceType => {
    suggestionsBySource[sourceType].sort((a, b) => b.relevance_score - a.relevance_score);
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Sugestões de Keywords ({suggestions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {suggestions.length === 0 ? (
            <div className="text-center py-8">
              <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma Sugestão Disponível</h3>
              <p className="text-muted-foreground">
                Clique em "Gerar Sugestões" para descobrir novas oportunidades de keywords
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
                  
                  <div className="space-y-3">
                    {sourceSuggestions.map((suggestion) => {
                      const isProcessing = processingIds.has(suggestion.id);
                      
                      return (
                        <div key={suggestion.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium truncate">{suggestion.suggested_keyword}</span>
                              <Badge className={getSourceTypeColor(suggestion.source_type)}>
                                {getSourceTypeLabel(suggestion.source_type)}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                                  <Badge className={getDifficultyColor(suggestion.difficulty_score)}>
                                    {getDifficultyLabel(suggestion.difficulty_score)}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSuggestionAction(suggestion.id, 'accepted')}
                              disabled={isProcessing}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              variant="ghost"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              size="sm"
                              onClick={() => handleSuggestionAction(suggestion.id, 'rejected')}
                              disabled={isProcessing}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              variant="ghost"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
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
    </div>
  );
};