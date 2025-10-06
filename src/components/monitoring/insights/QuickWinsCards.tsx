import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle, Award, Copy, Eye, Calendar } from "lucide-react";
import { QuickWinsData } from "@/services/quickWinsService";

interface QuickWinsCardsProps {
  data: QuickWinsData | null;
  isLoading?: boolean;
  onViewDetails?: (type: 'quick-wins' | 'at-risk' | 'featured-snippet' | 'cannibalization') => void;
}

export const QuickWinsCards = ({ data, isLoading, onViewDetails }: QuickWinsCardsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const cards = [
    {
      id: 'quick-wins' as const,
      title: 'Quick Wins',
      description: 'Palavras-chave próximas do Top 3',
      icon: TrendingUp,
      count: data.quickWins.length,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      visible: data.quickWins.length > 0
    },
    {
      id: 'at-risk' as const,
      title: 'Em Risco',
      description: 'Keywords com quedas significativas',
      icon: AlertTriangle,
      count: data.atRisk.length,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      visible: data.atRisk.length > 0
    },
    {
      id: 'featured-snippet' as const,
      title: 'Featured Snippets',
      description: 'Oportunidades de destaque',
      icon: Award,
      count: data.featuredSnippets.length,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      visible: data.featuredSnippets.length > 0
    },
    {
      id: 'cannibalization' as const,
      title: 'Cannibalização',
      description: 'URLs competindo entre si',
      icon: Copy,
      count: data.cannibalization.length,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      visible: data.cannibalization.length > 0
    }
  ];

  const visibleCards = cards.filter(card => card.visible);

  if (visibleCards.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Insights Automáticos
          </CardTitle>
          <CardDescription>
            Continue monitorando suas palavras-chave para identificar oportunidades e riscos automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground max-w-md">
            Nenhuma oportunidade crítica detectada no momento. Isso é bom! Continue monitorando para receber alertas quando surgirem oportunidades.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Insights Automáticos</h3>
          <p className="text-sm text-muted-foreground">
            Oportunidades e riscos detectados em suas palavras-chave
          </p>
        </div>
        <Badge variant="secondary" className="text-base px-3 py-1">
          {data.totalOpportunities} {data.totalOpportunities === 1 ? 'oportunidade' : 'oportunidades'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card 
              key={card.id} 
              className={`border-2 ${card.borderColor} hover:shadow-lg transition-all cursor-pointer group`}
              onClick={() => onViewDetails?.(card.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <Badge variant="secondary" className="text-lg font-bold">
                    {card.count}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-base mb-1 group-hover:text-primary transition-colors">
                  {card.title}
                </CardTitle>
                <CardDescription className="text-xs">
                  {card.description}
                </CardDescription>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                >
                  Ver detalhes
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
