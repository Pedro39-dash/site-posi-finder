-- Add foreign key constraint from ranking_history to keyword_rankings
ALTER TABLE ranking_history 
ADD CONSTRAINT fk_ranking_history_keyword_ranking 
FOREIGN KEY (keyword_ranking_id) 
REFERENCES keyword_rankings(id) 
ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_ranking_history_keyword_ranking_id 
ON ranking_history(keyword_ranking_id);