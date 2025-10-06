import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowUp, 
  ArrowDown, 
  Minus, 
  Search, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  TrendingUp
} from "lucide-react";
import { KeywordDetail } from "@/services/keywordMetricsService";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface KeywordDetailsTableProps {
  data: KeywordDetail[];
  isLoading?: boolean;
  onLoadHistory?: (keywordId: string) => Promise<{ date: string; position: number }[]>;
}

export const KeywordDetailsTable = ({ data, isLoading = false, onLoadHistory }: KeywordDetailsTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<'keyword' | 'currentPosition' | 'change' | 'estimatedTraffic'>('currentPosition');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [historyData, setHistoryData] = useState<Map<string, { date: string; position: number }[]>>(new Map());

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3 mb-2 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-14 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredData = data.filter(item =>
    item.keyword.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = a[sortField] ?? (sortField === 'currentPosition' ? 999 : 0);
    const bValue = b[sortField] ?? (sortField === 'currentPosition' ? 999 : 0);
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleRow = async (keywordId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(keywordId)) {
      newExpanded.delete(keywordId);
    } else {
      newExpanded.add(keywordId);
      // Load history if not already loaded
      if (!historyData.has(keywordId) && onLoadHistory) {
        const history = await onLoadHistory(keywordId);
        setHistoryData(new Map(historyData.set(keywordId, history)));
      }
    }
    setExpandedRows(newExpanded);
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="h-4 w-4 text-chart-1" />;
    if (change < 0) return <ArrowDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getChangeBadge = (change: number) => {
    if (change > 0) {
      return <Badge variant="default" className="bg-chart-1">+{change}</Badge>;
    }
    if (change < 0) {
      return <Badge variant="destructive">{change}</Badge>;
    }
    return <Badge variant="outline">0</Badge>;
  };

  const formatUrl = (url: string | null) => {
    if (!url) return 'N/A';
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      return url;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Palavras-chave Detalhadas
        </CardTitle>
        <CardDescription>
          Lista completa de palavras-chave monitoradas com histórico de posições
        </CardDescription>
        
        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar palavra-chave..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('keyword')}
                >
                  <div className="flex items-center gap-2">
                    Palavra-chave
                    {sortField === 'keyword' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="text-center cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('currentPosition')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Posição Atual
                    {sortField === 'currentPosition' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-center">Posição Anterior</TableHead>
                <TableHead 
                  className="text-center cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('change')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Variação
                    {sortField === 'change' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="text-center cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('estimatedTraffic')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Tráfego Est.
                    {sortField === 'estimatedTraffic' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead>URL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'Nenhuma palavra-chave encontrada' : 'Nenhuma palavra-chave monitorada'}
                  </TableCell>
                </TableRow>
              ) : (
                sortedData.map((keyword) => {
                  const isExpanded = expandedRows.has(keyword.id);
                  const history = historyData.get(keyword.id) || [];
                  
                  return (
                    <Collapsible key={keyword.id} open={isExpanded}>
                      <TableRow className="hover:bg-muted/50">
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRow(keyword.id)}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell className="font-medium">{keyword.keyword}</TableCell>
                        <TableCell className="text-center">
                          {keyword.currentPosition ? (
                            <Badge 
                              variant={keyword.currentPosition <= 10 ? 'default' : 'outline'}
                              className="font-mono"
                            >
                              {keyword.currentPosition}º
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {keyword.previousPosition ? (
                            <span className="text-muted-foreground font-mono text-sm">
                              {keyword.previousPosition}º
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            {getChangeIcon(keyword.change)}
                            {getChangeBadge(keyword.change)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {keyword.estimatedTraffic.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground truncate max-w-[200px]" title={keyword.url || undefined}>
                              {formatUrl(keyword.url)}
                            </span>
                            {keyword.url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(keyword.url!, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      <CollapsibleContent asChild>
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/20 p-6">
                            <div className="space-y-4">
                              <h4 className="font-semibold text-sm">Histórico de Posições (últimos 30 dias)</h4>
                              {history.length > 0 ? (
                                <ResponsiveContainer width="100%" height={200}>
                                  <LineChart data={history}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis 
                                      dataKey="date" 
                                      tickFormatter={(date) => new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                      className="text-xs"
                                    />
                                    <YAxis 
                                      reversed 
                                      domain={[1, 100]}
                                      className="text-xs"
                                    />
                                    <Tooltip 
                                      labelFormatter={(date) => new Date(date).toLocaleDateString('pt-BR')}
                                      formatter={(value: any) => [`${value}º`, 'Posição']}
                                    />
                                    <Line 
                                      type="monotone" 
                                      dataKey="position" 
                                      stroke="hsl(var(--primary))" 
                                      strokeWidth={2}
                                      dot={{ fill: 'hsl(var(--primary))' }}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              ) : (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                  Carregando histórico...
                                </div>
                              )}
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                                <div>
                                  <p className="text-xs text-muted-foreground">Motor de Busca</p>
                                  <p className="font-medium">{keyword.searchEngine}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Localização</p>
                                  <p className="font-medium">{keyword.location}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Dispositivo</p>
                                  <p className="font-medium">{keyword.device}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Última Atualização</p>
                                  <p className="font-medium text-sm">
                                    {new Date(keyword.lastUpdated).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        
        {sortedData.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Mostrando {sortedData.length} de {data.length} palavras-chave
          </div>
        )}
      </CardContent>
    </Card>
  );
};
