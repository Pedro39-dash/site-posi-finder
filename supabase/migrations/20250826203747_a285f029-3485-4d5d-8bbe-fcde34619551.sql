-- Create tables for competitive analysis system

-- Table to store competitive analysis reports
CREATE TABLE public.competitor_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  audit_report_id UUID REFERENCES public.audit_reports(id) ON DELETE CASCADE,
  target_domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_keywords INTEGER DEFAULT 0,
  total_competitors INTEGER DEFAULT 0,
  overall_competitiveness_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Table to store identified competitor domains
CREATE TABLE public.competitor_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID NOT NULL REFERENCES public.competitor_analyses(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  relevance_score INTEGER DEFAULT 0,
  total_keywords_found INTEGER DEFAULT 0,
  average_position DECIMAL(5,2),
  share_of_voice DECIMAL(5,2) DEFAULT 0,
  detected_automatically BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Table to store keyword positions for competitors
CREATE TABLE public.competitor_keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID NOT NULL REFERENCES public.competitor_analyses(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  target_domain_position INTEGER,
  competitor_positions JSONB DEFAULT '[]'::jsonb, -- Array of {domain, position, url}
  search_volume INTEGER,
  competition_level TEXT, -- 'low', 'medium', 'high'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Table to store identified opportunities
CREATE TABLE public.keyword_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID NOT NULL REFERENCES public.competitor_analyses(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  opportunity_type TEXT NOT NULL, -- 'missing_keyword', 'low_position', 'competitor_advantage'
  target_position INTEGER,
  best_competitor_position INTEGER,
  best_competitor_domain TEXT,
  priority_score INTEGER DEFAULT 0,
  gap_size INTEGER DEFAULT 0,
  recommended_action TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE public.competitor_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_opportunities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for competitor_analyses
CREATE POLICY "Users can view their own competitive analyses" 
  ON public.competitor_analyses 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own competitive analyses" 
  ON public.competitor_analyses 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own competitive analyses" 
  ON public.competitor_analyses 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own competitive analyses" 
  ON public.competitor_analyses 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for competitor_domains
CREATE POLICY "Users can view competitor domains of their analyses" 
  ON public.competitor_domains 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.competitor_analyses 
    WHERE id = competitor_domains.analysis_id 
    AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create competitor domains for their analyses" 
  ON public.competitor_domains 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.competitor_analyses 
    WHERE id = competitor_domains.analysis_id 
    AND user_id = auth.uid()
  ));

CREATE POLICY "Users can update competitor domains of their analyses" 
  ON public.competitor_domains 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.competitor_analyses 
    WHERE id = competitor_domains.analysis_id 
    AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete competitor domains of their analyses" 
  ON public.competitor_domains 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.competitor_analyses 
    WHERE id = competitor_domains.analysis_id 
    AND user_id = auth.uid()
  ));

-- RLS Policies for competitor_keywords
CREATE POLICY "Users can view competitor keywords of their analyses" 
  ON public.competitor_keywords 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.competitor_analyses 
    WHERE id = competitor_keywords.analysis_id 
    AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create competitor keywords for their analyses" 
  ON public.competitor_keywords 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.competitor_analyses 
    WHERE id = competitor_keywords.analysis_id 
    AND user_id = auth.uid()
  ));

CREATE POLICY "Users can update competitor keywords of their analyses" 
  ON public.competitor_keywords 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.competitor_analyses 
    WHERE id = competitor_keywords.analysis_id 
    AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete competitor keywords of their analyses" 
  ON public.competitor_keywords 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.competitor_analyses 
    WHERE id = competitor_keywords.analysis_id 
    AND user_id = auth.uid()
  ));

-- RLS Policies for keyword_opportunities
CREATE POLICY "Users can view keyword opportunities of their analyses" 
  ON public.keyword_opportunities 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.competitor_analyses 
    WHERE id = keyword_opportunities.analysis_id 
    AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create keyword opportunities for their analyses" 
  ON public.keyword_opportunities 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.competitor_analyses 
    WHERE id = keyword_opportunities.analysis_id 
    AND user_id = auth.uid()
  ));

CREATE POLICY "Users can update keyword opportunities of their analyses" 
  ON public.keyword_opportunities 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.competitor_analyses 
    WHERE id = keyword_opportunities.analysis_id 
    AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete keyword opportunities of their analyses" 
  ON public.keyword_opportunities 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.competitor_analyses 
    WHERE id = keyword_opportunities.analysis_id 
    AND user_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX idx_competitor_analyses_user_id ON public.competitor_analyses(user_id);
CREATE INDEX idx_competitor_analyses_audit_report_id ON public.competitor_analyses(audit_report_id);
CREATE INDEX idx_competitor_domains_analysis_id ON public.competitor_domains(analysis_id);
CREATE INDEX idx_competitor_keywords_analysis_id ON public.competitor_keywords(analysis_id);
CREATE INDEX idx_competitor_keywords_keyword ON public.competitor_keywords(keyword);
CREATE INDEX idx_keyword_opportunities_analysis_id ON public.keyword_opportunities(analysis_id);
CREATE INDEX idx_keyword_opportunities_priority_score ON public.keyword_opportunities(priority_score DESC);

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_competitor_analyses_updated_at
  BEFORE UPDATE ON public.competitor_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();