import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  Trash2, 
  Globe, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  RotateCcw 
} from "lucide-react";
import { MonitoredSite, useMonitoring } from "@/contexts/MonitoringContext";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MonitoringCardProps {
  site: MonitoredSite;
}

const MonitoringCard = ({ site }: MonitoringCardProps) => {
  const { toggleSiteStatus, removeSite, runCheck, getSiteHistory, isLoading } = useMonitoring();

  const getDomainName = (url: string) => {
    try {
      return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const getAveragePosition = () => {
    const history = getSiteHistory(site.id);
    const recentHistory = history.slice(0, site.keywords.length); // Get most recent check for all keywords
    
    if (recentHistory.length === 0) return null;
    
    const validPositions = recentHistory.filter(h => h.position !== null);
    if (validPositions.length === 0) return null;
    
    const sum = validPositions.reduce((acc, h) => acc + h.position!, 0);
    return Math.round(sum / validPositions.length);
  };

  const getTrendData = () => {
    const trends: { [keyword: string]: 'up' | 'down' | 'stable' | 'new' } = {};
    
    site.keywords.forEach(keyword => {
      const keywordHistory = getSiteHistory(site.id, keyword).slice(0, 2);
      
      if (keywordHistory.length < 2) {
        trends[keyword] = 'new';
      } else {
        const [current, previous] = keywordHistory;
        if (current.position === null || previous.position === null) {
          trends[keyword] = 'stable';
        } else if (current.position < previous.position) {
          trends[keyword] = 'up';
        } else if (current.position > previous.position) {
          trends[keyword] = 'down';
        } else {
          trends[keyword] = 'stable';
        }
      }
    });
    
    return trends;
  };

  const averagePosition = getAveragePosition();
  const trends = getTrendData();
  const trendCounts = {
    up: Object.values(trends).filter(t => t === 'up').length,
    down: Object.values(trends).filter(t => t === 'down').length,
    stable: Object.values(trends).filter(t => t === 'stable').length,
    new: Object.values(trends).filter(t => t === 'new').length,
  };

  return (
    <Card className="shadow-card hover:shadow-elegant transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              {getDomainName(site.website)}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {site.keywords.length} palavra(s)-chave
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <Badge 
              variant={site.status === 'active' ? 'default' : 'secondary'}
              className={site.status === 'active' ? 'bg-accent text-accent-foreground' : ''}
            >
              {site.status === 'active' ? 'Ativo' : 'Pausado'}
            </Badge>
            
            {averagePosition && (
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{averagePosition}º</p>
                <p className="text-xs text-muted-foreground">Posição média</p>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Trend Summary */}
          {(trendCounts.up > 0 || trendCounts.down > 0) && (
            <div className="flex gap-4 text-sm">
              {trendCounts.up > 0 && (
                <div className="flex items-center gap-1 text-accent">
                  <TrendingUp className="h-4 w-4" />
                  <span>{trendCounts.up} melhoraram</span>
                </div>
              )}
              {trendCounts.down > 0 && (
                <div className="flex items-center gap-1 text-destructive">
                  <TrendingDown className="h-4 w-4" />
                  <span>{trendCounts.down} pioraram</span>
                </div>
              )}
              {trendCounts.stable > 0 && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Minus className="h-4 w-4" />
                  <span>{trendCounts.stable} estáveis</span>
                </div>
              )}
            </div>
          )}
          
          {/* Last Check Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {site.lastCheck ? (
              <span>
                Última verificação: {formatDistanceToNow(site.lastCheck, { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </span>
            ) : (
              <span>Nunca verificado</span>
            )}
          </div>
          
          {/* Keywords Preview */}
          <div>
            <p className="text-sm font-medium mb-2">Palavras-chave:</p>
            <div className="flex flex-wrap gap-1">
              {site.keywords.slice(0, 3).map(keyword => (
                <Badge key={keyword} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
              {site.keywords.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{site.keywords.length - 3} mais
                </Badge>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={() => runCheck(site.id)}
              disabled={isLoading || site.status === 'paused'}
              className="flex-1"
            >
              {isLoading ? (
                "Verificando..."
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Verificar Agora
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleSiteStatus(site.id)}
            >
              {site.status === 'active' ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => removeSite(site.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonitoringCard;