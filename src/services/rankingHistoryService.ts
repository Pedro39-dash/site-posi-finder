// import { supabase } from '@/integrations/supabase/client';
// import { useSimulatedData } from '@/hooks/useSimulatedData';

// export interface RankingHistoryPoint {
//   id: string;
//   keyword: string;
//   position: number;
//   recorded_at: string;
//   change_from_previous: number;
//   metadata?: {
//     data_source?: 'search_console' | 'serpapi' | 'manual';
//     impressions?: number;
//     clicks?: number;
//     ctr?: number;
//     is_current_only?: boolean;
//   };
// }

// export interface HistoricalData {
//   keyword: string;
//   dataPoints: {
//     date: string;
//     position: number;
//     change: number;
//     metadata?: {
//       data_source?: 'search_console' | 'serpapi' | 'manual';
//       impressions?: number;
//       clicks?: number;
//       ctr?: number;
//       is_current_only?: boolean;
//     };
//   }[];
// }

// export interface HistoryMaturity {
//   status: 'building' | 'consolidating' | 'complete';
//   daysOfData: number;
//   totalDataPoints: number;
//   message: string;
//   icon: string;
// }

// /**
//  * Generate simulated historical data for testing
//  */
// function generateSimulatedHistory(
//   keywords: string[],
//   days: number
// ): { success: boolean; data: HistoricalData[] } {
//   const data: HistoricalData[] = keywords.map(keyword => {
//     const dataPoints: {
//       date: string;
//       position: number;
//       change: number;
//       metadata?: any;
//     }[] = [];
    
//     // Base position varies by keyword for more realistic simulation
//     const basePosition = Math.floor(Math.random() * 40) + 5;
    
//     // Generate appropriate number of points based on period
//     let pointsToGenerate: number;
//     let intervalHours: number;
    
//     if (days <= 1) {
//       // Day view: hourly data (24 points)
//       pointsToGenerate = 24;
//       intervalHours = 1;
//     } else if (days <= 7) {
//       // Week view: 4 points per day (28 points)
//       pointsToGenerate = days * 4;
//       intervalHours = 6;
//     } else if (days <= 30) {
//       // Month view: daily data (30 points)
//       pointsToGenerate = days;
//       intervalHours = 24;
//     } else {
//       // Year view: every 3 days (120 points)
//       pointsToGenerate = Math.floor(days / 3);
//       intervalHours = 72;
//     }
    
//     for (let i = 0; i < pointsToGenerate; i++) {
//       const date = new Date();
//       date.setHours(date.getHours() - (pointsToGenerate - i) * intervalHours);
      
//       // Create smooth, realistic position changes with trends
//       const trendFactor = Math.sin(i / pointsToGenerate * Math.PI) * 8; // Gradual improvement trend
//       const randomWalk = Math.floor(Math.random() * 7) - 3; // -3 to +3 random variation
//       const dailyCycle = Math.sin(i / 4) * 2; // Small daily fluctuations
      
//       const position = Math.max(1, Math.min(100, 
//         basePosition + trendFactor + randomWalk + dailyCycle
//       ));
      
//       const prevPosition = dataPoints[i - 1]?.position || position;
      
//       dataPoints.push({
//         date: date.toISOString(),
//         position: Math.round(position),
//         change: Math.round(position - prevPosition),
//         metadata: {
//           data_source: 'simulated' as any,
//           impressions: Math.floor(Math.random() * 800) + 200,
//           clicks: Math.floor(Math.random() * 60) + 10,
//           ctr: Math.random() * 8 + 2
//         }
//       });
//     }
    
//     return { keyword, dataPoints };
//   });
  
//   return { success: true, data };
// }

// /**
//  * Fetch ranking history for a specific project and keywords
//  */
// export async function fetchRankingHistory(
//   projectId: string,
//   keywords?: string[],
//   days: number = 30
// ): Promise<{ success: boolean; data?: HistoricalData[]; error?: string }> {
//   try {
//     // Check if simulated mode is active
//     const { isSimulatedMode } = useSimulatedData.getState();
    
//     if (isSimulatedMode) {
//       // If no keywords provided, generate some default ones
//       const simulatedKeywords = keywords || [
//         'marketing digital',
//         'SEO otimização',
//         'consultoria marketing',
//         'agência digital',
//         'estratégia conteúdo'
//       ];
//       return generateSimulatedHistory(simulatedKeywords, days);
//     }

//     const startDate = new Date();
//     startDate.setDate(startDate.getDate() - days);

//     let query = supabase
//       .from('ranking_history')
//       .select(`
//         id,
//         position,
//         recorded_at,
//         change_from_previous,
//         metadata,
//         keyword_rankings!inner(keyword, project_id)
//       `)
//       .eq('keyword_rankings.project_id', projectId)
//       .gte('recorded_at', startDate.toISOString())
//       .order('recorded_at', { ascending: true });

//     const { data: historyData, error } = await query;

//     if (error) {
//       console.error('Error fetching ranking history:', error);
//       return { success: false, error: error.message };
//     }

//     // For keywords without history in this period, fetch current position from keyword_rankings
//     if (keywords && keywords.length > 0) {
//       const keywordsWithHistory = new Set(
//         historyData?.map((h: any) => h.keyword_rankings.keyword) || []
//       );
      
//       const keywordsWithoutHistory = keywords.filter(k => !keywordsWithHistory.has(k));
      
//       if (keywordsWithoutHistory.length > 0) {
//         const { data: currentPositions } = await supabase
//           .from('keyword_rankings')
//           .select('keyword, current_position, updated_at, metadata, data_source')
//           .eq('project_id', projectId)
//           .in('keyword', keywordsWithoutHistory)
//           .not('current_position', 'is', null);
        
//         // Add current positions as single historical points
//         currentPositions?.forEach((cp: any) => {
//           if (!historyData) return;
          
//           historyData.push({
//             id: `current-${cp.keyword}`,
//             position: cp.current_position,
//             recorded_at: cp.updated_at,
//             change_from_previous: 0,
//             metadata: {
//               ...cp.metadata,
//               data_source: cp.data_source,
//               is_current_only: true
//             },
//             keyword_rankings: { keyword: cp.keyword, project_id: projectId }
//           });
//         });
//       }
//     }

//     // Group by keyword
//     const groupedData: Map<string, HistoricalData> = new Map();

//     historyData?.forEach((record: any) => {
//       const keyword = record.keyword_rankings.keyword;
      
//       if (!groupedData.has(keyword)) {
//         groupedData.set(keyword, {
//           keyword,
//           dataPoints: []
//         });
//       }

//       groupedData.get(keyword)!.dataPoints.push({
//         date: record.recorded_at, // Preserve full ISO timestamp
//         position: record.position,
//         change: record.change_from_previous || 0,
//         metadata: record.metadata || {}
//       });
//     });

//     // Filter by keywords if provided
//     let resultData = Array.from(groupedData.values());
//     if (keywords && keywords.length > 0) {
//       resultData = resultData.filter(d => keywords.includes(d.keyword));
//     }

//     return { success: true, data: resultData };
//   } catch (error: any) {
//     console.error('Exception in fetchRankingHistory:', error);
//     return { success: false, error: error.message };
//   }
// }

// /**
//  * Get maturity status of historical data
//  */
// export function getHistoryMaturity(dataPoints: number, daysSpan: number): HistoryMaturity {
//   if (daysSpan === 0 || dataPoints === 0) {
//     return {
//       status: 'building',
//       daysOfData: 0,
//       totalDataPoints: 0,
//       message: 'Nenhum histórico disponível ainda',
//       icon: '📊'
//     };
//   }

//   if (daysSpan < 7) {
//     return {
//       status: 'building',
//       daysOfData: daysSpan,
//       totalDataPoints: dataPoints,
//       message: `Construindo histórico... ${daysSpan} ${daysSpan === 1 ? 'dia' : 'dias'} registrado${daysSpan === 1 ? '' : 's'}`,
//       icon: '🟡'
//     };
//   }

//   if (daysSpan < 30) {
//     return {
//       status: 'consolidating',
//       daysOfData: daysSpan,
//       totalDataPoints: dataPoints,
//       message: `Histórico consolidado - ${daysSpan} dias de dados reais`,
//       icon: '🟢'
//     };
//   }

//   return {
//     status: 'complete',
//     daysOfData: daysSpan,
//     totalDataPoints: dataPoints,
//     message: `Dados completos - ${daysSpan}+ dias de histórico real`,
//     icon: '✅'
//   };
// }

// /**
//  * Calculate days span from historical data
//  */
// export function calculateDaysSpan(dataPoints: { date: string }[]): number {
//   if (dataPoints.length === 0) return 0;

//   const dates = dataPoints.map(d => new Date(d.date).getTime());
//   const minDate = Math.min(...dates);
//   const maxDate = Math.max(...dates);
  
//   return Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
// }

// /**
//  * Calculate data coverage for a specific period
//  */
// export function calculateDataCoverage(
//   dataPoints: number,
//   targetDays: number
// ): {
//   coveragePercentage: number;
//   isRelevant: boolean;
//   expectedPoints: number;
// } {
//   // Estimativa de pontos esperados: 1 ponto por dia no mínimo
//   const expectedPoints = Math.ceil(targetDays * 0.7); // 70% de cobertura esperada
  
//   const coveragePercentage = expectedPoints > 0
//     ? Math.min(100, (dataPoints / expectedPoints) * 100)
//     : 0;
  
//   // Considera relevante se tiver pelo menos 70% de cobertura
//   const isRelevant = coveragePercentage >= 70;
  
