import { useEffect, useState, useCallback } from "react";
import { CheckCircle, AlertTriangle, Info, TrendingUp, Target, Lightbulb, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompetitiveAnalysisData, CompetitorKeyword } from "@/services/competitorAnalysisService";

interface IntelligentNotificationsProps {
  analysisData?: CompetitiveAnalysisData;
  onActionClick?: (action: string, data?: any) => void;
}

interface Opportunity {
  id: string;
  type: 'high-impact' | 'quick-win' | 'trending' | 'alert';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  keywords?: string[];
  action?: string;
  actionData?: any;
}

const IntelligentNotifications = ({ analysisData, onActionClick }: IntelligentNotificationsProps) => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const generateOpportunities = useCallback((data: CompetitiveAnalysisData) => {
    if (!data?.keywords?.length) return;

    const newOpportunities: Opportunity[] = [];

    // Content Gaps - Keywords where competitors rank top 10 but target doesn't appear at all
    const contentGaps = data.keywords.filter(keyword => 
      !keyword.target_domain_position && 
      keyword.competitor_positions?.some(pos => pos.position <= 10)
    );
    
    if (contentGaps.length > 0) {
      // Get top competitor domains for these gaps
      const topCompetitors = [...new Set(
        contentGaps.flatMap(k => 
          k.competitor_positions?.filter(p => p.position <= 3).map(p => 
            p.domain?.replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0]
          ) || []
        )
      )].slice(0, 2);
      
      newOpportunities.push({
        id: 'content-gaps',
        type: 'high-impact',
        title: `${contentGaps.length} Gap${contentGaps.length > 1 ? 's' : ''} de Conteúdo Crítico${contentGaps.length > 1 ? 's' : ''}`,
        description: `${topCompetitors.join(' e ')} dominam "${contentGaps[0]?.keyword}"${contentGaps.length > 1 ? ` e outras ${contentGaps.length - 1} palavras-chave` : ''} onde você não aparece.`,
        impact: 'high',
        effort: 'medium',
        keywords: contentGaps.slice(0, 3).map(k => k.keyword),
        action: 'create-content',
        actionData: contentGaps
      });
    }

    // Quick Wins - Target domain ranking 11-30 (pages 2-3)
    const quickWins = data.keywords.filter(keyword => 
      keyword.target_domain_position && 
      keyword.target_domain_position >= 11 && 
      keyword.target_domain_position <= 30
    );
    
    if (quickWins.length > 0) {
      const avgPosition = Math.round(quickWins.reduce((sum, k) => sum + (k.target_domain_position || 0), 0) / quickWins.length);
      newOpportunities.push({
        id: 'quick-wins',
        type: 'quick-win',
        title: `${quickWins.length} Oportunidade${quickWins.length > 1 ? 's' : ''} de Melhoria Rápida`,
        description: `Você está na posição ${quickWins[0]?.target_domain_position}º para "${quickWins[0]?.keyword}" (média ${avgPosition}º) - otimizações simples podem levar à primeira página.`,
        impact: 'medium',
        effort: 'low',
        keywords: quickWins.slice(0, 3).map(k => k.keyword),
        action: 'optimize-content',
        actionData: quickWins
      });
    }

    // Competitive Threats - High-volume keywords dominated by competitors
    const competitiveThreats = data.keywords.filter(keyword => 
      (!keyword.target_domain_position || keyword.target_domain_position > 20) &&
      keyword.competitor_positions?.some(pos => pos.position <= 3) &&
      (keyword.search_volume || 0) > 100
    );
    
    if (competitiveThreats.length > 0) {
      const topThreat = competitiveThreats[0];
      const dominantCompetitor = topThreat.competitor_positions
        ?.find(p => p.position <= 3)?.domain
        ?.replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0];
      
      newOpportunities.push({
        id: 'competitive-threats',
        type: 'alert',
        title: `${competitiveThreats.length} Ameaça${competitiveThreats.length > 1 ? 's' : ''} Competitiva${competitiveThreats.length > 1 ? 's' : ''}`,
        description: `${dominantCompetitor} domina "${topThreat?.keyword}"${competitiveThreats.length > 1 ? ` e outras ${competitiveThreats.length - 1} palavras-chave` : ''} - analise sua estratégia.`,
        impact: 'medium',
        effort: 'high',
        keywords: competitiveThreats.slice(0, 3).map(k => k.keyword),
        action: 'competitive-response',
        actionData: competitiveThreats
      });
    }

    // SEO Technical Opportunities - Based on ranking patterns
    const seoOpportunities = data.keywords.filter(keyword =>
      keyword.target_domain_position && 
      keyword.target_domain_position > 10 &&
      keyword.competitor_positions?.some(pos => pos.position <= 10)
    );
    
    if (seoOpportunities.length > 0) {
      newOpportunities.push({
        id: 'seo-technical',
        type: 'trending',
        title: `${seoOpportunities.length} Oportunidade${seoOpportunities.length > 1 ? 's' : ''} de SEO Técnico`,
        description: `Melhore velocidade, estrutura de dados e otimização on-page para "${seoOpportunities[0]?.keyword}"${seoOpportunities.length > 1 ? ` e outras ${seoOpportunities.length - 1} keywords` : ''}.`,
        impact: 'low',
        effort: 'medium',
        keywords: seoOpportunities.slice(0, 3).map(k => k.keyword),
        action: 'technical-seo',
        actionData: seoOpportunities
      });
    }

    // Long-tail Opportunities - Less competitive, longer keywords
    const longTailOpportunities = data.keywords.filter(keyword =>
      keyword.keyword.split(' ').length >= 3 &&
      (!keyword.target_domain_position || keyword.target_domain_position > 20) &&
      keyword.competitor_positions?.every(pos => pos.position > 5)
    );
    
    if (longTailOpportunities.length > 0) {
      newOpportunities.push({
        id: 'long-tail',
        type: 'quick-win',
        title: `${longTailOpportunities.length} Oportunidade${longTailOpportunities.length > 1 ? 's' : ''} Long-tail`,
        description: `Palavras-chave específicas como "${longTailOpportunities[0]?.keyword}" com menor concorrência e alta intenção.`,
        impact: 'low',
        effort: 'low',
        keywords: longTailOpportunities.slice(0, 3).map(k => k.keyword),
        action: 'target-long-tail',
        actionData: longTailOpportunities
      });
    }

    setOpportunities(newOpportunities.slice(0, 4)); // Limit to 4 most relevant opportunities
  }, []);

  useEffect(() => {
    if (analysisData) {
      console.log('IntelligentNotifications: Generating opportunities from data:', {
        keywordsCount: analysisData.keywords?.length || 0,
        keywords: analysisData.keywords?.map(k => ({
          keyword: k.keyword,
          target_position: k.target_domain_position,
          search_volume: k.search_volume,
          competitor_positions: k.competitor_positions?.length || 0
        })).slice(0, 5) // Log first 5 for debugging
      });
      generateOpportunities(analysisData);
    }
  }, [analysisData, generateOpportunities]);

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => [...prev, id]);
  };

  const handleAction = (opportunity: Opportunity) => {
    if (onActionClick && opportunity.action) {
      onActionClick(opportunity.action, opportunity.actionData);
    }
    
    // Show success toast
    toast.success(`Ação iniciada: ${opportunity.title}`);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'high-impact': return TrendingUp;
      case 'quick-win': return Target;
      case 'trending': return CheckCircle;
      case 'alert': return AlertTriangle;
      default: return Info;
    }
  };

  const getVariant = (type: string) => {
    switch (type) {
      case 'high-impact': return 'default';
      case 'quick-win': return 'secondary';
      case 'trending': return 'outline';
      case 'alert': return 'destructive';
      default: return 'outline';
    }
  };

  const visibleOpportunities = opportunities.filter(o => !dismissedIds.includes(o.id));

  if (visibleOpportunities.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Oportunidades Inteligentes</h3>
      </div>

      <div className="grid gap-4">
        {visibleOpportunities.map((opportunity) => {
          const Icon = getIcon(opportunity.type);
          
          return (
            <Card key={opportunity.id} className="relative overflow-hidden animate-fade-in">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{opportunity.title}</h4>
                        <Badge variant={getVariant(opportunity.type)} className="text-xs">
                          {opportunity.impact === 'high' ? 'Alto Impacto' : 
                           opportunity.impact === 'medium' ? 'Médio Impacto' : 'Baixo Impacto'}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {opportunity.description}
                      </p>
                      
                      {opportunity.keywords && opportunity.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {opportunity.keywords.map((keyword, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                          {opportunity.actionData && opportunity.actionData.length > opportunity.keywords.length && (
                            <Badge variant="outline" className="text-xs">
                              +{opportunity.actionData.length - opportunity.keywords.length} mais
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 pt-2">
                        {opportunity.action && (
                          <Button 
                            size="sm" 
                            onClick={() => handleAction(opportunity)}
                            className="text-xs"
                          >
                            Analisar
                          </Button>
                        )}
                        
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span>Esforço: {
                            opportunity.effort === 'high' ? 'Alto' :
                            opportunity.effort === 'medium' ? 'Médio' : 'Baixo'
                          }</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDismiss(opportunity.id)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default IntelligentNotifications;