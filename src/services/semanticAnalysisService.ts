import { supabase } from '@/integrations/supabase/client';

export interface SemanticKeyword {
  keyword: string;
  relevance: number;
  context: string;
  intent: 'informational' | 'commercial' | 'navigational' | 'transactional';
  difficulty: number;
}

export class SemanticAnalysisService {
  
  /**
   * Analyze semantic similarity between keywords
   */
  static calculateSemanticSimilarity(keyword1: string, keyword2: string): number {
    const words1 = this.tokenize(keyword1);
    const words2 = this.tokenize(keyword2);
    
    // Jaccard similarity
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    if (union.length === 0) return 0;
    
    const jaccardSimilarity = intersection.length / union.length;
    
    // Boost score for common SEO patterns
    const patternBoost = this.calculatePatternBoost(keyword1, keyword2);
    
    return Math.min(1, jaccardSimilarity + patternBoost);
  }
  
  /**
   * Extract keywords from content using NLP techniques
   */
  static extractKeywordsFromContent(content: string): SemanticKeyword[] {
    const sentences = content.split(/[.!?]+/);
    const keywords: SemanticKeyword[] = [];
    
    // Extract noun phrases and important terms
    const nounPhrases = this.extractNounPhrases(content);
    const frequentTerms = this.getTermFrequency(content);
    
    // Combine and score
    const candidateKeywords = [...nounPhrases, ...Object.keys(frequentTerms)];
    
    candidateKeywords.forEach(keyword => {
      const relevance = this.calculateKeywordRelevance(keyword, content, frequentTerms);
      const intent = this.classifyKeywordIntent(keyword);
      const difficulty = this.estimateKeywordDifficulty(keyword);
      
      if (relevance > 0.3 && keyword.length > 2 && keyword.length < 50) {
        keywords.push({
          keyword: keyword.toLowerCase().trim(),
          relevance,
          context: this.extractContext(keyword, content),
          intent,
          difficulty
        });
      }
    });
    
    return keywords
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 15);
  }
  
  /**
   * Classify keyword intent
   */
  static classifyKeywordIntent(keyword: string): 'informational' | 'commercial' | 'navigational' | 'transactional' {
    const lowerKeyword = keyword.toLowerCase();
    
    // Commercial intent indicators
    if (/(comprar|preço|custo|valor|orçamento|barato|melhor|review|comparar)/.test(lowerKeyword)) {
      return 'commercial';
    }
    
    // Transactional intent indicators  
    if (/(download|cadastro|registrar|assinar|contratar|solicitar)/.test(lowerKeyword)) {
      return 'transactional';
    }
    
    // Navigational intent indicators
    if (/(login|entrar|site|página|oficial)/.test(lowerKeyword)) {
      return 'navigational';
    }
    
    // Default to informational
    return 'informational';
  }
  
  /**
   * Tokenize text for analysis
   */
  private static tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.isStopWord(word));
  }
  
  /**
   * Check if word is a stop word
   */
  private static isStopWord(word: string): boolean {
    const stopWords = new Set([
      'de', 'da', 'do', 'das', 'dos', 'e', 'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
      'para', 'por', 'com', 'sem', 'em', 'no', 'na', 'nos', 'nas', 'que', 'se', 'não',
      'mais', 'muito', 'como', 'quando', 'onde', 'porque', 'qual', 'quais', 'seu', 'sua'
    ]);
    return stopWords.has(word.toLowerCase());
  }
  
  /**
   * Calculate pattern boost for semantic similarity
   */
  private static calculatePatternBoost(keyword1: string, keyword2: string): number {
    let boost = 0;
    
    // Same root word
    const root1 = keyword1.split(' ')[0];
    const root2 = keyword2.split(' ')[0];
    if (root1 === root2) boost += 0.2;
    
    // Similar length (indicates similar complexity)
    const lengthSimilarity = 1 - Math.abs(keyword1.length - keyword2.length) / Math.max(keyword1.length, keyword2.length);
    if (lengthSimilarity > 0.8) boost += 0.1;
    
    // Common commercial patterns
    const commercialPatterns = ['melhor', 'preço', 'como', 'gratis', 'curso', 'tutorial'];
    const hasCommonPattern = commercialPatterns.some(pattern => 
      keyword1.includes(pattern) && keyword2.includes(pattern)
    );
    if (hasCommonPattern) boost += 0.15;
    
    return boost;
  }
  
  /**
   * Extract noun phrases from text
   */
  private static extractNounPhrases(text: string): string[] {
    const phrases: string[] = [];
    
    // Simple noun phrase extraction (adjective + noun patterns)
    const nounPhrasePattern = /(?:(?:[a-záçãêôé]+\s+){0,2}[a-záçãêôé]{3,})/gi;
    const matches = text.match(nounPhrasePattern) || [];
    
    matches.forEach(match => {
      const cleaned = match.trim().toLowerCase();
      if (cleaned.split(' ').length <= 4 && cleaned.length > 5) {
        phrases.push(cleaned);
      }
    });
    
    return [...new Set(phrases)];
  }
  
  /**
   * Calculate term frequency
   */
  private static getTermFrequency(text: string): Record<string, number> {
    const words = this.tokenize(text);
    const frequency: Record<string, number> = {};
    
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    return frequency;
  }
  
  /**
   * Calculate keyword relevance in content
   */
  private static calculateKeywordRelevance(
    keyword: string, 
    content: string, 
    termFrequency: Record<string, number>
  ): number {
    const keywordWords = this.tokenize(keyword);
    let relevanceScore = 0;
    
    // TF-IDF approximation
    keywordWords.forEach(word => {
      const tf = (termFrequency[word] || 0) / Object.keys(termFrequency).length;
      const idf = Math.log(content.length / (content.split(word).length - 1 || 1));
      relevanceScore += tf * idf;
    });
    
    // Position boost (keywords in title/headings are more relevant)
    if (content.toLowerCase().includes(keyword.toLowerCase())) {
      const position = content.toLowerCase().indexOf(keyword.toLowerCase());
      if (position < 200) relevanceScore *= 1.5; // Early in content
    }
    
    return Math.min(1, relevanceScore);
  }
  
  /**
   * Extract context around keyword
   */
  private static extractContext(keyword: string, content: string): string {
    const lowerContent = content.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    const index = lowerContent.indexOf(lowerKeyword);
    
    if (index === -1) return '';
    
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + keyword.length + 50);
    
    return content.substring(start, end).trim();
  }
  
  /**
   * Estimate keyword difficulty
   */
  private static estimateKeywordDifficulty(keyword: string): number {
    const words = keyword.split(' ');
    
    // Length-based difficulty
    let difficulty = Math.min(80, words.length * 15);
    
    // Commercial intent increases difficulty
    const intent = this.classifyKeywordIntent(keyword);
    if (intent === 'commercial') difficulty += 20;
    if (intent === 'transactional') difficulty += 30;
    
    return Math.min(100, difficulty);
  }
}