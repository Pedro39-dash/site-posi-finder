import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HistoryMaturity } from '@/services/rankingHistoryService';

interface HistoryMaturityBadgeProps {
  maturity: HistoryMaturity;
  className?: string;
}

const HistoryMaturityBadge: React.FC<HistoryMaturityBadgeProps> = ({ maturity, className = '' }) => {
  const getVariant = () => {
    switch (maturity.status) {
      case 'building':
        return 'secondary';
      case 'consolidating':
        return 'default';
      case 'complete':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getTooltipContent = () => {
    return (
      <div className="space-y-2">
        <p className="font-semibold">{maturity.icon} {maturity.message}</p>
        <p className="text-xs">
          {maturity.totalDataPoints} ponto{maturity.totalDataPoints !== 1 ? 's' : ''} de dados coletado{maturity.totalDataPoints !== 1 ? 's' : ''}
        </p>
        {maturity.status === 'building' && (
          <p className="text-xs text-muted-foreground">
            💡 Faça novas análises nos próximos dias para construir um histórico mais rico!
          </p>
        )}
        {maturity.status === 'consolidating' && (
          <p className="text-xs text-muted-foreground">
            📈 Continue analisando para ter dados completos de 30 dias
          </p>
        )}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={getVariant()} className={`cursor-help ${className}`}>
            {maturity.icon} {maturity.message}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default HistoryMaturityBadge;
