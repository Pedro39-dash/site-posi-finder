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

interface SerpKeywordData {
  keyword: string;
  search_volume?: number;
  competition?: string;
  position?: number;
  url?: string;
  title?: string;
}

interface ContentAnalysis {
  title?: string;
  headings: string[];
  keywords: string[];
  topics: string[];
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
      
      // 1. Real semantic suggestions from base keywords
      if (baseKeywords.length > 0) {
        const semanticSuggestions = await this.generateRealSemanticSuggestions(baseKeywords);
        suggestions.push(...semanticSuggestions);
      }
      
      // 2. Content-based suggestions from target domain
      if (targetDomain) {
        const contentSuggestions = await this.generateRealContentSuggestions(targetDomain);
        suggestions.push(...contentSuggestions);
      }
      
      // 3. Real competitor-based suggestions
      if (competitors.length > 0) {
        const competitorSuggestions = await this.generateRealCompetitorSuggestions(competitors, baseKeywords);
        suggestions.push(...competitorSuggestions);
      }
      
      // 4. Real gap analysis suggestions
      const gapSuggestions = await this.generateRealGapAnalysis(targetDomain, competitors, baseKeywords);
      suggestions.push(...gapSuggestions);
      
      // Sort by relevance score and remove duplicates
      const uniqueSuggestions = this.removeDuplicateKeywords(suggestions);
      uniqueSuggestions.sort((a, b) => b.relevance_score - a.relevance_score);
      
