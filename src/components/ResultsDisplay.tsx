import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Crown, AlertCircle } from "lucide-react";

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
    if (position === null) return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    if (!previous) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (position < previous) return <TrendingUp className="h-4 w-4 text-accent" />;
    if (position > previous) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getPositionBadgeVariant = (position: number | null) => {
    if (position === null) return "secondary";
    if (position <= 3) return "default";
    if (position <= 10) return "secondary";
    return "outline";
  };

  const getPositionText = (position: number | null) => {
    if (position === null) return "Não encontrado";
    if (position <= 100) return `#${position}`;
    return "100+";
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
                    <Badge variant={getPositionBadgeVariant(result.position)}>
                      {result.position === 1 && <Crown className="h-3 w-3 mr-1" />}
                      {getPositionText(result.position)}
                    </Badge>
                    
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
                    <div className="text-sm text-muted-foreground">
                      Não rankeando
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