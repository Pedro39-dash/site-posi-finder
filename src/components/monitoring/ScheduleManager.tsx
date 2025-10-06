import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Clock, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ScheduleManagerProps {
  configId: string;
  currentFrequency: string;
  isActive: boolean;
  onUpdate: () => void;
}

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({
  configId,
  currentFrequency,
  isActive,
  onUpdate
}) => {
  const { toast } = useToast();
  const [frequency, setFrequency] = useState(currentFrequency);
  const [active, setActive] = useState(isActive);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('monitoring_configs')
        .update({
          frequency,
          is_active: active,
          updated_at: new Date().toISOString()
        })
        .eq('id', configId);

      if (error) throw error;

      toast({
        title: 'Agendamento atualizado',
        description: 'As configurações de monitoramento foram salvas.',
      });

      onUpdate();
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o agendamento.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunNow = async () => {
    setIsRunning(true);
    try {
      const { error } = await supabase.functions.invoke('auto-monitoring', {
        body: { config_id: configId }
      });

      if (error) throw error;

      toast({
        title: 'Monitoramento iniciado',
        description: 'A verificação está sendo executada em background.',
      });

      // Refresh after a delay
      setTimeout(onUpdate, 3000);
    } catch (error) {
      console.error('Error running monitoring:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível executar o monitoramento.',
        variant: 'destructive'
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Configuração de Agendamento
        </CardTitle>
        <CardDescription>
          Configure a frequência de verificação automática das posições
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="frequency">Frequência de verificação</Label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger id="frequency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">A cada hora</SelectItem>
              <SelectItem value="daily">Diariamente (9h)</SelectItem>
              <SelectItem value="weekly">Semanalmente (Segunda 9h)</SelectItem>
              <SelectItem value="monthly">Mensalmente (Dia 1 às 9h)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="active">Monitoramento ativo</Label>
          <Switch
            id="active"
            checked={active}
            onCheckedChange={setActive}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleRunNow}
            disabled={isRunning}
          >
            <Play className="w-4 h-4 mr-2" />
            {isRunning ? 'Executando...' : 'Executar Agora'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
