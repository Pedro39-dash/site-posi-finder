import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Brain, Search, Copy, CheckCircle, TrendingUp, Target, Zap, Info, Filter, BarChart3 } from "lucide-react";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

interface KeywordAnalysisCardProps {
  url: string;
  results: any[] | null;
}

interface SemanticTerm {
  term: string;
  type: 'commercial_modifier' | 'main_entity' | 'attribute' | 'specifier';
  tailType: 'short' | 'medium' | 'long';
  intentType: 'commercial' | 'informational' | 'navigational';
  relevanceScore: number;
}

const KeywordAnalysisCard = ({ url, results }: KeywordAnalysisCardProps) => {
  const { toast } = useToast();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'commercial' | 'informational'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showStats, setShowStats] = useState(false);

  // Extract semantic data from audit results - Enhanced for intelligent analysis
  const extractSemanticData = () => {
    if (!results) return { keywords: [], prompts: [], semanticTerms: [], modifiers: [], entities: [], attributes: [] };

    // Look for enhanced semantic analysis data
    const aiOptimizationCategory = results.find(category => 
      category.category === 'ai_search_optimization'
    );
    
    if (aiOptimizationCategory?.issues) {
      for (const issue of aiOptimizationCategory.issues) {
        // Check for new intelligent semantic analysis data
        if (issue.metadata?.semanticAnalysis) {
          const semantic = issue.metadata.semanticAnalysis;
          
          // Extract enhanced semantic terms with context
          const allTerms = [
            ...(semantic.shortTailTerms || []),
            ...(semantic.mediumTailTerms || []),
            ...(semantic.longTailTerms || [])
          ];

          return {
            keywords: issue.metadata.keywords || [],
            prompts: semantic.intelligentPrompts || issue.metadata.prompts || [],
            semanticTerms: allTerms,
            modifiers: semantic.commercialModifiers || [],
            entities: semantic.mainEntities || [],
            attributes: semantic.attributes || []
          };
        }
        
        // Fallback to legacy data
        if (issue.metadata?.keywords && issue.metadata?.prompts) {
          return {
            keywords: issue.metadata.keywords || [],
            prompts: issue.metadata.prompts || [],
            semanticTerms: [],
            modifiers: [],
            entities: [],
            attributes: []
          };
        }
      }
    }

    return { keywords: [], prompts: [], semanticTerms: [], modifiers: [], entities: [], attributes: [] };
  };

  // Extract keywords - Fallback for backward compatibility
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
            .filter((keyword: string) => keyword && typeof keyword === 'string' && keyword.length > 1) // Reduced minimum length
            // REMOVED: .slice(0, 100) - No more artificial limits!
          
          console.log('✅ Found existing keywords:', existingKeywords.length, 'keywords (ALL TERMS)');
          return existingKeywords;
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
      // Remove duplicates and filter with less restrictive criteria
      const uniqueKeywords = [...new Set(allKeywords)]
        .filter(keyword => keyword && typeof keyword === 'string' && keyword.length > 1) // Reduced minimum length
        // REMOVED: .slice(0, 100) - No more artificial limits!
      
      console.log('✅ Found keywords from categories:', uniqueKeywords.length, 'keywords (ALL TERMS)');
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
  // Categorize terms by intent and tail type
  const categorizeTerms = (keywords: string[]) => {
    if (!keywords || keywords.length === 0) return { commercial: [], informational: [], shortTail: [], mediumTail: [], longTail: [] };
    
    const commercialKeywords = [
      'comprar', 'preço', 'custo', 'valor', 'orçamento', 'cotação', 'promoção', 'desconto', 'oferta',
      'melhor', 'top', 'ranking', 'review', 'análise', 'avaliação', 'buy', 'price', 'best', 'cheap'
    ];
    
    return keywords.reduce((acc, keyword) => {
      const isCommercial = commercialKeywords.some(ck => keyword.toLowerCase().includes(ck));
      const wordCount = keyword.split(' ').length;
      
      // Intent categorization
      if (isCommercial) {
        acc.commercial.push(keyword);
      } else {
        acc.informational.push(keyword);
      }
      
      // Tail categorization
      if (wordCount <= 2) {
        acc.shortTail.push(keyword);
      } else if (wordCount <= 4) {
        acc.mediumTail.push(keyword);
      } else {
        acc.longTail.push(keyword);
      }
      
      return acc;
    }, { 
      commercial: [] as string[], 
      informational: [] as string[], 
      shortTail: [] as string[], 
      mediumTail: [] as string[], 
      longTail: [] as string[] 
    });
  };

  const generateAIPrompts = () => {
    const { prompts } = extractSemanticData();
    if (prompts.length > 0) {
      return prompts;
    }

    // Fallback to legacy method
    const domain = url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
    const keywords = extractKeywords();
    
    const promptList = [];
    
    if (keywords.length > 0) {
      const topKeyword = keywords[0];
      
      promptList.push(`Onde encontrar ${topKeyword} profissional?`);
      promptList.push(`Como escolher ${topKeyword} de qualidade?`);
      promptList.push(`Melhor empresa de ${topKeyword}`);
      promptList.push(`${topKeyword}: melhor preço`);
      promptList.push(`Guia completo sobre ${topKeyword}`);
    }
    
    if (promptList.length === 0) {
      promptList.push(`O que é ${domain}?`);
      promptList.push(`Como usar ${domain}`);
      promptList.push(`${domain} é confiável?`);
    }

    return promptList.slice(0, 12);
  };

  const getTailTypeBadgeVariant = (tailType: 'short' | 'medium' | 'long') => {
    switch (tailType) {
      case 'short': return 'destructive';
      case 'medium': return 'secondary';
      case 'long': return 'default';
      default: return 'outline';
    }
  };

  const getIntentBadgeVariant = (intentType: 'commercial' | 'informational' | 'navigational') => {
    switch (intentType) {
      case 'commercial': return 'default';
      case 'informational': return 'secondary';
      case 'navigational': return 'outline';
      default: return 'outline';
    }
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

  const { keywords, prompts, semanticTerms, modifiers, entities, attributes } = extractSemanticData();
  const legacyKeywords = extractKeywords();
  const aiPrompts = generateAIPrompts();
  
  const finalKeywords = keywords.length > 0 ? keywords : legacyKeywords;
  const finalPrompts = prompts.length > 0 ? prompts : aiPrompts;
  const categorizedTerms = categorizeTerms(finalKeywords);

  // Filter keywords based on search term
  const filteredKeywords = useMemo(() => {
    if (!searchTerm) return finalKeywords;
    return finalKeywords.filter(keyword => 
      keyword.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [finalKeywords, searchTerm]);

  // Filter categorized terms based on search
  const filteredCategorizedTerms = useMemo(() => {
    if (!searchTerm) return categorizedTerms;
    return {
      commercial: categorizedTerms.commercial.filter(term => 
        term.toLowerCase().includes(searchTerm.toLowerCase())
      ),
      informational: categorizedTerms.informational.filter(term => 
        term.toLowerCase().includes(searchTerm.toLowerCase())
      ),
      shortTail: categorizedTerms.shortTail.filter(term => 
        term.toLowerCase().includes(searchTerm.toLowerCase())
      ),
      mediumTail: categorizedTerms.mediumTail.filter(term => 
        term.toLowerCase().includes(searchTerm.toLowerCase())
      ),
      longTail: categorizedTerms.longTail.filter(term => 
        term.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    };
  }, [categorizedTerms, searchTerm]);

  // Statistics
  const stats = {
    total: finalKeywords.length,
    unique: new Set(finalKeywords).size,
    commercial: categorizedTerms.commercial.length,
    informational: categorizedTerms.informational.length,
    shortTail: categorizedTerms.shortTail.length,
    mediumTail: categorizedTerms.mediumTail.length,
    longTail: categorizedTerms.longTail.length,
  };

  // Enhanced categorization for intelligent semantic terms
  const enhancedCategorization = {
    ...categorizedTerms,
    byType: {
      modifiers: semanticTerms.filter(t => t.type === 'commercial_modifier'),
      entities: semanticTerms.filter(t => t.type === 'main_entity'),
      attributes: semanticTerms.filter(t => t.type === 'attribute'),
      specifiers: semanticTerms.filter(t => t.type === 'specifier')
    },
    highQuality: semanticTerms.filter(t => t.relevanceScore >= 85),
    topTerms: semanticTerms
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 12)
  };

  const renderSemanticTerm = (term: any, index: number) => {
    const getScoreColor = (score: number) => {
      if (score >= 90) return 'text-green-600';
      if (score >= 80) return 'text-blue-600';
      if (score >= 70) return 'text-yellow-600';
      return 'text-gray-600';
    };

    const getTypeIcon = (type: string) => {
      switch (type) {
        case 'commercial_modifier': return '💰';
        case 'main_entity': return '🎯';
        case 'attribute': return '⚡';
        default: return '📌';
      }
    };

    return (
      <div key={index} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg hover:bg-secondary/30 transition-colors">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs">{getTypeIcon(term.type)}</span>
          <span className="font-medium">{term.term}</span>
          <div className="flex gap-1">
            <Badge variant={getTailTypeBadgeVariant(term.tailType)} className="text-xs px-1 py-0">
              {term.tailType}
            </Badge>
            <Badge variant={getIntentBadgeVariant(term.intentType)} className="text-xs px-1 py-0">
              {term.intentType}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger>
              <div className={`text-xs font-bold ${getScoreColor(term.relevanceScore)}`}>
                {term.relevanceScore}%
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                <p><strong>Score de Relevância:</strong> {term.relevanceScore}%</p>
                <p><strong>Fonte:</strong> {term.sourceContext?.htmlTag || 'desconhecida'}</p>
                <p><strong>Frequência:</strong> {term.sourceContext?.frequency || 1}x</p>
                <p><strong>Verbatim:</strong> {term.sourceContext?.isVerbatim ? 'Sim' : 'Não'}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Brain className="h-5 w-5 text-primary" />
            Análise Semântica Inteligente
            <Badge variant="outline" className="ml-auto">
              {stats.total} termos | {finalPrompts.length} prompts
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStats(!showStats)}
              className="ml-2"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </CardTitle>
          
          {/* Search and Statistics */}
          <div className="space-y-4">
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar termos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Badge variant="secondary">
                {searchTerm ? filteredKeywords.length : stats.total} termos
              </Badge>
            </div>

            {/* Statistics Panel */}
            {showStats && (
              <div className="p-4 bg-muted/20 rounded-lg space-y-2">
                <h4 className="font-medium text-sm">Estatísticas Detalhadas</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>Total: <strong>{stats.total}</strong></div>
                  <div>Únicos: <strong>{stats.unique}</strong></div>
                  <div>Comerciais: <strong>{stats.commercial}</strong></div>
                  <div>Informacionais: <strong>{stats.informational}</strong></div>
                  <div>Cauda Curta: <strong>{stats.shortTail}</strong></div>
                  <div>Cauda Média: <strong>{stats.mediumTail}</strong></div>
                  <div>Cauda Longa: <strong>{stats.longTail}</strong></div>
                  <div>Prompts: <strong>{finalPrompts.length}</strong></div>
                </div>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'overview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('overview')}
              className="flex items-center gap-2"
            >
              <Target className="h-4 w-4" />
              Visão Geral
            </Button>
            <Button
              variant={activeTab === 'commercial' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('commercial')}
              className="flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Comercial ({filteredCategorizedTerms.commercial.length})
            </Button>
            <Button
              variant={activeTab === 'informational' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('informational')}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Informacional ({filteredCategorizedTerms.informational.length})
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Semantic Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{filteredCategorizedTerms.shortTail.length}</div>
                  <div className="text-sm text-muted-foreground">Cauda Curta</div>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 mx-auto mt-1 opacity-50" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Termos de 1-2 palavras, alta competição</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="text-center p-4 bg-accent/5 rounded-lg">
                  <div className="text-2xl font-bold text-accent">{filteredCategorizedTerms.mediumTail.length}</div>
                  <div className="text-sm text-muted-foreground">Cauda Média</div>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 mx-auto mt-1 opacity-50" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Termos de 3-4 palavras, competição média</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="text-center p-4 bg-secondary/5 rounded-lg">
                  <div className="text-2xl font-bold text-secondary-foreground">{filteredCategorizedTerms.longTail.length}</div>
                  <div className="text-sm text-muted-foreground">Cauda Longa</div>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 mx-auto mt-1 opacity-50" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Termos de 5+ palavras, baixa competição, alta conversão</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Top Terms by Category */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Principais Termos por Categoria
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Commercial Terms */}
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <TrendingUp className="h-3 w-3" />
                      Intenção Comercial
                    </h4>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {filteredCategorizedTerms.commercial.slice(0, 12).map((term, index) => (
                        <Badge key={index} variant="default" className="text-xs">
                          {term}
                        </Badge>
                      ))}
                      {filteredCategorizedTerms.commercial.length > 12 && (
                        <Badge variant="outline" className="text-xs">
                          +{filteredCategorizedTerms.commercial.length - 12} mais
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Informational Terms */}
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <Search className="h-3 w-3" />
                      Intenção Informacional
                    </h4>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {filteredCategorizedTerms.informational.slice(0, 12).map((term, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {term}
                        </Badge>
                      ))}
                      {filteredCategorizedTerms.informational.length > 12 && (
                        <Badge variant="outline" className="text-xs">
                          +{filteredCategorizedTerms.informational.length - 12} mais
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Semantic Terms Section - Show if available */}
              {semanticTerms.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Análise Semântica Inteligente
                    <Badge variant="outline" className="text-xs ml-2">
                      {enhancedCategorization.highQuality.length} alta qualidade
                    </Badge>
                  </h3>
                  
                  <div className="grid gap-3">
                    {/* Top Quality Terms */}
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Target className="h-3 w-3" />
                        Termos de Alta Relevância (Score ≥ 80%)
                      </h4>
                      <div className="space-y-2">
                        {enhancedCategorization.topTerms.map((term, index) => 
                          renderSemanticTerm(term, index)
                        )}
                      </div>
                    </div>

                    {/* Semantic Categories Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">💰</div>
                        <div className="text-xs text-muted-foreground">Modificadores</div>
                        <div className="text-sm font-semibold">{enhancedCategorization.byType.modifiers.length}</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <div className="text-lg font-bold text-green-600">🎯</div>
                        <div className="text-xs text-muted-foreground">Entidades</div>
                        <div className="text-sm font-semibold">{enhancedCategorization.byType.entities.length}</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">⚡</div>
                        <div className="text-xs text-muted-foreground">Atributos</div>
                        <div className="text-sm font-semibold">{enhancedCategorization.byType.attributes.length}</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-950/20 rounded-lg">
                        <div className="text-lg font-bold text-gray-600">📌</div>
                        <div className="text-xs text-muted-foreground">Especificadores</div>
                        <div className="text-sm font-semibold">{enhancedCategorization.byType.specifiers.length}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Commercial Tab */}
          {activeTab === 'commercial' && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Termos Comerciais - Intenção de Compra
              </h3>
              <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                {filteredCategorizedTerms.commercial.length > 0 ? (
                  filteredCategorizedTerms.commercial.map((term, index) => (
                    <Badge key={index} variant="default">
                      {term}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {searchTerm ? 
                      `Nenhum termo comercial encontrado para "${searchTerm}".` :
                      'Nenhum termo comercial identificado. Considere incluir palavras como "comprar", "preço", "melhor" no seu conteúdo.'
                    }
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Informational Tab */}
          {activeTab === 'informational' && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Search className="h-4 w-4" />
                Termos Informacionais - Busca por Conhecimento
              </h3>
              <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                {filteredCategorizedTerms.informational.length > 0 ? (
                  filteredCategorizedTerms.informational.map((term, index) => (
                    <Badge key={index} variant="secondary">
                      {term}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {searchTerm ? 
                      `Nenhum termo informacional encontrado para "${searchTerm}".` :
                      'Nenhum termo informacional identificado.'
                    }
                  </p>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* AI Prompts Section */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Prompts Inteligentes Baseados em Intenção
            </h3>
            <div className="grid gap-2">
              {finalPrompts.length > 0 ? (
                finalPrompts.map((prompt, index) => {
                  const isCommercial = /comprar|preço|melhor|custo|valor|orçamento/.test(prompt.toLowerCase());
                  return (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm font-medium">{prompt}</span>
                        <Badge 
                          variant={isCommercial ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {isCommercial ? 'Comercial' : 'Informacional'}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(prompt, index)}
                        className="ml-2 h-6 w-6 p-0 shrink-0"
                      >
                        {copiedIndex === index ? (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground text-sm">
                  Nenhum prompt foi gerado. Execute uma auditoria para obter sugestões.
                </p>
              )}
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-accent/20 p-3 rounded-lg">
            <p className="font-medium mb-1">🧠 Sistema de Análise Semântica:</p>
            <ul className="space-y-1 ml-2">
              <li>• <strong>Modificadores Comerciais:</strong> Detecta intenções de compra (comprar, preço, melhor)</li>
              <li>• <strong>Entidades Principais:</strong> Identifica produtos/serviços do seu negócio</li>
              <li>• <strong>Classificação por Cauda:</strong> Organiza termos por competitividade e especificidade</li>
              <li>• <strong>Prompts Inteligentes:</strong> Gera perguntas que usuários fazem para IAs como ChatGPT</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default KeywordAnalysisCard;