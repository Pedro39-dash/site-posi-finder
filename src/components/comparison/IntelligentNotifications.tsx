import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (analysisData) {
      generateOpportunities(analysisData);
    }
  }, [analysisData]);

  const generateOpportunities = (data: CompetitiveAnalysisData) => {
    const newOpportunities: Opportunity[] = [];

    // High-impact opportunities (positions 11-20)
    const nearFirstPage = data.keywords.filter(k => 
      (k.target_domain_position || 100) > 10 && (k.target_domain_position || 100) <= 20
    );
    
    if (nearFirstPage.length > 0) {
      newOpportunities.push({
        id: 'near-first-page',
        type: 'high-impact',
        title: `${nearFirstPage.length} palavras-chave próximas da primeira página`,
        description: 'Oportunidades de alto impacto para entrar no top 10',
        impact: 'high',
        effort: 'medium',
        keywords: nearFirstPage.slice(0, 3).map(k => k.keyword),
        action: 'focus-keywords',
        actionData: nearFirstPage
      });
    }

    // Quick wins (easy keywords where competitors are weak)
    const quickWins = data.keywords.filter(k => {
      const avgCompetitorPos = k.competitor_positions.reduce((acc, c) => acc + (c.position || 100), 0) / k.competitor_positions.length;
      return (k.target_domain_position || 100) > avgCompetitorPos && avgCompetitorPos > 30;
    });

    if (quickWins.length > 0) {
      newOpportunities.push({
        id: 'quick-wins',
        type: 'quick-win',
        title: `${quickWins.length} oportunidades de vitória rápida`,
        description: 'Keywords onde os concorrentes estão fracos',
        impact: 'medium',
        effort: 'low',
        keywords: quickWins.slice(0, 3).map(k => k.keyword),
        action: 'target-weak-competitors',
        actionData: quickWins
      });
    }

    // Trending opportunities (keywords where you're improving)
    const trendingUp = data.keywords.filter(k => {
      // Simulate trend data - in real app, this would come from historical data
      return Math.random() > 0.7 && (k.target_domain_position || 100) < 50;
    });

    if (trendingUp.length > 0) {
      newOpportunities.push({
        id: 'trending-up',
        type: 'trending',
        title: `${trendingUp.length} palavras-chave em ascensão`,
        description: 'Continue investindo nestas keywords que estão subindo',
        impact: 'medium',
        effort: 'low',
        keywords: trendingUp.slice(0, 3).map(k => k.keyword),
        action: 'maintain-momentum',
        actionData: trendingUp
      });
    }

    // Critical alerts (losing to new competitors)
    const criticalLosses = data.keywords.filter(k => 
      (k.target_domain_position || 100) > 50 && k.competitor_positions.some(c => (c.position || 100) < 10)
    );

    if (criticalLosses.length > 0) {
      newOpportunities.push({
        id: 'critical-losses',
        type: 'alert',
        title: `${criticalLosses.length} palavras-chave com perdas críticas`,
        description: 'Concorrentes dominando keywords importantes',
        impact: 'high',
        effort: 'high',
        keywords: criticalLosses.slice(0, 3).map(k => k.keyword),
        action: 'competitive-analysis',
        actionData: criticalLosses
      });
    }

    setOpportunities(newOpportunities);
  };

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