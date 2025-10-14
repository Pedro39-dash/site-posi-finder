import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

// Tipos específicos para este serviço
export type CompetitiveAnalysis = Database['public']['Tables']['competitive_analysis']['Row'];
export type CompetitorDomain = Database['public']['Tables']['competitor_domains']['Row'];
export type CompetitorKeyword = Database['public']['Tables']['competitor_keywords']['Row'] & {
  competitor_positions?: { domain: string; position: number | null }[];
};

export interface CompetitiveAnalysisData {
  analysis: CompetitiveAnalysis;
  competitors: CompetitorDomain[];
  keywords: CompetitorKeyword[];
}

export const CompetitorAnalysisService = {
  /**
   * Inicia uma nova análise competitiva.
   */
  startAnalysis: async (
    targetDomain: string,
    competitors: string[],
    keywords: string[],
    projectId: string
  ): Promise<{ success: boolean; analysisId?: string; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('competitor-analysis', {
        body: { targetDomain, competitors, keywords, projectId },
      });

      if (error) throw error;
      
      return { success: true, analysisId: data.analysisId };
    } catch (err) {
      const error = err as Error;
      console.error('Error starting competitor analysis:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Busca os dados completos de uma análise específica.
   */
  getAnalysisData: async (
    analysisId: string
  ): Promise<{ success: boolean; data?: CompetitiveAnalysisData; error?: string }> => {
    try {
      const { data, error } = await supabase
        .from('competitive_analysis')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Analysis not found.');
      }

      const analysis = data;

      const { data: competitors, error: competitorsError } = await supabase
        .from('competitor_domains')
        .select('*')
        .eq('analysis_id', analysisId);

      if (competitorsError) throw competitorsError;

      const { data: keywords, error: keywordsError } = await supabase
        .from('competitor_keywords')
        .select('*')
        .eq('analysis_id', analysisId);

      if (keywordsError) throw keywordsError;

      // Estrutura os dados para o frontend
      const formattedKeywords = keywords.map(k => ({
        ...k,
        competitor_positions: competitors.map(c => ({
          domain: c.domain,
          position: (k.positions as any)?.[c.domain] ?? null
        }))
      }));

      return {
        success: true,
        data: {
          analysis,
          competitors,
          keywords: formattedKeywords,
        },
      };
    } catch (err) {
      const error = err as Error;
      console.error('Error fetching analysis data:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Lista as análises de um usuário, com opção de filtrar por projeto.
   */
  getUserAnalyses: async (
    limit: number,
    projectId?: string // <<< ALTERAÇÃO AQUI: Adicionado projectId como parâmetro opcional
  ): Promise<{ success: boolean; analyses: CompetitiveAnalysis[] | null; error?: string }> => {
    try {
      // Inicia a query base
      let query = supabase
        .from('competitive_analysis')
        .select(`
          id,
          created_at,
          target_domain,
          status,
          project_id
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      // <<< ALTERAÇÃO AQUI: Adiciona o filtro se o projectId for fornecido
      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      // Executa a query
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching user analyses:', error);
        return { success: false, analyses: null, error: error.message };
      }

      return { success: true, analyses: data };
    } catch (err) {
      const error = err as Error;
      console.error('Unexpected error fetching analyses:', error);
      return { success: false, analyses: null, error: error.message };
    }
  },

  /**
   * Cancela uma análise em andamento.
   */
  cancelAnalysis: async (analysisId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('competitive_analysis')
        .update({ status: 'cancelled' })
        .eq('id', analysisId);

      if (error) throw error;
      
      // Aqui, você também pode precisar chamar uma edge function para parar o processo
      // await supabase.functions.invoke('cancel-analysis-task', { body: { analysisId } });

      return { success: true };
    } catch (err) {
      const error = err as Error;
      console.error('Error cancelling analysis:', error);
      return { success: false, error: error.message };
    }
  },
};