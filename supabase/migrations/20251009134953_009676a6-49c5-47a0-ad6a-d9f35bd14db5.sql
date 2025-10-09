-- Add metadata column to ranking_history for data source tracking
ALTER TABLE ranking_history 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for data_source lookup
CREATE INDEX IF NOT EXISTS idx_ranking_history_metadata_data_source 
ON ranking_history ((metadata->>'data_source'));

-- Create index to help with date-based queries
CREATE INDEX IF NOT EXISTS idx_ranking_history_recorded_at 
ON ranking_history (keyword_ranking_id, recorded_at DESC);