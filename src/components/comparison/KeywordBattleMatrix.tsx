import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Swords, Crown, Target } from "lucide-react";
import { ComparisonResultEnhanced } from "./ComparisonResultsEnhanced";

interface KeywordBattleMatrixProps {
  results: ComparisonResultEnhanced[];
  websites: string[];
}

const KeywordBattleMatrix = ({ results, websites }: KeywordBattleMatrixProps) => {
  const clientDomain = websites[0];
  const competitorDomain = websites[1];

  const getDomainName = (url: string) => {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  };

const getPositionColor = (position: number | null): string => {
  if (!position) return "bg-muted/50";
  if (position === 1) return "bg-yellow-400"; // Ouro para 1ª posição
  if (position <= 3) return "bg-green-500"; // Verde para top 3
  if (position <= 10) return "bg-blue-500"; // Azul para top 10
  if (position <= 20) return "bg-orange-500"; // Laranja para top 20
  return "bg-red-500"; // Vermelho para demais
};

const getPositionIntensity = (position: number | null): string => {
  if (!position) return "opacity-30";
  if (position === 1) return "opacity-100 ring-2 ring-yellow-300 shadow-lg";
  if (position <= 3) return "opacity-90 shadow-md";
  if (position <= 10) return "opacity-80";
  if (position <= 20) return "opacity-60";
  return "opacity-50";
};

  const getPositionIcon = (position: number | null) => {
    if (!position) return null;
    if (position === 1) return <Crown className="h-3 w-3 text-white" />;
    if (position <= 3) return <Target className="h-3 w-3 text-white" />;
    return null;
  };

const getBattleResult = (clientPos: number | null, competitorPos: number | null): "client" | "competitor" | "draw" => {
  // Sem posições = empate
  if (!clientPos && !competitorPos) return "draw";
  // Apenas cliente tem posição = cliente vence
  if (clientPos && !competitorPos) return "client";
  // Apenas concorrente tem posição = concorrente vence
  if (!clientPos && competitorPos) return "competitor";
  // Ambos têm posições = menor posição vence (melhor ranking)
  if (clientPos && competitorPos) {
    if (clientPos < competitorPos) return "client";
    if (competitorPos < clientPos) return "competitor";
    return "draw"; // Posições iguais = empate
  }
  return "draw";
};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Swords className="h-5 w-5 text-primary" />
          Matriz de Batalha de Keywords
        </CardTitle>
        <CardDescription>
          Mapa de calor das posições de cada palavra-chave (verde = melhor posição)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="space-y-4">
            {/* Header */}
            <div className="grid grid-cols-3 gap-4 text-sm font-medium text-muted-foreground">
              <div>Palavra-chave</div>
              <div className="text-center">{getDomainName(clientDomain)} (Você)</div>
              <div className="text-center">{getDomainName(competitorDomain)}</div>
            </div>

            {/* Matriz */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result) => {
                const clientResult = result.results.find(r => r.website === clientDomain);
                const competitorResult = result.results.find(r => r.website === competitorDomain);
                const battleResult = getBattleResult(clientResult?.position, competitorResult?.position);

                return (
                  <div
                    key={result.keyword}
                    className={`grid grid-cols-3 gap-4 p-3 rounded-lg border transition-all duration-200 ${
                      battleResult === "client" ? "border-primary/50 bg-primary/5" :
                      battleResult === "competitor" ? "border-destructive/50 bg-destructive/5" :
                      "border-muted bg-muted/20"
                    }`}
                  >
                    {/* Palavra-chave */}
                    <div className="flex items-center">
                      <span className="font-medium text-sm truncate" title={result.keyword}>
                        {result.keyword}
                      </span>
                      {battleResult === "client" && (
                        <Crown className="h-4 w-4 text-primary ml-2 flex-shrink-0" />
                      )}
                    </div>

                    {/* Posição do Cliente */}
                    <div className="flex justify-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`w-12 h-8 rounded flex items-center justify-center transition-all duration-300 ${
                              getPositionColor(clientResult?.position)
                            } ${getPositionIntensity(clientResult?.position)}`}
                          >
                            {getPositionIcon(clientResult?.position) || (
                              <span className="text-xs font-bold text-white">
                                {clientResult?.position || "-"}
                              </span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {clientResult?.position
                              ? `${clientResult.position}ª posição`
                              : "Não encontrado"
                            }
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Posição do Concorrente */}
                    <div className="flex justify-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`w-12 h-8 rounded flex items-center justify-center transition-all duration-300 ${
                              getPositionColor(competitorResult?.position)
                            } ${getPositionIntensity(competitorResult?.position)}`}
                          >
                            {getPositionIcon(competitorResult?.position) || (
                              <span className="text-xs font-bold text-white">
                                {competitorResult?.position || "-"}
                              </span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {competitorResult?.position
                              ? `${competitorResult.position}ª posição`
                              : "Não encontrado"
                            }
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legenda CORRIGIDA */}
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-400 shadow-sm"></div>
                <span>1ª posição</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500"></div>
                <span>Top 3</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500"></div>
                <span>Top 10</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-500"></div>
                <span>Top 20</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500"></div>
                <span>Página 2+</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-muted/50"></div>
                <span>Não encontrado</span>
              </div>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};

export default KeywordBattleMatrix;