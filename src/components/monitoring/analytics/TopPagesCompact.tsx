import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import { PageMetrics } from '@/services/keywordMetricsService';
import { Button } from '@/components/ui/button';

interface TopPagesCompactProps {
  data: PageMetrics[];
  isLoading?: boolean;
}

export const TopPagesCompact = ({ data, isLoading = false }: TopPagesCompactProps) => {
  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname === '/' ? urlObj.hostname : urlObj.pathname;
    } catch {
      return url;
    }
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm">URLs Mais Acessadas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="border rounded-lg p-3 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm">URLs Mais Acessadas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma URL encontrada
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm">URLs Mais Acessadas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.slice(0, 5).map((page, index) => (
          <div
            key={index}
            className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="font-medium text-sm truncate flex-1" title={page.url}>
                {formatUrl(page.url)}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => window.open(page.url, '_blank')}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {page.totalKeywords} KW
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {page.estimatedTraffic.toLocaleString()} visitas
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                {page.improvements > 0 && (
                  <div className="flex items-center gap-0.5">
                    <ArrowUp className="h-3 w-3 text-emerald-500" />
                    <span className="text-xs text-emerald-500 font-medium">
                      {page.improvements}
                    </span>
                  </div>
                )}
                {page.declines > 0 && (
                  <div className="flex items-center gap-0.5">
                    <ArrowDown className="h-3 w-3 text-orange-500" />
                    <span className="text-xs text-orange-500 font-medium">
                      {page.declines}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {page.topKeywords.length > 0 && (
              <div className="mt-2 pt-2 border-t">
                <div className="text-xs text-muted-foreground mb-1">Top keywords:</div>
                <div className="flex flex-wrap gap-1">
                  {page.topKeywords.map((keyword, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};