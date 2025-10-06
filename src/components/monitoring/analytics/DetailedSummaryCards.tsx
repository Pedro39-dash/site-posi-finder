import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  RefreshCw, 
  PlusCircle,
  MinusCircle,
  Activity
} from "lucide-react";
import { SummaryStats } from "@/services/monitoringAnalyticsService";

interface DetailedSummaryCardsProps {
  stats: SummaryStats;
  isLoading?: boolean;
}

export const DetailedSummaryCards = ({ stats, isLoading = false }: DetailedSummaryCardsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total de Alterações",
      value: stats.totalChanges,
      icon: Activity,
      color: "text-primary",
      bgColor: "bg-primary/10",
      description: "Mudanças de posição detectadas",
    },
    {
      title: "Melhorias",
      value: stats.improvements,
      icon: ArrowUpCircle,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
      description: "Palavras-chave que subiram",
      badge: stats.improvements > stats.declines ? "positive" : undefined,
    },
    {
      title: "Pioras",
      value: stats.declines,
      icon: ArrowDownCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      description: "Palavras-chave que caíram",
      badge: stats.declines > stats.improvements ? "negative" : undefined,
    },
    {
      title: "Alterações na SERP",
      value: stats.serpChanges,
      icon: RefreshCw,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
      description: "Mudanças significativas (>5 posições)",
    },
    {
      title: "Novas Palavras-chave",
      value: stats.newKeywords,
      icon: PlusCircle,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
      description: "Palavras que entraram no ranking",
    },
    {
      title: "Palavras Perdidas",
      value: stats.lostKeywords,
      icon: MinusCircle,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
      description: "Palavras que saíram do ranking",
    },
  ];

  return (
    <div className="mb-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-foreground">Resumo do Período</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Análise detalhada das mudanças nas posições
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="relative overflow-hidden hover:shadow-md transition-shadow">
              <div className={`absolute top-0 right-0 w-24 h-24 ${card.bgColor} rounded-full -mr-12 -mt-12 opacity-20`} />
              
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-bold text-foreground">
                    {card.value.toLocaleString('pt-BR')}
                  </div>
                  {card.badge && (
                    <Badge 
                      variant={card.badge === 'positive' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {card.badge === 'positive' ? 'Positivo' : 'Negativo'}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
