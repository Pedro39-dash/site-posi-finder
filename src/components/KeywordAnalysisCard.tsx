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
    if (!results) return [];

    const keywords: string[] = [];
    
    results.forEach(category => {
      if (category.issues) {
        category.issues.forEach((issue: any) => {
          if (issue.metadata?.keywords) {
            keywords.push(...issue.metadata.keywords);
          }
        });
      }
    });

    // Remove duplicates and filter out common words
    const uniqueKeywords = [...new Set(keywords)].filter(keyword => 
      keyword.length > 2 && !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'car', 'she', 'use', 'way', 'many'].includes(keyword.toLowerCase())
    );

    return uniqueKeywords.slice(0, 10); // Top 10 keywords
  };

  // Generate AI prompts based on domain and keywords
  const generateAIPrompts = () => {
    const domain = url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
    const keywords = extractKeywords();
    
    const prompts = [];
    
    // Basic domain searches
    prompts.push(`O que é ${domain}?`);
    prompts.push(`Como usar ${domain}`);
    prompts.push(`${domain} é confiável?`);
    
    // Keyword-based prompts
    if (keywords.length > 0) {
      prompts.push(`Melhor site para ${keywords[0]}`);
      prompts.push(`${keywords[0]} online`);
      if (keywords[1]) {
        prompts.push(`${keywords[0]} e ${keywords[1]}`);
      }
    }
    
    // Industry-specific prompts
    const businessTypes = ['empresa', 'serviço', 'produto', 'solução', 'consultoria'];
    businessTypes.forEach(type => {
      if (keywords.some(k => k.toLowerCase().includes(type))) {
        prompts.push(`Melhores ${type}s como ${domain}`);
      }
    });

    return prompts.slice(0, 8); // Top 8 prompts
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