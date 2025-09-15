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

    // Content Gap Analysis - Keywords competitors rank for but target doesn't
    const contentGaps = data.keywords
      .filter(k => {
        const hasCompetitorInTop10 = k.competitor_positions?.some(cp => cp.position <= 10);
        const targetNotInTop20 = !k.target_domain_position || k.target_domain_position > 20;
        return hasCompetitorInTop10 && targetNotInTop20 && k.search_volume && k.search_volume > 300;
      })
      .slice(0, 3);

    if (contentGaps.length > 0) {
      newOpportunities.push({
        id: 'content-gaps',
        type: 'high-impact',
        title: 'Lacunas de Conteúdo Identificadas',
        description: `${contentGaps.length} tópicos importantes onde concorrentes estão dominando. Criar conteúdo focado pode gerar tráfego significativo.`,
        impact: 'high',
        effort: 'medium',
        keywords: contentGaps.map(k => k.keyword),
        action: 'create-content',
        actionData: contentGaps
      });
    }

    // Quick Position Wins - Keywords ranking 11-20 that can reach top 10
    const quickWins = data.keywords
      .filter(k => k.target_domain_position >= 11 && k.target_domain_position <= 20 && k.search_volume && k.search_volume > 200)
      .sort((a, b) => (a.target_domain_position || 999) - (b.target_domain_position || 999))
      .slice(0, 4);

    if (quickWins.length > 0) {
      newOpportunities.push({
        id: 'position-wins',
        type: 'quick-win',
        title: 'Oportunidades de Posicionamento',
        description: `${quickWins.length} keywords na segunda página podem alcançar o top 10 com otimização técnica e de conteúdo.`,
        impact: 'medium',
        effort: 'low',
        keywords: quickWins.map(k => k.keyword),
        action: 'optimize-content',
        actionData: quickWins
      });
    }

    // High-Volume Untapped Keywords
    const highVolumeUntapped = data.keywords
      .filter(k => {
        const isUntapped = !k.target_domain_position || k.target_domain_position > 30;
        const hasHighVolume = k.search_volume && k.search_volume > 1000;
        const hasWeakCompetition = !k.competitor_positions?.some(cp => cp.position <= 3);
        return isUntapped && hasHighVolume && hasWeakCompetition;
      })
      .slice(0, 2);

    if (highVolumeUntapped.length > 0) {
      newOpportunities.push({
        id: 'high-volume',
        type: 'trending',
        title: 'Keywords de Alto Volume Desexploradas',
        description: `${highVolumeUntapped.length} keywords com alto volume de busca e baixa competição. Oportunidade para crescimento acelerado.`,
        impact: 'high',
        effort: 'high',
        keywords: highVolumeUntapped.map(k => k.keyword),
        action: 'create-pillar-content',
        actionData: highVolumeUntapped
      });
    }

    // Competitive Threats - Competitors dominating important keywords
    const competitiveThreats = data.keywords
      .filter(k => {
        const competitorDominating = k.competitor_positions?.some(cp => cp.position <= 3);
        const importantKeyword = k.search_volume && k.search_volume > 500;
        const targetLagging = !k.target_domain_position || k.target_domain_position > 20;
        return competitorDominating && importantKeyword && targetLagging;
      })
      .slice(0, 3);

    if (competitiveThreats.length > 0) {
      newOpportunities.push({
        id: 'competitive-threats',
        type: 'alert',
        title: 'Ameaças Competitivas Críticas',
        description: `Concorrentes dominam ${competitiveThreats.length} keywords estratégicas. Ação imediata necessária para não perder market share.`,
        impact: 'high',
        effort: 'high',
        keywords: competitiveThreats.map(k => k.keyword),
        action: 'competitive-response',
        actionData: competitiveThreats
      });
    }

    // Long-tail Opportunities - Easy wins with specific intent
    const longTailOpportunities = data.keywords
      .filter(k => {
        const isLongTail = k.keyword.split(' ').length >= 3;
        const hasIntent = /como|onde|quando|porque|melhor|preço|comprar|tutorial/.test(k.keyword.toLowerCase());
        const lowCompetition = !k.competitor_positions?.some(cp => cp.position <= 10) || k.competitor_positions?.length <= 2;
        return isLongTail && hasIntent && lowCompetition;
      })
      .slice(0, 5);

    if (longTailOpportunities.length > 0) {
      newOpportunities.push({
        id: 'long-tail',
        type: 'quick-win',
        title: 'Oportunidades Long-Tail com Intenção Clara',
        description: `${longTailOpportunities.length} keywords específicas com baixa competição e alta intenção de conversão.`,
        impact: 'medium',
        effort: 'low',
        keywords: longTailOpportunities.map(k => k.keyword),
        action: 'target-long-tail',
        actionData: longTailOpportunities
      });
    }

    setOpportunities(newOpportunities);
  }, []);

  useEffect(() => {
    if (analysisData) {
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