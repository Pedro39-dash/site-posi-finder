import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Search, Copy, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface KeywordAnalysisCardProps {
  url: string;
  results: any[] | null;
}

const KeywordAnalysisCard = ({ url, results }: KeywordAnalysisCardProps) => {
  const { toast } = useToast();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Extract keywords - First try to use existing processed keywords, then fallback
  const extractKeywords = () => {
    if (!results) {
      console.log('🔍 No results provided to extractKeywords');
      return [];
    }

    console.log('🔍 Keyword extraction starting...');
    
    // Phase 1: Try to get keywords from existing audit metadata
    const aiOptimizationCategory = results.find(category => 
      category.category === 'ai_search_optimization'
    );
    
    if (aiOptimizationCategory?.issues) {
      // Look for the most recent issue with keywords
      for (const issue of aiOptimizationCategory.issues) {
        if (issue.metadata?.keywords && Array.isArray(issue.metadata.keywords)) {
          const existingKeywords = issue.metadata.keywords
            .filter((keyword: string) => keyword && typeof keyword === 'string' && keyword.length > 2)
            .slice(0, 100); // Get up to 100 keywords
          
          if (existingKeywords.length > 5) {
            console.log('✅ Found existing keywords:', existingKeywords.length, 'keywords');
            return existingKeywords;
          }
        }
      }
    }

    // Phase 2: Look for keywords in other categories 
    let allKeywords: string[] = [];
    results.forEach(category => {
      if (category.issues) {
        category.issues.forEach((issue: any) => {
          if (issue.metadata?.keywords && Array.isArray(issue.metadata.keywords)) {
            allKeywords.push(...issue.metadata.keywords);
          }
        });
      }
    });

    if (allKeywords.length > 0) {
      // Remove duplicates and filter
      const uniqueKeywords = [...new Set(allKeywords)]
        .filter(keyword => keyword && typeof keyword === 'string' && keyword.length > 2)
        .slice(0, 100);
      
      console.log('✅ Found keywords from categories:', uniqueKeywords.length, 'keywords');
      return uniqueKeywords;
    }

    console.log('⚠️ No processed keywords found, using fallback message');
    return [];
  };

  // Helper function to extract multi-word terms (2-4 words)
  const extractMultiWordTerms = (text: string): string[] => {
    const terms: string[] = [];
    
    // Clean HTML and normalize text
    const cleanText = text
      .replace(/<[^>]*>/g, ' ')
      .replace(/[^\w\sáéíóúâêîôûàèìòùãõç]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract 2-4 word combinations
    const words = cleanText.split(' ').filter(word => word.length > 1);
    
    for (let i = 0; i < words.length; i++) {
      // 2-word terms
      if (i < words.length - 1) {
        terms.push(`${words[i]} ${words[i + 1]}`);
      }
      // 3-word terms  
      if (i < words.length - 2) {
        terms.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
      }
      // 4-word terms
      if (i < words.length - 3) {
        terms.push(`${words[i]} ${words[i + 1]} ${words[i + 2]} ${words[i + 3]}`);
      }
      // Single significant words
      if (words[i].length > 3) {
        terms.push(words[i]);
      }
    }
    
    return terms;
  };

  // Normalize and validate keywords
  const normalizeKeyword = (keyword: string): string | null => {
    const normalized = keyword
      .toLowerCase()
      .trim()
      .replace(/[^\w\sáéíóúâêîôûàèìòùãõç]/g, ' ')
      .replace(/\s+/g, ' ');

    // Enhanced stop words for Portuguese business context
    const stopWords = new Set([
      'para', 'com', 'por', 'das', 'dos', 'nas', 'nos', 'uma', 'uns', 'umas',
      'que', 'como', 'quando', 'onde', 'porque', 'então', 'assim', 'muito',
      'mais', 'bem', 'já', 'ainda', 'até', 'depois', 'antes', 'sobre', 'entre',
      'sem', 'sob', 'desde', 'durante', 'através', 'dentro', 'fora', 'acima',
      'abaixo', 'além', 'aquém', 'contra', 'conforme', 'segundo', 'mediante',
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'was'
    ]);

    const words = normalized.split(' ');
    const filteredWords = words.filter(word => 
      word.length > 2 && 
      !stopWords.has(word) &&
      !/^\d+$/.test(word) // Not just numbers
    );

    if (filteredWords.length === 0 || filteredWords.join(' ').length < 3) {
      return null;
    }

    const result = filteredWords.join(' ');
    return result.length > 50 ? null : result; // Max length check
  };

  // Check if term has business context
  const hasBusinessContext = (term: string): boolean => {
    const businessIndicators = [
      'serviços', 'produtos', 'soluções', 'consultoria', 'empresa', 'negócio',
      'sistema', 'software', 'plataforma', 'tecnologia', 'implementação',
      'desenvolvimento', 'projeto', 'gestão', 'administração', 'vendas',
      'marketing', 'comercial', 'industrial', 'profissional', 'especializado'
    ];
    
    return businessIndicators.some(indicator => 
      term.toLowerCase().includes(indicator)
    );
  };

  // Check if term is a compound business term  
  const isCompoundBusinessTerm = (term: string): boolean => {
    const compoundPatterns = [
      /\w+\s+hidráulicos?/i,
      /\w+\s+elétricos?/i,
      /\w+\s+mecânicos?/i,
      /soluções?\s+para/i,
      /implementos?\s+\w+/i,
      /equipamentos?\s+\w+/i,
      /sistemas?\s+\w+/i,
      /serviços?\s+de/i,
      /consultoria\s+em/i,
      /\w+\s+industriais?/i,
      /\w+\s+comerciais?/i,
    ];
    
    return compoundPatterns.some(pattern => pattern.test(term));
  };

  // Check for technical context
  const hasTechnicalContext = (term: string): boolean => {
    const technicalTerms = [
      'técnico', 'tecnologia', 'engenharia', 'máquina', 'equipamento',
      'aparelho', 'dispositivo', 'instrumento', 'ferramenta', 'peça',
      'componente', 'material', 'produto', 'fabricação', 'produção',
      'manufatura', 'industrial', 'automação', 'controle', 'medição'
    ];
    
    return technicalTerms.some(tech => 
      term.toLowerCase().includes(tech)
    );
  };

  // Generate AI prompts based on domain and keywords
  const generateAIPrompts = () => {
    const domain = url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
    const keywords = extractKeywords();
    
    console.log('🤖 Generating AI prompts for domain:', domain);
    console.log('🤖 Available keywords:', keywords);
    
    // Try to get prompts from the audit results first
    const aiOptimizationCategory = results?.find(category => 
      category.category === 'ai_search_optimization'
    );
    
    console.log('🤖 AI optimization category for prompts:', aiOptimizationCategory);
    
    if (aiOptimizationCategory?.issues) {
      // Sort issues by created_at desc to get the most recent first
      const sortedIssues = [...aiOptimizationCategory.issues].sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
      
      // Look for the most recent issue with valid prompts
      for (const issue of sortedIssues) {
        if (issue.metadata?.prompts && Array.isArray(issue.metadata.prompts)) {
          const validPrompts = issue.metadata.prompts.filter((prompt: string) => 
            prompt && 
            typeof prompt === 'string' && 
            !prompt.includes('&') && // No HTML entities
            prompt.length > 10 &&
            prompt.length < 200
          );
          
          if (validPrompts.length > 3) {
            console.log('🤖 Found valid prompts:', validPrompts.length, 'prompts');
            return validPrompts; // Return all prompts from database
          }
        }
      }
    }
    
    // Fallback: generate prompts based on keywords and domain
    const prompts = [];
    
    // Extract company/service type from keywords
    const serviceKeywords = keywords.filter(k => 
      ['serviço', 'empresa', 'consultoria', 'solução', 'software', 'sistema', 'plataforma', 'desenvolvimento'].some(s => k.toLowerCase().includes(s))
    );
    
    const productKeywords = keywords.filter(k => 
      ['produto', 'venda', 'loja', 'comprar', 'preço', 'oferta'].some(s => k.toLowerCase().includes(s))
    );
    
    if (keywords.length > 0) {
      const topKeyword = keywords[0];
      
      // Problem-solution prompts
      prompts.push(`Onde encontrar ${topKeyword} profissional?`);
      prompts.push(`Como escolher ${topKeyword} de qualidade?`);
      prompts.push(`Melhor empresa de ${topKeyword}`);
      
      // Service-based prompts
      if (serviceKeywords.length > 0) {
        prompts.push(`Serviços de ${topKeyword} confiáveis`);
        prompts.push(`Consultoria especializada em ${topKeyword}`);
      }
      
      // Product-based prompts  
      if (productKeywords.length > 0) {
        prompts.push(`Onde comprar ${topKeyword}?`);
        prompts.push(`${topKeyword}: melhor preço`);
      }
      
      // Comparison prompts
      prompts.push(`Comparar empresas de ${topKeyword}`);
      prompts.push(`${topKeyword}: qual a melhor opção?`);
      
      // Educational prompts
      prompts.push(`Guia completo sobre ${topKeyword}`);
      prompts.push(`Como funciona ${topKeyword}?`);
      
      // Location-based prompts
      prompts.push(`${topKeyword} no Brasil`);
      prompts.push(`${topKeyword} em São Paulo`);
    }
    
    // Domain-specific prompts as fallback
    if (prompts.length === 0) {
      prompts.push(`O que é ${domain}?`);
      prompts.push(`Como usar ${domain}`);
      prompts.push(`${domain} é confiável?`);
      prompts.push(`Avaliação do ${domain}`);
      prompts.push(`Alternativas ao ${domain}`);
    }

    console.log('🤖 Generated AI prompts:', prompts.length, prompts);
    return prompts.slice(0, 12); // Return up to 12 generated prompts
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast({
        title: "Copiado!",
        description: "Prompt copiado para a área de transferência",
      });
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      toast({
        title: "Erro",
        description: "Falha ao copiar para a área de transferência",
        variant: "destructive",
      });
    }
  };

  if (!results) return null;

  const keywords = extractKeywords();
  const aiPrompts = generateAIPrompts();

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Brain className="h-5 w-5 text-primary" />
          Termos Relevantes e Prompts de IA
          <Badge variant="outline" className="ml-auto">
            {keywords.length} termos | {aiPrompts.length} prompts
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Keywords Section */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Search className="h-4 w-4" />
            Termos Identificados na Página
          </h3>
          <div className="flex flex-wrap gap-2">
            {keywords.length > 0 ? (
              keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary">
                  {keyword}
                </Badge>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">
                Nenhum termo relevante identificado. Execute uma auditoria completa para obter resultados.
              </p>
            )}
          </div>
        </div>

        {/* AI Prompts Section */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Possíveis Prompts que Usuários Digitariam
          </h3>
          <div className="grid gap-2">
            {aiPrompts.length > 0 ? (
              aiPrompts.map((prompt, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <span className="text-sm font-medium">{prompt}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(prompt, index)}
                    className="ml-2 h-6 w-6 p-0"
                  >
                    {copiedIndex === index ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">
                Nenhum prompt foi gerado. Execute uma auditoria para obter sugestões.
              </p>
            )}
          </div>
        </div>

        <div className="text-xs text-muted-foreground bg-accent/20 p-3 rounded-lg">
          <p className="font-medium mb-1">💡 Como usar estas informações:</p>
          <ul className="space-y-1 ml-2">
            <li>• <strong>Termos:</strong> Otimize seu conteúdo com essas palavras-chave</li>
            <li>• <strong>Prompts:</strong> Crie conteúdo que responda a essas perguntas</li>
            <li>• <strong>SEO para IA:</strong> IAs como ChatGPT, Claude e Gemini usam estes termos para encontrar seu site</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default KeywordAnalysisCard;