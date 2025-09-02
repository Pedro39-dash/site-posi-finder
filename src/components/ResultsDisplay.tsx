import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Minus, Crown, AlertCircle, Target, HelpCircle } from "lucide-react";

interface SearchResult {
  keyword: string;
  position: number | null;
  previousPosition?: number;
}

interface ResultsDisplayProps {
  website: string;
  results: SearchResult[];
}

const ResultsDisplay = ({ website, results }: ResultsDisplayProps) => {
  const getPositionIcon = (position: number | null, previous?: number) => {
    if (position === null) return <Target className="h-4 w-4 text-orange-500" />;
    if (!previous) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (position < previous) return <TrendingUp className="h-4 w-4 text-accent" />;
    if (position > previous) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getPositionBadgeVariant = (position: number | null) => {
    if (position === null) return "outline";
    if (position <= 3) return "default";
    if (position <= 10) return "secondary";
    return "outline";
  };

  const getPositionBadgeClass = (position: number | null) => {
    if (position === null) return "border-orange-300 text-orange-700 bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:bg-orange-900/20";
    return "";
  };

  const getPositionText = (position: number | null) => {
    if (position === null) return "Não rankeando";
    if (position <= 100) return `#${position}`;
    return "100+";
  };

  const getNotFoundInsight = (keyword: string) => {
    return `"${keyword}" não aparece nas primeiras 100 posições. Esta é uma oportunidade de crescimento com potencial de tráfego inexplorado.`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-xl flex items-center justify-between">
            <span>Resultados para: {website}</span>
            <Badge variant="outline">{results.length} palavras-chave</Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {results.map((result, index) => (
          <Card key={index} className="shadow-card hover:shadow-elegant transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{result.keyword}</h3>
                  <div className="flex items-center gap-3">
                    {getPositionIcon(result.position, result.previousPosition)}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge 
                            variant={getPositionBadgeVariant(result.position)}
                            className={getPositionBadgeClass(result.position)}
                          >
                            {result.position === 1 && <Crown className="h-3 w-3 mr-1" />}
                            {result.position === null && <Target className="h-3 w-3 mr-1" />}
                            {getPositionText(result.position)}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          {result.position === null ? (
                            <div className="space-y-2">
                              <p className="font-medium">Oportunidade de Crescimento</p>
                              <p className="text-sm">{getNotFoundInsight(result.keyword)}</p>
                              <p className="text-xs text-muted-foreground">
                                💡 Dica: Otimize seu conteúdo para essa palavra-chave para começar a rankear
                              </p>
                            </div>
                          ) : result.position <= 10 ? (
                            <p>Excelente! Você está na primeira página do Google</p>
                          ) : (
                            <p>Posição #{result.position} - Página {Math.ceil(result.position / 10)} do Google</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    {result.previousPosition && result.position && (
                      <span className="text-sm text-muted-foreground">
                        {result.position < result.previousPosition ? "↗" : 
                         result.position > result.previousPosition ? "↘" : "→"}
                        {" "}
                        {result.position < result.previousPosition ? 
                          `+${result.previousPosition - result.position}` :
                          result.position > result.previousPosition ?
                          `-${result.position - result.previousPosition}` :
                          "Sem mudança"
                        }
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  {result.position && result.position <= 10 && (
                    <div className="text-sm text-accent font-medium">
                      Primeira página!
                    </div>
                  )}
                  {result.position && result.position > 10 && result.position <= 100 && (
                    <div className="text-sm text-muted-foreground">
                      Página {Math.ceil(result.position / 10)}
                    </div>
                  )}
                  {result.position === null && (
                    <div className="text-right space-y-1">
                      <div className="text-sm font-medium text-orange-600 dark:text-orange-400 flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        Oportunidade
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Não aparece no top 100
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-xs text-primary cursor-help flex items-center gap-1">
                              <HelpCircle className="h-3 w-3" />
                              Como melhorar?
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm">
                            <div className="space-y-2">
                              <p className="font-medium">Estratégias para rankear:</p>
                              <ul className="text-sm space-y-1">
                                <li>• Crie conteúdo otimizado para "{result.keyword}"</li>
                                <li>• Analise concorrentes que já rankeiam</li>
                                <li>• Melhore SEO on-page e autoridade do domínio</li>
                                <li>• Considere palavras-chave de cauda longa relacionadas</li>
                              </ul>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ResultsDisplay;