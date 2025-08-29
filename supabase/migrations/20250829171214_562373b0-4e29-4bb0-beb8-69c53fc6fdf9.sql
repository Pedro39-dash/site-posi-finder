-- Fase 5: Sistema de Monitoramento Contínuo e Dashboards

-- Tabela para monitoramento contínuo de projetos
CREATE TABLE public.monitoring_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  monitoring_frequency TEXT NOT NULL DEFAULT 'daily', -- daily, weekly, monthly
  last_check_at TIMESTAMP WITH TIME ZONE,
  next_check_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para notificações do sistema
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID,
  type TEXT NOT NULL, -- ranking_change, audit_complete, alert_triggered
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, urgent
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para métricas do dashboard
CREATE TABLE public.dashboard_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID,
  metric_type TEXT NOT NULL, -- total_keywords, avg_position, visibility_score, etc
  current_value NUMERIC NOT NULL DEFAULT 0,
  previous_value NUMERIC,
  change_percentage NUMERIC,
  period_type TEXT NOT NULL DEFAULT 'daily', -- daily, weekly, monthly
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Habilitar RLS
ALTER TABLE public.monitoring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas para monitoring_sessions
CREATE POLICY "Users can create monitoring sessions for their projects"
ON public.monitoring_sessions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = monitoring_sessions.project_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can view monitoring sessions of their projects"
ON public.monitoring_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = monitoring_sessions.project_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update monitoring sessions of their projects"
ON public.monitoring_sessions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = monitoring_sessions.project_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all monitoring sessions"
ON public.monitoring_sessions
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Políticas para notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications for users"
ON public.notifications
FOR INSERT
WITH CHECK (true); -- Permite inserção via sistema/edge functions

CREATE POLICY "Admins can view all notifications"
ON public.notifications
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Políticas para dashboard_metrics
CREATE POLICY "Users can view metrics for their projects"
ON public.dashboard_metrics
FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = dashboard_metrics.project_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "System can create metrics for projects"
ON public.dashboard_metrics
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = dashboard_metrics.project_id 
    AND user_id = dashboard_metrics.user_id
  )
);

CREATE POLICY "Admins can view all metrics"
ON public.dashboard_metrics
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Triggers para updated_at
CREATE TRIGGER update_monitoring_sessions_updated_at
BEFORE UPDATE ON public.monitoring_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para calcular métricas do dashboard
CREATE OR REPLACE FUNCTION public.calculate_dashboard_metrics(
  _user_id UUID,
  _project_id UUID DEFAULT NULL,
  _period_type TEXT DEFAULT 'daily'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _total_keywords INTEGER;
  _avg_position NUMERIC;
  _visibility_score NUMERIC;
  _ranking_changes INTEGER;
BEGIN
  -- Calcular total de keywords
  SELECT COUNT(*)
  INTO _total_keywords
  FROM keyword_rankings kr
  JOIN projects p ON p.id = kr.project_id
  WHERE p.user_id = _user_id
    AND (_project_id IS NULL OR kr.project_id = _project_id);
  
  -- Calcular posição média
  SELECT AVG(current_position)
  INTO _avg_position
  FROM keyword_rankings kr
  JOIN projects p ON p.id = kr.project_id
  WHERE p.user_id = _user_id
    AND (_project_id IS NULL OR kr.project_id = _project_id)
    AND current_position IS NOT NULL;
  
  -- Calcular score de visibilidade (exemplo simplificado)
  _visibility_score := CASE 
    WHEN _avg_position IS NULL THEN 0
    WHEN _avg_position <= 3 THEN 100
    WHEN _avg_position <= 10 THEN 70
    WHEN _avg_position <= 20 THEN 40
    ELSE 10
  END;
  
  -- Contar mudanças de ranking recentes
  SELECT COUNT(*)
  INTO _ranking_changes
  FROM ranking_history rh
  JOIN keyword_rankings kr ON kr.id = rh.keyword_ranking_id
  JOIN projects p ON p.id = kr.project_id
  WHERE p.user_id = _user_id
    AND (_project_id IS NULL OR kr.project_id = _project_id)
    AND rh.recorded_at > now() - INTERVAL '24 hours'
    AND rh.change_from_previous != 0;
  
  -- Inserir métricas
  INSERT INTO dashboard_metrics (user_id, project_id, metric_type, current_value, period_type)
  VALUES 
    (_user_id, _project_id, 'total_keywords', _total_keywords, _period_type),
    (_user_id, _project_id, 'avg_position', COALESCE(_avg_position, 0), _period_type),
    (_user_id, _project_id, 'visibility_score', _visibility_score, _period_type),
    (_user_id, _project_id, 'ranking_changes', _ranking_changes, _period_type);
END;
$$;