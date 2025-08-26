import { useState, useEffect } from "react";
import { ArrowUp, ArrowDown, Trophy, Target, TrendingUp, Download, AlertTriangle, Users, Search, BarChart3, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { CompetitorAnalysisService, CompetitiveAnalysisData } from "@/services/competitorAnalysisService";

interface CompetitiveAnalysisResultsProps {
  analysisId: string;
  onBackToForm: () => void;
}

const CompetitiveAnalysisResults = ({ analysisId, onBackToForm }: CompetitiveAnalysisResultsProps) => {
  const [analysisData, setAnalysisData] = useState<CompetitiveAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalysisData();
    
    // Poll for updates if analysis is still running - more frequent polling for better UX
    const pollInterval = setInterval(() => {
      if (analysisData?.analysis.status === 'analyzing' || analysisData?.analysis.status === 'pending') {
        loadAnalysisData();
      }
    }, 2000); // Reduced from 5000ms to 2000ms for more responsive updates

    return () => clearInterval(pollInterval);
  }, [analysisId]);

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
          <h2 className="text-2xl font-bold">Carregando Análise Competitiva...</h2>
          <p className="text-muted-foreground">Aguarde enquanto coletamos os dados</p>
        </div>
      </div>
    );
  }

  if (error || !analysisData) {
    return (
      <div className="space-y-8">
        <Alert>
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
    // Calculate progress based on metadata
    const metadata = analysis.metadata || {};
    const totalKeywords = metadata.total_keywords || 0;
    const processedKeywords = metadata.processed_keywords || 0;
    const progressPercentage = totalKeywords > 0 ? Math.round((processedKeywords / totalKeywords) * 100) : 30;
    const stage = metadata.stage || 'initializing';
    
    // Get stage description
    const getStageDescription = (stage: string) => {
      switch (stage) {
        case 'keyword_analysis':
          return `Analisando palavras-chave (${processedKeywords}/${totalKeywords})`;
        case 'competitor_analysis':
          return 'Identificando concorrentes...';
        case 'opportunity_analysis':
          return 'Identificando oportunidades...';
        case 'finalizing':
          return 'Finalizando análise...';
        default:
          return 'Iniciando análise...';
      }
    };

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
              {getStageDescription(stage)}
            </p>
            {totalKeywords > 0 && (
              <p className="text-xs text-muted-foreground">
                Progresso: {progressPercentage}% completo
              </p>
            )}
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

  // Prepare data for charts
  const topCompetitors = competitors.slice(0, 5);
  const topKeywords = keywords.slice(0, 10);
  const topOpportunities = opportunities.slice(0, 10);

  const competitorShareData = topCompetitors.map(competitor => ({
    name: CompetitorAnalysisService.formatDomainName(competitor.domain),
    value: competitor.share_of_voice,
    keywords: competitor.total_keywords_found
  }));

  const keywordPositionsData = topKeywords.map(keyword => {
    const targetPosition = keyword.target_domain_position || 100;
    const bestCompetitorPosition = Math.min(...keyword.competitor_positions.map(p => p.position));
    
    return {
      keyword: keyword.keyword.length > 15 ? keyword.keyword.substring(0, 15) + "..." : keyword.keyword,
      'Seu Site': targetPosition,
      'Melhor Concorrente': bestCompetitorPosition,
      fullKeyword: keyword.keyword
    };
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">
            Análise Competitiva Real
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Domínio: <span className="font-semibold text-primary">{analysis.target_domain}</span>
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Competitivo</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Palavras-chave</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis.total_keywords}</div>
            <p className="text-xs text-muted-foreground">Analisadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concorrentes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis.total_competitors}</div>
            <p className="text-xs text-muted-foreground">Identificados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oportunidades</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{opportunities.length}</div>
            <p className="text-xs text-muted-foreground">Identificadas</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="competitors">Concorrentes</TabsTrigger>
          <TabsTrigger value="keywords">Palavras-chave</TabsTrigger>
          <TabsTrigger value="opportunities">Oportunidades</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Share of Voice Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Share of Voice</CardTitle>
                <CardDescription>Participação de cada domínio nas palavras-chave analisadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={competitorShareData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {competitorShareData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Keyword Positions Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Comparação de Posições</CardTitle>
                <CardDescription>Suas posições vs melhor concorrente (top 10 keywords)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={keywordPositionsData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="keyword" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={11}
                      />
                      <YAxis 
                        reversed
                        domain={[1, 100]}
                        tickFormatter={(value) => `${value}ª`}
                      />
                      <Tooltip 
                        formatter={(value: number, name: string, props: any) => [
                          `${value}ª posição`,
                          name
                        ]}
                        labelFormatter={(label) => `Palavra: ${keywordPositionsData.find(k => k.keyword === label)?.fullKeyword || label}`}
                      />
                      <Bar 
                        dataKey="Seu Site" 
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="Melhor Concorrente" 
                        fill="hsl(var(--destructive))" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="competitors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Concorrentes Identificados</CardTitle>
              <CardDescription>
                Domínios que competem com você nas mesmas palavras-chave
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domínio</TableHead>
                    <TableHead className="text-center">Score de Relevância</TableHead>
                    <TableHead className="text-center">Keywords Encontradas</TableHead>
                    <TableHead className="text-center">Posição Média</TableHead>
                    <TableHead className="text-center">Share of Voice</TableHead>
                    <TableHead className="text-center">Detecção</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competitors.map((competitor, index) => (
                    <TableRow key={competitor.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {index < 3 && <Trophy className="h-4 w-4 text-amber-500" />}
                          {CompetitorAnalysisService.formatDomainName(competitor.domain)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{competitor.relevance_score}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{competitor.total_keywords_found}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={competitor.average_position <= 5 ? "default" : "secondary"}>
                          {competitor.average_position}ª
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{competitor.share_of_voice}%</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={competitor.detected_automatically ? "default" : "outline"}>
                          {competitor.detected_automatically ? "Automática" : "Manual"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Palavras-chave</CardTitle>
              <CardDescription>
                Posições encontradas para cada palavra-chave analisada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Palavra-chave</TableHead>
                    <TableHead className="text-center">Sua Posição</TableHead>
                    <TableHead className="text-center">Melhor Concorrente</TableHead>
                    <TableHead className="text-center">Competição</TableHead>
                    <TableHead className="text-center">Total Concorrentes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keywords.map((keyword) => {
                    const bestCompetitor = keyword.competitor_positions.reduce((best, current) => 
                      current.position < best.position ? current : best
                    );
                    
                    return (
                      <TableRow key={keyword.id}>
                        <TableCell className="font-medium">{keyword.keyword}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={CompetitorAnalysisService.getPositionBadgeVariant(keyword.target_domain_position)}>
                            {CompetitorAnalysisService.getPositionText(keyword.target_domain_position)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="text-sm">
                            <Badge variant="outline" className="mb-1">
                              {bestCompetitor.position}ª
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              {CompetitorAnalysisService.formatDomainName(bestCompetitor.domain)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant="secondary" 
                            className={CompetitorAnalysisService.getCompetitionLevelColor(keyword.competition_level)}
                          >
                            {keyword.competition_level === 'low' ? 'Baixa' : 
                             keyword.competition_level === 'medium' ? 'Média' : 'Alta'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{keyword.competitor_positions.length}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Oportunidades de Melhoria</CardTitle>
              <CardDescription>
                Palavras-chave priorizadas onde você pode melhorar seu posicionamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topOpportunities.map((opportunity, index) => (
                  <div key={opportunity.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <span className="font-semibold">{opportunity.keyword}</span>
                          <Badge variant="secondary">
                            Score: {opportunity.priority_score}
                          </Badge>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {CompetitorAnalysisService.getOpportunityTypeText(opportunity.opportunity_type)}
                        </Badge>
                      </div>
                      <div className="text-right text-sm">
                        {opportunity.target_position && (
                          <div>Sua posição: <span className="font-semibold">{opportunity.target_position}ª</span></div>
                        )}
                        <div>Concorrente: <span className="font-semibold">{opportunity.best_competitor_position}ª</span></div>
                        <div className="text-xs text-muted-foreground">
                          {CompetitorAnalysisService.formatDomainName(opportunity.best_competitor_domain)}
                        </div>
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded p-3">
                      <p className="text-sm">{opportunity.recommended_action}</p>
                    </div>
                    {opportunity.gap_size > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <ArrowUp className="h-4 w-4 text-amber-600" />
                        <span>Gap de {opportunity.gap_size} posições para melhorar</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button variant="outline" onClick={onBackToForm} className="gap-2">
          <TrendingUp className="h-4 w-4" />
          Nova Análise
        </Button>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Relatório
        </Button>
      </div>
    </div>
  );
};

export default CompetitiveAnalysisResults;