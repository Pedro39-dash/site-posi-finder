-- Create advanced caching system for competitor analysis
CREATE TABLE public.analysis_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on cache table
ALTER TABLE public.analysis_cache ENABLE ROW LEVEL SECURITY;

-- Create policy for cache access
CREATE POLICY "Users can manage their own cache" 
ON public.analysis_cache 
FOR ALL 
USING (true); -- Public cache for now, can be restricted later

-- Create index for efficient cache lookups
CREATE INDEX idx_analysis_cache_key ON public.analysis_cache(cache_key);
CREATE INDEX idx_analysis_cache_expires ON public.analysis_cache(expires_at);

-- Create function to clean expired cache entries
CREATE OR REPLACE FUNCTION public.clean_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.analysis_cache 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_analysis_cache_updated_at
BEFORE UPDATE ON public.analysis_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();