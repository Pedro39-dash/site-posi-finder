-- Corrigir funções sem search_path definido
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.schedule_monitoring_job(
  _config_id uuid,
  _frequency text DEFAULT 'daily'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
        headers := ''{\"Content-Type\": \"application/json\", \"Authorization\": \"Bearer %s\"}''::jsonb,
        body := ''{\"config_id\": \"%s\", \"timestamp\": \"%s\"}''::jsonb
      );
    ', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmdmZrbGdqem1tb2J3ZmhkcnFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDk2NDIsImV4cCI6MjA3MTc4NTY0Mn0.vD7U-SosUcUr3EvaG0SPUWcORCPy2EkhIBkM-Y1uX00', _config_id, now())
  );
  
  -- Atualizar próxima execução
  UPDATE public.monitoring_configs 
  SET next_run_at = now() + interval '1 hour'
  WHERE id = _config_id;
END;
$$;