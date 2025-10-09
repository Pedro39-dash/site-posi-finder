-- Garantir que keywords manuais existentes sejam sempre 'active'
UPDATE keyword_rankings 
SET tracking_status = 'active',
    last_seen_at = now()
WHERE data_source = 'manual' 
  AND tracking_status != 'active';

-- Adicionar constraint para garantir que keywords manuais sempre sejam 'active'
ALTER TABLE keyword_rankings 
ADD CONSTRAINT manual_keywords_always_active 
CHECK (
  data_source != 'manual' OR tracking_status = 'active'
);