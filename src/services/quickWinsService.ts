import { supabase } from "@/integrations/supabase/client";

export interface QuickWin {
  keyword: string;
  keywordRankingId: string;
  currentPosition: number;
  potentialPosition: number;
  estimatedTrafficGain: number;
  url: string;
}

export interface AtRiskKeyword {
  keyword: string;
  keywordRankingId: string;
  currentPosition: number;
  previousPosition: number;
  decline: number;
  url: string;
}

export interface FeaturedSnippetOpportunity {
  keyword: string;
  keywordRankingId: string;
  currentPosition: number;
  hasQuestion: boolean;
  url: string;
}

export interface CannibalizationIssue {
  keyword: string;
  urls: string[];
  positions: number[];
  keywordRankingIds: string[];
}

export interface QuickWinsData {
  quickWins: QuickWin[];
  atRisk: AtRiskKeyword[];
  featuredSnippets: FeaturedSnippetOpportunity[];
  cannibalization: CannibalizationIssue[];
  totalOpportunities: number;
}

export class QuickWinsService {
  private estimateTrafficGain(fromPosition: number, toPosition: number, searchVolume: number = 1000): number {
    const ctrByPosition: Record<number, number> = {
      1: 0.28, 2: 0.15, 3: 0.11, 4: 0.08, 5: 0.07,
      6: 0.05, 7: 0.04, 8: 0.03, 9: 0.03, 10: 0.02
    };
    
    const fromCTR = ctrByPosition[fromPosition] || (fromPosition <= 20 ? 0.01 : 0.005);
    const toCTR = ctrByPosition[toPosition] || (toPosition <= 20 ? 0.01 : 0.005);
    
    return Math.round(searchVolume * (toCTR - fromCTR));
  }

  async getQuickWins(projectId: string): Promise<QuickWin[]> {
    // Keywords entre posição 4-10 (próximas do Top 3)
    const { data, error } = await supabase
      .from('keyword_rankings')
      .select('*')
      .eq('project_id', projectId)
      .gte('current_position', 4)
      .lte('current_position', 10)
      .order('current_position', { ascending: true })
      .limit(20);

    if (error || !data) return [];

    return data.map(kw => ({
      keyword: kw.keyword,
      keywordRankingId: kw.id,
      currentPosition: kw.current_position || 10,
      potentialPosition: 3,
      estimatedTrafficGain: this.estimateTrafficGain(kw.current_position || 10, 3),
      url: kw.url || ''
    }));
  }

  async getAtRiskKeywords(projectId: string, days: number = 7): Promise<AtRiskKeyword[]> {
    // Keywords que caíram mais de 5 posições nos últimos dias
    const { data: rankings, error } = await supabase
      .from('keyword_rankings')
      .select(`
        id,
        keyword,
        current_position,
        previous_position,
        url
      `)
      .eq('project_id', projectId);

    if (error || !rankings) return [];

    const atRisk: AtRiskKeyword[] = [];

    for (const ranking of rankings) {
      // Buscar histórico recente
      const { data: history } = await supabase
        .from('ranking_history')
        .select('position, change_from_previous')
        .eq('keyword_ranking_id', ranking.id)
        .gte('recorded_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('recorded_at', { ascending: false })
        .limit(1);

      if (history && history.length > 0) {
        const recentChange = history[0].change_from_previous || 0;
        
        if (recentChange > 5) { // Caiu mais de 5 posições
          atRisk.push({
            keyword: ranking.keyword,
            keywordRankingId: ranking.id,
            currentPosition: ranking.current_position || 100,
            previousPosition: (ranking.current_position || 100) - recentChange,
            decline: recentChange,
            url: ranking.url || ''
          });
        }
      }
    }

    return atRisk.slice(0, 10);
  }

  async getFeaturedSnippetOpportunities(projectId: string): Promise<FeaturedSnippetOpportunity[]> {
    // Keywords entre posição 1-10 que são perguntas ou têm potencial de snippet
    const { data, error } = await supabase
      .from('keyword_rankings')
      .select('*')
      .eq('project_id', projectId)
      .gte('current_position', 1)
      .lte('current_position', 10)
      .order('current_position', { ascending: true });

    if (error || !data) return [];

    const opportunities: FeaturedSnippetOpportunity[] = [];
    const questionWords = ['como', 'o que', 'quando', 'onde', 'por que', 'qual', 'quanto'];

    for (const kw of data) {
      const keyword = kw.keyword.toLowerCase();
      const hasQuestion = questionWords.some(q => keyword.includes(q));
      
      // Também considerar keywords informacionais
      const isInformational = keyword.includes('guia') || 
                             keyword.includes('tutorial') || 
                             keyword.includes('passo a passo');

      if (hasQuestion || isInformational) {
        opportunities.push({
          keyword: kw.keyword,
          keywordRankingId: kw.id,
          currentPosition: kw.current_position || 1,
          hasQuestion,
          url: kw.url || ''
        });
      }
    }

    return opportunities.slice(0, 10);
  }

  async detectCannibalization(projectId: string): Promise<CannibalizationIssue[]> {
    // Detectar múltiplas URLs ranqueando para mesma keyword
    const { data, error } = await supabase
      .from('keyword_rankings')
      .select('keyword, url, current_position, id')
      .eq('project_id', projectId)
      .not('url', 'is', null)
      .order('keyword');

    if (error || !data) return [];

    const keywordMap = new Map<string, typeof data>();
    
    data.forEach(kw => {
      const existing = keywordMap.get(kw.keyword) || [];
      existing.push(kw);
      keywordMap.set(kw.keyword, existing);
    });

    const issues: CannibalizationIssue[] = [];

    keywordMap.forEach((rankings, keyword) => {
      const uniqueUrls = new Set(rankings.map(r => r.url));
      
      if (uniqueUrls.size > 1) {
        issues.push({
          keyword,
          urls: Array.from(uniqueUrls) as string[],
          positions: rankings.map(r => r.current_position || 100),
          keywordRankingIds: rankings.map(r => r.id)
        });
      }
    });

    return issues.slice(0, 10);
  }

  async getQuickWinsData(projectId: string): Promise<QuickWinsData> {
    const [quickWins, atRisk, featuredSnippets, cannibalization] = await Promise.all([
      this.getQuickWins(projectId),
      this.getAtRiskKeywords(projectId),
      this.getFeaturedSnippetOpportunities(projectId),
      this.detectCannibalization(projectId)
    ]);

    return {
      quickWins,
      atRisk,
      featuredSnippets,
      cannibalization,
      totalOpportunities: quickWins.length + atRisk.length + featuredSnippets.length + cannibalization.length
    };
  }
}

export const quickWinsService = new QuickWinsService();
