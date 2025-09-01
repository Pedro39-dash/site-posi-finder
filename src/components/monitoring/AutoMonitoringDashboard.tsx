import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { useProject } from "@/hooks/useProject";
import { MonitoringServiceAdvanced, MonitoringConfig, MonitoringLog } from "@/services/monitoringServiceAdvanced";
import { 
  Activity, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Play, 
  Pause, 
  Settings,
  BarChart3,
  Zap,
  Eye
} from 'lucide-react';

interface MonitoringStats {
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  average_execution_time: number;
  total_keywords_monitored: number;
  total_notifications_created: number;
}

const AutoMonitoringDashboard: React.FC = () => {
  const [configs, setConfigs] = useState<MonitoringConfig[]>([]);
  const [logs, setLogs] = useState<MonitoringLog[]>([]);
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConfig, setSelectedConfig] = useState<string | null>(null);
  const { activeProject } = useProject();
  const { toast } = useToast();

  useEffect(() => {
    if (activeProject) {
      loadMonitoringData();
    }
  }, [activeProject]);

  const loadMonitoringData = async () => {
    if (!activeProject) return;

    try {
      setIsLoading(true);
      
      const [configsResult, statsResult] = await Promise.all([
        MonitoringServiceAdvanced.getProjectConfigs(activeProject.id),
        MonitoringServiceAdvanced.getMonitoringStats(activeProject.id)
      ]);

      if (configsResult.success) {
        setConfigs(configsResult.configs);
        
        // Carregar logs da primeira configuração
        if (configsResult.configs.length > 0) {
          const firstConfig = configsResult.configs[0];
          setSelectedConfig(firstConfig.id!);
          await loadConfigLogs(firstConfig.id!);
        }
      }

      if (statsResult.success) {
        setStats(statsResult.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de monitoramento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de monitoramento",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadConfigLogs = async (configId: string) => {
    const result = await MonitoringServiceAdvanced.getMonitoringLogs(configId);
    if (result.success) {
      setLogs(result.logs);
    }
  };

  const handleToggleConfig = async (configId: string, isActive: boolean) => {
    const result = await MonitoringServiceAdvanced.updateMonitoringConfig(configId, {
      is_active: isActive
    });

    if (result.success) {
      setConfigs(prev => 
        prev.map(config => 
          config.id === configId ? { ...config, is_active: isActive } : config
        )
      );
      
      toast({
        title: isActive ? "Monitoramento Ativado" : "Monitoramento Pausado",
        description: `O monitoramento foi ${isActive ? 'ativado' : 'pausado'} com sucesso`,
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do monitoramento",
        variant: "destructive"
      });
    }
  };

  const handleManualTrigger = async (configId: string) => {
    const result = await MonitoringServiceAdvanced.triggerManualMonitoring(configId);
    
    if (result.success) {
      toast({
        title: "Monitoramento Executado",
        description: "O monitoramento manual foi executado com sucesso",
      });
      
      // Recarregar logs após alguns segundos
      setTimeout(() => {
        if (selectedConfig) {
          loadConfigLogs(selectedConfig);
        }
      }, 3000);
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível executar o monitoramento manual",
        variant: "destructive"
      });
    }
  };

  const handleFrequencyChange = async (configId: string, frequency: string) => {
    const result = await MonitoringServiceAdvanced.updateMonitoringConfig(configId, {
      frequency: frequency as any
    });

    if (result.success) {
      setConfigs(prev => 
        prev.map(config => 
          config.id === configId ? { ...config, frequency: frequency as any } : config
        )
      );
      
      toast({
        title: "Frequência Atualizada",
        description: "A frequência de monitoramento foi atualizada",
      });
    }
  };

  const getStatusColor = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      case 'running': return 'outline';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ranking': return <TrendingUp className="w-4 h-4" />;
      case 'performance': return <Zap className="w-4 h-4" />;
      case 'seo': return <BarChart3 className="w-4 h-4" />;
      case 'uptime': return <Activity className="w-4 h-4" />;
      default: return <Eye className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Carregando dados de monitoramento...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Execuções</CardTitle>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_executions}</div>
              <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
              <CheckCircle className="w-4 h-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {stats.total_executions > 0 ? 
                  Math.round((stats.successful_executions / stats.total_executions) * 100) : 0}%
              </div>
              <Progress 
                value={stats.total_executions > 0 ? (stats.successful_executions / stats.total_executions) * 100 : 0} 
                className="h-2 mt-2" 
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(stats.average_execution_time || 0)}ms
              </div>
              <p className="text-xs text-muted-foreground">Por execução</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Keywords</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_keywords_monitored}</div>
              <p className="text-xs text-muted-foreground">Monitoradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notificações</CardTitle>
              <AlertTriangle className="w-4 h-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_notifications_created}</div>
              <p className="text-xs text-muted-foreground">Criadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Falhas</CardTitle>
              <XCircle className="w-4 h-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.failed_executions}</div>
              <p className="text-xs text-muted-foreground">Execuções</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={selectedConfig || 'overview'} onValueChange={setSelectedConfig}>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="configs">Configurações</TabsTrigger>
            <TabsTrigger value="logs">Histórico</TabsTrigger>
            <TabsTrigger value="settings">Ajustes</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {configs.length === 0 ? (
            <Alert>
              <Settings className="w-4 h-4" />
              <AlertDescription>
                Nenhuma configuração de monitoramento encontrada. Configure o monitoramento automático para começar.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {configs.map((config) => (
                <Card key={config.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(config.monitoring_type)}
                      <CardTitle className="text-sm font-medium capitalize">
                        {config.monitoring_type}
                      </CardTitle>
                    </div>
                    <Switch
                      checked={config.is_active}
                      onCheckedChange={(checked) => handleToggleConfig(config.id!, checked)}
                    />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Frequência:</span>
                        <Badge variant="outline">{config.frequency}</Badge>
                      </div>
                      
                      {config.last_run_at && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Última execução:</span>
                          <span>{new Date(config.last_run_at).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      {config.next_run_at && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Próxima execução:</span>
                          <span>{new Date(config.next_run_at).toLocaleDateString()}</span>
                        </div>
                      )}

                      <div className="pt-2 space-y-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => handleManualTrigger(config.id!)}
                          disabled={!config.is_active}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Executar Agora
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          {selectedConfig && logs.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Execuções</CardTitle>
                <CardDescription>
                  Últimas execuções do monitoramento selecionado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Badge variant={getStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">{log.execution_type}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.executed_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right text-sm">
                        {log.execution_time_ms && (
                          <p>{log.execution_time_ms}ms</p>
                        )}
                        {log.results?.total_keywords && (
                          <p className="text-muted-foreground">
                            {log.results.total_keywords} keywords
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <Activity className="w-4 h-4" />
              <AlertDescription>
                Nenhum histórico de execução encontrado. Execute um monitoramento para ver o histórico.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutoMonitoringDashboard;