-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar tabela para armazenar configurações de monitoramento automático
CREATE TABLE public.monitoring_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  monitoring_type text NOT NULL DEFAULT 'ranking',
  frequency text NOT NULL DEFAULT 'daily',
  is_active boolean DEFAULT true,
  last_run_at timestamp with time zone,
  next_run_at timestamp with time zone,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.monitoring_configs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can manage monitoring configs for their projects" 
ON public.monitoring_configs 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = monitoring_configs.project_id 
  AND projects.user_id = auth.uid()
));

-- Criar tabela para logs de execução do monitoramento
CREATE TABLE public.monitoring_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id uuid NOT NULL,
  execution_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  results jsonb DEFAULT '{}'::jsonb,
  error_message text,
  execution_time_ms integer,
  executed_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS para logs
ALTER TABLE public.monitoring_logs ENABLE ROW LEVEL SECURITY;

-- Política RLS para logs
CREATE POLICY "Users can view monitoring logs for their configs" 
ON public.monitoring_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM monitoring_configs mc
  JOIN projects p ON p.id = mc.project_id
  WHERE mc.id = monitoring_logs.config_id 
  AND p.user_id = auth.uid()
));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_monitoring_configs_updated_at
  BEFORE UPDATE ON public.monitoring_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar função para agendar monitoramento automático
CREATE OR REPLACE FUNCTION public.schedule_monitoring_job(
  _config_id uuid,
  _frequency text DEFAULT 'daily'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _cron_schedule text;
  _job_name text;
BEGIN
  -- Definir horário baseado na frequência
  CASE _frequency
    WHEN 'hourly' THEN _cron_schedule := '0 * * * *';
    WHEN 'daily' THEN _cron_schedule := '0 6 * * *';  -- 6h da manhã
    WHEN 'weekly' THEN _cron_schedule := '0 6 * * 1'; -- Segunda-feira 6h
    WHEN 'monthly' THEN _cron_schedule := '0 6 1 * *'; -- Dia 1 do mês 6h
    ELSE _cron_schedule := '0 6 * * *'; -- Default diário
  END CASE;
  
  _job_name := 'monitoring_job_' || _config_id;
  
  -- Agendar job usando pg_cron
  PERFORM cron.schedule(
    _job_name,
    _cron_schedule,
    format('
      SELECT net.http_post(
        url := ''https://yfvfklgjzmmobwfhdrqp.supabase.co/functions/v1/auto-monitoring'',
        headers := ''{"Content-Type": "application/json", "Authorization": "Bearer %s"}''::jsonb,
        body := ''{"config_id": "%s", "timestamp": "%s"}''::jsonb
      );
    ', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmdmZrbGdqem1tb2J3ZmhkcnFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDk2NDIsImV4cCI6MjA3MTc4NTY0Mn0.vD7U-SosUcUr3EvaG0SPUWcORCPy2EkhIBkM-Y1uX00', _config_id, now())
  );
  
  -- Atualizar próxima execução
  UPDATE public.monitoring_configs 
  SET next_run_at = now() + interval '1 hour'
  WHERE id = _config_id;
END;
$$;