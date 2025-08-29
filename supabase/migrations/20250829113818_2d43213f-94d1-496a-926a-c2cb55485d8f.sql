-- Create a separate table for storing large keyword arrays to avoid JSONB size limits
CREATE TABLE IF NOT EXISTS public.audit_keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_report_id UUID NOT NULL,
  category TEXT NOT NULL,
  keyword TEXT NOT NULL,
  relevance_score INTEGER DEFAULT 0,
  keyword_type TEXT DEFAULT 'extracted',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for the new table
ALTER TABLE public.audit_keywords ENABLE ROW LEVEL SECURITY;

-- Create policies for keyword access
CREATE POLICY "Users can view keywords of their reports" 
ON public.audit_keywords 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM audit_reports 
  WHERE audit_reports.id = audit_keywords.audit_report_id 
  AND audit_reports.user_id = auth.uid()
));

CREATE POLICY "Users can create keywords for their reports" 
ON public.audit_keywords 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM audit_reports 
  WHERE audit_reports.id = audit_keywords.audit_report_id 
  AND audit_reports.user_id = auth.uid()
));

CREATE POLICY "Users can update keywords of their reports" 
ON public.audit_keywords 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM audit_reports 
  WHERE audit_reports.id = audit_keywords.audit_report_id 
  AND audit_reports.user_id = auth.uid()
));

CREATE POLICY "Users can delete keywords of their reports" 
ON public.audit_keywords 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM audit_reports 
  WHERE audit_reports.id = audit_keywords.audit_report_id 
  AND audit_reports.user_id = auth.uid()
));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_keywords_report_id ON public.audit_keywords(audit_report_id);
CREATE INDEX IF NOT EXISTS idx_audit_keywords_category ON public.audit_keywords(category);
CREATE INDEX IF NOT EXISTS idx_audit_keywords_relevance ON public.audit_keywords(relevance_score DESC);