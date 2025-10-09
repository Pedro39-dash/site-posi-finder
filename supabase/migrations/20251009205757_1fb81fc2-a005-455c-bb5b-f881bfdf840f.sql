-- Adicionar campo tracking_status à tabela keyword_rankings
ALTER TABLE public.keyword_rankings 
ADD COLUMN IF NOT EXISTS tracking_status TEXT DEFAULT 'active' CHECK (tracking_status IN ('active', 'inactive', 'missing'));

-- Criar índice para queries de keywords por status
CREATE INDEX IF NOT EXISTS idx_keyword_rankings_tracking_status 
ON public.keyword_rankings(tracking_status);

-- Adicionar campo last_seen_at para rastrear quando a keyword foi vista pela última vez no GSC
ALTER TABLE public.keyword_rankings 
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Comentários explicativos
COMMENT ON COLUMN public.keyword_rankings.tracking_status IS 'Status do rastreamento: active (com dados recentes), inactive (sem dados no período), missing (desapareceu do GSC por >7 dias)';
COMMENT ON COLUMN public.keyword_rankings.last_seen_at IS 'Última vez que a keyword apareceu no Google Search Console';