import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, CheckCircle, Clock, Info } from 'lucide-react';

interface DataValidationIndicatorProps {
  lastUpdated?: Date | null;
  isStale?: boolean;
  onRefresh?: () => void;
  loading?: boolean;
  error?: string | null;
  validationStatus?: 'valid' | 'warning' | 'error' | 'checking';
}

export function DataValidationIndicator({
  lastUpdated,
  isStale,
  onRefresh,
  loading,
  error,
  validationStatus = 'valid'
}: DataValidationIndicatorProps) {
  const getStatusConfig = () => {
    if (error) {
      return {
        icon: AlertTriangle,
        variant: 'destructive' as const,
        text: 'Erro nos dados',
        color: 'text-destructive'
      };
    }

    switch (validationStatus) {
      case 'checking':
      case 'warning':
        return {
          icon: Clock,
          variant: 'secondary' as const,
          text: isStale ? 'Dados desatualizados' : 'Verificando...',
          color: 'text-warning'
        };
      case 'error':
        return {
          icon: AlertTriangle,
          variant: 'destructive' as const,
          text: 'Inconsistência detectada',
          color: 'text-destructive'
        };
      default:
        return {
          icon: CheckCircle,
          variant: 'default' as const,
          text: 'Dados atualizados',
          color: 'text-success'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (!lastUpdated && !error) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
      
      {lastUpdated && (
        <span className="text-muted-foreground">
          {new Date(lastUpdated).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      )}
      
      {onRefresh && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="h-6 w-6 p-0"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      )}
      
      {error && (
        <Alert className="mt-2">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}