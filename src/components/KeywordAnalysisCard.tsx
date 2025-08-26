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

  // Extract relevant keywords from audit results
  const extractKeywords = () => {
    if (!results) {
      console.log('🔍 No results provided to extractKeywords');
      return [];
    }

    console.log('🔍 Extracting keywords from results:', results);
    let keywords: string[] = [];
    
    // Find the AI search optimization category specifically
    const aiOptimizationCategory = results.find(category => 
      category.category === 'ai_search_optimization'
    );
    
    console.log('🔍 AI optimization category found:', aiOptimizationCategory);
    
    if (aiOptimizationCategory?.issues) {
      // Sort issues by created_at desc to get the most recent first
      const sortedIssues = [...aiOptimizationCategory.issues].sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
      
      console.log('🔍 Sorted issues by date:', sortedIssues.length);
      
      // Look for the most recent issue with valid metadata and keywords
      for (const issue of sortedIssues) {
        console.log('🔍 Checking issue metadata:', issue.metadata);
        
        if (issue.metadata?.keywords && Array.isArray(issue.metadata.keywords)) {
          // Filter out HTML entities and corrupted data
          const validKeywords = issue.metadata.keywords.filter((keyword: string) => 
            keyword && 
            typeof keyword === 'string' && 
            !keyword.includes('&') && // No HTML entities
            keyword.length > 1 &&
            keyword.length < 50 // Reasonable length
          );
          
          if (validKeywords.length > 5) { // Only use if we have enough valid keywords
            console.log('🔍 Found valid keywords:', validKeywords.length, 'keywords');
            keywords.push(...validKeywords);
            break; // Use the first (most recent) valid set
          }
        }
      }
    }
    
    // If no keywords found in AI optimization, try other categories as fallback
    if (keywords.length === 0) {
      console.log('🔍 No keywords in AI category, trying other categories');
      results.forEach(category => {
        if (category.issues) {
          category.issues.forEach((issue: any) => {
            if (issue.metadata?.keywords && Array.isArray(issue.metadata.keywords)) {
              const validKeywords = issue.metadata.keywords.filter((keyword: string) => 
                keyword && 
                typeof keyword === 'string' && 
                !keyword.includes('&') && 
                keyword.length > 1 &&
                keyword.length < 50
              );
              keywords.push(...validKeywords);
            }
          });
        }
      });
    }

    // Remove duplicates and filter out common words
    const stopWords = new Set([
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'car', 'she', 'use', 'way', 'many',
      'que', 'para', 'com', 'uma', 'por', 'dos', 'das', 'nos', 'nas', 'ser', 'ter', 'seu', 'sua', 'seus', 'suas', 'mais', 'como', 'muito', 'bem', 'onde', 'quando', 'porque', 'então', 'assim', 'também', 'já', 'ainda', 'até', 'depois', 'antes'
    ]);
    
    const uniqueKeywords = [...new Set(keywords)].filter(keyword => 
      keyword && keyword.length > 2 && !stopWords.has(keyword.toLowerCase())
    );

    console.log('🔍 Final extracted keywords:', uniqueKeywords.length, uniqueKeywords);
    return uniqueKeywords; // Return all keywords found
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