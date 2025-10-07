-- Create project_integrations table for OAuth connections
CREATE TABLE IF NOT EXISTS public.project_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL CHECK (integration_type IN ('search_console', 'analytics')),
  
  -- OAuth tokens (encrypted by Supabase)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Integration specific settings
  property_id TEXT, -- For GSC: site URL
  view_id TEXT,     -- For GA4: Property ID
  
  -- Metadata
  account_email TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'active' CHECK (sync_status IN ('active', 'error', 'expired', 'disconnected')),
  sync_error TEXT,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(project_id, integration_type)
);

-- Add RLS policies for project_integrations
ALTER TABLE public.project_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage integrations for their projects"
  ON public.project_integrations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_integrations.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Add columns to keyword_rankings for real data
ALTER TABLE public.keyword_rankings
ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'manual' CHECK (data_source IN ('manual', 'search_console', 'serp_api')),
ADD COLUMN IF NOT EXISTS impressions INTEGER,
ADD COLUMN IF NOT EXISTS clicks INTEGER,
ADD COLUMN IF NOT EXISTS ctr REAL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_project_integrations_project_id ON public.project_integrations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_integrations_type ON public.project_integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_keyword_rankings_data_source ON public.keyword_rankings(data_source);

-- Add trigger to update updated_at
CREATE TRIGGER update_project_integrations_updated_at
  BEFORE UPDATE ON public.project_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();