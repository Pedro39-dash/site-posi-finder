import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Bug, Target, AlertTriangle, CheckCircle, Info } from "lucide-react";

interface DebugInfo {
  total_matches_found?: number;
  all_positions?: number[];
  best_position?: number | null;
  saved_position?: number | null;
}

interface KeywordDebugData {
  keyword: string;
  saved_position: number | null;
  debug_info?: DebugInfo;
  metadata?: {
    detection_debug?: DebugInfo;
    saved_at?: string;
  };
}

interface PositionDebugPanelProps {
  keywordData: KeywordDebugData[];
  isVisible?: boolean;
}

export const PositionDebugPanel = ({ keywordData, isVisible = false }: PositionDebugPanelProps) => {
  const [isOpen, setIsOpen] = useState(isVisible);

  // Analyze debug data for issues
  const analysisResults = keywordData.map(keyword => {
    const debugInfo = keyword.debug_info || keyword.metadata?.detection_debug;
    const hasIssue = debugInfo && debugInfo.best_position !== null && 
                     debugInfo.saved_position !== debugInfo.best_position;
    
    return {
      ...keyword,
      debugInfo,
      hasIssue,
      issueType: hasIssue ? 'position_mismatch' : null
    };
  });

  const totalIssues = analysisResults.filter(r => r.hasIssue).length;
  const hasAnyIssues = totalIssues > 0;

  if (keywordData.length === 0) return null;

  return (
    <Card className="border-dashed">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bug className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">
                  Debug de Posições
                </CardTitle>
                {hasAnyIssues && (
                  <Badge variant="destructive" className="text-xs">
                    {totalIssues} problema{totalIssues !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {keywordData.length} palavra{keywordData.length !== 1 ? 's' : ''}
                </Badge>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
            <CardDescription className="text-xs">
              Informações detalhadas sobre detecção de posições
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            {hasAnyIssues && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Detectados problemas na análise de posições. Os dados podem não refletir as posições reais encontradas.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              {analysisResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-3 text-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{result.keyword}</span>
                      {result.hasIssue ? (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Inconsistência
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          OK
                        </Badge>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Posição: {result.saved_position || 'N/A'}
                    </Badge>
                  </div>

                  {result.debugInfo && (
                    <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium">Detecções encontradas:</span>
                        <div className="mt-1">
                          {result.debugInfo.total_matches_found || 0} match{(result.debugInfo.total_matches_found || 0) !== 1 ? 'es' : ''}
                        </div>
                        {result.debugInfo.all_positions && result.debugInfo.all_positions.length > 0 && (
                          <div>
                            Posições: [{result.debugInfo.all_positions.join(', ')}]
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="font-medium">Validação:</span>
                        <div className="mt-1">
                          Melhor posição: {result.debugInfo.best_position || 'N/A'}
                        </div>
                        <div>
                          Posição salva: {result.debugInfo.saved_position || 'N/A'}
                        </div>
                      </div>
                    </div>
                  )}

                  {result.hasIssue && (
                    <Alert className="mt-2">
                      <Info className="h-3 w-3" />
                      <AlertDescription className="text-xs">
                        A melhor posição encontrada ({result.debugInfo?.best_position}) não corresponde 
                        à posição salva ({result.debugInfo?.saved_position}). Isso pode indicar um 
                        problema na lógica de detecção.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 border-t">
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>
                  Total: {keywordData.length} palavra{keywordData.length !== 1 ? 's' : ''} analisada{keywordData.length !== 1 ? 's' : ''}
                </span>
                <span>
                  Problemas: {totalIssues}
                </span>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};