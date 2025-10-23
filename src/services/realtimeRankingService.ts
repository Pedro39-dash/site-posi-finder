import { SerpApiService } from './serpApiService';
import { supabase } from '@/integrations/supabase/client';

interface RealtimeCheckResult {
  keyword: string;
  position: number | null;
  url: string | null;
  previousPosition: number | null;
  change: number | null;
  checkedAt: string;
}

export const RealtimeRankingService = {
  /**
   * Busca posições em tempo real via SerpAPI e salva no histórico
   */
  async checkKeywordsRealtime(
    projectId: string,
    keywords: string[],
    targetDomain: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<RealtimeCheckResult[]> {
    const results: RealtimeCheckResult[] = [];

    for (let i = 0; i < keywords.length; i++) {
      const keyword = keywords[i];
      
      try {
        console.log(`🔍 Verificando keyword "${keyword}" via SerpAPI...`);
        
        // 1. Buscar posição via SerpAPI
        const serpResult = await SerpApiService.checkKeywordPosition(
          keyword,
          targetDomain,
          'Brazil',
          'desktop'
        );
        console.log(`[REALTIME][${keyword}] Resposta completa do SerpApiService:`, serpResult);

        // 2. Buscar posição anterior do banco
        const { data: existingRanking } = await supabase
          .from('keyword_rankings')
          .select('id, current_position, previous_position')
          .eq('project_id', projectId)
          .eq('keyword', keyword)
          .maybeSingle();
        console.log(`[REALTIME][${keyword}] Ranking do banco:`, existingRanking);
        const previousPosition = existingRanking?.current_position || null;
        const newPosition = serpResult.position;
        const change = previousPosition && newPosition 
          ? previousPosition - newPosition 
          : null;

        console.log(`[REALTIME][${keyword}] previousPosition:`, previousPosition, '| newPosition:', newPosition, '| change:', change);

        console.log(`[REALTIME][${keyword}] Atualizando keyword_rankings...`);

        // 3. Atualizar keyword_rankings
        if (existingRanking) {
          await supabase
            .from('keyword_rankings')
            .update({
              current_position: newPosition,
              previous_position: previousPosition,
              url: serpResult.url,
              updated_at: new Date().toISOString(),
              data_source: 'serp_api',
              last_seen_at: new Date().toISOString()
            })
            .eq('id', existingRanking.id);
          console.log(`[REALTIME][${keyword}] keyword_rankings atualizado!`);

          // 4. Adicionar ao histórico (apenas se tiver posição)
          if (newPosition) {
            await supabase
              .from('ranking_history')
              .insert({
                keyword_ranking_id: existingRanking.id,
                position: newPosition,
                recorded_at: new Date().toISOString(),
                change_from_previous: change || 0,
                metadata: {
                  data_source: 'serp_api',
                  url: serpResult.url,
                  realtime_check: true
                }
              });
            console.log(`✅ [${keyword}] Histórico atualizado`);
          }
        }

        results.push({
          keyword,
          position: newPosition,
          url: serpResult.url,
          previousPosition,
          change,
          checkedAt: new Date().toISOString()
        });

        if (onProgress) {
          onProgress(i + 1, keywords.length);
        }

      } catch (error) {
        console.error(`❌ Erro ao verificar keyword "${keyword}":`, error);
        results.push({
          keyword,
          position: null,
          url: null,
          previousPosition: null,
          change: null,
          checkedAt: new Date().toISOString()
          
          console.log(`[REALTIME][${keyword}] Result final para push:`, {
            keyword,
            position: newPosition,
            url: serpResult.url,
            previousPosition,
            change
          });
        });
      }
    }

    console.log(`🎉 Verificação em tempo real concluída: ${results.length} keywords`);
    return results;
    console.log("🎉 Verificação em tempo real concluída: resultados =>", results);
  }
};
