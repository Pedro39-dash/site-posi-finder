import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

interface GraphSelectionPanelProps {
  domains: string[];
  selectedDomains: string[];
  onSelectionChange: (selected: string[]) => void;
  targetDomain: string;
  maxSelection?: number;
}

const GraphSelectionPanel: React.FC<GraphSelectionPanelProps> = ({
  domains,
  selectedDomains,
  onSelectionChange,
  targetDomain,
  maxSelection = 10
}) => {
  const handleDomainToggle = (domain: string, checked: boolean) => {
    if (checked && selectedDomains.length >= maxSelection) {
      return; // Don't add if at max limit
    }
    
    if (checked) {
      onSelectionChange([...selectedDomains, domain]);
    } else {
      onSelectionChange(selectedDomains.filter(d => d !== domain));
    }
  };

  const handleSelectAll = () => {
    const availableToSelect = domains.slice(0, maxSelection);
    onSelectionChange(availableToSelect);
  };

  const handleClearAll = () => {
    // Keep at least the target domain
    onSelectionChange([targetDomain]);
  };

  const isAtMaxLimit = selectedDomains.length >= maxSelection;
  
  // Colors for different domains (matching the chart colors)
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0', '#ff69b4', '#00ced1', '#ffd700', '#ff6347'];

  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with counter and actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Domínios Selecionados</span>
              <Badge variant={isAtMaxLimit ? 'destructive' : 'secondary'}>
                {selectedDomains.length}/{maxSelection}
              </Badge>
              {isAtMaxLimit && (
                <div className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  Limite atingido
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSelectAll}
                disabled={domains.length <= maxSelection && selectedDomains.length === domains.length}
              >
                Selecionar Todos
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearAll}
                disabled={selectedDomains.length <= 1}
              >
                Limpar
              </Button>
            </div>
          </div>

          {/* Domain selection grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {domains.map((domain, index) => {
              const isSelected = selectedDomains.includes(domain);
              const isTarget = domain === targetDomain;
              const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
              const canToggle = isSelected || !isAtMaxLimit;
              
              return (
                <div
                  key={domain}
                  className={`flex items-center space-x-2 p-2 rounded-md border transition-colors ${
                    isSelected ? 'bg-accent/50 border-accent' : 'hover:bg-accent/20'
                  } ${!canToggle && !isSelected ? 'opacity-50' : ''}`}
                >
                  <Checkbox
                    id={`domain-${index}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => handleDomainToggle(domain, checked as boolean)}
                    disabled={!canToggle && !isSelected}
                  />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <label 
                      htmlFor={`domain-${index}`}
                      className="text-sm font-medium truncate cursor-pointer flex-1"
                      title={cleanDomain}
                    >
                      {cleanDomain}
                    </label>
                    {isTarget && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        Principal
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {domains.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-4">
              Nenhum domínio disponível para seleção
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GraphSelectionPanel;
