import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Target, Zap, Trophy, ArrowRight, Search, Loader2 } from 'lucide-react';
import { CompetitorKeyword } from '@/services/competitorAnalysisService';
import { DeepAnalysisService, DeepAnalysisData } from '@/services/deepAnalysisService';
import DeepInsightsModal from './DeepInsightsModal';
import { toast } from 'sonner';

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [deepAnalysisData, setDeepAnalysisData] = useState<DeepAnalysisData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  console.log('🎯 StrategicOpportunities mounted:', {
    hasAnalysisId: !!analysisId,
    analysisId,
    hasDeepData: !!deepAnalysisData,
    isAnalyzing
  });
  // Calculate real opportunities based on competitor analysis
  const contentGaps = keywords.filter(k => !k.target_domain_position && k.competitor_positions?.some(p => p.position <= 10));
  const quickWins = keywords.filter(k => k.target_domain_position && k.target_domain_position >= 11 && k.target_domain_position <= 20);
  const competitorAnalysis = keywords.filter(k => k.competitor_positions?.length > 0);
  const topCompetitorDomains = [...new Set(keywords.flatMap(k => 
    k.competitor_positions?.filter(p => p.position <= 3).map(p => p.domain) || []
  ))].slice(0, 3);

  const opportunities = [
    {
      id: 'content-gaps',
      title: 'Gaps de Conteúdo',
      description: contentGaps.length > 0 
        ? `${contentGaps.length} keywords onde concorrentes rankeiam top 10 mas você não aparece`
        : 'Nenhum gap identificado - boa cobertura de conteúdo',
      count: contentGaps.length,
      priority: contentGaps.length > 0 ? 'high' : 'low',
      color: contentGaps.length > 0 ? 'bg-red-500' : 'bg-gray-500',
      icon: Target,
      action: contentGaps.length > 0 ? 'Criar Conteúdo' : 'Monitorar'
    },
    {
      id: 'quick-wins',
      title: 'Vitórias Rápidas',
      description: quickWins.length > 0 
        ? `${quickWins.length} keywords na página 2 - potencial para primeira página`
        : 'Foque em melhorar palavras-chave existentes',
      count: quickWins.length,
      priority: quickWins.length > 0 ? 'high' : 'medium',
      color: quickWins.length > 0 ? 'bg-green-500' : 'bg-blue-500',
      icon: Zap,
      action: quickWins.length > 0 ? 'Otimizar Agora' : 'Analisar Posições'
    },
    {
      id: 'competitor-leaders',
      title: 'Líderes do Mercado',
      description: topCompetitorDomains.length > 0 
        ? `Analise estratégias de: ${topCompetitorDomains.slice(0, 2).map(d => d?.replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0]).join(', ')}`
        : 'Identifique líderes do seu nicho',
      count: topCompetitorDomains.length,
      priority: 'medium',
      color: 'bg-purple-500',
      icon: Trophy,
      action: 'Analisar Estratégias'
    },
    {
      id: 'seo-optimization',
      title: 'Otimização SEO',
      description: keywords.length > 0 
        ? `Melhore títulos, meta descriptions e estrutura de ${Math.ceil(keywords.length / 2)} páginas`
        : 'Configure análise de palavras-chave',
      count: Math.ceil(keywords.length / 2),
      priority: 'low',
      color: 'bg-orange-500',
      icon: TrendingUp,
      action: 'Otimizar SEO'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20';
      case 'medium': return 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20';
      case 'low': return 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20';
      default: return 'border-border bg-card';
    }
  };

  // Extrair insights relevantes por tipo de oportunidade
  const getDeepInsights = (opportunityId: string) => {
    console.log('🔍 getDeepInsights called:', { 
      opportunityId, 
      hasDeepData: !!deepAnalysisData,
      deepAnalysisData: deepAnalysisData ? 'exists' : 'null'
    });
    
    if (!deepAnalysisData) {
      console.log('⚠️ No deep analysis data available yet');
      return null;
    }
    
    const target = deepAnalysisData.target;
    const avgCompetitors = deepAnalysisData.competitorAverages;
    
    console.log('✅ Extracting insights for:', opportunityId);
    
    switch(opportunityId) {
      case 'content-gaps':
        return {
          wordCount: target.onPage.wordCount,
          avgCompetitors: avgCompetitors.wordCount,
          gap: avgCompetitors.wordCount - target.onPage.wordCount,
          headings: target.onPage.h1Count + target.onPage.h2Count
        };
      case 'quick-wins':
        return {
          performanceScore: target.performanceScore,
          lcpStatus: target.coreWebVitals.lcp.status,
          seoScore: target.seoScore,
          fidStatus: target.coreWebVitals.fid.status
        };
      case 'competitor-leaders':
        return {
          targetDA: target.estimatedDA,
          avgDA: avgCompetitors.estimatedDA,
          gap: avgCompetitors.estimatedDA - target.estimatedDA
        };
      case 'seo-optimization':
        return {
          hasSchema: target.onPage.hasSchema,
          hasOpenGraph: target.onPage.hasOpenGraph,
          isMobile: target.onPage.isMobileFriendly,
          checksOk: [target.onPage.hasSchema, target.onPage.hasOpenGraph, target.onPage.isMobileFriendly].filter(Boolean).length
        };
      default:
        return null;
    }
  };

  // Handler para análise profunda
  const handleDeepAnalysis = async () => {
    console.log('🚀 handleDeepAnalysis called');
    
    if (!analysisId) {
      console.error('❌ No analysisId provided');
      toast.error('ID de análise não encontrado. Tente recarregar a página.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    
    console.log('⏳ Starting deep analysis for:', { analysisId, targetDomain });
    
    // Show initial toast with loading state
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

      console.log('📊 Top competitors selected:', topCompetitors);

      const result = await DeepAnalysisService.startDeepAnalysis(
        analysisId,
        targetDomain,
        topCompetitors
      );

      console.log('📥 Deep analysis result:', result);

      if (result.success && result.data) {
        console.log('✅ Deep analysis successful, setting data');
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
        console.error('❌ Deep analysis failed:', result.error);
        setAnalysisError(result.error || 'Erro desconhecido');
        toast.error(result.error || 'Erro ao realizar análise profunda', {
          id: 'deep-analysis',
        });
      }
    } catch (error) {
      console.error('❌ Exception during deep analysis:', error);
      setAnalysisError(error instanceof Error ? error.message : 'Erro inesperado');
      toast.error('Erro ao executar análise profunda. Verifique os logs para mais detalhes.', {
        id: 'deep-analysis',
      });
    } finally {
      setIsAnalyzing(false);
      console.log('🏁 Deep analysis finished');
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
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2" key={deepAnalysisData ? 'with-insights' : 'without-insights'}>
        {opportunities.map((opportunity) => {
          const Icon = opportunity.icon;
          const insights = getDeepInsights(opportunity.id);
          
          console.log('📊 Rendering card:', { 
            id: opportunity.id, 
            hasInsights: !!insights,
            insights 
          });
          
          return (
            <Card 
              key={opportunity.id} 
              className={`transition-all hover:shadow-md ${getPriorityColor(opportunity.priority)} ${
                insights ? 'ring-2 ring-primary/20 animate-in fade-in duration-500' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${opportunity.color} flex items-center justify-center text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-foreground">{opportunity.title}</h4>
                      <Badge variant="outline" className="text-xs mt-1 text-muted-foreground">
                        {opportunity.count} oportunidades
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {insights && (
                      <Badge variant="default" className="text-xs bg-primary/10 text-primary border-primary/20">
                        🆕 Atualizado
                      </Badge>
                    )}
                    <Badge 
                      variant={opportunity.priority === 'high' ? 'destructive' : 
                              opportunity.priority === 'medium' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {opportunity.priority === 'high' ? 'Alta' : 
                       opportunity.priority === 'medium' ? 'Média' : 'Baixa'}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  {opportunity.description}
                </p>

                {/* Micro-insights da análise profunda */}
                {insights && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Search className="h-3 w-3" />
                      Análise Profunda:
                    </p>
                    
                    {/* Content Gaps Insights */}
                    {opportunity.id === 'content-gaps' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Seu conteúdo:</span>
                          <span className="font-medium">{insights.wordCount} palavras</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Concorrentes:</span>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{insights.avgCompetitors} palavras</span>
                            <Badge variant={insights.gap > 0 ? "destructive" : "default"} className="text-xs">
                              {insights.gap > 0 ? `+${insights.gap}` : '✓'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quick Wins Insights */}
                    {opportunity.id === 'quick-wins' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Performance:</span>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{insights.performanceScore}/100</span>
                            <Badge variant={insights.performanceScore >= 90 ? "default" : "secondary"} className="text-xs">
                              {insights.performanceScore >= 90 ? '✓' : '⚠️'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Core Web Vitals:</span>
                          <div className="flex items-center gap-1 text-xs">
                            <span>LCP {insights.lcpStatus === 'good' ? '✅' : insights.lcpStatus === 'needs-improvement' ? '⚠️' : '❌'}</span>
                            <span>FID {insights.fidStatus === 'good' ? '✅' : insights.fidStatus === 'needs-improvement' ? '⚠️' : '❌'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Competitor Leaders Insights */}
                    {opportunity.id === 'competitor-leaders' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Seu DA:</span>
                          <span className="font-medium">{insights.targetDA}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Média concorrentes:</span>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{insights.avgDA}</span>
                            <Badge variant={insights.gap > 0 ? "destructive" : "default"} className="text-xs">
                              {insights.gap > 0 ? `+${insights.gap}` : '✓'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SEO Optimization Insights */}
                    {opportunity.id === 'seo-optimization' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Checklist Técnico:</span>
                          <Badge variant={insights.checksOk === 3 ? "default" : "secondary"} className="text-xs">
                            {insights.checksOk}/3 OK
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1.5 text-xs">
                          <Badge variant="outline" className="text-xs">
                            {insights.hasSchema ? '✅' : '❌'} Schema
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {insights.hasOpenGraph ? '✅' : '❌'} Open Graph
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {insights.isMobile ? '✅' : '❌'} Mobile
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-between text-xs mt-3"
                  disabled={opportunity.count === 0}
                >
                  {opportunity.action}
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal de Análise Profunda */}
      <DeepInsightsModal 
        open={showModal}
        onOpenChange={setShowModal}
        data={deepAnalysisData}
      />
    </div>
  );
};

export default StrategicOpportunities;