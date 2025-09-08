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
    ttl = CacheService.DEFAULT_TTL,
    enableAutoRefresh = false,
    refreshInterval = 5 * 60 * 1000 // 5 minutes
  } = options;

  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      setError(null);
      
      if (!forceRefresh) {
        // Try cache first
        const cachedData = await CacheService.get<T>(key);
        if (cachedData) {
          console.log('📋 Cache hit for:', key);
          setData(cachedData);
          setLoading(false);
          setLastUpdated(new Date());
          return cachedData;
        }
      }

      console.log('🔄 Fetching fresh data for:', key);
      setLoading(true);
      
      const freshData = await fetcher();
      
      // Cache the fresh data
      await CacheService.set(key, freshData, ttl);
      
      setData(freshData);
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