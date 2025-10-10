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

  console.log('🔍 [calculateKeywordRelevance] Iniciando cálculo:', {
    projectId,
    keywordsCount: keywords.length,
    currentPeriod,
    expectedDays: PERIOD_DAYS[currentPeriod]
  });

  try {
    // Buscar dados históricos de todas as keywords
    // Usar o período mais longo (16 meses) para calcular relevância em todos os períodos
    const maxDays = PERIOD_DAYS['16m'];
    const result = await fetchRankingHistory(projectId, keywords, maxDays);

    if (!result.success || !result.data) {
      console.warn('Falha ao buscar histórico para cálculo de relevância');
      return relevanceMap;
    }

    console.log('📦 Dados históricos recebidos:', {
      keywordsWithData: result.data.length,
      totalDataPoints: result.data.reduce((sum, d) => sum + d.dataPoints.length, 0)
    });

    // Calcular relevância para cada keyword
    for (const keyword of keywords) {
      const historicalData = result.data.find(d => d.keyword === keyword);
      const dataPoints = historicalData?.dataPoints || [];
      
      console.log(`📊 [${keyword}]`, {
        totalDataPoints: dataPoints.length,
        firstDate: dataPoints[0]?.date,
        lastDate: dataPoints[dataPoints.length - 1]?.date,
        sampleDates: dataPoints.slice(0, 3).map(dp => dp.date)
      });
      
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
        
        // Filtrar apenas pontos dentro do período com validação robusta
        const pointsInPeriod = dataPoints.filter(dp => {
          if (!dp.date) {
            console.warn(`⚠️ Data point sem data para keyword ${keyword}`);
            return false;
          }
          
          const pointDate = new Date(dp.date);
          
          // Validar se data é válida
          if (isNaN(pointDate.getTime())) {
            console.warn(`⚠️ Data inválida para keyword ${keyword}:`, dp.date);
            return false;
          }
          
          // Normalizar para comparação apenas de dia (sem horas)
          pointDate.setHours(0, 0, 0, 0);
          
          const cutoffDate = new Date();
          cutoffDate.setHours(0, 0, 0, 0);
          cutoffDate.setDate(cutoffDate.getDate() - periodDays);
          
          return pointDate >= cutoffDate;
        }).length;
        
        const expectedPoints = minPoints;
        const coveragePercentage = expectedPoints > 0 
          ? (pointsInPeriod / expectedPoints) * 100 
          : 0;
        
        hasRelevanceFor[period] = coveragePercentage >= RELEVANCE_THRESHOLDS.minCoveragePercentage;
      }

      // Calcular métricas para o período atual com validação robusta
      const currentPeriodDays = PERIOD_DAYS[currentPeriod];
      const currentMinPoints = RELEVANCE_THRESHOLDS.minPointsByPeriod[currentPeriod];
      
      const pointsInCurrentPeriod = dataPoints.filter(dp => {
        if (!dp.date) return false;
        
        const pointDate = new Date(dp.date);
        if (isNaN(pointDate.getTime())) return false;
        
        pointDate.setHours(0, 0, 0, 0);
        
        const cutoffDate = new Date();
        cutoffDate.setHours(0, 0, 0, 0);
        cutoffDate.setDate(cutoffDate.getDate() - currentPeriodDays);
        
        return pointDate >= cutoffDate;
      }).length;

      const dataCoverage = currentMinPoints > 0
        ? Math.min(100, (pointsInCurrentPeriod / currentMinPoints) * 100)
        : 0;

      const isRelevant = hasRelevanceFor[currentPeriod];

      console.log(`📈 [${keyword}] Resultado período ${currentPeriod}:`, {
        pointsInPeriod: pointsInCurrentPeriod,
        expectedPoints: currentMinPoints,
        coverage: `${Math.round(dataCoverage)}%`,
        isRelevant,
        daysSpan
      });

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
