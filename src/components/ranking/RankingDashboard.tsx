import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProject } from "@/hooks/useProject";
import { useToast } from "@/components/ui/use-toast";
import { RankingService, KeywordRanking, KeywordSuggestion, RankingAlert } from "@/services/rankingService";
import { RankingMonitor } from "./RankingMonitor";
import { KeywordSuggestions } from "./KeywordSuggestions";
import { RankingAlerts } from "./RankingAlerts";
import { TrendingUp, Search, AlertCircle, Target, RefreshCw } from "lucide-react";

export const RankingDashboard = () => {
  const { activeProject } = useProject();
  const { toast } = useToast();
  
  const [rankings, setRankings] = useState<KeywordRanking[]>([]);
  const [suggestions, setSuggestions] = useState<KeywordSuggestion[]>([]);
  const [alerts, setAlerts] = useState<RankingAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (activeProject) {
      loadDashboardData();
    }
  }, [activeProject]);

  const loadDashboardData = async () => {
    if (!activeProject) return;
    
    setIsLoading(true);
    try {
      const [rankingsResult, suggestionsResult, alertsResult] = await Promise.all([
        RankingService.getProjectRankings(activeProject.id),
        RankingService.getKeywordSuggestions(activeProject.id),
        RankingService.getProjectAlerts(activeProject.id)
      ]);

      if (rankingsResult.success) setRankings(rankingsResult.rankings || []);
      if (suggestionsResult.success) setSuggestions(suggestionsResult.suggestions || []);
      if (alertsResult.success) setAlerts(alertsResult.alerts || []);

    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar dados do dashboard",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSuggestions = async () => {
    if (!activeProject) return;
    
    setIsRefreshing(true);
    try {
      const result = await RankingService.generateSemanticSuggestions(
        activeProject.id,
        activeProject.focus_keywords || [],
      );
      
      if (result.success) {
        toast({
          title: "Sugestões Geradas",
          description: `${result.suggestionsCount} novas sugestões de keywords foram criadas`
        });
        loadDashboardData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao gerar sugestões de keywords",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const getMetricsData = () => {
    const totalKeywords = rankings.length;
    const topPositions = rankings.filter(r => r.current_position && r.current_position <= 10).length;
    const improvements = rankings.filter(r => 
      r.current_position && r.previous_position && 
      r.current_position < r.previous_position
    ).length;
    const declines = rankings.filter(r => 
      r.current_position && r.previous_position && 
      r.current_position > r.previous_position
    ).length;

    return { totalKeywords, topPositions, improvements, declines };
  };

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum Projeto Ativo</h3>
          <p className="text-muted-foreground">
            Selecione um projeto para visualizar o monitoramento de rankings
          </p>
        </div>
      </div>
    );
  }

  const metrics = getMetricsData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Monitoramento de Rankings</h2>
          <p className="text-muted-foreground">
            Projeto: <span className="font-medium">{activeProject.name}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateSuggestions}
            disabled={isRefreshing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Gerar Sugestões
          </Button>
          <Button
            onClick={loadDashboardData}
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Keywords Monitoradas</p>
                <p className="text-2xl font-bold">{metrics.totalKeywords}</p>
              </div>
              <Search className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Top 10 Posições</p>
                <p className="text-2xl font-bold text-green-600">{metrics.topPositions}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Melhorias</p>
                <p className="text-2xl font-bold text-blue-600">{metrics.improvements}</p>
              </div>
              <div className="text-blue-600">↗</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alertas Ativos</p>
                <p className="text-2xl font-bold text-red-600">{alerts.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="monitor" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monitor">Monitoramento</TabsTrigger>
          <TabsTrigger value="suggestions">
            Sugestões 
            {suggestions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {suggestions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="alerts">
            Alertas
            {alerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {alerts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitor">
          <RankingMonitor
            rankings={rankings}
            projectId={activeProject.id}
            onRankingsUpdate={loadDashboardData}
          />
        </TabsContent>

        <TabsContent value="suggestions">
          <KeywordSuggestions
            suggestions={suggestions}
            projectId={activeProject.id}
            onSuggestionsUpdate={loadDashboardData}
          />
        </TabsContent>

        <TabsContent value="alerts">
          <RankingAlerts
            alerts={alerts}
            projectId={activeProject.id}
            onAlertsUpdate={loadDashboardData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};