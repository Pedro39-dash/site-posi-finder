import { PeriodOption } from '@/components/monitoring/filters/PeriodSelector';
import { fetchRankingHistory } from './rankingHistoryService';
import { RELEVANCE_THRESHOLDS, PERIOD_DAYS } from '@/config/monitoringConfig';

/**
 * Informação de relevância de uma keyword
 */
export interface KeywordRelevance {
  keyword: string;
  dataCoverage: number; // percentual 0-100
  dataPoints: number;
  expectedPoints: number;
  hasRelevanceFor: Record<PeriodOption, boolean>;
  isRelevant: boolean; // relevante para o período atual
  daysSpan: number; // quantos dias de dados possui
}

/**
 * Calcula a relevância de múltiplas keywords para um período específico
 */
export async function calculateKeywordRelevance(
  projectId: string,
  keywords: string[],
  currentPeriod: PeriodOption
): Promise<Map<string, KeywordRelevance>> {
  const relevanceMap = new Map<string, KeywordRelevance>();

  if (!projectId || keywords.length === 0) {
    return relevanceMap;
  }

  try {
    // Buscar dados históricos de todas as keywords
    // Usar o período mais longo (16 meses) para calcular relevância em todos os períodos
    const maxDays = PERIOD_DAYS['16m'];
    const result = await fetchRankingHistory(projectId, keywords, maxDays);

    if (!result.success || !result.data) {
      console.warn('Falha ao buscar histórico para cálculo de relevância');
      return relevanceMap;
    }

    // Calcular relevância para cada keyword
    for (const keyword of keywords) {
      const historicalData = result.data.find(d => d.keyword === keyword);
      const dataPoints = historicalData?.dataPoints || [];
      
      // Calcular span de dias (diferença entre primeira e última data)
      let daysSpan = 0;
      if (dataPoints.length > 0) {
        const dates = dataPoints.map(d => new Date(d.date).getTime());
        const minDate = Math.min(...dates);
        const maxDate = Math.max(...dates);
        daysSpan = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
      }

      // Calcular relevância para cada período
      const hasRelevanceFor: Record<PeriodOption, boolean> = {} as Record<PeriodOption, boolean>;
      
      for (const period of Object.keys(RELEVANCE_THRESHOLDS.minPointsByPeriod) as PeriodOption[]) {
        const periodDays = PERIOD_DAYS[period];
        const minPoints = RELEVANCE_THRESHOLDS.minPointsByPeriod[period];
        
        // Filtrar apenas pontos dentro do período
        const pointsInPeriod = dataPoints.filter(dp => {
          const pointDate = new Date(dp.date);
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - periodDays);
          return pointDate >= cutoffDate;
        }).length;
        
        const expectedPoints = minPoints;
        const coveragePercentage = expectedPoints > 0 
          ? (pointsInPeriod / expectedPoints) * 100 
          : 0;
        
        hasRelevanceFor[period] = coveragePercentage >= RELEVANCE_THRESHOLDS.minCoveragePercentage;
      }

      // Calcular métricas para o período atual
      const currentPeriodDays = PERIOD_DAYS[currentPeriod];
      const currentMinPoints = RELEVANCE_THRESHOLDS.minPointsByPeriod[currentPeriod];
      
      const pointsInCurrentPeriod = dataPoints.filter(dp => {
        const pointDate = new Date(dp.date);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - currentPeriodDays);
        return pointDate >= cutoffDate;
      }).length;

      const dataCoverage = currentMinPoints > 0
        ? Math.min(100, (pointsInCurrentPeriod / currentMinPoints) * 100)
        : 0;

      const isRelevant = hasRelevanceFor[currentPeriod];

      relevanceMap.set(keyword, {
        keyword,
        dataCoverage: Math.round(dataCoverage),
        dataPoints: pointsInCurrentPeriod,
        expectedPoints: currentMinPoints,
        hasRelevanceFor,
        isRelevant,
        daysSpan
      });
    }

    return relevanceMap;
  } catch (error) {
    console.error('Erro ao calcular relevância de keywords:', error);
    return relevanceMap;
  }
}

/**
 * Filtra apenas keywords relevantes para o período especificado
 */
export function filterRelevantKeywords(
  keywords: string[],
  relevanceMap: Map<string, KeywordRelevance>
): string[] {
  return keywords.filter(keyword => {
    const relevance = relevanceMap.get(keyword);
    return relevance?.isRelevant !== false; // considera relevante se não houver info
  });
}
