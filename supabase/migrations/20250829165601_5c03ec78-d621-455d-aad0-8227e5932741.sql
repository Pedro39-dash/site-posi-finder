-- Create ranking monitoring tables for persistent tracking
CREATE TABLE public.keyword_rankings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  keyword TEXT NOT NULL,
  current_position INTEGER,
  previous_position INTEGER,
  url TEXT,
  search_engine TEXT NOT NULL DEFAULT 'google',
  location TEXT DEFAULT 'brazil',
  device TEXT NOT NULL DEFAULT 'desktop',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create ranking history for temporal analysis
CREATE TABLE public.ranking_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword_ranking_id UUID NOT NULL,
  position INTEGER NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  change_from_previous INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create keyword suggestions table for discovery
CREATE TABLE public.keyword_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  suggested_keyword TEXT NOT NULL,
  source_type TEXT NOT NULL, -- 'semantic', 'competitor', 'content', 'trends'
  relevance_score INTEGER DEFAULT 0,
  search_volume INTEGER,
  difficulty_score INTEGER,
  suggested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create alerts table for monitoring changes
CREATE TABLE public.ranking_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  keyword TEXT NOT NULL,
  alert_type TEXT NOT NULL, -- 'position_drop', 'position_gain', 'new_ranking', 'lost_ranking'
  threshold_value INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_triggered TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on all tables
ALTER TABLE public.keyword_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranking_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for keyword_rankings
CREATE POLICY "Users can view their project rankings" 
ON public.keyword_rankings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = keyword_rankings.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create rankings for their projects" 
ON public.keyword_rankings 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = keyword_rankings.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their project rankings" 
ON public.keyword_rankings 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = keyword_rankings.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their project rankings" 
ON public.keyword_rankings 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = keyword_rankings.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Create RLS policies for ranking_history
CREATE POLICY "Users can view ranking history of their projects" 
ON public.ranking_history 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.keyword_rankings kr
    JOIN public.projects p ON p.id = kr.project_id
    WHERE kr.id = ranking_history.keyword_ranking_id 
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create ranking history for their projects" 
ON public.ranking_history 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.keyword_rankings kr
    JOIN public.projects p ON p.id = kr.project_id
    WHERE kr.id = ranking_history.keyword_ranking_id 
    AND p.user_id = auth.uid()
  )
);

-- Create RLS policies for keyword_suggestions
CREATE POLICY "Users can view suggestions for their projects" 
ON public.keyword_suggestions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = keyword_suggestions.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create suggestions for their projects" 
ON public.keyword_suggestions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = keyword_suggestions.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update suggestions for their projects" 
ON public.keyword_suggestions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = keyword_suggestions.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete suggestions for their projects" 
ON public.keyword_suggestions 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = keyword_suggestions.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Create RLS policies for ranking_alerts
CREATE POLICY "Users can manage alerts for their projects" 
ON public.ranking_alerts 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = ranking_alerts.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_keyword_rankings_project_id ON public.keyword_rankings(project_id);
CREATE INDEX idx_keyword_rankings_keyword ON public.keyword_rankings(keyword);
CREATE INDEX idx_ranking_history_keyword_ranking_id ON public.ranking_history(keyword_ranking_id);
CREATE INDEX idx_ranking_history_recorded_at ON public.ranking_history(recorded_at);
CREATE INDEX idx_keyword_suggestions_project_id ON public.keyword_suggestions(project_id);
CREATE INDEX idx_ranking_alerts_project_id ON public.ranking_alerts(project_id);

-- Create triggers for updated_at
CREATE TRIGGER update_keyword_rankings_updated_at
BEFORE UPDATE ON public.keyword_rankings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create ranking history entries
CREATE OR REPLACE FUNCTION public.create_ranking_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create history if position actually changed
  IF NEW.current_position IS DISTINCT FROM OLD.current_position THEN
    INSERT INTO public.ranking_history (
      keyword_ranking_id,
      position,
      change_from_previous
    ) VALUES (
      NEW.id,
      NEW.current_position,
      COALESCE(NEW.current_position - OLD.current_position, 0)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;