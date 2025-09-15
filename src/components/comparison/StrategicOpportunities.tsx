import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Target, Zap, Trophy, ArrowRight } from 'lucide-react';
import { CompetitorKeyword } from '@/services/competitorAnalysisService';

interface StrategicOpportunitiesProps {
  keywords: CompetitorKeyword[];
  targetDomain: string;
}

const StrategicOpportunities: React.FC<StrategicOpportunitiesProps> = ({ 
  keywords, 
  targetDomain 
}) => {
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

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Oportunidades Estratégicas</h3>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {opportunities.map((opportunity) => {
          const Icon = opportunity.icon;
          return (
            <Card 
              key={opportunity.id} 
              className={`transition-all hover:shadow-md ${getPriorityColor(opportunity.priority)}`}
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
                  <Badge 
                    variant={opportunity.priority === 'high' ? 'destructive' : 
                            opportunity.priority === 'medium' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {opportunity.priority === 'high' ? 'Alta' : 
                     opportunity.priority === 'medium' ? 'Média' : 'Baixa'}
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  {opportunity.description}
                </p>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-between text-xs"
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
    </div>
  );
};

export default StrategicOpportunities;