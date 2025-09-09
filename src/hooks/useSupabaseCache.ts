import { useState, useEffect, useCallback } from 'react';
import { CacheService } from '@/services/cacheService';

interface CacheOptions {
  ttl?: number;
  enableAutoRefresh?: boolean;
  refreshInterval?: number;
}

export const useSupabaseCache = <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const {
    ttl = 15 * 60 * 1000, // 15 minutes - extended for maximum stability
    enableAutoRefresh = false, // Permanently disabled to eliminate glitches
    refreshInterval = 10 * 60 * 1000, // 10 minutes (not used when auto-refresh is disabled)
  } = options;

  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      setError(null);
      
      if (!forceRefresh) {
        // Try cache first
        const cachedData = await CacheService.get<T>(key);
        if (cachedData) {
          console.log('📋 Cache hit for:', key);
          // Normalize cached data to ensure consistency
          const normalizedData = normalizeData(cachedData);
          setData(normalizedData);
          setLoading(false);
          setLastUpdated(new Date());
          return normalizedData;
        }
      }

      console.log('🔄 Fetching fresh data for:', key);
      setLoading(true);
      
      const freshData = await fetcher();
      
      // Normalize fresh data before caching
      const normalizedData = normalizeData(freshData);
      
      // Cache the normalized data
      await CacheService.set(key, normalizedData, ttl);
      
      setData(normalizedData);
      setLastUpdated(new Date());
      
      return freshData;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      console.error('❌ Cache load error:', errorMessage);
      setError(errorMessage);
      
      // Try to return cached data on error
      const cachedData = await CacheService.get<T>(key);
      if (cachedData) {
        console.log('📋 Returning stale cache on error for:', key);
        setData(cachedData);
        setLastUpdated(new Date());
        return cachedData;
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl]);

  const refresh = useCallback(() => {
    return loadData(true);
  }, [loadData]);

  const invalidate = useCallback(async () => {
    await CacheService.delete(key);
    setData(null);
    setLastUpdated(null);
  }, [key]);

  const updateCache = useCallback(async (newData: T) => {
    await CacheService.set(key, newData, ttl);
    setData(newData);
    setLastUpdated(new Date());
  }, [key, ttl]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh
  useEffect(() => {
    if (!enableAutoRefresh) return;

    const interval = setInterval(() => {
      loadData(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [enableAutoRefresh, refreshInterval, loadData]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
    invalidate,
    updateCache,
    isStale: lastUpdated ? Date.now() - lastUpdated.getTime() > ttl : false
  };
};

/**
 * Normalize data to ensure consistent structure and prevent hook instability
 */
function normalizeData<T>(data: T): T {
  if (!data || typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map(item => normalizeData(item)) as T;
  }
  
  // For objects, ensure all properties exist and have consistent types
  const normalized = { ...data } as any;
  
  // Special handling for competitive analysis data
  if (normalized.keywords && Array.isArray(normalized.keywords)) {
    normalized.keywords = normalized.keywords.map((keyword: any) => ({
      ...keyword,
      search_volume: keyword.search_volume ?? 0,
      target_domain_position: keyword.target_domain_position ?? null,
      competitor_positions: keyword.competitor_positions ?? [],
      competition_level: keyword.competition_level ?? null,
      metadata: keyword.metadata ?? {}
    }));
  }
  
  if (normalized.competitors && Array.isArray(normalized.competitors)) {
    normalized.competitors = normalized.competitors.map((competitor: any) => ({
      ...competitor,
      relevance_score: competitor.relevance_score ?? 0,
      total_keywords_found: competitor.total_keywords_found ?? 0,
      average_position: competitor.average_position ?? 0,
      share_of_voice: competitor.share_of_voice ?? 0,
      metadata: competitor.metadata ?? {}
    }));
  }
  
  return normalized as T;
}

// Specialized hooks for common use cases
export const useSerpCache = <T>(
  keyword: string,
  domain: string,
  fetcher: () => Promise<T>,
  location: string = 'brazil'
) => {
  const key = CacheService.serpCacheKey(keyword, domain, location);
  return useSupabaseCache(key, fetcher, {
    ttl: CacheService.SERP_TTL,
    enableAutoRefresh: false
  });
};

export const useAnalysisCache = <T>(
  analysisId: string,
  fetcher: () => Promise<T>
) => {
  const key = CacheService.analysisCacheKey(analysisId);
  return useSupabaseCache(key, fetcher, {
    ttl: CacheService.ANALYSIS_TTL,
    enableAutoRefresh: true,
    refreshInterval: 3 * 60 * 1000 // 3 minutes for active analyses
  });
};

export const useKeywordCache = <T>(
  keyword: string,
  domain: string,
  fetcher: () => Promise<T>
) => {
  const key = CacheService.keywordCacheKey(keyword, domain);
  return useSupabaseCache(key, fetcher, {
    ttl: CacheService.SERP_TTL,
    enableAutoRefresh: false
  });
};

// Cache management hook
export const useCacheManager = () => {
  const [stats, setStats] = useState({ total: 0, expired: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const getStats = useCallback(async () => {
    const cacheStats = await CacheService.getStats();
    setStats(cacheStats);
    return cacheStats;
  }, []);

  const cleanExpired = useCallback(async () => {
    setIsLoading(true);
    try {
      const deletedCount = await CacheService.cleanExpired();
      await getStats(); // Refresh stats
      return deletedCount;
    } finally {
      setIsLoading(false);
    }
  }, [getStats]);

  const clearPattern = useCallback(async (pattern: string) => {
    setIsLoading(true);
    try {
      await CacheService.deletePattern(pattern);
      await getStats(); // Refresh stats
    } finally {
      setIsLoading(false);
    }
  }, [getStats]);

  useEffect(() => {
    getStats();
  }, [getStats]);

  return {
    stats,
    isLoading,
    getStats,
    cleanExpired,
    clearPattern
  };
};