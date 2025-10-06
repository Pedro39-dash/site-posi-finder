import { supabase } from '@/integrations/supabase/client';

interface SerpPosition {
  position: number;
  url: string;
  title: string;
  snippet: string;
}

interface SerpCompetitor {
  domain: string;
  position: number;
  url: string;
  title: string;
}

interface KeywordCheckResult {
  keyword: string;
  position: number | null;
  url: string | null;
  competitors: SerpCompetitor[];
  relatedSearches: string[];
  serpFeatures: string[];
}

// Rate limiting: 3 requests per second
const RATE_LIMIT_DELAY = 350; // ms between requests
let lastRequestTime = 0;

async function respectRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
}

export const SerpApiService = {
  /**
   * Check keyword position via SerpAPI
   */
  async checkKeywordPosition(
    keyword: string,
    targetDomain: string,
    location: string = 'Brazil',
    device: string = 'desktop'
  ): Promise<KeywordCheckResult> {
    await respectRateLimit();
    
    try {
      const { data, error } = await supabase.functions.invoke('web-scraper', {
        body: {
          keyword,
          targetDomain,
          location,
          device,
          type: 'serp_check'
        }
      });

      if (error) throw error;

      return {
        keyword,
        position: data.position || null,
        url: data.url || null,
        competitors: data.competitors || [],
        relatedSearches: data.relatedSearches || [],
        serpFeatures: data.serpFeatures || []
      };
    } catch (error) {
      console.error('Error checking keyword position:', error);
      throw error;
    }
  },

  /**
   * Batch check multiple keywords
   */
  async batchCheckPositions(
    keywords: string[],
    targetDomain: string,
    location: string = 'Brazil',
    device: string = 'desktop',
    onProgress?: (current: number, total: number) => void
  ): Promise<KeywordCheckResult[]> {
    const results: KeywordCheckResult[] = [];
    
    for (let i = 0; i < keywords.length; i++) {
      try {
        const result = await this.checkKeywordPosition(
          keywords[i],
          targetDomain,
          location,
          device
        );
        results.push(result);
        
        if (onProgress) {
          onProgress(i + 1, keywords.length);
        }
      } catch (error) {
        console.error(`Error checking keyword "${keywords[i]}":`, error);
        // Continue with next keyword
        results.push({
          keyword: keywords[i],
          position: null,
          url: null,
          competitors: [],
          relatedSearches: [],
          serpFeatures: []
        });
      }
    }
    
    return results;
  },

  /**
   * Get related keywords from SerpAPI
   */
  async getRelatedKeywords(keyword: string): Promise<Array<{ keyword: string; source: string; relevance: number }>> {
    await respectRateLimit();
    
    try {
      const { data, error } = await supabase.functions.invoke('web-scraper', {
        body: {
          keyword,
          type: 'related_searches'
        }
      });

      if (error) throw error;

      return data.relatedKeywords || [];
    } catch (error) {
      console.error('Error fetching related keywords:', error);
      return [];
    }
  },

  /**
   * Get competitors for a keyword (Top 10 domains)
   */
  async getCompetitorsForKeyword(keyword: string): Promise<SerpCompetitor[]> {
    await respectRateLimit();
    
    try {
      const { data, error } = await supabase.functions.invoke('web-scraper', {
        body: {
          keyword,
          type: 'competitor_analysis'
        }
      });

      if (error) throw error;

      return data.competitors || [];
    } catch (error) {
      console.error('Error fetching competitors:', error);
      return [];
    }
  }
};
