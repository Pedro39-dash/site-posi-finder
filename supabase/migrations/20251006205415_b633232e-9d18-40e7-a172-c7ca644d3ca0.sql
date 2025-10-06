-- Create keyword_tags table for custom tagging system
CREATE TABLE IF NOT EXISTS public.keyword_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_ranking_id UUID NOT NULL REFERENCES public.keyword_rankings(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  tag_color TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(keyword_ranking_id, tag_name)
);

-- Enable RLS
ALTER TABLE public.keyword_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for keyword_tags
CREATE POLICY "Users can view tags for their project keywords"
  ON public.keyword_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM keyword_rankings kr
      JOIN projects p ON p.id = kr.project_id
      WHERE kr.id = keyword_tags.keyword_ranking_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tags for their project keywords"
  ON public.keyword_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM keyword_rankings kr
      JOIN projects p ON p.id = kr.project_id
      WHERE kr.id = keyword_tags.keyword_ranking_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tags for their project keywords"
  ON public.keyword_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM keyword_rankings kr
      JOIN projects p ON p.id = kr.project_id
      WHERE kr.id = keyword_tags.keyword_ranking_id
        AND p.user_id = auth.uid()
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_keyword_tags_keyword_ranking_id ON public.keyword_tags(keyword_ranking_id);
CREATE INDEX IF NOT EXISTS idx_keyword_tags_tag_name ON public.keyword_tags(tag_name);