//   return {
//     coveragePercentage: Math.round(coveragePercentage),
//     isRelevant,
//     expectedPoints
//   };
// }

// /**
//  * @deprecated This function is no longer used. Projections removed to show only real data.
//  * Kept for backwards compatibility.
//  */
// export function mergeRealAndProjectedData(
//   realData: { date: string; position: number }[],
//   currentPosition: number,
//   totalDays: number
// ): { date: string; position: number; isReal: boolean }[] {
//   console.warn('[DEPRECATED] mergeRealAndProjectedData is deprecated. Use real data only.');
//   return realData.map(d => ({ ...d, isReal: true }));
// }
import { supabase } from '@/integrations/supabase/client';
import { useSimulatedData } from '@/hooks/useSimulatedData';

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
    is_current_only?: boolean;
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
      is_current_only?: boolean;
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
 * Generate simulated historical data for testing
 */
function generateSimulatedHistory(
  keywords: string[]
): { success: boolean; data: HistoricalData[] } {
  const data: HistoricalData[] = keywords.map(keyword => {
    const dataPoints: {
      date: string;
      position: number;
      change: number;
      metadata?: any;
    }[] = [];

    // Para modo real, só gerar o dado atual
    const basePosition = Math.floor(Math.random() * 40) + 5;
    const position = Math.max(1, Math.min(100, basePosition));
    dataPoints.push({
      date: new Date().toISOString(),
      position: Math.round(position),
      change: 0,
      metadata: {
        data_source: 'simulated' as any,
        impressions: Math.floor(Math.random() * 800) + 200,
        clicks: Math.floor(Math.random() * 60) + 10,
        ctr: Math.random() * 8 + 2
      }
    });

    return { keyword, dataPoints };
  });

  return { success: true, data };
}

/**
 * Fetch ranking history for a specific project and keywords
 * Apenas dados do dia atual.
 */
export async function fetchRankingHistory(
  projectId: string,
  keywords?: string[]
): Promise<{ success: boolean; data?: HistoricalData[]; error?: string }> {
  try {
    // Check if simulated mode is active
    const { isSimulatedMode } = useSimulatedData.getState();

    if (isSimulatedMode) {
      // Gera sempre só o dado do dia
      const simulatedKeywords = keywords || [
        'marketing digital',
        'SEO otimização',
        'consultoria marketing',
        'agência digital',
        'estratégia conteúdo'
      ];
      return generateSimulatedHistory(simulatedKeywords);
    }

    // Busca só dados do dia (hoje)
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

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
      return { success: false, error: error.message };
    }

    // For keywords without history in this period, fetch current position from keyword_rankings
    if (keywords && keywords.length > 0) {
      const keywordsWithHistory = new Set(
        historyData?.map((h: any) => h.keyword_rankings.keyword) || []
      );

      const keywordsWithoutHistory = keywords.filter(k => !keywordsWithHistory.has(k));

      if (keywordsWithoutHistory.length > 0) {
        const { data: currentPositions } = await supabase
          .from('keyword_rankings')
          .select('keyword, current_position, updated_at, metadata, data_source')
          .eq('project_id', projectId)
          .in('keyword', keywordsWithoutHistory)
          .not('current_position', 'is', null);

        currentPositions?.forEach((cp: any) => {
          if (!historyData) return;

          historyData.push({
            id: `current-${cp.keyword}`,
            position: cp.current_position,
            recorded_at: cp.updated_at,
            change_from_previous: 0,
            metadata: {
              ...cp.metadata,
              data_source: cp.data_source,
              is_current_only: true
            },
            keyword_rankings: { keyword: cp.keyword, project_id: projectId }
          });
        });
      }
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
        date: record.recorded_at,
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
    return { success: false, error: error.message };
  }
}

/**
 * Get maturity status of historical data
 * (mantém igual)
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
 * Calculate data coverage for a specific period
 * (pode remover ou manter, mas só será usado para analytics/extensões futuras)
 */
export function calculateDataCoverage(
  dataPoints: number,
  targetDays: number
): {
  coveragePercentage: number;
  isRelevant: boolean;
  expectedPoints: number;
} {
  const expectedPoints = Math.ceil(targetDays * 0.7);
  const coveragePercentage = expectedPoints > 0
    ? Math.min(100, (dataPoints / expectedPoints) * 100)
    : 0;
  const isRelevant = coveragePercentage >= 70;

  return {
    coveragePercentage: Math.round(coveragePercentage),
    isRelevant,
    expectedPoints
  };
}

/**
 * @deprecated This function is no longer used. Projections removed to show only real data.
 */
export function mergeRealAndProjectedData(
  realData: { date: string; position: number }[],
  currentPosition: number,
  totalDays: number
): { date: string; position: number; isReal: boolean }[] {
  return realData.map(d => ({ ...d, isReal: true }));
}
