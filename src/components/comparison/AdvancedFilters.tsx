import React from 'react';
import { Search, Filter, SortAsc, SortDesc, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface FilterState {
  search: string;
  positionRange: [number, number];
  opportunityTypes: string[];
  competitionLevel: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  showOnlyWinning: boolean;
  showOnlyLosing: boolean;
  showOnlyOpportunities: boolean;
}

interface AdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  keywordCount: number;
  filteredCount: number;
}

const AdvancedFilters = ({ filters, onFiltersChange, keywordCount, filteredCount }: AdvancedFiltersProps) => {
  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const resetFilters = () => {
    onFiltersChange({
      search: '',
      positionRange: [1, 100],
      opportunityTypes: [],
      competitionLevel: [],
      sortBy: 'keyword',
      sortOrder: 'asc',
      showOnlyWinning: false,
      showOnlyLosing: false,
      showOnlyOpportunities: false
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.positionRange[0] !== 1 || filters.positionRange[1] !== 100) count++;
    if (filters.opportunityTypes.length > 0) count++;
    if (filters.competitionLevel.length > 0) count++;
    if (filters.showOnlyWinning) count++;
    if (filters.showOnlyLosing) count++;
    if (filters.showOnlyOpportunities) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-4">
      {/* Search and Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar keywords..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          {/* Sort */}
          <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="keyword">Keyword</SelectItem>
              <SelectItem value="position">Posição</SelectItem>
              <SelectItem value="difficulty">Dificuldade</SelectItem>
              <SelectItem value="opportunity">Oportunidade</SelectItem>
              <SelectItem value="competition">Competição</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {filters.sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>

          {/* Advanced Filters */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <Card className="border-0 shadow-none">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Filtros Avançados</CardTitle>
                    {activeFiltersCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={resetFilters}>
                        <X className="h-4 w-4 mr-1" />
                        Limpar
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Position Range Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Faixa de Posição</Label>
                    <div className="px-2">
                      <Slider
                        value={filters.positionRange}
                        onValueChange={(value) => updateFilter('positionRange', value)}
                        max={100}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{filters.positionRange[0]}ª</span>
                        <span>{filters.positionRange[1]}ª</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Status Filters */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="winning"
                          checked={filters.showOnlyWinning}
                          onCheckedChange={(checked) => updateFilter('showOnlyWinning', !!checked)}
                        />
                        <Label htmlFor="winning" className="text-sm">Apenas vencendo</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="losing"
                          checked={filters.showOnlyLosing}
                          onCheckedChange={(checked) => updateFilter('showOnlyLosing', !!checked)}
                        />
                        <Label htmlFor="losing" className="text-sm">Apenas perdendo</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="opportunities"
                          checked={filters.showOnlyOpportunities}
                          onCheckedChange={(checked) => updateFilter('showOnlyOpportunities', !!checked)}
                        />
                        <Label htmlFor="opportunities" className="text-sm">Apenas oportunidades</Label>
                      </div>
                    </div>
                  </div>

                  {/* Opportunity Types */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tipos de Oportunidade</Label>
                    <div className="space-y-2">
                      {['quick_win', 'content_gap', 'competitor_weakness', 'ranking_drop'].map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={type}
                            checked={filters.opportunityTypes.includes(type)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                updateFilter('opportunityTypes', [...filters.opportunityTypes, type]);
                              } else {
                                updateFilter('opportunityTypes', filters.opportunityTypes.filter(t => t !== type));
                              }
                            }}
                          />
                          <Label htmlFor={type} className="text-sm capitalize">
                            {type.replace('_', ' ')}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Competition Level */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Nível de Competição</Label>
                    <div className="space-y-2">
                      {['low', 'medium', 'high', 'very_high'].map((level) => (
                        <div key={level} className="flex items-center space-x-2">
                          <Checkbox
                            id={level}
                            checked={filters.competitionLevel.includes(level)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                updateFilter('competitionLevel', [...filters.competitionLevel, level]);
                              } else {
                                updateFilter('competitionLevel', filters.competitionLevel.filter(l => l !== level));
                              }
                            }}
                          />
                          <Label htmlFor={level} className="text-sm capitalize">
                            {level.replace('_', ' ')}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Results Counter and Active Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">
          {filteredCount} de {keywordCount} keywords
        </Badge>

        {/* Active Filter Pills */}
        {filters.search && (
          <Badge variant="outline" className="gap-1">
            Busca: "{filters.search}"
            <X 
              className="h-3 w-3 cursor-pointer" 
              onClick={() => updateFilter('search', '')}
            />
          </Badge>
        )}

        {(filters.positionRange[0] !== 1 || filters.positionRange[1] !== 100) && (
          <Badge variant="outline" className="gap-1">
            Posição: {filters.positionRange[0]}-{filters.positionRange[1]}
            <X 
              className="h-3 w-3 cursor-pointer" 
              onClick={() => updateFilter('positionRange', [1, 100])}
            />
          </Badge>
        )}

        {filters.showOnlyWinning && (
          <Badge variant="outline" className="gap-1">
            Vencendo
            <X 
              className="h-3 w-3 cursor-pointer" 
              onClick={() => updateFilter('showOnlyWinning', false)}
            />
          </Badge>
        )}

        {filters.showOnlyLosing && (
          <Badge variant="outline" className="gap-1">
            Perdendo
            <X 
              className="h-3 w-3 cursor-pointer" 
              onClick={() => updateFilter('showOnlyLosing', false)}
            />
          </Badge>
        )}

        {filters.showOnlyOpportunities && (
          <Badge variant="outline" className="gap-1">
            Oportunidades
            <X 
              className="h-3 w-3 cursor-pointer" 
              onClick={() => updateFilter('showOnlyOpportunities', false)}
            />
          </Badge>
        )}

        {filters.opportunityTypes.map(type => (
          <Badge key={type} variant="outline" className="gap-1">
            {type.replace('_', ' ')}
            <X 
              className="h-3 w-3 cursor-pointer" 
              onClick={() => updateFilter('opportunityTypes', filters.opportunityTypes.filter(t => t !== type))}
            />
          </Badge>
        ))}

        {filters.competitionLevel.map(level => (
          <Badge key={level} variant="outline" className="gap-1">
            {level.replace('_', ' ')}
            <X 
              className="h-3 w-3 cursor-pointer" 
              onClick={() => updateFilter('competitionLevel', filters.competitionLevel.filter(l => l !== level))}
            />
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default AdvancedFilters;