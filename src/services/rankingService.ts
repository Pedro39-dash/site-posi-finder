import { supabase } from "@/integrations/supabase/client";
import { useSimulatedData } from "@/hooks/useSimulatedData";

/**
 * Aplica dados de posicionamento simulados às keywords reais
 */
function applySimulatedPositions(
  realKeywords: KeywordRanking[], 
  period: string = '28d'
): KeywordRanking[] {
  // Calcular fator de variação baseado no período
  const getVariationFactor = (period: string): number => {
    switch(period) {
      case '24h': return 2;   // Variação máxima de ±2 posições
      case '7d': return 5;    // Variação máxima de ±5 posições
      case '28d': return 10;  // Variação máxima de ±10 posições
      case '90d': return 20;  // Variação máxima de ±20 posições
      case '180d': return 30; // Variação máxima de ±30 posições
      case '365d': return 50; // Variação máxima de ±50 posições
      case '16m': return 60;  // Variação máxima de ±60 posições
      default: return 10;
    }
  };

  const maxVariation = getVariationFactor(period);

  return realKeywords.map((keyword, index) => {
    // Usar seed baseado no ID da keyword para consistência
    const seed = keyword.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = (seed + index) % 100 / 100;
    
    // Gerar posição atual simulada (1-100)
    const simulatedPosition = Math.floor(random * 100) + 1;
    
    // Gerar posição anterior com variação proporcional ao período
    const variation = Math.floor((random * maxVariation * 2) - maxVariation);
    const simulatedPreviousPosition = Math.max(1, Math.min(100, simulatedPosition - variation));
    
    // Volume de busca baseado na posição (keywords bem ranqueadas geralmente têm mais volume)
    const baseVolume = simulatedPosition <= 10 ? 5000 : 
                       simulatedPosition <= 20 ? 2000 : 
                       simulatedPosition <= 50 ? 800 : 300;
    const simulatedVolume = Math.floor(baseVolume + (random * baseVolume * 0.5));
    
    return {
      ...keyword,
      current_position: simulatedPosition,
      previous_position: simulatedPreviousPosition,
      data_source: 'simulated_overlay',
      metadata: {
        ...keyword.metadata,
        search_volume: simulatedVolume,
        difficulty: Math.floor(random * 60) + 20,
        trend: simulatedPosition < simulatedPreviousPosition ? 'up' : 
               simulatedPosition > simulatedPreviousPosition ? 'down' : 'stable',
        simulated_period: period
      }
    };
  });
}

/**
 * Gera keywords simuladas completas para demonstração (fallback quando não há keywords reais)
 */
function generateSimulatedKeywords(projectId: string): KeywordRanking[] {
  const simulatedKeywords = [
    // Keywords informacionais
    { keyword: 'o que é SEO', position: 3, previousPosition: 5, volume: 8100, device: 'desktop' },
    { keyword: 'como fazer marketing digital', position: 7, previousPosition: 12, volume: 5400, device: 'desktop' },
    { keyword: 'otimização de sites', position: 15, previousPosition: 18, volume: 2900, device: 'mobile' },
    { keyword: 'estratégias de conteúdo', position: 22, previousPosition: 19, volume: 1600, device: 'desktop' },
    { keyword: 'análise de palavras-chave', position: 11, previousPosition: 11, volume: 1900, device: 'desktop' },
    
    // Keywords transacionais
    { keyword: 'consultoria SEO preço', position: 4, previousPosition: 6, volume: 3200, device: 'desktop' },
    { keyword: 'agência de marketing digital', position: 9, previousPosition: 7, volume: 6500, device: 'mobile' },
    { keyword: 'ferramenta de análise SEO', position: 12, previousPosition: 15, volume: 2100, device: 'desktop' },
    
    // Keywords locais
    { keyword: 'SEO São Paulo', position: 2, previousPosition: 3, volume: 1200, device: 'mobile' },
    { keyword: 'marketing digital Rio de Janeiro', position: 6, previousPosition: 8, volume: 980, device: 'desktop' },
    
    // Keywords long-tail
    { keyword: 'como melhorar posicionamento google 2025', position: 18, previousPosition: 25, volume: 590, device: 'desktop' },
    { keyword: 'melhores práticas SEO técnico', position: 14, previousPosition: 14, volume: 720, device: 'desktop' },
    { keyword: 'backlinks de qualidade como conseguir', position: 31, previousPosition: 28, volume: 430, device: 'mobile' },
    
    // Keywords em alta
    { keyword: 'IA para SEO', position: 8, previousPosition: 45, volume: 4200, device: 'desktop' },
    { keyword: 'Google Search Generative Experience', position: 19, previousPosition: null, volume: 2800, device: 'desktop' },
  ];

  return simulatedKeywords.map((kw, index) => ({
    id: `sim-${index}`,
    project_id: projectId,
    keyword: kw.keyword,
    current_position: kw.position,
    previous_position: kw.previousPosition,
    url: `https://example.com/${kw.keyword.replace(/\s+/g, '-')}`,
    search_engine: 'google',
    location: 'brazil',
    device: kw.device as string,
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000).toISOString(),
    data_source: 'simulated',
    metadata: {
      search_volume: kw.volume,
      difficulty: Math.floor(Math.random() * 60) + 20,
      trend: kw.previousPosition && kw.position < kw.previousPosition ? 'up' : 
             kw.previousPosition && kw.position > kw.previousPosition ? 'down' : 'stable'
    }
  }));
}

