import { supabase } from '@/integrations/supabase/client';
import { ContentExtractionService } from './contentExtractionService';

const extractKeywordsFromDomain = async (domain: string): Promise<string[]> => {
  // 1. Adiciona a verificação para prevenir chamadas com domínio vazio
  if (!domain || typeof domain !== 'string' || domain.trim() === '') {
    return []; // Retorna um array vazio silenciosamente
  }

  // 2. Usa a função e a estrutura de dados corretas do ContentExtractionService
  const extractedData = await ContentExtractionService.extractDomainContent(domain);

  if (extractedData && Array.isArray(extractedData.keywords)) {
    return extractedData.keywords.slice(0, 10);
  }

  return [];
};

export const KeywordDiscoveryService = {
  /**
   * Suggests competitors based on target domain keywords.
   */
  generateCompetitorSuggestions: async (targetDomain: string): Promise<string[]> => {
    const keywords = await extractKeywordsFromDomain(targetDomain);
    if (keywords.length === 0) return [];

    const { data, error } = await supabase.functions.invoke('discover-keywords', {
      body: { keywords },
    });

    if (error) {
      console.error('Error discovering competitors:', error);
      return [];
    }

    return data.competitors?.filter((c: string) => c !== targetDomain).slice(0, 5) || [];
  },

  /**
   * Generates a keyword gap analysis.
   */
  generateRealGapAnalysis: async (
    targetDomain: string,
    competitorDomain: string
  ): Promise<{ commonKeywords: string[], targetOnly: string[], competitorOnly: string[] }> => {
    const [targetKeywords, competitorKeywords] = await Promise.all([
      extractKeywordsFromDomain(targetDomain),
      extractKeywordsFromDomain(competitorDomain)
    ]);

    const targetSet = new Set(targetKeywords);
    const competitorSet = new Set(competitorKeywords);

    const commonKeywords = targetKeywords.filter(k => competitorSet.has(k));
    const targetOnly = targetKeywords.filter(k => !competitorSet.has(k));
    const competitorOnly = competitorKeywords.filter(k => !targetSet.has(k));

    return { commonKeywords, targetOnly, competitorOnly };
  },
};