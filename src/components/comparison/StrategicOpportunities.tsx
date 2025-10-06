import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Search, Loader2, Gauge, FileText, ImageIcon, Award, HardDrive } from 'lucide-react';
import { CompetitorKeyword } from '@/services/competitorAnalysisService';
import { DeepAnalysisService, DeepAnalysisData } from '@/services/deepAnalysisService';
import DeepInsightsModal from './DeepInsightsModal';
import { toast } from 'sonner';
import { useKeywordFilter } from '@/contexts/KeywordFilterContext';

interface StrategicOpportunitiesProps {
  keywords: CompetitorKeyword[];
  targetDomain: string;
  analysisId?: string;
}

const StrategicOpportunities: React.FC<StrategicOpportunitiesProps> = ({ 
  keywords, 
  targetDomain,
  analysisId
}) => {
  const { deepAnalysisData, setDeepAnalysisData } = useKeywordFilter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  // useRef para proteger dados durante re-renders
  const deepAnalysisDataRef = useRef<DeepAnalysisData | null>(null);
  
  // Sincronizar ref com o context
  useEffect(() => {
    if (deepAnalysisData) {
      deepAnalysisDataRef.current = deepAnalysisData;
    }
  }, [deepAnalysisData]);

  // Gerar cards baseados em dados reais da análise profunda
  const getOpportunitiesFromData = () => {
    // Usar ref como fallback se o context estiver null durante re-render
    const data = deepAnalysisData || deepAnalysisDataRef.current;
    if (!data) {
      return [];
    }

    const { target, competitorAverages } = data;
    
    const formatBytes = (bytes: number) => {
      const mb = bytes / 1024 / 1024;
      return mb.toFixed(1) + ' MB';
    };

    return [
      // 1. Performance vs Concorrentes
      {
        id: 'performance',
        title: 'Performance vs Concorrentes',
        icon: Gauge,
        priority: target.performanceScore < competitorAverages.performanceScore ? 'high' : 'low',
        data: {
          score: target.performanceScore,
          competitorScore: Math.round(competitorAverages.performanceScore),
          gap: Math.round(competitorAverages.performanceScore - target.performanceScore),
          lcp: { value: target.coreWebVitals.lcp.value.toFixed(1), status: target.coreWebVitals.lcp.status },
          fid: { value: target.coreWebVitals.fid.value.toFixed(0), status: target.coreWebVitals.fid.status },
          cls: { value: target.coreWebVitals.cls.value.toFixed(2), status: target.coreWebVitals.cls.status }
        }
      },
      // 2. SEO Score vs Concorrentes
      {
        id: 'seo-score',
        title: 'SEO Score vs Concorrentes',
        icon: TrendingUp,
        priority: target.seoScore < competitorAverages.seoScore ? 'high' : 'low',
        data: {
          score: target.seoScore,
          competitorScore: Math.round(competitorAverages.seoScore),
          gap: Math.round(competitorAverages.seoScore - target.seoScore),
          hasSchema: target.onPage.hasSchema,
          hasOpenGraph: target.onPage.hasOpenGraph,
          isMobile: target.onPage.isMobileFriendly
        }
      },
      // 3. Conteúdo da Página
      {
        id: 'content',
        title: 'Conteúdo da Página',
        icon: FileText,
        priority: target.onPage.wordCount < competitorAverages.wordCount ? 'medium' : 'low',
        data: {
          wordCount: target.onPage.wordCount,
          competitorWordCount: Math.round(competitorAverages.wordCount),
          gap: Math.round(competitorAverages.wordCount - target.onPage.wordCount),
          h1: target.onPage.h1Count,
          h2: target.onPage.h2Count,
          h3: target.onPage.h3Count,
          titleLength: target.onPage.titleLength,
          metaLength: target.onPage.metaLength
        }
      },
      // 4. Imagens & Links
      {
        id: 'images-links',
        title: 'Imagens & Links',
        icon: ImageIcon,
        priority: target.onPage.imagesWithoutAlt > 0 ? 'medium' : 'low',
        data: {
          totalImages: target.onPage.totalImages,
          imagesWithoutAlt: target.onPage.imagesWithoutAlt,
          internalLinks: target.onPage.internalLinks,
          externalLinks: target.onPage.externalLinks
        }
      },
      // 5. Autoridade de Domínio
      {
        id: 'domain-authority',
        title: 'Autoridade de Domínio (DA)',
        icon: Award,
        priority: target.estimatedDA < competitorAverages.estimatedDA ? 'high' : 'low',
        data: {
          da: target.estimatedDA,
          competitorDA: Math.round(competitorAverages.estimatedDA),
          gap: Math.round(competitorAverages.estimatedDA - target.estimatedDA)
        }
      },
      // 6. Tamanho da Página
      {
        id: 'page-size',
        title: 'Tamanho da Página',
        icon: HardDrive,
        priority: target.pageSize > competitorAverages.pageSize ? 'medium' : 'low',
        data: {
          size: formatBytes(target.pageSize),
          competitorSize: formatBytes(competitorAverages.pageSize),
          gap: formatBytes(target.pageSize - competitorAverages.pageSize),
          isLarger: target.pageSize > competitorAverages.pageSize
        }
      }
    ];
  };

  const opportunities = getOpportunitiesFromData();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20';
      case 'medium': return 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20';
      case 'low': return 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20';
      default: return 'border-border bg-card';
    }
  };

  // Handler para análise profunda
  const handleDeepAnalysis = async () => {
    if (!analysisId) {
      toast.error('ID de análise não encontrado. Tente recarregar a página.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    
    toast.loading('🔍 Iniciando análise profunda... (~40 segundos)', {
      id: 'deep-analysis',
    });
    
    try {
      // Get top 3 competitors by average position
      const topCompetitors = keywords
        .filter(k => k.competitor_positions && k.competitor_positions.length > 0)
        .flatMap(k => k.competitor_positions || [])
        .reduce((acc, comp) => {
          const existing = acc.find(c => c.domain === comp.domain);
          if (existing) {
            existing.totalPosition += comp.position || 100;
            existing.count++;
          } else {
            acc.push({
              domain: comp.domain,
              totalPosition: comp.position || 100,
              count: 1
            });
          }
          return acc;
        }, [] as Array<{ domain: string; totalPosition: number; count: number }>)
        .map(c => ({ ...c, avgPosition: c.totalPosition / c.count }))
        .sort((a, b) => a.avgPosition - b.avgPosition)
        .slice(0, 3)
        .map(c => c.domain);

      const result = await DeepAnalysisService.startDeepAnalysis(
        analysisId,
        targetDomain,
        topCompetitors
      );

      if (result.success && result.data) {
        setDeepAnalysisData(result.data);
        setShowModal(true);
        
        toast.success('✅ Análise profunda concluída!', {
          id: 'deep-analysis',
          duration: 3000,
        });

        // Fechar modal automaticamente e destacar cards atualizados
        setTimeout(() => {
          setShowModal(false);
          toast.success('✅ Confira os insights nos cards abaixo!', { duration: 5000 });
        }, 1000);
      } else {
        setAnalysisError(result.error || 'Erro desconhecido');
        toast.error(result.error || 'Erro ao realizar análise profunda', {
          id: 'deep-analysis',
        });
      }
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Erro inesperado');
      toast.error('Erro ao executar análise profunda. Verifique os logs para mais detalhes.', {
        id: 'deep-analysis',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Oportunidades Estratégicas</h3>
          {deepAnalysisData && (
            <p className="text-xs text-primary font-medium mt-1">
              ✅ Insights detalhados disponíveis nos cards abaixo
            </p>
          )}
          {analysisError && (
            <p className="text-xs text-destructive font-medium mt-1">
              ❌ {analysisError}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 items-end">
          {!analysisId && (
            <p className="text-xs text-muted-foreground">
              ⚠️ ID de análise não disponível
            </p>
          )}
          {analysisId && (
            <Button 
              variant={deepAnalysisData ? "outline" : "default"}
              size="sm"
              onClick={handleDeepAnalysis}
              disabled={isAnalyzing}
              className="gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analisando... (~40s)
                </>
              ) : deepAnalysisData ? (
                <>
                  <TrendingUp className="h-4 w-4" />
                  Atualizar Análise
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Análise Profunda de SEO
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      
      {opportunities.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <Search className="h-12 w-12 text-muted-foreground" />
            <div>
              <h4 className="font-medium text-foreground mb-1">Análise Profunda Necessária</h4>
              <p className="text-sm text-muted-foreground">
                Clique no botão "Análise Profunda de SEO" acima para ver insights detalhados
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2" key={deepAnalysisData ? 'with-insights' : 'without-insights'}>
          {opportunities.map((opportunity) => {
            const Icon = opportunity.icon;
            
            return (
              <Card 
                key={opportunity.id} 
                className={`transition-all hover:shadow-md ${getPriorityColor(opportunity.priority)} ring-2 ring-primary/20 animate-in fade-in duration-500`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${
                        opportunity.priority === 'high' ? 'bg-red-500' : 
                        opportunity.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                      } flex items-center justify-center text-white`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-foreground">{opportunity.title}</h4>
                      </div>
                    </div>
                    <Badge 
                      variant={opportunity.priority === 'high' ? 'destructive' : 
                              opportunity.priority === 'medium' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {opportunity.priority === 'high' ? 'Alta' : 
                       opportunity.priority === 'medium' ? 'Média' : 'Baixa'}
                    </Badge>
                  </div>

                  {/* Performance Card */}
                  {opportunity.id === 'performance' && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Seu Score:</span>
                        <span className="text-sm font-bold">{opportunity.data.score}/100</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Concorrentes:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{opportunity.data.competitorScore}/100</span>
                          {typeof opportunity.data.gap === 'number' && opportunity.data.gap !== 0 && (
                            <Badge variant={opportunity.data.gap > 0 ? "destructive" : "default"} className="text-xs">
                              {opportunity.data.gap > 0 ? `+${opportunity.data.gap}` : opportunity.data.gap}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="pt-2 border-t space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground">Core Web Vitals:</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="font-medium">{opportunity.data.lcp.value}s</div>
                            <div className="text-muted-foreground">LCP {opportunity.data.lcp.status === 'good' ? '✅' : opportunity.data.lcp.status === 'needs-improvement' ? '⚠️' : '❌'}</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium">{opportunity.data.fid.value}ms</div>
                            <div className="text-muted-foreground">FID {opportunity.data.fid.status === 'good' ? '✅' : opportunity.data.fid.status === 'needs-improvement' ? '⚠️' : '❌'}</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium">{opportunity.data.cls.value}</div>
                            <div className="text-muted-foreground">CLS {opportunity.data.cls.status === 'good' ? '✅' : opportunity.data.cls.status === 'needs-improvement' ? '⚠️' : '❌'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SEO Score Card */}
                  {opportunity.id === 'seo-score' && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Seu Score:</span>
                        <span className="text-sm font-bold">{opportunity.data.score}/100</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Concorrentes:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{opportunity.data.competitorScore}/100</span>
                          {typeof opportunity.data.gap === 'number' && opportunity.data.gap !== 0 && (
                            <Badge variant={opportunity.data.gap > 0 ? "destructive" : "default"} className="text-xs">
                              {opportunity.data.gap > 0 ? `+${opportunity.data.gap}` : opportunity.data.gap}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="pt-2 border-t space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground">Técnico:</p>
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant={opportunity.data.hasSchema ? "default" : "secondary"} className="text-xs">
                            {opportunity.data.hasSchema ? '✅' : '❌'} Schema.org
                          </Badge>
                          <Badge variant={opportunity.data.hasOpenGraph ? "default" : "secondary"} className="text-xs">
                            {opportunity.data.hasOpenGraph ? '✅' : '❌'} Open Graph
                          </Badge>
                          <Badge variant={opportunity.data.isMobile ? "default" : "secondary"} className="text-xs">
                            {opportunity.data.isMobile ? '✅' : '❌'} Mobile
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Content Card */}
                  {opportunity.id === 'content' && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Palavras:</span>
                        <span className="text-sm font-bold">{opportunity.data.wordCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Concorrentes:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{opportunity.data.competitorWordCount}</span>
                          {typeof opportunity.data.gap === 'number' && opportunity.data.gap !== 0 && (
                            <Badge variant={opportunity.data.gap > 0 ? "destructive" : "default"} className="text-xs">
                              {opportunity.data.gap > 0 ? `+${opportunity.data.gap}` : opportunity.data.gap}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="pt-2 border-t space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground">Estrutura:</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">H1:</span>
                            <span className="font-medium">{opportunity.data.h1} {opportunity.data.h1 === 1 ? '✅' : '⚠️'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">H2:</span>
                            <span className="font-medium">{opportunity.data.h2}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Título:</span>
                            <span className="font-medium">{opportunity.data.titleLength} chars {opportunity.data.titleLength <= 60 ? '✅' : '⚠️'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Meta:</span>
                            <span className="font-medium">{opportunity.data.metaLength} chars {opportunity.data.metaLength <= 160 ? '✅' : '⚠️'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Images & Links Card */}
                  {opportunity.id === 'images-links' && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Total de Imagens:</span>
                        <span className="text-sm font-bold">{opportunity.data.totalImages}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Sem ALT:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{opportunity.data.imagesWithoutAlt}</span>
                          <Badge variant={opportunity.data.imagesWithoutAlt > 0 ? "destructive" : "default"} className="text-xs">
                            {opportunity.data.imagesWithoutAlt > 0 ? '⚠️' : '✅'}
                          </Badge>
                        </div>
                      </div>
                      <div className="pt-2 border-t space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground">Links:</p>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Internos:</span>
                          <span className="font-medium">{opportunity.data.internalLinks}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Externos:</span>
                          <span className="font-medium">{opportunity.data.externalLinks}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Domain Authority Card */}
                  {opportunity.id === 'domain-authority' && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Seu DA:</span>
                        <span className="text-sm font-bold">{opportunity.data.da}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Concorrentes:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{opportunity.data.competitorDA}</span>
                          {typeof opportunity.data.gap === 'number' && opportunity.data.gap !== 0 && (
                            <Badge variant={opportunity.data.gap > 0 ? "destructive" : "default"} className="text-xs">
                              {opportunity.data.gap > 0 ? `+${opportunity.data.gap}` : opportunity.data.gap}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          {typeof opportunity.data.gap === 'number' && opportunity.data.gap > 0
                            ? 'Melhore performance, SEO e conteúdo para aumentar autoridade' 
                            : 'Sua autoridade está competitiva!'
                          }
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Page Size Card */}
                  {opportunity.id === 'page-size' && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Seu Tamanho:</span>
                        <span className="text-sm font-bold">{opportunity.data.size}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Concorrentes:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{opportunity.data.competitorSize}</span>
                          {opportunity.data.isLarger && (
                            <Badge variant="destructive" className="text-xs">
                              +{opportunity.data.gap}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          {opportunity.data.isLarger 
                            ? 'Comprima imagens e minifique CSS/JS' 
                            : 'Tamanho otimizado!'
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {deepAnalysisData && (
        <DeepInsightsModal
          open={showModal}
          onOpenChange={setShowModal}
          data={deepAnalysisData}
        />
      )}
    </div>
  );
};

export default StrategicOpportunities;