export interface KeywordRanking {
  id: string;
  project_id: string;
  keyword: string;
  current_position: number | null;
  previous_position: number | null;
  url: string | null;
  search_engine: string;
  location: string;
  device: string;
  created_at: string;
  updated_at: string;
  data_source?: string;
  tracking_status?: string; // Database returns string, not literal type
  last_seen_at?: string;
  metadata?: any;
}

export interface RankingHistory {
  id: string;
  keyword_ranking_id: string;
  position: number;
  recorded_at: string;
  change_from_previous: number;
  metadata?: any;
}

export interface KeywordSuggestion {
  id: string;
  project_id: string;
  suggested_keyword: string;
  source_type: 'semantic' | 'competitor' | 'content' | 'trends';
  relevance_score: number;
  search_volume: number | null;
  difficulty_score: number | null;
  suggested_at: string;
  status: 'pending' | 'accepted' | 'rejected';
  metadata?: any;
}

export interface RankingAlert {
  id: string;
  project_id: string;
  keyword: string;
  alert_type: 'position_drop' | 'position_gain' | 'new_ranking' | 'lost_ranking';
  threshold_value: number | null;
  is_active: boolean;
  created_at: string;
  last_triggered: string | null;
  metadata?: any;
}

export class RankingService {
  // ================ KEYWORD RANKINGS ================
  
