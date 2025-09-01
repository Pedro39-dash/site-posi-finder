-- Corrigir função com search_path seguro
CREATE OR REPLACE FUNCTION public.calculate_dashboard_metrics(
  _user_id UUID,
  _project_id UUID DEFAULT NULL,
  _period_type TEXT DEFAULT 'daily'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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