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
  // Calculate opportunities
  const opportunities = [
    {
      id: 'quick-wins',
      title: 'Vitórias Rápidas',
      description: 'Keywords na posição 11-20 com potencial de primeira página',
      count: keywords.filter(k => k.target_domain_position && k.target_domain_position >= 11 && k.target_domain_position <= 20).length,
      priority: 'high',
      color: 'bg-green-500',
      icon: Zap,
      action: 'Otimizar Agora'
    },
    {
      id: 'content-gaps',
      title: 'Gaps de Conteúdo',
      description: 'Keywords onde concorrentes rankeiam mas você não',
      count: keywords.filter(k => !k.target_domain_position && k.competitor_positions?.some(p => p.position <= 10)).length,
      priority: 'medium',
      color: 'bg-blue-500',
      icon: Target,
      action: 'Criar Conteúdo'
    },
    {
      id: 'competitor-weaknesses',
      title: 'Pontos Fracos dos Concorrentes',
      description: 'Keywords onde você está melhor posicionado',
      count: keywords.filter(k => {
        if (!k.target_domain_position || k.target_domain_position > 10) return false;
        const bestCompetitor = k.competitor_positions?.reduce((best, current) => 
          current.position < best ? current.position : best, 999
        ) || 999;
        return k.target_domain_position < bestCompetitor;
      }).length,
      priority: 'medium',
      color: 'bg-purple-500',
      icon: Trophy,
      action: 'Fortalecer Posição'
    },
    {
      id: 'trending-keywords',
      title: 'Keywords em Ascensão',
      description: 'Oportunidades baseadas em tendências de busca',
      count: Math.floor(keywords.length * 0.15), // Simulate 15% trending
      priority: 'low',
      color: 'bg-orange-500',
      icon: TrendingUp,
      action: 'Monitorar'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Oportunidades Estratégicas</h3>
      <div className="grid gap-4 md:grid-cols-2">
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
                      <h4 className="font-medium text-sm">{opportunity.title}</h4>
                      <Badge variant="outline" className="text-xs mt-1">
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
                
                <p className="text-xs text-muted-foreground mb-3">
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