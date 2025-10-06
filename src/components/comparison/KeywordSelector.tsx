import React, { useState, useMemo, useEffect } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Target, Check } from 'lucide-react';
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

  const handleKeywordSelect = (keyword: CompetitorKeyword) => {
    setSelectedKeyword(keyword);
    setSearchTerm(''); // Limpa a busca após selecionar
  };

  return (
    <div className="space-y-4 p-6 bg-background/50 rounded-lg border">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Filtrar por palavra-chave:</span>
      </div>
      
      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Command with integrated search */}
        <Command className="rounded-lg border shadow-sm">
          <CommandInput 
            placeholder="Buscar e selecionar palavra-chave..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>Nenhuma palavra-chave encontrada</CommandEmpty>
            <CommandGroup>
              {filteredKeywords.map((keyword) => (
                <CommandItem
                  key={keyword.id}
                  value={keyword.keyword}
                  onSelect={() => handleKeywordSelect(keyword)}
                  className="flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {selectedKeyword?.id === keyword.id && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                    <span className="truncate">{keyword.keyword}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                    Vol: {keyword.search_volume || 0}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>

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