import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KeywordSuggestionsProps {
  inputKeyword: string;
  onAddKeyword: (keyword: string) => void;
  existingKeywords: string[];
  maxSuggestions?: number;
}

// Mock function to generate keyword suggestions
const generateSuggestions = (keyword: string): string[] => {
  if (!keyword.trim()) return [];
  
  const baseSuggestions = [
    `${keyword} gratis`,
    `${keyword} online`,
    `${keyword} curso`,
    `como usar ${keyword}`,
    `${keyword} portugal`,
    `${keyword} preço`,
    `melhor ${keyword}`,
    `${keyword} 2024`,
    `${keyword} profissional`,
    `${keyword} avançado`
  ];
  
  return baseSuggestions
    .filter(suggestion => !suggestion.includes(keyword) || suggestion !== keyword)
    .slice(0, 5);
};

export default function KeywordSuggestions({ 
  inputKeyword, 
  onAddKeyword, 
  existingKeywords, 
  maxSuggestions = 5 
}: KeywordSuggestionsProps) {
  const [addingKeywords, setAddingKeywords] = useState<Set<string>>(new Set());
  
  const suggestions = generateSuggestions(inputKeyword)
    .filter(suggestion => !existingKeywords.includes(suggestion))
    .slice(0, maxSuggestions);

  const handleAddSuggestion = (suggestion: string) => {
    setAddingKeywords(prev => new Set(prev).add(suggestion));
    onAddKeyword(suggestion);
    
    // Remove from adding state after a brief moment
    setTimeout(() => {
      setAddingKeywords(prev => {
        const next = new Set(prev);
        next.delete(suggestion);
        return next;
      });
    }, 300);
  };

  if (!inputKeyword.trim() || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="text-sm font-medium text-foreground">
          Sugestões baseadas em "{inputKeyword}":
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <Button
            key={suggestion}
            variant="outline"
            size="sm"
            onClick={() => handleAddSuggestion(suggestion)}
            disabled={addingKeywords.has(suggestion)}
            className="h-8 px-3 text-xs border-border hover:bg-muted"
          >
            <Plus className="h-3 w-3 mr-1" />
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  );
}