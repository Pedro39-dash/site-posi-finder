import { supabase } from "@/integrations/supabase/client";

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
  
  static async getProjectRankings(projectId: string): Promise<{
    success: boolean;
    rankings?: KeywordRanking[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('keyword_rankings')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        rankings: data || []
      };
    } catch (error) {
      console.error('Error fetching project rankings:', error);
      return {
        success: false,
        error: error.message
      };
    }
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