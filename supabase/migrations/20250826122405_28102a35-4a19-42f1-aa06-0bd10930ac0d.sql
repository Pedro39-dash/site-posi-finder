-- Create audit_reports table for storing complete audit reports
CREATE TABLE public.audit_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  overall_score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, analyzing, completed, failed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create audit_categories table for category-specific results
CREATE TABLE public.audit_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_report_id UUID NOT NULL REFERENCES public.audit_reports(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- meta_tags, html_structure, performance, links, mobile_friendly
  score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL, -- excellent, good, needs_improvement, critical
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit_issues table for specific issues found
CREATE TABLE public.audit_issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_category_id UUID NOT NULL REFERENCES public.audit_categories(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- success, warning, error
  message TEXT NOT NULL,
  priority TEXT NOT NULL, -- high, medium, low
  recommendation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.audit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_issues ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audit_reports
CREATE POLICY "Users can view their own audit reports" 
ON public.audit_reports 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own audit reports" 
ON public.audit_reports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own audit reports" 
ON public.audit_reports 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own audit reports" 
ON public.audit_reports 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for audit_categories
CREATE POLICY "Users can view audit categories of their reports" 
ON public.audit_categories 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.audit_reports 
    WHERE id = audit_categories.audit_report_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create audit categories for their reports" 
ON public.audit_categories 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.audit_reports 
    WHERE id = audit_categories.audit_report_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update audit categories of their reports" 
ON public.audit_categories 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.audit_reports 
    WHERE id = audit_categories.audit_report_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete audit categories of their reports" 
ON public.audit_categories 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.audit_reports 
    WHERE id = audit_categories.audit_report_id 
    AND user_id = auth.uid()
  )
);

-- Create RLS policies for audit_issues
CREATE POLICY "Users can view audit issues of their reports" 
ON public.audit_issues 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.audit_categories ac
    JOIN public.audit_reports ar ON ac.audit_report_id = ar.id
    WHERE ac.id = audit_issues.audit_category_id 
    AND ar.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create audit issues for their reports" 
ON public.audit_issues 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.audit_categories ac
    JOIN public.audit_reports ar ON ac.audit_report_id = ar.id
    WHERE ac.id = audit_issues.audit_category_id 
    AND ar.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update audit issues of their reports" 
ON public.audit_issues 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.audit_categories ac
    JOIN public.audit_reports ar ON ac.audit_report_id = ar.id
    WHERE ac.id = audit_issues.audit_category_id 
    AND ar.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete audit issues of their reports" 
ON public.audit_issues 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.audit_categories ac
    JOIN public.audit_reports ar ON ac.audit_report_id = ar.id
    WHERE ac.id = audit_issues.audit_category_id 
    AND ar.user_id = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates on audit_reports
CREATE TRIGGER update_audit_reports_updated_at
  BEFORE UPDATE ON public.audit_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_audit_reports_user_id ON public.audit_reports(user_id);
CREATE INDEX idx_audit_reports_url ON public.audit_reports(url);
CREATE INDEX idx_audit_reports_status ON public.audit_reports(status);
CREATE INDEX idx_audit_categories_audit_report_id ON public.audit_categories(audit_report_id);
CREATE INDEX idx_audit_issues_audit_category_id ON public.audit_issues(audit_category_id);