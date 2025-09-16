import React, { useState, useMemo, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Target, Search } from 'lucide-react';
import { CompetitorKeyword } from '@/services/competitorAnalysisService';
import { useKeywordFilter } from '@/contexts/KeywordFilterContext';

interface KeywordSelectorProps {
  keywords: CompetitorKeyword[];
}

const KeywordSelector: React.FC<KeywordSelectorProps> = ({ keywords }) => {
  const { selectedKeyword, setSelectedKeyword } = useKeywordFilter();
  const [searchTerm, setSearchTerm] = useState('');

  // Auto-select first keyword if none selected
  useEffect(() => {
    if (!selectedKeyword && keywords.length > 0) {
      setSelectedKeyword(keywords[0]);
    }
  }, [selectedKeyword, keywords, setSelectedKeyword]);

  // Filter keywords based on search term
  const filteredKeywords = useMemo(() => {
    if (!searchTerm) return keywords;
    return keywords.filter(keyword => 
      keyword.keyword.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [keywords, searchTerm]);

  const handleValueChange = (value: string) => {
    const keyword = keywords.find(k => k.id === value);
    if (keyword) {
      setSelectedKeyword(keyword);
    }
  };

  const getCurrentValue = () => {
    return selectedKeyword?.id || '';
  };

  return (
    <div className="space-y-4 p-6 bg-background/50 rounded-lg border">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Filtrar por palavra-chave:</span>
      </div>
      
      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Search and Select */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar palavra-chave..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={getCurrentValue()} onValueChange={handleValueChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma palavra-chave" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {filteredKeywords.map((keyword) => (
                <SelectItem key={keyword.id} value={keyword.id}>
                  <div className="flex items-center justify-between w-full gap-3">
                    <span className="flex-1 truncate">{keyword.keyword}</span>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-xs">
                        Vol: {keyword.search_volume || 0}
                      </Badge>
                    </div>
                  </div>
                </SelectItem>
              ))}
              {filteredKeywords.length === 0 && searchTerm && (
                <div className="px-2 py-1 text-sm text-muted-foreground">
                  Nenhuma palavra-chave encontrada
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Position Display */}
        {selectedKeyword && (
          <div className="flex items-center gap-3 lg:justify-end">
            <span className="text-sm text-muted-foreground">Posição atual:</span>
            <Badge variant={selectedKeyword.target_domain_position ? "default" : "secondary"}>
              {selectedKeyword.target_domain_position ? `${selectedKeyword.target_domain_position}º` : "Não detectada"}
            </Badge>
          </div>
        )}
      </div>
      
      {/* Keywords count info */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Total de palavras-chave: {keywords.length}</span>
        {searchTerm && (
          <span>• Filtradas: {filteredKeywords.length}</span>
        )}
      </div>
    </div>
  );
};

export default KeywordSelector;