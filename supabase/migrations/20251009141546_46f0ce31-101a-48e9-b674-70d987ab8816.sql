-- 1. Criar constraint UNIQUE para permitir upserts no sync do Search Console
-- Isso permite que a edge function faça upserts corretos (1 registro por keyword por dia)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ranking_history_unique_per_day
ON ranking_history(keyword_ranking_id, recorded_at);

-- 2. Criar índice na foreign key para melhorar performance de JOINs
CREATE INDEX IF NOT EXISTS idx_ranking_history_keyword_ranking_id
ON ranking_history(keyword_ranking_id);

-- 3. Comentário explicativo
COMMENT ON INDEX idx_ranking_history_unique_per_day IS 
'Permite upserts na sync do Search Console (1 registro por keyword por dia)';