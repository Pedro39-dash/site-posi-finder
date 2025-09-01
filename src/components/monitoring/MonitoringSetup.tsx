import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { MonitoringService } from '@/services/monitoringService';
import { useProject } from '@/hooks/useProject';

interface MonitoringSetupProps {
  onSetupComplete: () => void;
}

export const MonitoringSetup: React.FC<MonitoringSetupProps> = ({ onSetupComplete }) => {
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [autoStart, setAutoStart] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { activeProject } = useProject();

  const handleSetup = async () => {
    if (!activeProject) {
      toast({
        title: "Erro",
        description: "Nenhum projeto ativo selecionado",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { success, error } = await MonitoringService.createMonitoringSession({
        project_id: activeProject.id,
        monitoring_frequency: frequency,
        metadata: {
          auto_start: autoStart,
          created_by: 'user'
        }
      });

      if (success) {
        toast({
          title: "Sucesso",
          description: "Monitoramento configurado com sucesso!",
        });
        onSetupComplete();
      } else {
        toast({
          title: "Erro",
          description: error || "Erro ao configurar monitoramento",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao configurar monitoramento",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!activeProject) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurar Monitoramento</CardTitle>
          <CardDescription>
            Selecione um projeto ativo para configurar o monitoramento
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurar Monitoramento</CardTitle>
        <CardDescription>
          Configure o monitoramento automático para o projeto "{activeProject.name}"
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="frequency">Frequência de Monitoramento</Label>
          <Select value={frequency} onValueChange={(value: any) => setFrequency(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a frequência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Diário</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-start">Iniciar Automaticamente</Label>
            <p className="text-sm text-muted-foreground">
              Começar o monitoramento imediatamente após a configuração
            </p>
          </div>
          <Switch
            id="auto-start"
            checked={autoStart}
            onCheckedChange={setAutoStart}
          />
        </div>

        <div className="pt-4">
          <Button 
            onClick={handleSetup} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Configurando...' : 'Configurar Monitoramento'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};