      return {
        success: true,
        suggestions: uniqueSuggestions.slice(0, 20) // Limit to top 20
      };
    } catch (error) {
      console.error('Error generating competitor suggestions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate suggestions'
      };
    }
  }
  
  /**
   * Generate real semantic suggestions using SerpApi
   */
  private static async generateRealSemanticSuggestions(baseKeywords: string[]): Promise<CompetitorKeywordSuggestion[]> {
    try {
      const suggestions: CompetitorKeywordSuggestion[] = [];
      
      for (const keyword of baseKeywords) {
        // Get related searches from SerpApi
        const relatedKeywords = await this.getSerpApiRelatedSearches(keyword);
        
        // Generate semantic variations with real context
        const semanticVariations = this.generateContextualVariations(keyword);
        
        // Combine and score suggestions
        [...relatedKeywords, ...semanticVariations].forEach((suggestion, index) => {
          if (suggestion && suggestion.trim().length > 0) {
            const relevanceScore = this.calculateSemanticRelevance(keyword, suggestion);
            
            suggestions.push({
              id: `semantic-${Date.now()}-${index}`,
              suggested_keyword: suggestion.toLowerCase().trim(),
              source_type: 'semantic',
              relevance_score: relevanceScore,
              search_volume: this.estimateSearchVolume(suggestion, keyword),
              difficulty_score: this.estimateDifficulty(suggestion),
              metadata: { 
                base_keyword: keyword,
                similarity_type: relatedKeywords.includes(suggestion) ? 'serp_related' : 'semantic_variation'
              }
            });
          }
        });
      }
      
      return suggestions;
    } catch (error) {
      console.error('Error generating semantic suggestions:', error);
      return this.getFallbackSemanticSuggestions(baseKeywords);
    }
  }
  
  /**
   * Generate real competitor-based suggestions using SERP analysis
   */
  private static async generateRealCompetitorSuggestions(
    competitors: string[], 
    baseKeywords: string[]
  ): Promise<CompetitorKeywordSuggestion[]> {
    try {
      const suggestions: CompetitorKeywordSuggestion[] = [];
      
      // For each competitor, analyze their content and extract keywords
      for (const competitor of competitors.slice(0, 3)) { // Limit to 3 competitors
        const competitorKeywords = await this.analyzeCompetitorKeywords(competitor, baseKeywords);
        
        competitorKeywords.forEach((keyword, index) => {
          suggestions.push({
            id: `competitor-${competitor.replace(/\./g, '')}-${index}`,
            suggested_keyword: keyword.keyword,
            source_type: 'competitor',
            relevance_score: keyword.relevance_score,
            search_volume: keyword.search_volume,
            difficulty_score: keyword.difficulty_score,
            competitor_domains: [competitor],
            metadata: { 
              found_on_competitor: competitor,
              extraction_method: 'content_analysis'
            }
          });
        });
      }
      
      return suggestions;
    } catch (error) {
      console.error('Error generating competitor suggestions:', error);
      return this.getFallbackCompetitorSuggestions(competitors);
    }
  }
  
  /**
   * Generate real gap analysis suggestions
   */
  private static async generateRealGapAnalysis(
    targetDomain: string, 
    competitors: string[],
    baseKeywords: string[]
  ): Promise<CompetitorKeywordSuggestion[]> {
    try {
      const suggestions: CompetitorKeywordSuggestion[] = [];
      
      // Analyze what competitors are ranking for that target domain might be missing
      const competitorKeywords = new Map<string, string[]>();
      
      for (const competitor of competitors.slice(0, 2)) {
        const keywords = await this.extractKeywordsFromDomain(competitor);
        competitorKeywords.set(competitor, keywords);
      }
      
      // Find keywords that multiple competitors have but are different from base keywords
      const allCompetitorKeywords = Array.from(competitorKeywords.values()).flat();
      const keywordFrequency = new Map<string, number>();
      
      allCompetitorKeywords.forEach(keyword => {
        keywordFrequency.set(keyword, (keywordFrequency.get(keyword) || 0) + 1);
      });
      
      // Identify gap opportunities (keywords used by multiple competitors)
      keywordFrequency.forEach((frequency, keyword) => {
        if (frequency >= 2 && !this.isKeywordTooSimilar(keyword, baseKeywords)) {
          const competingDomains = Array.from(competitorKeywords.entries())
            .filter(([, keywords]) => keywords.includes(keyword))
            .map(([domain]) => domain);
          
          const relevanceScore = Math.min(95, 60 + (frequency * 10));
          
          suggestions.push({
            id: `gap-${keyword.replace(/\s+/g, '-')}-${Date.now()}`,
            suggested_keyword: keyword,
            source_type: 'gap_analysis',
            relevance_score: relevanceScore,
            search_volume: this.estimateSearchVolume(keyword, baseKeywords[0] || ''),
            difficulty_score: this.estimateDifficulty(keyword),
            competitor_domains: competingDomains,
            metadata: { 
              gap_opportunity: true,
              competing_domains_count: competingDomains.length,
              frequency_across_competitors: frequency
            }
          });
        }
      });
      
      return suggestions.slice(0, 8); // Limit gap analysis suggestions
    } catch (error) {
      console.error('Error in gap analysis:', error);
      return [];
    }
  }
  
  /**
   * Generate real content-based suggestions from domain analysis
   */
  private static async generateRealContentSuggestions(domain: string): Promise<CompetitorKeywordSuggestion[]> {
    try {
      const suggestions: CompetitorKeywordSuggestion[] = [];
      const keywords = await this.extractKeywordsFromDomain(domain);
      
      keywords.slice(0, 8).forEach((keyword, index) => {
        const relevanceScore = this.calculateContentRelevance(keyword, domain);
        
        suggestions.push({
          id: `content-${domain.replace(/\./g, '')}-${index}`,
          suggested_keyword: keyword,
          source_type: 'content',
          relevance_score: relevanceScore,
          search_volume: this.estimateSearchVolume(keyword, ''),
          difficulty_score: this.estimateDifficulty(keyword),
          metadata: { 
            source_domain: domain,
            extraction_method: 'content_analysis'
          }
        });
      });
      
      return suggestions;
    } catch (error) {
      console.error('Error generating content suggestions:', error);
      return [];
    }
  }

  // Helper methods for the new implementation
  
  /**
   * Get related searches from SerpApi
   */
  private static async getSerpApiRelatedSearches(keyword: string): Promise<string[]> {
    try {
      const { data, error } = await supabase.functions.invoke('web-scraper', {
        body: { 
          query: keyword,
          type: 'related_searches',
          limit: 5
        }
      });
      
      if (error) throw error;
      return data?.related_searches || [];
    } catch (error) {
      console.error('Error getting SerpApi related searches:', error);
      return [];
    }
  }
  
  /**
   * Generate contextual variations of a keyword
   */
  private static generateContextualVariations(keyword: string): string[] {
    const variations: string[] = [];
    const modifiers = {
      informational: ['como', 'o que é', 'tutorial', 'guia', 'dicas'],
      commercial: ['melhor', 'comparar', 'preço', 'custo', 'barato'],
      local: ['perto de mim', 'em são paulo', 'no brasil'],
      temporal: ['2024', 'hoje', 'atualizado']
    };
    
    Object.values(modifiers).flat().slice(0, 6).forEach(modifier => {
      variations.push(`${modifier} ${keyword}`);
      variations.push(`${keyword} ${modifier}`);
    });
    
    return variations.filter(v => v.length < 60);
  }
  
  /**
   * Calculate semantic relevance between keywords
   */
  private static calculateSemanticRelevance(baseKeyword: string, suggestion: string): number {
    const baseWords = new Set(baseKeyword.toLowerCase().split(/\s+/));
    const suggestionWords = new Set(suggestion.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...baseWords].filter(x => suggestionWords.has(x)));
    const union = new Set([...baseWords, ...suggestionWords]);
    
    const jaccardSimilarity = intersection.size / union.size;
    
    // Boost for semantic patterns
    let boost = 0;
    if (suggestion.includes(baseKeyword) || baseKeyword.includes(suggestion)) boost += 0.2;
    if (suggestion.length > baseKeyword.length) boost += 0.1; // Long-tail bonus
    
    return Math.min(95, (jaccardSimilarity + boost) * 100);
  }
  
  /**
   * Analyze competitor keywords
   */
  private static async analyzeCompetitorKeywords(competitor: string, baseKeywords: string[]): Promise<Array<{
    keyword: string;
    relevance_score: number;
    search_volume: number;
    difficulty_score: number;
  }>> {
    try {
      const keywords = await this.extractKeywordsFromDomain(competitor);
      
      return keywords.slice(0, 5).map(keyword => ({
        keyword,
        relevance_score: this.calculateCompetitorRelevance(keyword, baseKeywords),
        search_volume: this.estimateSearchVolume(keyword, baseKeywords[0] || ''),
        difficulty_score: this.estimateDifficulty(keyword)
      }));
    } catch (error) {
      console.error('Error analyzing competitor:', error);
      return [];
    }
  }
  
  /**
   * Extract keywords from a domain
   */
  private static async extractKeywordsFromDomain(domain: string): Promise<string[]> {
    try {
      const { ContentExtractionService } = await import('./contentExtractionService');
      const content = await ContentExtractionService.extractDomainContent(domain);
      return content.keywords.slice(0, 15);
    } catch (error) {
      console.error('Error extracting keywords from domain:', error);
      return this.getFallbackKeywordsForDomain(domain);
    }
  }
  
  /**
   * Calculate competitor relevance
   */
  private static calculateCompetitorRelevance(keyword: string, baseKeywords: string[]): number {
    if (baseKeywords.length === 0) return 60;
    
    const maxRelevance = Math.max(...baseKeywords.map(base => 
      this.calculateSemanticRelevance(base, keyword)
    ));
    
    return Math.max(50, maxRelevance);
  }
  
  /**
   * Calculate content relevance
   */
  private static calculateContentRelevance(keyword: string, domain: string): number {
    // Base relevance for content-derived keywords
    let relevance = 65;
    
    // Boost for domain-specific terms
    if (keyword.includes(domain.split('.')[0])) relevance += 10;
    
    // Boost for longer, more specific keywords
    if (keyword.split(' ').length > 2) relevance += 5;
    
    return Math.min(90, relevance);
  }
  
  /**
   * Estimate search volume
   */
  private static estimateSearchVolume(keyword: string, baseKeyword: string): number {
    const wordCount = keyword.split(' ').length;
    let volume = 1000;
    
    // Shorter keywords generally have higher volume
    if (wordCount === 1) volume = 5000;
    else if (wordCount === 2) volume = 3000;
    else if (wordCount === 3) volume = 1500;
    else volume = 800;
    
    // Similar to base keyword = higher volume
    if (baseKeyword && keyword.includes(baseKeyword)) {
      volume *= 1.5;
    }
    
    return Math.floor(volume + (Math.random() * volume * 0.3));
  }
  
  /**
   * Estimate keyword difficulty
   */
  private static estimateDifficulty(keyword: string): number {
    const wordCount = keyword.split(' ').length;
    let difficulty = 30;
    
    // Shorter keywords are generally harder
    if (wordCount === 1) difficulty = 70;
    else if (wordCount === 2) difficulty = 50;
    else if (wordCount === 3) difficulty = 35;
    else difficulty = 25;
    
    // Commercial keywords are harder
    const commercialTerms = ['comprar', 'preço', 'melhor', 'curso', 'serviço'];
    if (commercialTerms.some(term => keyword.includes(term))) {
      difficulty += 15;
    }
    
    return Math.min(95, difficulty + Math.floor(Math.random() * 10));
  }
  
  /**
   * Check if keyword is too similar to base keywords
   */
  private static isKeywordTooSimilar(keyword: string, baseKeywords: string[]): boolean {
    return baseKeywords.some(base => 
      keyword.toLowerCase().includes(base.toLowerCase()) || 
      base.toLowerCase().includes(keyword.toLowerCase()) ||
      this.calculateSemanticRelevance(base, keyword) > 80
    );
  }
  
  /**
   * Remove duplicate keywords
   */
  private static removeDuplicateKeywords(suggestions: CompetitorKeywordSuggestion[]): CompetitorKeywordSuggestion[] {
    const seen = new Set<string>();
    return suggestions.filter(suggestion => {
      const key = suggestion.suggested_keyword.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  
  /**
   * Fallback suggestions for semantic analysis
   */
  private static getFallbackSemanticSuggestions(baseKeywords: string[]): CompetitorKeywordSuggestion[] {
    const modifiers = ['como', 'melhor', 'gratis', 'curso', 'dicas', 'tutorial'];
    const suggestions: CompetitorKeywordSuggestion[] = [];
    
    baseKeywords.forEach(keyword => {
      modifiers.slice(0, 3).forEach((modifier, index) => {
        suggestions.push({
          id: `fallback-semantic-${index}`,
          suggested_keyword: `${modifier} ${keyword}`,
          source_type: 'semantic',
          relevance_score: 70,
          search_volume: 1200,
          difficulty_score: 40,
          metadata: { fallback: true }
        });
      });
    });
    
    return suggestions;
  }
  
  /**
   * Fallback suggestions for competitor analysis
   */
  private static getFallbackCompetitorSuggestions(competitors: string[]): CompetitorKeywordSuggestion[] {
    const suggestions: CompetitorKeywordSuggestion[] = [];
    const fallbackKeywords = ['marketing digital', 'seo', 'otimização', 'análise'];
    
    competitors.slice(0, 2).forEach((competitor, compIndex) => {
      fallbackKeywords.slice(0, 2).forEach((keyword, kwIndex) => {
        suggestions.push({
          id: `fallback-competitor-${compIndex}-${kwIndex}`,
          suggested_keyword: keyword,
          source_type: 'competitor',
          relevance_score: 65,
          search_volume: 2000,
          difficulty_score: 50,
          competitor_domains: [competitor],
          metadata: { fallback: true }
        });
      });
    });
    
    return suggestions;
  }
  
  /**
   * Get fallback keywords for domain
   */
  private static getFallbackKeywordsForDomain(domain: string): string[] {
    const domainName = domain.split('.')[0];
    return [
      domainName,
      `${domainName} online`,
      `sobre ${domainName}`,
      `${domainName} brasil`,
      `contato ${domainName}`
    ];
  }
}