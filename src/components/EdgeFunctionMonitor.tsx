import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, RefreshCw, Terminal, ExternalLink } from "lucide-react";

interface EdgeFunctionLog {
  id: string;
  timestamp: string;
  event_message: string;
  status_code?: number;
  method?: string;
  execution_time_ms?: number;
}

export const EdgeFunctionMonitor = () => {
  const [logs, setLogs] = useState<EdgeFunctionLog[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string>('');

  const fetchLogs = async () => {
    setIsRefreshing(true);
    try {
      // Simulate fetching logs - in real implementation this would be connected to Supabase analytics
      setTimeout(() => {
        setLogs([
          {
            id: '1',
            timestamp: new Date().toISOString(),
            event_message: 'SEO audit function invoked successfully',
            status_code: 200,
            method: 'POST',
            execution_time_ms: 1250
          },
          {
            id: '2', 
            timestamp: new Date(Date.now() - 30000).toISOString(),
            event_message: 'Starting SEO audit for: https://example.com',
            status_code: 200,
            method: 'POST',
            execution_time_ms: 45000
          }
        ]);
        setLastRefresh(new Date().toLocaleTimeString());
        setIsRefreshing(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const getStatusColor = (statusCode?: number) => {
    if (!statusCode) return 'secondary';
    if (statusCode >= 200 && statusCode < 300) return 'default';
    if (statusCode >= 400) return 'destructive';
    return 'secondary';
  };

  const openSupabaseLogs = () => {
    const projectId = 'yfvfklgjzmmobwfhdrqp';
    const functionName = 'seo-audit';
    const url = `https://supabase.com/dashboard/project/${projectId}/functions/${functionName}/logs`;
    window.open(url, '_blank');
  };

  return (
    <Card className="border-dashed border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Monitor Edge Function
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openSupabaseLogs}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver Logs Completos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {lastRefresh && (
            <div className="text-sm text-muted-foreground">
              Última atualização: {lastRefresh}
            </div>
          )}

          {logs.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Terminal className="h-8 w-8 mr-2" />
              Nenhum log encontrado. Execute uma auditoria para ver os logs.
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Logs da Edge Function (seo-audit):</h4>
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg border"
                >
                  <Badge
                    variant={getStatusColor(log.status_code)}
                    className="mt-0.5"
                  >
                    {log.status_code || 'INFO'}
                  </Badge>
                  <div className="flex-1">
                    <div className="text-sm font-mono">
                      {log.event_message}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span>{formatTimestamp(log.timestamp)}</span>
                      {log.method && (
                        <span>Método: {log.method}</span>
                      )}
                      {log.execution_time_ms && (
                        <span>Tempo: {log.execution_time_ms}ms</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              💡 <strong>Dica:</strong> Os logs mostram o estado atual da edge function seo-audit. 
              Para ver logs em tempo real, clique em "Ver Logs Completos" para acessar o painel do Supabase.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};