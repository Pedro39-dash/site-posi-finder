export interface ExtractedContent {
  title?: string;
  metaDescription?: string;
  headings: string[];
  bodyText: string;
  keywords: string[];
  links: string[];
}

export class ContentExtractionService {
  
  /**
   * Extract content from a domain using web scraping
   */
  static async extractDomainContent(domain: string): Promise<ExtractedContent> {
    try {
      const url = domain.startsWith('http') ? domain : `https://${domain}`;
      
      // Fetch the page content directly
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      
      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : '';
      
      // Extract meta description
      const metaDescMatch = html.match(/<meta[^>]+name=['"]description['"][^>]+content=['"]([^'"]+)['"][^>]*>/i);
      const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : '';
      
      // Extract headings
      const headingMatches = html.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi) || [];
      const headings = headingMatches.map(h => {
        const textMatch = h.match(/>([^<]+)</);
        return textMatch ? textMatch[1].trim() : '';
      }).filter(Boolean);
      
      // Extract body text (simplified)
      const bodyMatch = html.match(/<body[^>]*>(.*?)<\/body>/is);
      const bodyText = bodyMatch 
        ? bodyMatch[1].replace(/<script[^>]*>.*?<\/script>/gis, '')
                      .replace(/<style[^>]*>.*?<\/style>/gis, '')
                      .replace(/<[^>]+>/g, ' ')
                      .replace(/\s+/g, ' ')
                      .trim()
                      .slice(0, 1000)
        : '';
      
      // Extract keywords from content
      const keywords = this.extractKeywordsFromHTML(html);
      
      // Extract links
      const linkMatches = html.match(/<a[^>]+href=['"]([^'"]+)['"][^>]*>/gi) || [];
      const links = linkMatches
        .map(link => {
          const hrefMatch = link.match(/href=['"]([^'"]+)['"]/i);
          return hrefMatch ? hrefMatch[1] : '';
        })
        .filter(link => link.startsWith('http'))
        .slice(0, 20);
      
      return {
        title,
        metaDescription,
        headings: headings.slice(0, 10),
        bodyText,
        keywords: keywords.slice(0, 15),
        links
      };
    } catch (error) {
      console.error('Error extracting domain content:', error);
      return this.getFallbackContent(domain);
    }
  }
  
  /**
   * Extract keywords from HTML content
   */
  static extractKeywordsFromHTML(html: string): string[] {
    const keywords: string[] = [];
    
    try {
      // Extract from title tags
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        keywords.push(...this.extractWordsFromText(titleMatch[1]));
      }
      
      // Extract from meta keywords
      const metaKeywords = html.match(/<meta[^>]+name=['"]keywords['"][^>]+content=['"]([^'"]+)['"][^>]*>/i);
      if (metaKeywords) {
        keywords.push(...metaKeywords[1].split(',').map(k => k.trim()));
      }
      
      // Extract from headings
      const headingMatches = html.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi) || [];
      headingMatches.forEach(heading => {
        const textMatch = heading.match(/>([^<]+)</);
        if (textMatch) {
          keywords.push(...this.extractWordsFromText(textMatch[1]));
        }
      });
      
      // Extract from content (limited to avoid noise)
      const bodyMatch = html.match(/<body[^>]*>(.*?)<\/body>/is);
      if (bodyMatch) {
        const textContent = bodyMatch[1].replace(/<[^>]+>/g, ' ').trim();
        const contentKeywords = this.extractKeywordsFromContent(textContent);
        keywords.push(...contentKeywords.slice(0, 10)); // Limit content keywords
      }
      
    } catch (error) {
      console.error('Error parsing HTML:', error);
    }
    
    return this.cleanAndFilterKeywords(keywords);
  }
  
  /**
   * Extract meaningful keywords from text content
   */
  static extractKeywordsFromContent(text: string): string[] {
    // Remove HTML tags and normalize text
    const cleanText = text.replace(/<[^>]+>/g, ' ')
                         .replace(/\s+/g, ' ')
                         .toLowerCase()
                         .trim();
    
    // Extract noun phrases and important terms
    const words = cleanText.split(/\s+/);
    const keywords: string[] = [];
    
    // Extract 2-4 word phrases
    for (let i = 0; i < words.length - 1; i++) {
      for (let len = 2; len <= 4 && i + len <= words.length; len++) {
        const phrase = words.slice(i, i + len).join(' ');
        if (this.isValidKeyword(phrase)) {
          keywords.push(phrase);
        }
      }
    }
    
    // Get most frequent keywords
    const frequency: Record<string, number> = {};
    keywords.forEach(keyword => {
      frequency[keyword] = (frequency[keyword] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([keyword]) => keyword);
  }
  
  /**
   * Clean and filter keywords
   */
  private static cleanAndFilterKeywords(keywords: string[]): string[] {
    const cleaned = keywords
      .map(k => k.toLowerCase().trim())
      .filter(k => k.length > 2 && k.length < 50)
      .filter(k => !this.isStopWord(k))
      .filter(k => this.isValidKeyword(k));
    
    // Remove duplicates
    return [...new Set(cleaned)];
  }
  
  /**
   * Check if a keyword is valid
   */
  private static isValidKeyword(keyword: string): boolean {
    // Must contain at least one letter
    if (!/[a-záçãêôéíóú]/i.test(keyword)) return false;
    
    // Must not be too short or too long
    if (keyword.length < 3 || keyword.length > 50) return false;
    
    // Must not contain too many numbers
    const numberCount = (keyword.match(/\d/g) || []).length;
    if (numberCount > keyword.length * 0.3) return false;
    
    // Must not be all stop words
    const words = keyword.split(/\s+/);
    const stopWordCount = words.filter(word => this.isStopWord(word)).length;
    if (stopWordCount === words.length) return false;
    
    return true;
  }
  
  /**
   * Check if word is a stop word
   */
  private static isStopWord(word: string): boolean {
    const stopWords = new Set([
      'de', 'da', 'do', 'das', 'dos', 'e', 'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
      'para', 'por', 'com', 'sem', 'em', 'no', 'na', 'nos', 'nas', 'que', 'se', 'não',
      'mais', 'muito', 'como', 'quando', 'onde', 'porque', 'qual', 'quais', 'seu', 'sua',
      'este', 'esta', 'isso', 'aqui', 'ali', 'então', 'mas', 'ou', 'também', 'já', 'só',
      'entre', 'sobre', 'até', 'desde', 'após', 'antes', 'durante', 'contra', 'sob'
    ]);
    return stopWords.has(word.toLowerCase());
  }
  
  /**
   * Extract words from text
   */
  private static extractWordsFromText(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\sáçãêôéíóú]/gi, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.isStopWord(word));
  }
  
  /**
   * Get fallback content when extraction fails
   */
  private static getFallbackContent(domain: string): ExtractedContent {
    return {
      title: `Análise de ${domain}`,
      metaDescription: `Conteúdo extraído de ${domain}`,
      headings: [],
      bodyText: '',
      keywords: [],
      links: []
    };
  }
}