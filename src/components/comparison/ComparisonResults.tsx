import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GitCompare, Crown, TrendingUp, RotateCcw } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export interface ComparisonResult {
  keyword: string;
  results: {
    website: string;
    position: number | null;
    isWinner: boolean;
  }[];
}

interface ComparisonResultsProps {
  websites: string[];
  results: ComparisonResult[];
  onNewComparison: () => void;
}

const ComparisonResults = ({ websites, results, onNewComparison }: ComparisonResultsProps) => {
  const getPositionText = (position: number | null) => {
    if (position === null) return "Não encontrado";
    if (position <= 10) return `${position}ª posição`;
    return `${position}ª posição`;
  };

  const getPositionBadgeVariant = (position: number | null) => {
    if (position === null) return "secondary";
    if (position <= 3) return "default";
    if (position <= 10) return "secondary";
    return "outline";
  };

  const getDomainName = (url: string) => {
    try {
      return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  // Prepare chart data
  const chartData = results.map(result => {
    const dataPoint: any = { keyword: result.keyword };
    result.results.forEach(r => {
      const domain = getDomainName(r.website);
      dataPoint[domain] = r.position || 101; // Use 101 for "not found" to show at bottom
    });
    return dataPoint;
  });

  // Generate colors for domains
  const domainColors = [
    "hsl(var(--primary))",
    "hsl(var(--accent))",
    "#8884d8",
    "#82ca9d",
    "#ffc658",
  ];

  const getWinnerStats = () => {
    const stats: { [key: string]: number } = {};
    
    results.forEach(result => {
      const winner = result.results.find(r => r.isWinner);
      if (winner) {
        const domain = getDomainName(winner.website);
        stats[domain] = (stats[domain] || 0) + 1;
      }
    });

    const topDomain = Object.entries(stats).sort((a, b) => b[1] - a[1])[0];
    return { stats, topDomain };
  };

  const { stats, topDomain } = getWinnerStats();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <GitCompare className="h-8 w-8 text-primary" />
            Resultados da Comparação
          </h2>
          <p className="text-muted-foreground mt-1">
            Comparando {websites.length} sites para {results.length} palavra(s)-chave
          </p>
        </div>
        
        <Button onClick={onNewComparison} variant="outline">
          <RotateCcw className="mr-2 h-4 w-4" />
          Nova Comparação
        </Button>
      </div>

      {/* Winner Stats */}
      {topDomain && (
        <Card className="bg-gradient-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Melhor Performance Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{topDomain[0]}</p>
                <p className="text-primary-foreground/80">
                  Venceu em {topDomain[1]} de {results.length} palavras-chave
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-primary-foreground/60" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Gráfico de Comparação</CardTitle>
          <p className="text-sm text-muted-foreground">
            Posições menores são melhores (valores mais baixos no gráfico)
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="keyword" 
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis 
                  reversed 
                  domain={[1, 101]}
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Posição', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    value === 101 ? 'Não encontrado' : `${value}ª posição`,
                    name
                  ]}
                />
                <Legend />
                {websites.map((website, index) => (
                  <Bar 
                    key={website}
                    dataKey={getDomainName(website)}
                    fill={domainColors[index % domainColors.length]}
                    radius={[2, 2, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados Detalhados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Palavra-chave</TableHead>
                  {websites.map(website => (
                    <TableHead key={website} className="text-center">
                      {getDomainName(website)}
                    </TableHead>
                  ))}
                  <TableHead className="text-center">Vencedor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.keyword}>
                    <TableCell className="font-medium">
                      {result.keyword}
                    </TableCell>
                    {result.results.map((siteResult) => (
                      <TableCell key={siteResult.website} className="text-center">
                        <Badge 
                          variant={getPositionBadgeVariant(siteResult.position)}
                          className={siteResult.isWinner ? "bg-accent text-accent-foreground" : ""}
                        >
                          {getPositionText(siteResult.position)}
                        </Badge>
                      </TableCell>
                    ))}
                    <TableCell className="text-center">
                      {(() => {
                        const winner = result.results.find(r => r.isWinner);
                        return winner ? (
                          <div className="flex items-center justify-center gap-1">
                            <Crown className="h-4 w-4 text-accent" />
                            <span className="text-sm font-medium">
                              {getDomainName(winner.website)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        );
                      })()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComparisonResults;