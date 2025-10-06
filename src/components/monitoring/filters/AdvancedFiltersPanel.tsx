import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { X, Filter } from "lucide-react";
import { PositionFilters, PositionRange } from "./PositionFilters";

export interface AdvancedFilters {
  positionRange: PositionRange;
  changeType: 'all' | 'improvements' | 'declines' | 'stable' | 'new';
  trafficLevel: 'all' | 'high' | 'medium' | 'low';
  url: string | null;
  opportunity: 'all' | 'quick-wins' | 'featured-snippet' | 'at-risk' | 'cannibalization';
  device: 'all' | 'desktop' | 'mobile';
}

interface AdvancedFiltersPanelProps {
  filters: AdvancedFilters;
  onChange: (filters: AdvancedFilters) => void;
  availableUrls?: string[];
  positionCounts?: {
    all: number;
    top3: number;
    top10: number;
    top20: number;
    top50: number;
    top100: number;
  };
}

export const AdvancedFiltersPanel = ({ 
  filters, 
  onChange, 
  availableUrls = [],
  positionCounts 
}: AdvancedFiltersPanelProps) => {
  const hasActiveFilters = 
    filters.positionRange !== 'all' ||
    filters.changeType !== 'all' ||
    filters.trafficLevel !== 'all' ||
    filters.url !== null ||
    filters.opportunity !== 'all' ||
    filters.device !== 'all';

  const clearFilters = () => {
    onChange({
      positionRange: 'all',
      changeType: 'all',
      trafficLevel: 'all',
      url: null,
      opportunity: 'all',
      device: 'all'
    });
  };

  const updateFilter = <K extends keyof AdvancedFilters>(
    key: K,
    value: AdvancedFilters[K]
  ) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">Filtros Avançados</h3>
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              {[
                filters.positionRange !== 'all',
                filters.changeType !== 'all',
                filters.trafficLevel !== 'all',
                filters.url !== null,
                filters.opportunity !== 'all',
                filters.device !== 'all'
              ].filter(Boolean).length} ativos
            </Badge>
          )}
        </div>
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Position Range Filter */}
        <div>
          <PositionFilters 
            value={filters.positionRange}
            onChange={(value) => updateFilter('positionRange', value)}
            counts={positionCounts}
          />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Change Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Tipo de mudança
            </label>
            <Select
              value={filters.changeType}
              onValueChange={(value) => updateFilter('changeType', value as AdvancedFilters['changeType'])}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="improvements">Melhorias</SelectItem>
                <SelectItem value="declines">Pioras</SelectItem>
                <SelectItem value="stable">Estável</SelectItem>
                <SelectItem value="new">Novas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Traffic Level */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Nível de tráfego
            </label>
            <Select
              value={filters.trafficLevel}
              onValueChange={(value) => updateFilter('trafficLevel', value as AdvancedFilters['trafficLevel'])}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="high">Alto (&gt;100)</SelectItem>
                <SelectItem value="medium">Médio (10-100)</SelectItem>
                <SelectItem value="low">Baixo (&lt;10)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* URL Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              URL
            </label>
            <Select
              value={filters.url || 'all'}
              onValueChange={(value) => updateFilter('url', value === 'all' ? null : value)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todas as URLs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as URLs</SelectItem>
                {availableUrls.map((url) => (
                  <SelectItem key={url} value={url}>
                    {url.length > 30 ? `${url.substring(0, 30)}...` : url}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Opportunity Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Oportunidade
            </label>
            <Select
              value={filters.opportunity}
              onValueChange={(value) => updateFilter('opportunity', value as AdvancedFilters['opportunity'])}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="quick-wins">Quick Wins</SelectItem>
                <SelectItem value="featured-snippet">Featured Snippet</SelectItem>
                <SelectItem value="at-risk">Em Risco</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Device Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Dispositivo
            </label>
            <Select
              value={filters.device}
              onValueChange={(value) => updateFilter('device', value as AdvancedFilters['device'])}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="desktop">Desktop</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </Card>
  );
};
