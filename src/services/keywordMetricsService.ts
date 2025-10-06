import { supabase } from "@/integrations/supabase/client";

export interface KeywordDetail {
  id: string;
  keyword: string;
  currentPosition: number | null;
  previousPosition: number | null;
  change: number;
  url: string | null;
  searchEngine: string;
  location: string;
  device: string;
  estimatedTraffic: number;
  lastUpdated: string;
}

export interface PageMetrics {
  url: string;
  totalKeywords: number;
  avgPosition: number;
  estimatedTraffic: number;
  improvements: number;
  declines: number;
  topKeywords: string[];
}

export class KeywordMetricsService {
  private static estimateTrafficFromPosition(position: number, searchVolume: number = 1000): number {
    const ctrByPosition: { [key: number]: number } = {
      1: 0.3945,
      2: 0.1851,
      3: 0.1134,
      4: 0.0845,
      5: 0.0666,
      6: 0.0544,
      7: 0.0454,
      8: 0.0387,
      9: 0.0335,
      10: 0.0293,
    };
    
    if (position <= 10) {
      return Math.round(searchVolume * (ctrByPosition[position] || 0.02));
    } else if (position <= 20) {
      return Math.round(searchVolume * 0.015);
    } else if (position <= 50) {
      return Math.round(searchVolume * 0.005);
    }
    return Math.round(searchVolume * 0.001);
  }

  static async getKeywordDetails(projectId: string): Promise<KeywordDetail[]> {
    try {
      const { data, error } = await supabase
        .from('keyword_rankings')
        .select('*')
        .eq('project_id', projectId)
        .order('current_position', { ascending: true, nullsFirst: false });

      if (error) throw error;

      return (data || []).map(kr => {
        const change = kr.current_position && kr.previous_position 
          ? kr.previous_position - kr.current_position 
          : 0;
        
        return {
          id: kr.id,
          keyword: kr.keyword,
          currentPosition: kr.current_position,
          previousPosition: kr.previous_position,
          change,
          url: kr.url,
          searchEngine: kr.search_engine,
          location: kr.location || 'brazil',
          device: kr.device,
          estimatedTraffic: kr.current_position 
            ? this.estimateTrafficFromPosition(kr.current_position) 
            : 0,
          lastUpdated: kr.updated_at,
        };
      });
    } catch (error) {
      console.error('Error fetching keyword details:', error);
      return [];
    }
  }

  static async getPageMetrics(projectId: string): Promise<PageMetrics[]> {
    try {
      const { data, error } = await supabase
        .from('keyword_rankings')
        .select('*')
        .eq('project_id', projectId)
        .not('url', 'is', null);

      if (error) throw error;

      // Group by URL
      const pageGroups = new Map<string, any[]>();
      data?.forEach(kr => {
        if (!kr.url) return;
        if (!pageGroups.has(kr.url)) {
          pageGroups.set(kr.url, []);
        }
        pageGroups.get(kr.url)?.push(kr);
      });

      // Calculate metrics for each page
      const metrics: PageMetrics[] = [];
      pageGroups.forEach((keywords, url) => {
        const totalKeywords = keywords.length;
        const avgPosition = keywords.reduce((sum, k) => sum + (k.current_position || 100), 0) / totalKeywords;
        const estimatedTraffic = keywords.reduce((sum, k) => {
          return sum + (k.current_position ? this.estimateTrafficFromPosition(k.current_position) : 0);
        }, 0);
        
        const improvements = keywords.filter(k => {
          if (!k.current_position || !k.previous_position) return false;
          return k.current_position < k.previous_position;
        }).length;

        const declines = keywords.filter(k => {
          if (!k.current_position || !k.previous_position) return false;
          return k.current_position > k.previous_position;
        }).length;

        // Get top 3 keywords by position
        const topKeywords = keywords
          .filter(k => k.current_position)
          .sort((a, b) => (a.current_position || 100) - (b.current_position || 100))
          .slice(0, 3)
          .map(k => k.keyword);

        metrics.push({
          url,
          totalKeywords,
          avgPosition: Math.round(avgPosition * 10) / 10,
          estimatedTraffic,
          improvements,
          declines,
          topKeywords,
        });
      });

      // Sort by estimated traffic
      return metrics.sort((a, b) => b.estimatedTraffic - a.estimatedTraffic);
    } catch (error) {
      console.error('Error fetching page metrics:', error);
      return [];
    }
  }

  static async getKeywordHistory(keywordRankingId: string, days: number = 30): Promise<{ date: string; position: number }[]> {
    try {
      const { data, error } = await supabase
        .from('ranking_history')
        .select('recorded_at, position')
        .eq('keyword_ranking_id', keywordRankingId)
        .gte('recorded_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('recorded_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(record => ({
        date: record.recorded_at,
        position: record.position,
      }));
    } catch (error) {
      console.error('Error fetching keyword history:', error);
      return [];
    }
  }
}
