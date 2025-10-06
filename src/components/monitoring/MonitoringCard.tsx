import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Play, Pause, Square, Settings, CheckCircle, XCircle, Clock } from 'lucide-react';
import { MonitoringSession } from '@/services/monitoringService';
import { supabase } from '@/integrations/supabase/client';

interface MonitoringCardProps {
  session: MonitoringSession;
  onStatusChange: (id: string, status: 'active' | 'paused' | 'stopped') => void;
  onSettings: (session: MonitoringSession) => void;
}

export const MonitoringCard: React.FC<MonitoringCardProps> = ({
  session,
  onStatusChange,
  onSettings
}) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [session.id]);

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      // Get monitoring config for this session
      const { data: config } = await supabase
        .from('monitoring_configs')
        .select('id')
        .eq('project_id', session.project_id)
        .single();

      if (config) {
        const { data: logsData } = await supabase
          .from('monitoring_logs')
          .select('*')
          .eq('config_id', config.id)
          .order('executed_at', { ascending: false })
          .limit(10);

        setLogs(logsData || []);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'stopped': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'Diário';
      case 'weekly': return 'Semanal';
      case 'monthly': return 'Mensal';
      default: return frequency;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg">Monitoramento do Projeto</CardTitle>
          <CardDescription>
            Frequência: {getFrequencyLabel(session.monitoring_frequency)}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(session.status)}`} />
            {session.status === 'active' ? 'Ativo' : 
             session.status === 'paused' ? 'Pausado' : 'Parado'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Última verificação:</p>
            <p className="font-medium">{formatDate(session.last_check_at)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Próxima verificação:</p>
            <p className="font-medium">{formatDate(session.next_check_at)}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {session.status === 'active' ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusChange(session.id, 'paused')}
            >
              <Pause className="w-4 h-4 mr-1" />
              Pausar
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusChange(session.id, 'active')}
            >
              <Play className="w-4 h-4 mr-1" />
              Iniciar
            </Button>
          )}
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStatusChange(session.id, 'stopped')}
            disabled={session.status === 'stopped'}
          >
            <Square className="w-4 h-4 mr-1" />
            Parar
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSettings(session)}
          >
            <Settings className="w-4 h-4 mr-1" />
            Configurar
          </Button>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="logs">
            <AccordionTrigger>
              📊 Histórico de Execuções (últimas 10)
            </AccordionTrigger>
            <AccordionContent>
              {loadingLogs ? (
                <p className="text-sm text-muted-foreground">Carregando logs...</p>
              ) : logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma execução registrada ainda.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Keywords</TableHead>
                      <TableHead>Notificações</TableHead>
                      <TableHead>Tempo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {new Date(log.executed_at).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          {log.status === 'success' ? (
                            <Badge variant="outline" className="gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Sucesso
                            </Badge>
                          ) : log.status === 'error' ? (
                            <Badge variant="destructive" className="gap-1">
                              <XCircle className="w-3 h-3" />
                              Erro
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <Clock className="w-3 h-3" />
                              Pendente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.results?.keywords_checked || 0} atualizadas
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.results?.notifications?.length || 0} criadas
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.execution_time_ms ? `${(log.execution_time_ms / 1000).toFixed(1)}s` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};