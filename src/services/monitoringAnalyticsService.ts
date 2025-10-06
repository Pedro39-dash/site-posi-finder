import { supabase } from "@/integrations/supabase/client";
import { addDays, format, subDays } from "date-fns";

export interface KeywordMetrics {
  totalKeywords: number;
  estimatedTraffic: number;
  previousTotalKeywords: number;
  previousEstimatedTraffic: number;
  changePercentageKeywords: number;
  changePercentageTraffic: number;
}

export interface PositionDistribution {
  date: string;
  top3: number;
  top10: number;
  top20: number;
  top50: number;
  top100: number;
}

export interface DailyMetrics {
  date: string;
  totalKeywords: number;
  estimatedTraffic: number;
}

export class MonitoringAnalyticsService {
  // Estima tráfego baseado na posição (CTR simplificado)
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

  static async getKeywordMetrics(projectId: string, days: number = 30): Promise<KeywordMetrics> {
    const currentDate = new Date();
    const startDate = subDays(currentDate, days);
    const previousStartDate = subDays(startDate, days);

    try {
      // Get current period data
      const { data: currentData, error: currentError } = await supabase
        .from('ranking_history')
        .select(`
          position,
          keyword_ranking_id,
          keyword_rankings!inner(project_id)
        `)
        .eq('keyword_rankings.project_id', projectId)
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at', { ascending: false });

      if (currentError) throw currentError;

      // Get previous period data
      const { data: previousData, error: previousError } = await supabase
        .from('ranking_history')
        .select(`
          position,
          keyword_ranking_id,
          keyword_rankings!inner(project_id)
        `)
        .eq('keyword_rankings.project_id', projectId)
        .gte('recorded_at', previousStartDate.toISOString())
        .lt('recorded_at', startDate.toISOString())
        .order('recorded_at', { ascending: false });

      if (previousError) throw previousError;

      // Calculate current metrics
      const uniqueCurrentKeywords = new Set(currentData?.map(r => r.keyword_ranking_id) || []);
      const totalKeywords = uniqueCurrentKeywords.size;
      
      const estimatedTraffic = currentData?.reduce((sum, record) => {
        return sum + this.estimateTrafficFromPosition(record.position);
      }, 0) || 0;

      // Calculate previous metrics
      const uniquePreviousKeywords = new Set(previousData?.map(r => r.keyword_ranking_id) || []);
      const previousTotalKeywords = uniquePreviousKeywords.size;
      
      const previousEstimatedTraffic = previousData?.reduce((sum, record) => {
        return sum + this.estimateTrafficFromPosition(record.position);
      }, 0) || 0;

      // Calculate percentage changes
      const changePercentageKeywords = previousTotalKeywords > 0
        ? ((totalKeywords - previousTotalKeywords) / previousTotalKeywords) * 100
        : 0;

      const changePercentageTraffic = previousEstimatedTraffic > 0
        ? ((estimatedTraffic - previousEstimatedTraffic) / previousEstimatedTraffic) * 100
        : 0;

      return {
        totalKeywords,
        estimatedTraffic,
        previousTotalKeywords,
        previousEstimatedTraffic,
        changePercentageKeywords,
        changePercentageTraffic,
      };
    } catch (error) {
      console.error('Error fetching keyword metrics:', error);
      return {
        totalKeywords: 0,
        estimatedTraffic: 0,
        previousTotalKeywords: 0,
        previousEstimatedTraffic: 0,
        changePercentageKeywords: 0,
        changePercentageTraffic: 0,
      };
    }
  }

  static async getPositionDistribution(projectId: string, days: number = 30): Promise<PositionDistribution[]> {
    const currentDate = new Date();
    const startDate = subDays(currentDate, days);

    try {
      const { data, error } = await supabase
        .from('ranking_history')
        .select(`
          position,
          recorded_at,
          keyword_ranking_id,
          keyword_rankings!inner(project_id)
        `)
        .eq('keyword_rankings.project_id', projectId)
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at', { ascending: true });

      if (error) throw error;

      // Group by date
      const dateGroups = new Map<string, any[]>();
      data?.forEach(record => {
        const dateKey = format(new Date(record.recorded_at), 'yyyy-MM-dd');
        if (!dateGroups.has(dateKey)) {
          dateGroups.set(dateKey, []);
        }
        dateGroups.get(dateKey)?.push(record);
      });

      // Calculate distribution for each date
      const distribution: PositionDistribution[] = [];
      dateGroups.forEach((records, date) => {
        const top3 = records.filter(r => r.position <= 3).length;
        const top10 = records.filter(r => r.position <= 10).length;
        const top20 = records.filter(r => r.position <= 20).length;
        const top50 = records.filter(r => r.position <= 50).length;
        const top100 = records.filter(r => r.position <= 100).length;

        distribution.push({
          date,
          top3,
          top10,
          top20,
          top50,
          top100,
        });
      });

      return distribution.sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Error fetching position distribution:', error);
      return [];
    }
  }

  static async getDailyMetrics(projectId: string, days: number = 30): Promise<DailyMetrics[]> {
    const currentDate = new Date();
    const startDate = subDays(currentDate, days);

    try {
      const { data, error } = await supabase
        .from('ranking_history')
        .select(`
          position,
          recorded_at,
          keyword_ranking_id,
          keyword_rankings!inner(project_id)
        `)
        .eq('keyword_rankings.project_id', projectId)
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at', { ascending: true });

      if (error) throw error;

      // Group by date
      const dateGroups = new Map<string, any[]>();
      data?.forEach(record => {
        const dateKey = format(new Date(record.recorded_at), 'yyyy-MM-dd');
        if (!dateGroups.has(dateKey)) {
          dateGroups.set(dateKey, []);
        }
        dateGroups.get(dateKey)?.push(record);
      });

      // Calculate metrics for each date
      const metrics: DailyMetrics[] = [];
      dateGroups.forEach((records, date) => {
        const uniqueKeywords = new Set(records.map(r => r.keyword_ranking_id));
        const totalKeywords = uniqueKeywords.size;
        
        const estimatedTraffic = records.reduce((sum, record) => {
          return sum + this.estimateTrafficFromPosition(record.position);
        }, 0);

        metrics.push({
          date,
          totalKeywords,
          estimatedTraffic,
        });
      });

      return metrics.sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Error fetching daily metrics:', error);
      return [];
    }
  }
}
