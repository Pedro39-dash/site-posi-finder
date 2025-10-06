-- Fix security vulnerability in analysis_cache table
-- Add user_id column to track ownership and implement proper RLS policies

-- Step 1: Add user_id column (nullable for backward compatibility with existing cache entries)
ALTER TABLE public.analysis_cache 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Create index for performance
CREATE INDEX idx_analysis_cache_user_id ON public.analysis_cache(user_id);
CREATE INDEX idx_analysis_cache_expires_at ON public.analysis_cache(expires_at);

-- Step 3: Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can manage their own cache" ON public.analysis_cache;

-- Step 4: Create proper user-scoped RLS policies
-- Users can only view their own cache entries
CREATE POLICY "Users can view their own cache"
ON public.analysis_cache
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can only create cache entries for themselves
CREATE POLICY "Users can create their own cache"
ON public.analysis_cache
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own cache entries
CREATE POLICY "Users can update their own cache"
ON public.analysis_cache
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can only delete their own cache entries
CREATE POLICY "Users can delete their own cache"
ON public.analysis_cache
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Step 5: Update clean_expired_cache function to handle user-scoped cache
CREATE OR REPLACE FUNCTION public.clean_expired_cache()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired cache entries
  DELETE FROM public.analysis_cache 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Also delete orphaned cache entries (no user_id) older than 7 days
  DELETE FROM public.analysis_cache
  WHERE user_id IS NULL 
    AND created_at < now() - INTERVAL '7 days';
  
  RETURN deleted_count;
END;
$$;

-- Step 6: Add comment explaining the security fix
COMMENT ON TABLE public.analysis_cache IS 
'Cache table for analysis results. RLS enforced to ensure users can only access their own cache entries.';

COMMENT ON COLUMN public.analysis_cache.user_id IS 
'Owner of the cache entry. NULL values are legacy entries that will be cleaned up after 7 days.';