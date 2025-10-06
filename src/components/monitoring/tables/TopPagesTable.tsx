import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, ExternalLink, FileText } from "lucide-react";
import { PageMetrics } from "@/services/keywordMetricsService";
import { Button } from "@/components/ui/button";

interface TopPagesTableProps {
  data: PageMetrics[];
  isLoading?: boolean;
}

export const TopPagesTable = ({ data, isLoading = false }: TopPagesTableProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3 mb-2 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Principais Páginas
          </CardTitle>
          <CardDescription>
            Páginas com melhor desempenho em rankings de palavras-chave
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma página encontrada com dados de ranking
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    } catch {
      return url;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Principais Páginas
        </CardTitle>
        <CardDescription>
          Top {data.length} páginas com melhor desempenho em rankings de palavras-chave
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">URL</TableHead>
                <TableHead className="text-center">Palavras-chave</TableHead>
                <TableHead className="text-center">Posição Média</TableHead>
                <TableHead className="text-center">Tráfego Est.</TableHead>
                <TableHead className="text-center">Alterações</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice(0, 10).map((page, index) => (
                <TableRow key={index} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-sm truncate max-w-md" title={page.url}>
                        {formatUrl(page.url)}
                      </div>
                      {page.topKeywords.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {page.topKeywords.map((kw, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{page.totalKeywords}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant={page.avgPosition <= 10 ? 'default' : 'outline'}
                      className="font-mono"
                    >
                      {page.avgPosition.toFixed(1)}º
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {page.estimatedTraffic.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {page.improvements > 0 && (
                        <div className="flex items-center gap-1 text-chart-1">
                          <ArrowUp className="h-3 w-3" />
                          <span className="text-xs font-medium">{page.improvements}</span>
                        </div>
                      )}
                      {page.declines > 0 && (
                        <div className="flex items-center gap-1 text-destructive">
                          <ArrowDown className="h-3 w-3" />
                          <span className="text-xs font-medium">{page.declines}</span>
                        </div>
                      )}
                      {page.improvements === 0 && page.declines === 0 && (
                        <span className="text-xs text-muted-foreground">Sem alterações</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(page.url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
