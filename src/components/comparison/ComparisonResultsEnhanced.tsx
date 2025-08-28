import { ArrowUp, ArrowDown, Trophy, Target, TrendingUp, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { EnhancedChartContainer, CustomTooltip, CHART_COLORS, ChartGradients, formatPosition } from "@/components/ui/enhanced-chart";
import { calculateAdvancedScore, calculateOverallScore, getPositionCategory } from "@/utils/seoScoring";
import KeywordBattleMatrix from "./KeywordBattleMatrix";
import OpportunityCategories from "./OpportunityCategories";

export interface ComparisonResultEnhanced {
  keyword: string;
  results: {
    website: string;
    position: number | null;
    isWinner: boolean;
    isClient: boolean;
  }[];
}

interface ComparisonResultsEnhancedProps {
  websites: string[];
  results: ComparisonResultEnhanced[];
  projectName?: string;
  onNewComparison: () => void;
}

const ComparisonResultsEnhanced = ({ websites, results, projectName, onNewComparison }: ComparisonResultsEnhancedProps) => {
  const clientDomain = websites[0];
  const competitorDomain = websites[1];

  // Cálculo do score geral usando algoritmo aprimorado
  const calculateScore = (website: string) => {
    const websiteResults = results.map(r => r.results.find(res => res.website === website));
    const validPositions = websiteResults
      .filter(r => r?.position !== null)
      .map(r => r!.position!);
    
    return calculateOverallScore(validPositions, { useNonLinearFormula: true });
  };

  const clientScore = calculateScore(clientDomain);
  const competitorScore = calculateScore(competitorDomain);
  const scoreDifference = clientScore - competitorScore;
  
  // Estatísticas
  const clientWins = results.filter(r => 
    r.results.find(res => res.website === clientDomain)?.isWinner
  ).length;
  
  const competitorWins = results.filter(r => 
    r.results.find(res => res.website === competitorDomain)?.isWinner
  ).length;

  // Oportunidades (palavras onde o concorrente está melhor)
  const opportunities = results.filter(r => {
    const clientPos = r.results.find(res => res.website === clientDomain)?.position;
    const competitorPos = r.results.find(res => res.website === competitorDomain)?.position;
    
    if (!clientPos || !competitorPos) return false;
    return competitorPos < clientPos;
  });

  // Dados para o gráfico - CORRIGIDO para mostrar scores ao invés de posições
  const chartData = results.slice(0, 10).map(r => {
    const clientResult = r.results.find(res => res.website === clientDomain);
    const competitorResult = r.results.find(res => res.website === competitorDomain);
    
    // Calcular scores baseados nas posições (scores maiores = melhores posições)
    const clientScore = calculateAdvancedScore(clientResult?.position);
    const competitorScore = calculateAdvancedScore(competitorResult?.position);
    
    return {
      keyword: r.keyword.length > 15 ? r.keyword.substring(0, 15) + "..." : r.keyword,
      [clientDomain]: clientScore,
      [competitorDomain]: competitorScore,
      // Dados adicionais para tooltips
      clientPosition: clientResult?.position,
      competitorPosition: competitorResult?.position
    };
  });

  const getDomainName = (url: string) => {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  };

  const getPositionBadgeVariant = (position: number | null) => {
    return getPositionCategory(position).badgeVariant;
  };

  const getPositionText = (position: number | null) => {
    return position ? `${position}ª` : "Não encontrado";
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-accent";
    if (score >= 60) return "text-primary";
    return "text-destructive";
  };

  return (
    <div className="space-y-8">
      {/* Header com Score Geral */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">
            Comparação Competitiva
            {projectName && <span className="text-primary"> - {projectName}</span>}
          </h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Score do Cliente */}
          <Card className="border-primary/20">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-lg">Seu Site</CardTitle>
              <CardDescription>{getDomainName(clientDomain)}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(clientScore)}`}>
                {clientScore}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Score SEO</p>
              <Badge variant="secondary" className="mt-2">
                {clientWins} vitórias
              </Badge>
            </CardContent>
          </Card>

          {/* Comparação */}
          <Card className="border-muted">
            <CardContent className="flex items-center justify-center h-full p-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  {scoreDifference > 0 ? (
                    <ArrowUp className="h-8 w-8 text-accent" />
                  ) : scoreDifference < 0 ? (
                    <ArrowDown className="h-8 w-8 text-destructive" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      =
                    </div>
                  )}
                </div>
                <p className="font-bold text-lg">
                  {scoreDifference > 0 ? "+" : ""}{scoreDifference} pontos
                </p>
                <p className="text-sm text-muted-foreground">
                  {scoreDifference > 0 ? "Você está ganhando!" : 
                   scoreDifference < 0 ? "Precisa melhorar" : "Empatado"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Score do Concorrente */}
          <Card className="border-destructive/20">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-lg">Concorrente</CardTitle>
              <CardDescription>{getDomainName(competitorDomain)}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(competitorScore)}`}>
                {competitorScore}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Score SEO</p>
              <Badge variant="secondary" className="mt-2">
                {competitorWins} vitórias
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Gráfico de Comparação - CORRIGIDO */}
      <EnhancedChartContainer
        title="Scores SEO por Palavra-chave (Top 10)"
        description="Quanto maior a barra, melhor o desempenho (score baseado na posição no Google)"
        icon={<Target className="h-5 w-5" />}
        badge={{
          text: `${clientWins}/${results.length} vitórias`,
          variant: clientWins > competitorWins ? "default" : "destructive"
        }}
        height={400}
      >
        <BarChart 
          data={chartData} 
          margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
        >
          <ChartGradients />
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
          <XAxis 
            dataKey="keyword" 
            angle={-45}
            textAnchor="end"
            height={90}
            fontSize={11}
            stroke="hsl(var(--muted-foreground))"
          />
          <YAxis 
            domain={[0, 100]}
            tickFormatter={(value) => `${value}`}
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            label={{ value: 'Score SEO', angle: -90, position: 'insideLeft' }}
          />
          <CustomTooltip 
            formatter={(value: number, name: string, props: any) => {
              const data = chartData.find(d => d.keyword === props.payload.keyword);
              const isClient = name === clientDomain;
              const position = isClient ? data?.clientPosition : data?.competitorPosition;
              
              return [
                `Score: ${value.toFixed(1)} | Posição: ${position ? `${position}ª` : 'Não ranqueia'}`,
                isClient ? "Seu site" : "Concorrente"
              ];
            }}
            labelFormatter={(label) => `Palavra: ${label}`}
          />
          <Bar 
            dataKey={clientDomain} 
            fill="url(#primaryGradient)"
            name="Seu site"
            radius={[6, 6, 0, 0]}
            animationDuration={800}
            animationBegin={0}
          />
          <Bar 
            dataKey={competitorDomain} 
            fill="url(#destructiveGradient)"
            name="Concorrente"
            radius={[6, 6, 0, 0]}
            animationDuration={800}
            animationBegin={200}
          />
        </BarChart>
      </EnhancedChartContainer>

      {/* Matriz de Batalha de Keywords */}
      <KeywordBattleMatrix results={results} websites={websites} />

      {/* Análise Estratégica de Oportunidades */}
      <OpportunityCategories results={results} websites={websites} />

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados Detalhados</CardTitle>
          <CardDescription>
            Posição de cada palavra-chave nos resultados de busca
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Palavra-chave</TableHead>
                <TableHead className="text-center">
                  {getDomainName(clientDomain)}
                  <br />
                  <span className="text-xs text-muted-foreground">(Seu site)</span>
                </TableHead>
                <TableHead className="text-center">
                  {getDomainName(competitorDomain)}
                  <br />
                  <span className="text-xs text-muted-foreground">(Concorrente)</span>
                </TableHead>
                <TableHead className="text-center">Vencedor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => {
                const clientResult = result.results.find(r => r.website === clientDomain);
                const competitorResult = result.results.find(r => r.website === competitorDomain);
                const winner = result.results.find(r => r.isWinner);
                
                return (
                  <TableRow key={result.keyword}>
                    <TableCell className="font-medium">{result.keyword}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getPositionBadgeVariant(clientResult?.position)}>
                        {getPositionText(clientResult?.position)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getPositionBadgeVariant(competitorResult?.position)}>
                        {getPositionText(competitorResult?.position)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {winner && (
                        <Badge variant={winner.website === clientDomain ? "default" : "destructive"}>
                          {winner.website === clientDomain ? "Você" : "Concorrente"}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button variant="outline" onClick={onNewComparison} className="gap-2">
          <TrendingUp className="h-4 w-4" />
          Nova Comparação
        </Button>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Relatório
        </Button>
      </div>
    </div>
  );
};

export default ComparisonResultsEnhanced;