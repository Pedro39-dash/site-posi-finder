import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, X, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import GoogleAuthButton from "./GoogleAuthButton";
import PropertySelector from "./PropertySelector";
import { IntegrationService, ProjectIntegration } from "@/services/integrationService";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface IntegrationManagerProps {
  projectId: string;
}

const IntegrationManager = ({ projectId }: IntegrationManagerProps) => {
  const [integrations, setIntegrations] = useState<ProjectIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncingType, setSyncingType] = useState<string | null>(null);

  const loadIntegrations = async () => {
    setIsLoading(true);
    const result = await IntegrationService.getProjectIntegrations(projectId);
    if (result.success && result.integrations) {
      setIntegrations(result.integrations);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadIntegrations();
  }, [projectId]);

  const handleDisconnect = async (integrationId: string, type: string) => {
    const result = await IntegrationService.disconnectIntegration(integrationId);
    if (result.success) {
      toast.success('Integração desconectada com sucesso');
      loadIntegrations();
    } else {
      toast.error('Erro ao desconectar: ' + result.error);
    }
  };

  const handleSync = async (type: 'search_console' | 'analytics') => {
    setSyncingType(type);
    const result = await IntegrationService.syncIntegration(projectId, type);
    
    if (result.success) {
      toast.success('Sincronização iniciada com sucesso!');
      loadIntegrations();
    } else {
      toast.error('Erro na sincronização: ' + result.error);
    }
    
    setSyncingType(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'expired':
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <X className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      error: "destructive",
      expired: "secondary",
      disconnected: "outline",
    };
    
    const labels: Record<string, string> = {
      active: "Ativa",
      error: "Erro",
      expired: "Expirada",
      disconnected: "Desconectada",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const gscIntegration = IntegrationService.getIntegration(integrations, 'search_console');
  const gaIntegration = IntegrationService.getIntegration(integrations, 'analytics');

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Carregando integrações...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrações Google</CardTitle>
        <CardDescription>
          Conecte suas contas Google para obter dados reais de ranking e tráfego
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Google Search Console */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔍</span>
              <div>
                <h3 className="font-semibold">Google Search Console</h3>
                <p className="text-sm text-muted-foreground">
                  Posições reais, impressões e cliques
                </p>
              </div>
            </div>
            {gscIntegration && getStatusBadge(gscIntegration.sync_status)}
          </div>

          {gscIntegration && gscIntegration.is_active ? (
            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm">
                {getStatusIcon(gscIntegration.sync_status)}
                <span className="font-medium">{gscIntegration.account_email}</span>
              </div>
              
              {gscIntegration.property_id ? (
                <div className="text-xs text-muted-foreground">
                  Propriedade: <span className="font-medium">{gscIntegration.property_id}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-orange-600">
                    ⚠️ Selecione uma propriedade para sincronizar dados
                  </p>
                  <PropertySelector
                    integrationId={gscIntegration.id}
                    currentPropertyId={gscIntegration.property_id}
                    onPropertySaved={loadIntegrations}
                  />
                </div>
              )}
              
              {gscIntegration.last_sync_at && (
                <p className="text-xs text-muted-foreground">
                  Última sincronização: {formatDistanceToNow(new Date(gscIntegration.last_sync_at), { 
                    addSuffix: true,
                    locale: ptBR 
                  })}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSync('search_console')}
                  disabled={syncingType === 'search_console' || !gscIntegration.property_id}
                  title={!gscIntegration.property_id ? 'Selecione uma propriedade primeiro' : ''}
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${syncingType === 'search_console' ? 'animate-spin' : ''}`} />
                  Sincronizar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDisconnect(gscIntegration.id, 'search_console')}
                >
                  <X className="h-3 w-3 mr-1" />
                  Desconectar
                </Button>
              </div>
            </div>
          ) : (
            <GoogleAuthButton
              projectId={projectId}
              integrationType="search_console"
              isConnected={false}
              onSuccess={loadIntegrations}
            />
          )}
        </div>

        <Separator />

        {/* Google Analytics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <div>
                <h3 className="font-semibold">Google Analytics 4</h3>
                <p className="text-sm text-muted-foreground">
                  Métricas de tráfego e comportamento
                </p>
              </div>
            </div>
            {gaIntegration && getStatusBadge(gaIntegration.sync_status)}
          </div>

          {gaIntegration && gaIntegration.is_active ? (
            <div className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm">
                {getStatusIcon(gaIntegration.sync_status)}
                <span className="font-medium">{gaIntegration.account_email}</span>
              </div>
              
              {gaIntegration.last_sync_at && (
                <p className="text-xs text-muted-foreground">
                  Última sincronização: {formatDistanceToNow(new Date(gaIntegration.last_sync_at), { 
                    addSuffix: true,
                    locale: ptBR 
                  })}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSync('analytics')}
                  disabled={syncingType === 'analytics'}
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${syncingType === 'analytics' ? 'animate-spin' : ''}`} />
                  Sincronizar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDisconnect(gaIntegration.id, 'analytics')}
                >
                  <X className="h-3 w-3 mr-1" />
                  Desconectar
                </Button>
              </div>
            </div>
          ) : (
            <GoogleAuthButton
              projectId={projectId}
              integrationType="analytics"
              isConnected={false}
              onSuccess={loadIntegrations}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default IntegrationManager;