  static async getProjectRankings(
    projectId: string,
    period?: string
  ): Promise<{
    success: boolean;
    rankings?: KeywordRanking[];
    error?: string;
  }> {
    try {
      const { isSimulatedMode } = useSimulatedData.getState();
      
      // 1. Buscar keywords monitoradas
      const { data: monitoredData, error: monitoredError } = await supabase
        .from('keyword_rankings')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (monitoredError) throw monitoredError;
      
      let allKeywords = monitoredData || [];

      // 2. Se período especificado E modo não simulado, buscar keywords adicionais do histórico
      if (period && !isSimulatedMode) {
        const days = this.periodToDays(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        console.log(`🔍 Buscando keywords do histórico para período ${period} (${days} dias)`);
        
        const { data: historicalData } = await supabase
          .from('ranking_history')
          .select(`
            keyword_ranking_id,
            keyword_rankings!inner(
              id, keyword, project_id, search_engine, 
              location, device, data_source
            )
          `)
          .eq('keyword_rankings.project_id', projectId)
          .gte('recorded_at', startDate.toISOString());
        
        if (historicalData && historicalData.length > 0) {
          // Extrair keywords únicas do histórico
          const historicalKeywords = new Map();
          historicalData.forEach((record: any) => {
            const kr = record.keyword_rankings;
            if (!historicalKeywords.has(kr.keyword)) {
              historicalKeywords.set(kr.keyword, kr);
            }
          });
          
          // Adicionar apenas keywords que NÃO estão já monitoradas
          const monitoredKeywordSet = new Set(allKeywords.map(k => k.keyword));
          historicalKeywords.forEach((kr, keyword) => {
            if (!monitoredKeywordSet.has(keyword)) {
              allKeywords.push({
                ...kr,
                current_position: null,
                previous_position: null,
                url: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                tracking_status: 'active',
                metadata: { from_history: true }
              });
            }
          });
          
          console.log(`📊 Keywords encontradas: ${monitoredData?.length || 0} monitoradas + ${allKeywords.length - (monitoredData?.length || 0)} do histórico = ${allKeywords.length} total`);
        }
      }
      
      // 3. Se modo simulado está ativo
      if (isSimulatedMode) {
        // Se há keywords reais, aplicar posições simuladas nelas
        if (allKeywords.length > 0) {
          console.log('🧪 Modo simulado ativo: aplicando posições simuladas às keywords', { period });
          return {
            success: true,
            rankings: applySimulatedPositions(allKeywords, period || '28d')
          };
        }
        // Se não há keywords, gerar keywords simuladas completas (fallback)
        console.log('🧪 Modo simulado ativo: gerando keywords de exemplo (sem keywords reais)');
        return {
          success: true,
          rankings: generateSimulatedKeywords(projectId)
        };
      }
      
      // Modo normal: retornar dados reais
      return {
        success: true,
        rankings: allKeywords
      };
    } catch (error) {
      console.error('Error fetching project rankings:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper para converter período em dias
  private static periodToDays(period: string): number {
    const map: Record<string, number> = {
      '24h': 1, '7d': 7, '28d': 28, '90d': 90,
      '180d': 180, '365d': 365, '16m': 480
    };
    return map[period] || 28;
  }

  static async addKeywordToTracking(data: {
    projectId: string;
    keyword: string;
    searchEngine?: string;
    location?: string;
    device?: string;
  }): Promise<{
    success: boolean;
    ranking?: KeywordRanking;
    error?: string;
  }> {
    try {
      const { data: ranking, error } = await supabase
        .from('keyword_rankings')
        .insert({
          project_id: data.projectId,
          keyword: data.keyword,
          search_engine: data.searchEngine || 'google',
          location: data.location || 'brazil',
          device: data.device || 'desktop'
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        ranking
      };
    } catch (error) {
      console.error('Error adding keyword to tracking:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async syncProjectKeywords(
    projectId: string,
    keywords: string[]
  ): Promise<{
    success: boolean;
    added: number;
    skipped: number;
    error?: string;
  }> {
    try {
      // 1. Buscar keywords já monitoradas
      const existing = await this.getProjectRankings(projectId);
      const existingKeywords = new Set(
        existing.rankings?.map(r => r.keyword.toLowerCase()) || []
      );
      
      // 2. Filtrar apenas as NOVAS keywords
      const newKeywords = keywords.filter(
        k => k.trim() && !existingKeywords.has(k.trim().toLowerCase())
      );
      
      // 3. Adicionar ao monitoramento
      let addedCount = 0;
      for (const keyword of newKeywords) {
        const result = await this.addKeywordToTracking({
          projectId,
          keyword: keyword.trim(),
          searchEngine: 'google',
          location: 'brazil',
          device: 'desktop'
        });
        if (result.success) addedCount++;
      }
      
      return {
        success: true,
        added: addedCount,
        skipped: keywords.length - newKeywords.length
      };
    } catch (error) {
      console.error('Error syncing project keywords:', error);
      return {
        success: false,
        added: 0,
        skipped: 0,
        error: error.message
      };
    }
  }

  static async deleteKeyword(keywordId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('keyword_rankings')
        .delete()
        .eq('id', keywordId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting keyword:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async updateKeywordPosition(
    rankingId: string,
    position: number,
    url?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // First get current position for history tracking
      const { data: current } = await supabase
        .from('keyword_rankings')
        .select('current_position')
        .eq('id', rankingId)
        .single();

      const { error } = await supabase
        .from('keyword_rankings')
        .update({
          previous_position: current?.current_position,
          current_position: position,
          url: url,
          updated_at: new Date().toISOString()
        })
        .eq('id', rankingId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating keyword position:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ================ RANKING HISTORY ================
  
  static async getRankingHistory(
    rankingId: string,
    limit: number = 30
  ): Promise<{
    success: boolean;
    history?: RankingHistory[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('ranking_history')
        .select('*')
        .eq('keyword_ranking_id', rankingId)
        .order('recorded_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        history: data || []
      };
    } catch (error) {
      console.error('Error fetching ranking history:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ================ KEYWORD SUGGESTIONS ================
  
  static async getKeywordSuggestions(projectId: string): Promise<{
    success: boolean;
    suggestions?: KeywordSuggestion[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('keyword_suggestions')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'pending')
        .order('relevance_score', { ascending: false })
        .limit(50);

      if (error) throw error;

      return {
        success: true,
        suggestions: (data as KeywordSuggestion[]) || []
      };
    } catch (error) {
      console.error('Error fetching keyword suggestions:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async generateSemanticSuggestions(
    projectId: string,
    baseKeywords: string[],
    websiteContent?: string
  ): Promise<{
    success: boolean;
    suggestionsCount?: number;
    error?: string;
  }> {
    try {
      const suggestions: any[] = [];

      // Generate semantic variations for each base keyword
      baseKeywords.forEach(baseKeyword => {
        const variations = this.generateKeywordVariations(baseKeyword);
        variations.forEach(variation => {
          suggestions.push({
            project_id: projectId,
            suggested_keyword: variation,
            source_type: 'semantic',
            relevance_score: Math.floor(Math.random() * 40) + 60, // 60-100
            search_volume: Math.floor(Math.random() * 5000) + 100,
            difficulty_score: Math.floor(Math.random() * 60) + 20
          });
        });
      });

      // Content-based suggestions if website content is provided
      if (websiteContent) {
        const contentKeywords = this.extractKeywordsFromContent(websiteContent);
        contentKeywords.forEach(keyword => {
          suggestions.push({
            project_id: projectId,
            suggested_keyword: keyword,
            source_type: 'content',
            relevance_score: Math.floor(Math.random() * 30) + 50, // 50-80
            search_volume: Math.floor(Math.random() * 2000) + 50,
            difficulty_score: Math.floor(Math.random() * 50) + 25
          });
        });
      }

      // Insert suggestions in batches to avoid overwhelming the database
      if (suggestions.length > 0) {
        const { error } = await supabase
          .from('keyword_suggestions')
          .insert(suggestions.slice(0, 20)); // Limit to 20 suggestions per batch

        if (error) throw error;
      }

      return {
        success: true,
        suggestionsCount: Math.min(suggestions.length, 20)
      };
    } catch (error) {
      console.error('Error generating semantic suggestions:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async updateSuggestionStatus(
    suggestionId: string,
    status: 'accepted' | 'rejected'
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('keyword_suggestions')
        .update({ status })
        .eq('id', suggestionId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating suggestion status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ================ RANKING ALERTS ================
  
  static async createRankingAlert(data: {
    projectId: string;
    keyword: string;
    alertType: 'position_drop' | 'position_gain' | 'new_ranking' | 'lost_ranking';
    thresholdValue?: number;
  }): Promise<{
    success: boolean;
    alert?: RankingAlert;
    error?: string;
  }> {
    try {
      const { data: alert, error } = await supabase
        .from('ranking_alerts')
        .insert({
          project_id: data.projectId,
          keyword: data.keyword,
          alert_type: data.alertType,
          threshold_value: data.thresholdValue
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        alert: alert as RankingAlert
      };
    } catch (error) {
      console.error('Error creating ranking alert:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async getProjectAlerts(projectId: string): Promise<{
    success: boolean;
    alerts?: RankingAlert[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('ranking_alerts')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        alerts: (data as RankingAlert[]) || []
      };
    } catch (error) {
      console.error('Error fetching project alerts:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ================ UTILITY FUNCTIONS ================
  
  private static generateKeywordVariations(baseKeyword: string): string[] {
    const variations = [];
    const prefixes = ['melhor', 'top', 'como', 'onde', 'qual', 'quanto custa'];
    const suffixes = ['online', 'brasil', 'preço', '2025', 'grátis', 'profissional'];
    
    // Add prefixes
    prefixes.forEach(prefix => {
      variations.push(`${prefix} ${baseKeyword}`);
    });
    
    // Add suffixes
    suffixes.forEach(suffix => {
      variations.push(`${baseKeyword} ${suffix}`);
    });
    
    return variations.slice(0, 6); // Limit variations
  }

  private static extractKeywordsFromContent(content: string): string[] {
    // Simple keyword extraction - in a real scenario, you'd use NLP
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= 4)
      .filter(word => !this.isStopWord(word));

    // Count word frequency
    const frequency: { [key: string]: number } = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    // Return most frequent words as potential keywords
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  private static isStopWord(word: string): boolean {
    const stopWords = [
      'para', 'com', 'uma', 'mais', 'como', 'por', 'dos', 'das', 'que', 'são',
      'tem', 'ter', 'ele', 'ela', 'seu', 'sua', 'este', 'esta', 'esse', 'essa'
    ];
    return stopWords.includes(word);
  }
}