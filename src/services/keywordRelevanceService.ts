import { PeriodOption } from '@/components/monitoring/filters/PeriodSelector';
import { fetchRankingHistory } from './rankingHistoryService';
import { RELEVANCE_THRESHOLDS, PERIOD_DAYS } from '@/config/monitoringConfig';
import { supabase } from '@/integrations/supabase/client';

/**
 * Informação de relevância de uma keyword baseada em histórico e atividade
 */
export interface KeywordRelevance {
  keyword: string;
  totalDataPoints: number;
  firstDate: string | null;
  lastDate: string | null;
  daysSinceLastCollection: number;
  isRelevant: boolean;
  relevanceReason: 'current_period' | 'strong_history' | 'recent_activity' | 'established';
  dataPointsInPeriod: number;
}

/**
 * Calcula a relevância de keywords baseada em histórico e atividade recente
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

  console.log('🔍 [calculateKeywordRelevance] Nova lógica - Iniciando cálculo:', {
    projectId,
    keywordsCount: keywords.length,
    currentPeriod
  });

  try {
    // Buscar histórico completo (16 meses)
    const maxDays = PERIOD_DAYS['16m'];
    const result = await fetchRankingHistory(projectId, keywords, maxDays);

    if (!result.success || !result.data) {
      console.warn('Falha ao buscar histórico para cálculo de relevância');
      return relevanceMap;
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const currentPeriodDays = PERIOD_DAYS[currentPeriod];
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - currentPeriodDays);

    console.log('📊 Processando relevância para', keywords.length, 'keywords');

    for (const keyword of keywords) {
      const historicalData = result.data.find(d => d.keyword === keyword);
      let dataPoints = historicalData?.dataPoints || [];

      // Se não tem dados históricos, buscar current_position
      if (dataPoints.length === 0) {
        try {
          const { data: currentRanking } = await supabase
            .from('keyword_rankings')
            .select('current_position, updated_at, data_source')
            .eq('project_id', projectId)
            .eq('keyword', keyword)
            .maybeSingle();
          
          if (currentRanking?.current_position) {
            dataPoints = [{
              date: currentRanking.updated_at,
              position: currentRanking.current_position,
              change: 0,
              metadata: {
                is_current_only: true
              }
            }];
            console.log(`📍 [${keyword}] Usando current_position como ponto de dados`);
          }
        } catch (err) {
          console.warn(`Erro ao buscar current_position para ${keyword}:`, err);
        }
      }

      // Se ainda não tem dados, marcar como irrelevante
      if (dataPoints.length === 0) {
        relevanceMap.set(keyword, {
          keyword,
          totalDataPoints: 0,
          firstDate: null,
          lastDate: null,
          daysSinceLastCollection: 999,
          isRelevant: false,
          relevanceReason: 'current_period',
          dataPointsInPeriod: 0
        });
        continue;
      }

      // Extrair informações básicas
      const sortedDates = dataPoints
        .map(dp => new Date(dp.date))
        .filter(d => !isNaN(d.getTime()))
        .sort((a, b) => a.getTime() - b.getTime());

      if (sortedDates.length === 0) {
        relevanceMap.set(keyword, {
          keyword,
          totalDataPoints: dataPoints.length,
          firstDate: null,
          lastDate: null,
          daysSinceLastCollection: 999,
          isRelevant: false,
          relevanceReason: 'current_period',
          dataPointsInPeriod: 0
        });
        continue;
      }

      const firstDate = sortedDates[0];
      const lastDate = sortedDates[sortedDates.length - 1];
      const daysSinceLastCollection = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysSinceFirstCollection = Math.floor((now.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));

      // Contar pontos no período atual
      const dataPointsInPeriod = dataPoints.filter(dp => {
        if (!dp.date) return false;
        const pointDate = new Date(dp.date);
        if (isNaN(pointDate.getTime())) return false;
        pointDate.setHours(0, 0, 0, 0);
        return pointDate >= cutoffDate;
      }).length;

      // NOVA LÓGICA DE RELEVÂNCIA: Múltiplas condições
      let isRelevant = false;
      let relevanceReason: KeywordRelevance['relevanceReason'] = 'current_period';

      // Condição 1: Tem dados suficientes no período atual
      const minPointsForPeriod = currentPeriod === 'today'
        ? 0 // Para "hoje", sempre aceitar (será buscado via SerpAPI)
        : currentPeriodDays <= 7 
          ? 1 
          : Math.max(2, Math.floor(currentPeriodDays / 14));
      
      if (dataPointsInPeriod >= minPointsForPeriod) {
        isRelevant = true;
        relevanceReason = 'current_period';
      }
      // Condição 2: Keyword estabelecida (50+ pontos históricos, 90+ dias de tracking)
      else if (dataPoints.length >= 50 && daysSinceFirstCollection >= 90) {
        isRelevant = true;
        relevanceReason = 'established';
      }
      // Condição 3: Histórico significativo + atividade recente (10+ pontos, última coleta < 30 dias)
      else if (dataPoints.length >= 10 && daysSinceLastCollection <= 30) {
        isRelevant = true;
        relevanceReason = 'recent_activity';
      }
      // Condição 4: Histórico muito forte (100+ pontos = keyword importante)
      else if (dataPoints.length >= 100) {
        isRelevant = true;
        relevanceReason = 'strong_history';
      }
      // Condição 5: Tem posição atual muito recente (< 7 dias)
      else if (dataPoints.length > 0 && daysSinceLastCollection <= 7) {
        isRelevant = true;
        relevanceReason = 'recent_activity';
      }

      const relevance: KeywordRelevance = {
        keyword,
        totalDataPoints: dataPoints.length,
        firstDate: firstDate.toISOString(),
        lastDate: lastDate.toISOString(),
        daysSinceLastCollection,
        isRelevant,
        relevanceReason,
        dataPointsInPeriod
      };

      relevanceMap.set(keyword, relevance);

      console.log(`✅ [${keyword}]`, {
        total: dataPoints.length,
        inPeriod: dataPointsInPeriod,
        lastCollection: `${daysSinceLastCollection}d atrás`,
        firstCollection: `${daysSinceFirstCollection}d atrás`,
        isRelevant,
        reason: relevanceReason
      });
    }

    return relevanceMap;
  } catch (error) {
    console.error('❌ Erro ao calcular relevância de keywords:', error);
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
