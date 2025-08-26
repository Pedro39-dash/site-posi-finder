-- Add metadata column to audit_issues table to store keywords and AI prompts
ALTER TABLE public.audit_issues 
ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;