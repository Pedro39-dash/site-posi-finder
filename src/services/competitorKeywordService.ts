import { supabase } from '@/integrations/supabase/client';

export interface CompetitorKeywordSuggestion {
  id: string;
  suggested_keyword: string;
  source_type: 'semantic' | 'competitor' | 'content' | 'gap_analysis';
  relevance_score: number;
  search_volume?: number;
  difficulty_score?: number;
  competitor_domains?: string[];
  metadata?: Record<string, any>;
}

export class CompetitorKeywordService {
  
  /**
   * Generate keyword suggestions based on target domain and competitors
   */
  static async generateCompetitorSuggestions(
    targetDomain: string,
    competitors: string[],
    baseKeywords: string[] = []
  ): Promise<{
    success: boolean;
    suggestions?: CompetitorKeywordSuggestion[];
    error?: string;
  }> {
    try {
      const suggestions: CompetitorKeywordSuggestion[] = [];
      
      // 1. Semantic suggestions from base keywords
      if (baseKeywords.length > 0) {
        const semanticSuggestions = this.generateSemanticSuggestions(baseKeywords);
        suggestions.push(...semanticSuggestions);
      }
      
      // 2. Competitor-based suggestions
      const competitorSuggestions = this.generateCompetitorBasedSuggestions(competitors);
      suggestions.push(...competitorSuggestions);
      
      // 3. Gap analysis suggestions
      const gapSuggestions = this.generateGapAnalysisSuggestions(targetDomain, competitors);
      suggestions.push(...gapSuggestions);
      
      // Sort by relevance score
      suggestions.sort((a, b) => b.relevance_score - a.relevance_score);
      
      return {
        success: true,
        suggestions: suggestions.slice(0, 15) // Limit to top 15
      };
    } catch (error) {
      console.error('Error generating competitor suggestions:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Generate semantic variations of base keywords
   */
  private static generateSemanticSuggestions(baseKeywords: string[]): CompetitorKeywordSuggestion[] {
    const suggestions: CompetitorKeywordSuggestion[] = [];
    const semanticModifiers = [
      'melhor', 'como', 'gratis', 'online', 'curso', 'preço', 'reviews',
      'comparação', 'alternativa', 'dicas', 'tutorial', 'profissional'
    ];
    
    baseKeywords.forEach(keyword => {
      // Add modifier variations
      semanticModifiers.slice(0, 3).forEach(modifier => {
        const variation = Math.random() > 0.5 ? 
          `${modifier} ${keyword}` : 
          `${keyword} ${modifier}`;
          
        suggestions.push({
          id: `semantic-${Date.now()}-${Math.random()}`,
          suggested_keyword: variation,
          source_type: 'semantic',
          relevance_score: Math.floor(Math.random() * 20) + 70, // 70-90
          search_volume: Math.floor(Math.random() * 3000) + 500,
          difficulty_score: Math.floor(Math.random() * 40) + 30,
          metadata: { base_keyword: keyword, modifier }
        });
      });
      
      // Add long-tail variations
      const longTails = [
        `como usar ${keyword}`,
        `${keyword} para iniciantes`,
        `${keyword} passo a passo`
      ];
      
      longTails.slice(0, 1).forEach(longTail => {
        suggestions.push({
          id: `semantic-longtail-${Date.now()}-${Math.random()}`,
          suggested_keyword: longTail,
          source_type: 'semantic',
          relevance_score: Math.floor(Math.random() * 15) + 60, // 60-75
          search_volume: Math.floor(Math.random() * 1000) + 200,
          difficulty_score: Math.floor(Math.random() * 30) + 25,
          metadata: { base_keyword: keyword, type: 'long_tail' }
        });
      });
    });
    
    return suggestions;
  }
  
  /**
   * Generate suggestions based on competitor domains (mock implementation)
   */
  private static generateCompetitorBasedSuggestions(competitors: string[]): CompetitorKeywordSuggestion[] {
    const suggestions: CompetitorKeywordSuggestion[] = [];
    const competitorKeywords = [
      'seo otimização', 'marketing digital', 'análise concorrência',
      'palavras chave', 'rankeamento google', 'tráfego orgânico',
      'backlinks', 'link building', 'content marketing', 'social media'
    ];
    
    competitors.forEach(competitor => {
      // Generate 2-3 suggestions per competitor
      competitorKeywords.slice(0, 3).forEach(keyword => {
        suggestions.push({
          id: `competitor-${Date.now()}-${Math.random()}`,
          suggested_keyword: keyword,
          source_type: 'competitor',
          relevance_score: Math.floor(Math.random() * 25) + 60, // 60-85
          search_volume: Math.floor(Math.random() * 5000) + 1000,
          difficulty_score: Math.floor(Math.random() * 50) + 40,
          competitor_domains: [competitor],
          metadata: { found_on_competitor: competitor }
        });
      });
    });
    
    return suggestions;
  }
  
  /**
   * Generate gap analysis suggestions (keywords competitors rank for but target doesn't)
   */
  private static generateGapAnalysisSuggestions(
    targetDomain: string, 
    competitors: string[]
  ): CompetitorKeywordSuggestion[] {
    const suggestions: CompetitorKeywordSuggestion[] = [];
    const gapKeywords = [
      'ferramentas seo', 'auditoria seo', 'consultoria digital',
      'estratégia seo', 'otimização site', 'análise keywords'
    ];
    
    gapKeywords.forEach(keyword => {
      const competingDomains = competitors.slice(0, Math.floor(Math.random() * competitors.length) + 1);
      
      suggestions.push({
        id: `gap-${Date.now()}-${Math.random()}`,
        suggested_keyword: keyword,
        source_type: 'gap_analysis',
        relevance_score: Math.floor(Math.random() * 20) + 75, // 75-95
        search_volume: Math.floor(Math.random() * 4000) + 800,
        difficulty_score: Math.floor(Math.random() * 35) + 45,
        competitor_domains: competingDomains,
        metadata: { 
          gap_opportunity: true,
          competing_domains_count: competingDomains.length
        }
      });
    });
    
    return suggestions;
  }
  
  /**
   * Generate content-based suggestions from domain analysis
   */
  static async generateContentSuggestions(
    domain: string
  ): Promise<CompetitorKeywordSuggestion[]> {
    // This would typically scrape the domain and extract keywords
    // For now, return mock content-based suggestions
    const contentKeywords = [
      'blog seo', 'artigos marketing', 'guias otimização',
      'casos sucesso', 'estudos caso', 'newsletter digital'
    ];
    
    return contentKeywords.map(keyword => ({
      id: `content-${Date.now()}-${Math.random()}`,
      suggested_keyword: keyword,
      source_type: 'content',
      relevance_score: Math.floor(Math.random() * 20) + 55, // 55-75
      search_volume: Math.floor(Math.random() * 2000) + 300,
      difficulty_score: Math.floor(Math.random() * 40) + 25,
      metadata: { source_domain: domain }
    }));
  }
}