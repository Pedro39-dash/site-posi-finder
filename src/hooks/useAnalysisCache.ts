import { useState, useEffect } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class AnalysisCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Get all keys matching a pattern
  invalidatePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

const globalCache = new AnalysisCache();

export const useAnalysisCache = () => {
  const [cacheVersion, setCacheVersion] = useState(0);

  const setCache = <T>(key: string, data: T, ttl?: number) => {
    globalCache.set(key, data, ttl);
    setCacheVersion(prev => prev + 1);
  };

  const getCache = <T>(key: string): T | null => {
    return globalCache.get<T>(key);
  };

  const invalidateCache = (key: string) => {
    globalCache.invalidate(key);
    setCacheVersion(prev => prev + 1);
  };

  const clearCache = () => {
    globalCache.clear();
    setCacheVersion(prev => prev + 1);
  };

  const invalidatePattern = (pattern: string) => {
    globalCache.invalidatePattern(pattern);
    setCacheVersion(prev => prev + 1);
  };

  return {
    setCache,
    getCache,
    invalidateCache,
    clearCache,
    invalidatePattern,
    cacheVersion
  };
};

export default useAnalysisCache;