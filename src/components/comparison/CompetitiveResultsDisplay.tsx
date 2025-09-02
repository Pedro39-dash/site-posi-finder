import { useState, useEffect } from "react";
import { ArrowUp, ArrowDown, Trophy, Target, RefreshCw, AlertTriangle, TrendingUp, Users, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CompetitorAnalysisService, CompetitiveAnalysisData } from "@/services/competitorAnalysisService";

interface CompetitiveResultsDisplayProps {
  analysisId: string;
  onBackToForm: () => void;
}

const CompetitiveResultsDisplay = ({ analysisId, onBackToForm }: CompetitiveResultsDisplayProps) => {
  const [analysisData, setAnalysisData] = useState<CompetitiveAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalysisData();
    
    let pollCount = 0;
    const maxPolls = 30;
    
    const pollInterval = setInterval(() => {
      pollCount++;
      
      if (pollCount >= maxPolls) {
        clearInterval(pollInterval);
        setError('Análise demorou mais que o esperado. Tente novamente.');
        return;
      }
      
      if (analysisData?.analysis.status === 'analyzing' || 
          analysisData?.analysis.status === 'pending') {
        loadAnalysisData();
      } else if (analysisData?.analysis.status === 'completed' || 
                 analysisData?.analysis.status === 'failed') {
        clearInterval(pollInterval);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [analysisId, analysisData?.analysis.status]);

  const loadAnalysisData = async () => {
    try {
      const result = await CompetitorAnalysisService.getAnalysisData(analysisId);
      if (result.success && result.data) {
        setAnalysisData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to load analysis data');
      }
    } catch (err) {
      setError('Unexpected error loading analysis');
      console.error('Error loading analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto" />
          <h2 className="text-2xl font-bold">Carregando Análise...</h2>
          <p className="text-muted-foreground">Aguarde enquanto coletamos os dados</p>
        </div>
      </div>
    );
  }

  if (error || !analysisData) {
    return (
      <div className="space-y-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Não foi possível carregar os dados da análise'}
          </AlertDescription>
        </Alert>
        <Button onClick={onBackToForm} variant="outline">
          Voltar ao Formulário
        </Button>
      </div>
    );
  }

  const { analysis, competitors, keywords, opportunities } = analysisData;

  // Show loading state if analysis is still running
  if (analysis.status === 'analyzing' || analysis.status === 'pending') {
    const metadata = analysis.metadata || {};
    const totalKeywords = metadata.total_keywords || 0;
    const processedKeywords = metadata.processed_keywords || 0;
    const progressPercentage = totalKeywords > 0 ? Math.round((processedKeywords / totalKeywords) * 100) : 30;
    
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto" />
          <h2 className="text-2xl font-bold">Análise em Progresso</h2>
          <p className="text-muted-foreground">
            Analisando <span className="font-semibold text-primary">{analysis.target_domain}</span>
          </p>
          <div className="max-w-md mx-auto space-y-3">
            <Progress value={progressPercentage} className="w-full" />
            <p className="text-sm text-muted-foreground">
              {processedKeywords}/{totalKeywords} palavras-chave processadas
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if analysis failed
  if (analysis.status === 'failed') {
    return (
      <div className="space-y-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            A análise falhou: {analysis.metadata?.error || 'Erro desconhecido'}
          </AlertDescription>
        </Alert>
        <Button onClick={onBackToForm} variant="outline">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  // Calculate key metrics
  const topCompetitor = competitors[0];
  const keywordWins = keywords.filter(k => 
    k.target_domain_position && 
    k.competitor_positions.every(cp => !k.target_domain_position || cp.position > k.target_domain_position)
  ).length;
  
  const competitorWins = keywords.filter(k => 
    k.competitor_positions.some(cp => 
      !k.target_domain_position || (k.target_domain_position && cp.position < k.target_domain_position)
    )
  ).length;

  const getDomainName = (url: string) => {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  };

  const getPositionBadgeVariant = (position: number | null) => {
    if (!position) return "outline";
    if (position <= 3) return "default";
    if (position <= 10) return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Resultado da Análise Competitiva</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Domínio: <span className="font-semibold text-primary">{analysis.target_domain}</span>
        </p>
      </div>

      {/* Main Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Competitivo</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {analysis.overall_competitiveness_score}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analysis.overall_competitiveness_score >= 70 ? 'Muito competitivo' : 
               analysis.overall_competitiveness_score >= 50 ? 'Moderadamente competitivo' : 'Baixa competitividade'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suas Vitórias</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{keywordWins}</div>
            <p className="text-xs text-muted-foreground">
              de {analysis.total_keywords} palavras-chave
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concorrente Vence</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{competitorWins}</div>
            <p className="text-xs text-muted-foreground">
              oportunidades identificadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oportunidades</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{opportunities.length}</div>
            <p className="text-xs text-muted-foreground">para melhorar</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Competitor Summary */}
      {topCompetitor && (
        <Card className="bg-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              Principal Concorrente Identificado
            </CardTitle>
            <CardDescription>
              Concorrente que mais compete com você nas palavras-chave analisadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-lg font-semibold">
                  {getDomainName(topCompetitor.domain)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Posição média: {topCompetitor.average_position}ª • 
                  Share of Voice: {topCompetitor.share_of_voice}%
                </p>
              </div>
              <div className="flex gap-4">
                <Badge variant="secondary">
                  {topCompetitor.total_keywords_found} keywords encontradas
                </Badge>
                <Badge variant="default">
                  Score: {topCompetitor.relevance_score}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Keywords Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle>Análise Detalhada por Palavra-chave</CardTitle>
          <CardDescription>
            Comparação posição por posição das {keywords.length} palavras-chave analisadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Palavra-chave</TableHead>
                  <TableHead className="text-center">Sua Posição</TableHead>
                  <TableHead className="text-center">Melhor Concorrente</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keywords.slice(0, 20).map((keyword) => {
                  const bestCompetitorPos = Math.min(...keyword.competitor_positions.map(cp => cp.position));
                  const myPosition = keyword.target_domain_position;
                  const isWinning = myPosition && (bestCompetitorPos > myPosition);
                  
                  return (
                    <TableRow key={keyword.id}>
                      <TableCell className="font-medium">
                        {keyword.keyword}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getPositionBadgeVariant(myPosition)}>
                          {myPosition ? `${myPosition}ª` : "Não encontrado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getPositionBadgeVariant(bestCompetitorPos)}>
                          {bestCompetitorPos}ª
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {isWinning ? (
                          <Badge variant="default" className="gap-1">
                            <Trophy className="h-3 w-3" />
                            Vencendo
                          </Badge>
                        ) : myPosition && bestCompetitorPos < myPosition ? (
                          <Badge variant="destructive" className="gap-1">
                            <Target className="h-3 w-3" />
                            Oportunidade
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            Empate/Não ranqueado
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            {keywords.length > 20 && (
              <div className="text-center pt-4 text-sm text-muted-foreground">
                Mostrando primeiras 20 de {keywords.length} palavras-chave analisadas
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Opportunities Section */}
      {opportunities.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Target className="h-5 w-5" />
              Principais Oportunidades de Melhoria
            </CardTitle>
            <CardDescription>
              Palavras-chave onde você pode ganhar posições facilmente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {opportunities.slice(0, 6).map((opportunity) => (
                <div key={opportunity.id} className="p-4 border rounded-lg bg-white">
                  <h4 className="font-medium text-sm mb-2">{opportunity.keyword}</h4>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>Prioridade: {opportunity.priority_score}</p>
                    <p>Gap: {opportunity.gap_size} posições</p>
                    <Badge variant="outline" className="text-xs">
                      {CompetitorAnalysisService.getOpportunityTypeText(opportunity.opportunity_type)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Summary */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Eye className="h-5 w-5" />
            Próximos Passos Recomendados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Focar Imediatamente:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• {competitorWins} palavras-chave perdendo para concorrentes</li>
                <li>• {opportunities.length} oportunidades de baixa dificuldade</li>
                <li>• Analisar estratégia do concorrente principal</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Manter/Melhorar:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• {keywordWins} palavras-chave já vencendo</li>
                <li>• Score competitivo atual: {analysis.overall_competitiveness_score}%</li>
                <li>• Monitorar posições regularmente</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompetitiveResultsDisplay;