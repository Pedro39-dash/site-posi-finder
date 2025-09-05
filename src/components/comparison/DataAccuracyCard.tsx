import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RefreshCw, AlertTriangle, Clock, CheckCircle, Info } from "lucide-react";
import { CompetitiveAnalysisData } from "@/services/competitorAnalysisService";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DataAccuracyCardProps {
  analysisData: CompetitiveAnalysisData;
  onRefreshAnalysis?: () => void;
}

export const DataAccuracyCard = ({ analysisData, onRefreshAnalysis }: DataAccuracyCardProps) => {
  const { analysis, keywords } = analysisData;
  
  // Calculate data freshness
  const analysisDate = new Date(analysis.completed_at || analysis.created_at);
  const hoursOld = Math.floor((Date.now() - analysisDate.getTime()) / (1000 * 60 * 60));
  const daysSinceAnalysis = Math.floor(hoursOld / 24);
  
  // Data accuracy indicators
  const isRecent = hoursOld < 24;
  const isModerate = hoursOld >= 24 && hoursOld < 72;
  const isOld = hoursOld >= 72;
  
  // Get API source from metadata
  const apiSource = analysis.metadata?.api_source || 'unknown';
  const totalResults = analysis.metadata?.total_keywords || keywords.length;
  const successRate = analysis.metadata?.success_rate || 100;
  
  const getDataFreshnessStatus = () => {
    if (isRecent) {
      return {
        icon: <CheckCircle className="h-4 w-4 text-green-600" />,
        text: "Dados Recentes",
        color: "text-green-600",
        bgColor: "bg-green-50 border-green-200",
        description: "Análise realizada nas últimas 24 horas"
      };
    } else if (isModerate) {
      return {
        icon: <Clock className="h-4 w-4 text-yellow-600" />,
        text: "Dados Moderados",
        color: "text-yellow-600", 
        bgColor: "bg-yellow-50 border-yellow-200",
        description: "Análise pode estar desatualizada"
      };
    } else {
      return {
        icon: <AlertTriangle className="h-4 w-4 text-orange-600" />,
        text: "Dados Antigos",
        color: "text-orange-600",
        bgColor: "bg-orange-50 border-orange-200", 
        description: "Recomendamos uma nova análise"
      };
    }
  };

  const dataStatus = getDataFreshnessStatus();

  return (
    <Card className={`${dataStatus.bgColor}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {dataStatus.icon}
            <CardTitle className="text-lg">Precisão dos Dados</CardTitle>
          </div>
          <Badge variant={isRecent ? "default" : isOld ? "destructive" : "secondary"}>
            {dataStatus.text}
          </Badge>
        </div>
        <CardDescription>
          {dataStatus.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Analysis Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-muted-foreground">Última Atualização</p>
            <p className={dataStatus.color}>
              {formatDistanceToNow(analysisDate, { addSuffix: true, locale: ptBR })}
            </p>
          </div>
          
          <div>
            <p className="font-medium text-muted-foreground">Fonte dos Dados</p>
            <div className="flex items-center gap-1">
              <p>SerpApi</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Utilizamos SerpApi para obter dados reais do Google Search. 
                      Analisamos os primeiros 50 resultados para cada palavra-chave.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          <div>
            <p className="font-medium text-muted-foreground">Palavras Analisadas</p>
            <p>{totalResults} palavras-chave</p>
          </div>
          
          <div>
            <p className="font-medium text-muted-foreground">Taxa de Sucesso</p>
            <p className={successRate >= 90 ? "text-green-600" : successRate >= 70 ? "text-yellow-600" : "text-red-600"}>
              {successRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Data Quality Indicators */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Como interpretamos os dados:</p>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• <strong>Normalização de domínios:</strong> Removemos www, https e comparamos variações</li>
                <li>• <strong>Cobertura expandida:</strong> Analisamos 50 posições (antes eram 20)</li>
                <li>• <strong>Filtragem inteligente:</strong> Excluímos YouTube, redes sociais e sites não-comerciais</li>
                <li>• <strong>Re-verificação:</strong> Use o botão de atualização para verificar posições específicas</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* Action Button */}
        {(isOld || successRate < 80) && onRefreshAnalysis && (
          <div className="pt-2">
            <Button onClick={onRefreshAnalysis} variant="outline" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar Análise Completa
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};