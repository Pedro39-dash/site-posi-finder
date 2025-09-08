import { useState, useEffect } from "react";
import { ArrowUp, ArrowDown, Trophy, Target, RefreshCw, AlertTriangle, TrendingUp, TrendingDown, Users, Eye, BarChart3, Zap, ArrowUpCircle, HelpCircle, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CompetitorAnalysisService, CompetitiveAnalysisData, CompetitorKeyword, CompetitorDomain } from "@/services/competitorAnalysisService";
import { calculateCompetitiveMetrics, getKeywordCompetitiveDifficulty, getKeywordPotential, getCompetitorsAhead, getGapAnalysis, getCTRByPosition } from "@/utils/competitiveAnalysis";
import KeywordDetailModal from "./KeywordDetailModal";
import PositionTrendChart from "./PositionTrendChart";
import { useAnalysisCache } from "@/hooks/useAnalysisCache";

interface CompetitiveResultsDisplayProps {
  analysisId: string;
  onBackToForm: () => void;
}

const CompetitiveResultsDisplay = ({ analysisId, onBackToForm }: CompetitiveResultsDisplayProps) => {
  const { getCache, setCache } = useAnalysisCache();
  const [analysisData, setAnalysisData] = useState<CompetitiveAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKeyword, setSelectedKeyword] = useState<CompetitorKeyword | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [keywordFilter, setKeywordFilter] = useState<'all' | 'winning' | 'losing' | 'opportunities'>('all');
  const [reverifyingKeywords, setReverifyingKeywords] = useState<string[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);
  
  const itemsPerPage = 10;

  useEffect(() => {
    loadAnalysisData();
    
    let pollCount = 0;
    const maxPolls = 60; // Increased from 30 to 60 (2 minutes)
    let pollInterval: NodeJS.Timeout;
    
    const startPolling = () => {
      pollInterval = setInterval(async () => {
        pollCount++;
        
        // Progressive polling - start fast, then slow down
        const currentInterval = pollCount < 10 ? 1000 : pollCount < 20 ? 2000 : 3000;
        
        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          setError('Análise demorou mais que o esperado. Tente novamente.');
          return;
        }
        
        // Only poll if we haven't loaded recently (prevent excessive calls)
        const now = Date.now();
        if (now - lastLoadTime > 1500) { // At least 1.5s between loads
          if (analysisData?.analysis.status === 'analyzing' || 
              analysisData?.analysis.status === 'pending') {
            await loadAnalysisData();
          } else if (analysisData?.analysis.status === 'completed' || 
                     analysisData?.analysis.status === 'failed') {
            clearInterval(pollInterval);
          }
        }
        
        // Clear interval and adjust timing
        if (pollInterval) {
          clearInterval(pollInterval);
          setTimeout(startPolling, currentInterval);
        }
      }, 1000);
    };

    startPolling();
    return () => clearInterval(pollInterval);
  }, [analysisId, analysisData?.analysis.status, lastLoadTime]);

  const loadAnalysisData = async () => {
    const startTime = Date.now();
    
    // Try cache first
    const cacheKey = `analysis_${analysisId}`;
    const cachedData = getCache<CompetitiveAnalysisData>(cacheKey);
    
    if (cachedData && cachedData.analysis.status === 'completed') {
      console.log('📋 Using cached analysis data');
      setAnalysisData(cachedData);
      setError(null);
      setLoading(false);
      setLastLoadTime(Date.now());
      return;
    }
    
    try {
      const result = await CompetitorAnalysisService.getAnalysisData(analysisId);
      if (result.success && result.data) {
        setAnalysisData(result.data);
        setError(null);
        setRetryCount(0); // Reset retry count on success
        
        // Cache completed analysis for 30 minutes
        if (result.data.analysis.status === 'completed') {
          setCache(cacheKey, result.data, 30 * 60 * 1000); // 30 minutes
        }
      } else {
        setError(result.error || 'Failed to load analysis data');
      }
    } catch (err) {
      setError('Unexpected error loading analysis');
      console.error('Error loading analysis:', err);
    } finally {
      setLoading(false);
      setLastLoadTime(Date.now());
    }
  };

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    setLoading(true);
    setError(null);
    await loadAnalysisData();
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto" />
          <h2 className="text-2xl font-bold">
            {analysisData?.analysis.status === 'analyzing' ? 'Análise em Progresso...' : 'Carregando Análise...'}
          </h2>
          <p className="text-muted-foreground">
            {analysisData?.analysis.status === 'analyzing' 
              ? 'Coletando dados do Google e analisando concorrentes...' 
              : 'Aguarde enquanto coletamos os dados'
            }
          </p>
          {analysisData?.analysis.metadata?.processed_keywords && (
            <div className="space-y-2">
              <Progress 
                value={(analysisData.analysis.metadata.processed_keywords / analysisData.analysis.metadata.total_keywords) * 100} 
                className="w-full max-w-md mx-auto"
              />
              <p className="text-sm text-muted-foreground">
                {analysisData.analysis.metadata.processed_keywords} de {analysisData.analysis.metadata.total_keywords} palavras-chave analisadas
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error || !analysisData) {
    return (
      <div className="space-y-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="space-y-2">
            <p>{error || 'Não foi possível carregar os dados da análise'}</p>
            {retryCount < 3 && (
              <p className="text-sm">Tentativa {retryCount + 1} de 3</p>
            )}
          </AlertDescription>
        </Alert>
        <div className="flex gap-2 justify-center">
          {retryCount < 3 && (
            <Button onClick={handleRetry} variant="outline" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Tentar Novamente
            </Button>
          )}
          <Button onClick={onBackToForm} variant="outline">
            Voltar ao Formulário
          </Button>
        </div>
      </div>
    );
  }

  const { analysis, competitors, keywords, opportunities } = analysisData;

  // Calculate enhanced competitive metrics
  const competitiveMetrics = calculateCompetitiveMetrics(keywords, competitors);

  // Show loading state if analysis is still running
  if (analysis.status === 'analyzing' || analysis.status === 'pending') {
    const metadata = analysis.metadata || {};
    const totalKeywords = metadata.total_keywords || 0;
    const processedKeywords = metadata.processed_keywords || 0;
    const progressPercentage = totalKeywords > 0 ? Math.round((processedKeywords / totalKeywords) * 100) : 30;
    
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto" />
          <h2 className="text-2xl font-bold">Análise em Progresso</h2>
          <p className="text-muted-foreground">
            Analisando <span className="font-semibold text-primary">{analysis.target_domain}</span>
          </p>
          <div className="max-w-md mx-auto space-y-3">
            <Progress value={progressPercentage} className="w-full" />
            <p className="text-sm text-muted-foreground">
              {processedKeywords}/{totalKeywords} palavras-chave processadas
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if analysis failed
  if (analysis.status === 'failed') {
    return (
      <div className="space-y-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            A análise falhou: {analysis.metadata?.error || 'Erro desconhecido'}
          </AlertDescription>
        </Alert>
        <Button onClick={onBackToForm} variant="outline">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  // Calculate key metrics
  const topCompetitor = competitors[0];
  const referenceCompetitors = competitors.filter(c => !c.detected_automatically);
  
  // Use the new reference competitor wins from metrics
  const keywordWins = competitiveMetrics.referenceCompetitorWins;
  
  const competitorWins = keywords.filter(k => 
    k.competitor_positions.some(cp => 
      !k.target_domain_position || (k.target_domain_position && cp.position < k.target_domain_position)
    )
  ).length;

  // Calculate quick opportunities based on high potential keywords
  const quickOpportunities = keywords.filter(k => {
    const potential = getKeywordPotential(k);
    return potential.improvementPotential === 'high' && k.target_domain_position && k.target_domain_position > 10;
  }).length;
  
  // Calculate traffic potential for quick opportunities only
  const quickOpportunityTraffic = keywords.filter(k => {
    const potential = getKeywordPotential(k);
    return potential.improvementPotential === 'high' && k.target_domain_position && k.target_domain_position > 10;
  }).reduce((acc, k) => {
    const myPosition = k.target_domain_position;
    const bestCompetitorPos = Math.min(...k.competitor_positions.map(cp => cp.position));
    if (myPosition && bestCompetitorPos < myPosition) {
      const volume = k.search_volume || 100;
      const currentCTR = getCTRByPosition(myPosition);
      const potentialCTR = getCTRByPosition(bestCompetitorPos);
      return acc + ((potentialCTR - currentCTR) * volume / 100);
    }
    return acc;
  }, 0);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getDomainName = (url: string) => {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  };

  const getPositionBadgeVariant = (position: number | null) => {
    if (!position) return "outline";
    if (position <= 3) return "default";
    if (position <= 10) return "secondary";
    return "outline";
  };

  const getDifficultyVariant = (level: string) => {
    switch (level) {
      case 'low': return 'default';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
      case 'very-high': return 'destructive';
      default: return 'outline';
    }
  };

  const getPotentialVariant = (level: string) => {
    switch (level) {
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const handleViewDetails = (keyword: CompetitorKeyword) => {
    setSelectedKeyword(keyword);
    setIsDetailModalOpen(true);
  };

  const handleReverifyKeyword = async (keyword: CompetitorKeyword) => {
    if (!analysisData) return;
    
    setReverifyingKeywords(prev => [...prev, keyword.keyword]);
    
    try {
      const result = await CompetitorAnalysisService.reverifyKeyword(
        analysisId,
        keyword.keyword,
        analysisData.analysis.target_domain
      );
      
      if (result.success) {
        // Reload analysis data to get updated position
        await loadAnalysisData();
        
        // Show toast notification with result
        const message = result.newPosition 
          ? `Posição atualizada: ${result.newPosition}ª para "${keyword.keyword}"`
          : `"${keyword.keyword}" não encontrado nos primeiros 50 resultados`;
        
        // You can add toast notification here if you have a toast system
        console.log(`✅ Re-verification completed: ${message}`);
      } else {
        console.error('❌ Re-verification failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Error during re-verification:', error);
    } finally {
      setReverifyingKeywords(prev => prev.filter(k => k !== keyword.keyword));
    }
  };

  const getFilteredKeywords = () => {
    switch (keywordFilter) {
      case 'winning':
        return keywords.filter(k => {
          if (!k.target_domain_position) return false;
          
          // If we have reference competitors, compare only against them
          if (referenceCompetitors.length > 0) {
            const referenceCompetitorDomains = new Set(referenceCompetitors.map(c => c.domain));
            const referencePositions = k.competitor_positions.filter(cp => 
              referenceCompetitorDomains.has(cp.domain)
            );
            return referencePositions.length > 0 && 
                   referencePositions.every(cp => cp.position > k.target_domain_position!);
          }
          
          // Fallback to all competitors if no reference competitors
          return k.competitor_positions.every(cp => cp.position > k.target_domain_position!);
        });
      case 'losing':
        return keywords.filter(k => 
          k.competitor_positions.some(cp => 
            !k.target_domain_position || (k.target_domain_position && cp.position < k.target_domain_position)
          )
        );
      case 'opportunities':
        return keywords.filter(k => {
          const potential = getKeywordPotential(k);
          return potential.improvementPotential === 'high';
        });
      default:
        return keywords;
    }
  };

  const getPaginatedKeywords = () => {
    const filteredKeywords = getFilteredKeywords();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredKeywords.slice(startIndex, endIndex);
  };

  return (
    <div className="space-y-8">
      {/* Executive Summary */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Análise Competitiva - {analysis.target_domain}</CardTitle>
          </div>
          <CardDescription className="text-base">
            {(() => {
              const gapAnalysis = getGapAnalysis(competitiveMetrics.averagePositionGap, keywords.length);
              return (
          <div className="space-y-2">
            <p className="text-lg font-medium">
              Situação no Mercado: <span className={`${gapAnalysis.color}`}>{gapAnalysis.description}</span>
            </p>
                  <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                    {gapAnalysis.recommendation}
                  </p>
                </div>
              );
            })()}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Simplified Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(() => {
          const gapAnalysis = getGapAnalysis(competitiveMetrics.averagePositionGap, keywords.length);
          return (
            <Card className={`${gapAnalysis.borderColor} ${gapAnalysis.bgColor}`}>
              <CardContent className="p-6">
                <div className="text-center space-y-3">
                  <BarChart3 className={`h-12 w-12 mx-auto ${gapAnalysis.color}`} />
                  <div>
                    <p className={`text-3xl font-bold ${gapAnalysis.color}`}>
                      {competitiveMetrics.averagePositionGap > 0 ? '+' : ''}{competitiveMetrics.averagePositionGap}
                    </p>
                    <div className="flex items-center gap-1 justify-center">
                      <p className="text-sm font-medium text-muted-foreground">Distância da Concorrência</p>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Quantas posições, em média, você está atrás dos seus principais concorrentes nas palavras-chave analisadas</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {gapAnalysis.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <Trophy className="h-12 w-12 mx-auto text-primary" />
              <div>
                <p className="text-3xl font-bold text-primary">
                  {keywordWins}
                </p>
                <div className="flex items-center gap-1 justify-center">
                  <p className="text-sm font-medium text-muted-foreground">Você está melhor em {keywordWins} palavras</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Palavras-chave onde você está melhor posicionado que todos os {referenceCompetitors.length > 0 ? 'concorrentes de referência especificados' : 'concorrentes encontrados na análise'}
                          {referenceCompetitors.length > 0 && (
                            <span className="block mt-1 text-xs text-muted-foreground">
                              Comparando apenas com: {referenceCompetitors.map(c => c.domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]).join(', ')}
                            </span>
                          )}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {((keywordWins / keywords.length) * 100).toFixed(1)}% do total analisado
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-secondary/20 bg-secondary/5">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <TrendingUp className="h-12 w-12 mx-auto text-secondary-foreground" />
              <div>
                <p className="text-3xl font-bold text-secondary-foreground">
                  0
                </p>
                <div className="flex items-center gap-1 justify-center">
                  <p className="text-sm font-medium text-muted-foreground">Posições Ganhas (30 dias)</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Tracking histórico será implementado em breve. Este valor mostrará quantas posições você ganhou nos últimos 30 dias</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Funcionalidade em desenvolvimento
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Position Trend Chart */}
      <PositionTrendChart targetDomain={analysis.target_domain} />

      {/* Keywords Analysis with Filters and Pagination */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Análise Detalhada por Palavra-chave</CardTitle>
              <CardDescription>
                {(() => {
                  const filteredKeywords = getFilteredKeywords();
                  return `${filteredKeywords.length} palavra${filteredKeywords.length !== 1 ? 's' : ''}-chave encontrada${filteredKeywords.length !== 1 ? 's' : ''}`;
                })()}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Filter className="h-3 w-3" />
                Filtrar
              </Badge>
              <select 
                value={keywordFilter} 
                onChange={(e) => {
                  setKeywordFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="text-sm border border-input bg-background px-3 py-2 rounded-md focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="all">Todas ({keywords.length})</option>
                <option value="winning">Vencendo ({keywordWins})</option>
                <option value="losing">Perdendo ({competitorWins})</option>
                <option value="opportunities">Melhorias Rápidas ({quickOpportunities})</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">Palavra-chave</TableHead>
                  <TableHead className="text-center w-20">Posição</TableHead>
                  <TableHead className="text-center w-32">1º Lugar</TableHead>
                  <TableHead className="text-center w-28">Dificuldade</TableHead>
                  <TableHead className="text-center w-28">Potencial</TableHead>
                  <TableHead className="text-center w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getPaginatedKeywords().map((keyword) => {
                  const competitorsAhead = getCompetitorsAhead(keyword);
                  const difficulty = getKeywordCompetitiveDifficulty(keyword);
                  const potential = getKeywordPotential(keyword);
                  const myPosition = keyword.target_domain_position;
                  const isWinning = competitorsAhead.length === 0 && myPosition;
                  
                  return (
                    <TableRow key={keyword.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <p className="font-medium">{keyword.keyword}</p>
                          {keyword.search_volume && (
                            <Badge variant="outline" className="text-xs">
                              {formatNumber(keyword.search_volume)}/mês
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-center font-medium">
                                {myPosition ? myPosition : '-'}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                              {myPosition ? (
                                <p>Você está na posição {myPosition} para "{keyword.keyword}"</p>
                              ) : (
                                <div className="space-y-2">
                                  <p className="font-medium">Não rankeando no top 100</p>
                                  <p className="text-sm">
                                    "{keyword.keyword}" representa uma oportunidade de crescimento com {keyword.search_volume ? `${keyword.search_volume.toLocaleString()} buscas mensais` : 'potencial de tráfego inexplorado'}.
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    💡 Seus concorrentes já estão rankeando - analise suas estratégias!
                                  </p>
                                </div>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                        <TableCell className="text-center">
                          <div className="text-center">
                            {(() => {
                              const firstPlace = competitorsAhead.find(comp => comp.position === 1);
                              if (firstPlace) {
                                return <span className="font-medium">{firstPlace.domain}</span>;
                              } else if (myPosition === 1) {
                                return <span className="text-muted-foreground">Você está em 1º</span>;
                              } else {
                                return <span className="text-muted-foreground">-</span>;
                              }
                            })()}
                          </div>
                         </TableCell>
                       <TableCell className="text-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge 
                                variant={getDifficultyVariant(difficulty.level)}
                                className="text-xs cursor-help"
                              >
                                {difficulty.level === 'low' ? 'Fácil' : 
                                 difficulty.level === 'medium' ? 'Médio' : 
                                 difficulty.level === 'high' ? 'Difícil' : 'Muito Difícil'}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{difficulty.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                       </TableCell>
                       <TableCell className="text-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge 
                                  variant={getPotentialVariant(potential.improvementPotential)}
                                  className="text-xs cursor-help"
                                >
                                  {potential.improvementPotential === 'high' ? 'Alto' :
                                   potential.improvementPotential === 'medium' ? 'Médio' : 'Baixo'}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{potential.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                       <TableCell className="text-center">
                        <div className="flex gap-1 justify-center">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleViewDetails(keyword)}
                            className="text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Detalhes
                          </Button>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleReverifyKeyword(keyword)}
                                  className="text-xs"
                                  disabled={reverifyingKeywords.includes(keyword.keyword)}
                                >
                                  {reverifyingKeywords.includes(keyword.keyword) ? (
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-3 w-3" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Re-verificar posição atual desta palavra-chave</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            {/* Pagination Controls */}
            {(() => {
              const filteredKeywords = getFilteredKeywords();
              const totalPages = Math.ceil(filteredKeywords.length / itemsPerPage);
              
              if (totalPages <= 1) return null;
              
              return (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages} ({filteredKeywords.length} resultados)
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = i + Math.max(1, currentPage - 2);
                        if (pageNum > totalPages) return null;
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        </CardContent>
      </Card>


      {/* Keyword Detail Modal */}
      <KeywordDetailModal
        keyword={selectedKeyword}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        targetDomain={analysis.target_domain}
      />
    </div>
  );
};

export default CompetitiveResultsDisplay;