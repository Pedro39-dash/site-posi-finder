import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, Settings } from 'lucide-react';
import { MonitoringSession } from '@/services/monitoringService';

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
      </CardContent>
    </Card>
  );
};