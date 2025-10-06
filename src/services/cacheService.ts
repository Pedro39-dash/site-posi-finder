import { supabase } from "@/integrations/supabase/client";

export interface CacheEntry {
  cache_key: string;
  data: any;
  expires_at: string;
  user_id: string;
}

export class CacheService {
  static DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours
  static SERP_TTL = 24 * 60 * 60 * 1000; // 24 hours for SERP results
  static ANALYSIS_TTL = 30 * 60 * 1000; // 30 minutes for analysis results

  // Set cache with custom TTL
  static async set(key: string, data: any, ttlMs: number = this.DEFAULT_TTL): Promise<void> {
    try {
      // Get current user ID for ownership tracking
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('⚠️ Cannot set cache: User not authenticated');
        return;
      }

      const expiresAt = new Date(Date.now() + ttlMs).toISOString();
      
      const { error } = await supabase
        .from('analysis_cache')
        .upsert(
          {
            cache_key: key,
            data: data,
            expires_at: expiresAt,
            user_id: user.id
          },
          { onConflict: 'cache_key' }
        );

      if (error) {
        console.error('❌ Cache set error:', error);
      } else {
        console.log('✅ Cache set:', key);
      }
    } catch (error) {
      console.error('❌ Cache set error:', error);
    }
  }

  // Get cache entry
  static async get<T>(key: string): Promise<T | null> {
    try {
      const { data, error } = await supabase
        .from('analysis_cache')
        .select('*')
        .eq('cache_key', key)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Not found
          console.error('❌ Cache get error:', error);
        }
        return null;
      }

      console.log('💰 Cache hit:', key);
      return data.data as T;
    } catch (error) {
      console.error('❌ Cache get error:', error);
      return null;
    }
  }

  // Delete cache entry
  static async delete(key: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('analysis_cache')
        .delete()
        .eq('cache_key', key);

      if (error) {
        console.error('❌ Cache delete error:', error);
      } else {
        console.log('🗑️ Cache deleted:', key);
      }
    } catch (error) {
      console.error('❌ Cache delete error:', error);
    }
  }

  // Delete cache entries by pattern
  static async deletePattern(pattern: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('analysis_cache')
        .delete()
        .like('cache_key', `%${pattern}%`);

      if (error) {
        console.error('❌ Cache delete pattern error:', error);
      } else {
        console.log('🗑️ Cache pattern deleted:', pattern);
      }
    } catch (error) {
      console.error('❌ Cache delete pattern error:', error);
    }
  }

  // Clean expired entries (maintenance)
  static async cleanExpired(): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('clean_expired_cache');

      if (error) {
        console.error('❌ Cache cleanup error:', error);
        return 0;
      }

      console.log(`🧹 Cleaned ${data} expired cache entries`);
      return data;
    } catch (error) {
      console.error('❌ Cache cleanup error:', error);
      return 0;
    }
  }

  // SERP cache helpers
  static serpCacheKey(keyword: string, domain: string, location: string = 'brazil'): string {
    return `serp:${keyword}:${domain}:${location}`;
  }

  static analysisCacheKey(analysisId: string): string {
    return `analysis:${analysisId}`;
  }

  static keywordCacheKey(keyword: string, domain: string): string {
    return `keyword:${keyword}:${domain}`;
  }

  // Cache SERP results
  static async setSerpCache(keyword: string, domain: string, data: any, location: string = 'brazil'): Promise<void> {
    const key = this.serpCacheKey(keyword, domain, location);
    await this.set(key, data, this.SERP_TTL);
  }

  // Get SERP cache
  static async getSerpCache<T>(keyword: string, domain: string, location: string = 'brazil'): Promise<T | null> {
    const key = this.serpCacheKey(keyword, domain, location);
    return await this.get<T>(key);
  }

  // Cache analysis results
  static async setAnalysisCache(analysisId: string, data: any): Promise<void> {
    const key = this.analysisCacheKey(analysisId);
    await this.set(key, data, this.ANALYSIS_TTL);
  }

  // Get analysis cache
  static async getAnalysisCache<T>(analysisId: string): Promise<T | null> {
    const key = this.analysisCacheKey(analysisId);
    return await this.get<T>(key);
  }

  // Invalidate analysis cache when updated
  // Clear cache entries for a specific analysis and all keyword variations
  static async invalidateAnalysisCache(analysisId: string): Promise<void> {
    const pattern = `competitive-analysis-${analysisId}`;
    await this.deletePattern(pattern);
  }

  // Clear cache for specific keyword filter  
  static async invalidateKeywordFilterCache(analysisId: string, keyword: string | null): Promise<void> {
    const key = `competitive-analysis-${analysisId}-keyword-${keyword || 'all'}`;
    await this.delete(key);
  }

  // Get cache stats (for debugging)
  static async getStats(): Promise<{ total: number; expired: number }> {
    try {
      const { data: totalData, error: totalError } = await supabase
        .from('analysis_cache')
        .select('count', { count: 'exact' });

      const { data: expiredData, error: expiredError } = await supabase
        .from('analysis_cache')
        .select('count', { count: 'exact' })
        .lt('expires_at', new Date().toISOString());

      if (totalError || expiredError) {
        console.error('Cache stats error:', totalError || expiredError);
        return { total: 0, expired: 0 };
      }

      return {
        total: totalData.length,
        expired: expiredData.length
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { total: 0, expired: 0 };
    }
  }
}