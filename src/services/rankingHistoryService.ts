import { supabase } from '@/integrations/supabase/client';

export interface RankingHistoryPoint {
  id: string;
  keyword: string;
  position: number;
  recorded_at: string;
  change_from_previous: number;
  metadata?: {
    data_source?: 'search_console' | 'serpapi' | 'manual';
    impressions?: number;
    clicks?: number;
    ctr?: number;
  };
}

export interface HistoricalData {
  keyword: string;
  dataPoints: {
    date: string;
    position: number;
    change: number;
    metadata?: {
      data_source?: 'search_console' | 'serpapi' | 'manual';
      impressions?: number;
      clicks?: number;
      ctr?: number;
    };
  }[];
}

export interface HistoryMaturity {
  status: 'building' | 'consolidating' | 'complete';
  daysOfData: number;
  totalDataPoints: number;
  message: string;
  icon: string;
}

/**
 * Fetch ranking history for a specific project and keywords
 */
export async function fetchRankingHistory(
  projectId: string,
  keywords?: string[],
  days: number = 30
): Promise<{ success: boolean; data?: HistoricalData[]; error?: string }> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .from('ranking_history')
      .select(`
        id,
        position,
        recorded_at,
        change_from_previous,
        metadata,
        keyword_rankings!inner(keyword, project_id)
      `)
      .eq('keyword_rankings.project_id', projectId)
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: true });

    const { data: historyData, error } = await query;

    if (error) {
      console.error('Error fetching ranking history:', error);
      return { success: false, error: error.message };
    }

    // Group by keyword
    const groupedData: Map<string, HistoricalData> = new Map();

    historyData?.forEach((record: any) => {
      const keyword = record.keyword_rankings.keyword;
      
      if (!groupedData.has(keyword)) {
        groupedData.set(keyword, {
          keyword,
          dataPoints: []
        });
      }

      groupedData.get(keyword)!.dataPoints.push({
        date: record.recorded_at, // Preserve full ISO timestamp
        position: record.position,
        change: record.change_from_previous || 0,
        metadata: record.metadata || {}
      });
    });

    // Filter by keywords if provided
    let resultData = Array.from(groupedData.values());
    if (keywords && keywords.length > 0) {
      resultData = resultData.filter(d => keywords.includes(d.keyword));
    }

    return { success: true, data: resultData };
  } catch (error: any) {
    console.error('Exception in fetchRankingHistory:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get maturity status of historical data
 */
export function getHistoryMaturity(dataPoints: number, daysSpan: number): HistoryMaturity {
  if (daysSpan === 0 || dataPoints === 0) {
    return {
      status: 'building',
      daysOfData: 0,
      totalDataPoints: 0,
      message: 'Nenhum histórico disponível ainda',
      icon: '📊'
    };
  }

  if (daysSpan < 7) {
    return {
      status: 'building',
      daysOfData: daysSpan,
      totalDataPoints: dataPoints,
      message: `Construindo histórico... ${daysSpan} ${daysSpan === 1 ? 'dia' : 'dias'} registrado${daysSpan === 1 ? '' : 's'}`,
      icon: '🟡'
    };
  }

  if (daysSpan < 30) {
    return {
      status: 'consolidating',
      daysOfData: daysSpan,
      totalDataPoints: dataPoints,
      message: `Histórico consolidado - ${daysSpan} dias de dados reais`,
      icon: '🟢'
    };
  }

  return {
    status: 'complete',
    daysOfData: daysSpan,
    totalDataPoints: dataPoints,
    message: `Dados completos - ${daysSpan}+ dias de histórico real`,
    icon: '✅'
  };
}

/**
 * Calculate days span from historical data
 */
export function calculateDaysSpan(dataPoints: { date: string }[]): number {
  if (dataPoints.length === 0) return 0;

  const dates = dataPoints.map(d => new Date(d.date).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  
  return Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
}

/**
 * @deprecated This function is no longer used. Projections removed to show only real data.
 * Kept for backwards compatibility.
 */
export function mergeRealAndProjectedData(
  realData: { date: string; position: number }[],
  currentPosition: number,
  totalDays: number
): { date: string; position: number; isReal: boolean }[] {
  console.warn('[DEPRECATED] mergeRealAndProjectedData is deprecated. Use real data only.');
  return realData.map(d => ({ ...d, isReal: true }));
}
