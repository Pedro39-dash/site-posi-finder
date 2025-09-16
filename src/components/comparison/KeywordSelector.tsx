import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Target } from 'lucide-react';
import { CompetitorKeyword } from '@/services/competitorAnalysisService';
import { useKeywordFilter } from '@/contexts/KeywordFilterContext';

interface KeywordSelectorProps {
  keywords: CompetitorKeyword[];
}

const KeywordSelector: React.FC<KeywordSelectorProps> = ({ keywords }) => {
  const { selectedKeyword, isAllKeywords, setSelectedKeyword, setAllKeywords } = useKeywordFilter();

  const handleValueChange = (value: string) => {
    if (value === 'all') {
      setAllKeywords();
    } else {
      const keyword = keywords.find(k => k.id === value);
      if (keyword) {
        setSelectedKeyword(keyword);
      }
    }
  };

  const getCurrentValue = () => {
    if (isAllKeywords) return 'all';
    return selectedKeyword?.id || 'all';
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-background/50 rounded-lg border">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Filtrar por palavra-chave:</span>
      </div>
      
      <Select value={getCurrentValue()} onValueChange={handleValueChange}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Selecione uma palavra-chave" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {keywords.length}
              </Badge>
              Todas as palavras-chave
            </div>
          </SelectItem>
          {keywords.map((keyword) => (
            <SelectItem key={keyword.id} value={keyword.id}>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Vol: {keyword.search_volume || 0}
                </Badge>
                {keyword.keyword}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedKeyword && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Posição:</span>
          <Badge variant={selectedKeyword.target_domain_position ? "default" : "secondary"}>
            {selectedKeyword.target_domain_position || "Não detectada"}
          </Badge>
        </div>
      )}
    </div>
  );
};

export default KeywordSelector;