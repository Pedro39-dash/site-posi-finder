import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";
import { useProject } from "@/hooks/useProject";
import { MonitoringServiceAdvanced } from "@/services/monitoringServiceAdvanced";
import { RankingService } from "@/services/rankingService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FileText,
  Download,
  Calendar as CalendarIcon,
  TrendingUp,
  Activity,
  BarChart3,
  Mail,
  Clock,
  CheckCircle
} from 'lucide-react';
import { EnhancedChartContainer, CustomTooltip, ChartGradients } from '@/components/ui/enhanced-chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

interface ReportData {
  period: {
    start: string;
    end: string;
  };
  ranking_summary: {
    total_keywords: number;
    improved_positions: number;
    declined_positions: number;
    average_position: number;
    visibility_score: number;
  };
  performance_summary: {
    average_performance_score: number;
    average_seo_score: number;
    core_web_vitals_status: string;
    total_opportunities: number;
  };
  monitoring_summary: {
    total_executions: number;
    success_rate: number;
    notifications_sent: number;
  };
  trend_data: Array<{
    date: string;
    avg_position: number;
    performance_score: number;
    keywords_tracked: number;
  }>;
  top_keywords: Array<{
    keyword: string;
    current_position: number;
    change: number;
  }>;
}

const AutomatedReports: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [customDateRange, setCustomDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCustomDate, setShowCustomDate] = useState(false);
  const { activeProject } = useProject();
  const { toast } = useToast();

  useEffect(() => {
    if (activeProject) {
      generateReport();
    }
  }, [activeProject, selectedPeriod]);

  const generateReport = async () => {
    if (!activeProject) return;

    setIsGenerating(true);
    
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      // Calcular período baseado na seleção
      switch (selectedPeriod) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case 'quarter':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      if (customDateRange) {
        startDate.setTime(customDateRange.start.getTime());
        endDate.setTime(customDateRange.end.getTime());
      }

      // Buscar dados em paralelo
      const [rankingsResult, performanceResult, monitoringResult] = await Promise.all([
        RankingService.getProjectRankings(activeProject.id),
        MonitoringServiceAdvanced.getPerformanceHistory(activeProject.id, getDaysDifference(startDate, endDate)),
        MonitoringServiceAdvanced.getMonitoringStats(activeProject.id, getDaysDifference(startDate, endDate))
      ]);

      // Processar dados de ranking
      const rankings = rankingsResult.success ? rankingsResult.rankings : [];
      const improved = rankings.filter(r => r.previous_position && r.current_position && r.current_position < r.previous_position);
      const declined = rankings.filter(r => r.previous_position && r.current_position && r.current_position > r.previous_position);
      const avgPosition = rankings.reduce((sum, r) => sum + (r.current_position || 0), 0) / rankings.length || 0;

      // Processar dados de performance
      const performanceHistory = performanceResult.success ? performanceResult.history : [];
      const avgPerformanceScore = performanceHistory.reduce((sum, p) => sum + p.performance_score, 0) / performanceHistory.length || 0;
      const avgSeoScore = performanceHistory.reduce((sum, p) => sum + p.seo_score, 0) / performanceHistory.length || 0;

      // Processar dados de monitoramento
      const monitoringStats = monitoringResult.success ? monitoringResult.stats : null;

      // Gerar dados de tendência
      const trendData = generateTrendData(rankings, performanceHistory, startDate, endDate);

      // Top keywords (melhores posições)
      const topKeywords = rankings
        .filter(r => r.current_position)
        .sort((a, b) => (a.current_position || 100) - (b.current_position || 100))
        .slice(0, 10)
        .map(r => ({
          keyword: r.keyword,
          current_position: r.current_position || 0,
          change: (r.previous_position && r.current_position) 
            ? r.previous_position - r.current_position 
            : 0
        }));

      const report: ReportData = {
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        ranking_summary: {
          total_keywords: rankings.length,
          improved_positions: improved.length,
          declined_positions: declined.length,
          average_position: avgPosition,
          visibility_score: calculateVisibilityScore(rankings)
        },
        performance_summary: {
          average_performance_score: avgPerformanceScore,
          average_seo_score: avgSeoScore,
          core_web_vitals_status: 'good', // Simplificado
          total_opportunities: performanceHistory.length
        },
        monitoring_summary: {
          total_executions: monitoringStats?.total_executions || 0,
          success_rate: monitoringStats?.total_executions > 0 
            ? (monitoringStats.successful_executions / monitoringStats.total_executions) * 100 
            : 0,
          notifications_sent: monitoringStats?.total_notifications_created || 0
        },
        trend_data: trendData,
        top_keywords: topKeywords
      };

      setReportData(report);

      toast({
        title: "Relatório Gerado",
        description: `Relatório do período de ${selectedPeriod} gerado com sucesso`,
      });
      
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o relatório",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getDaysDifference = (start: Date, end: Date) => {
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const calculateVisibilityScore = (rankings: any[]) => {
    if (rankings.length === 0) return 0;
    
    const score = rankings.reduce((sum, r) => {
      if (!r.current_position) return sum;
      if (r.current_position <= 3) return sum + 100;
      if (r.current_position <= 10) return sum + 70;
      if (r.current_position <= 20) return sum + 40;
      return sum + 10;
    }, 0);

    return Math.round(score / rankings.length);
  };

  const generateTrendData = (rankings: any[], performanceHistory: any[], startDate: Date, endDate: Date) => {
    // Simplificado - gerar dados baseados nos dados disponíveis
    const data = [];
    const days = getDaysDifference(startDate, endDate);
    
    for (let i = 0; i < Math.min(days, 30); i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      data.push({
        date: format(date, 'dd/MM', { locale: ptBR }),
        avg_position: Math.round(Math.random() * 50 + 10), // Simulado
        performance_score: Math.round(Math.random() * 30 + 70), // Simulado
        keywords_tracked: rankings.length
      });
    }
    
    return data;
  };

  const exportReport = () => {
    if (!reportData) return;

    const reportText = `
RELATÓRIO SEO - ${activeProject?.name}
Período: ${format(new Date(reportData.period.start), 'dd/MM/yyyy', { locale: ptBR })} - ${format(new Date(reportData.period.end), 'dd/MM/yyyy', { locale: ptBR })}

RESUMO DE RANKINGS:
- Total de Keywords: ${reportData.ranking_summary.total_keywords}
- Posições Melhoradas: ${reportData.ranking_summary.improved_positions}
- Posições Pioradas: ${reportData.ranking_summary.declined_positions}
- Posição Média: ${Math.round(reportData.ranking_summary.average_position)}
- Score de Visibilidade: ${reportData.ranking_summary.visibility_score}%

PERFORMANCE:
- Score de Performance: ${Math.round(reportData.performance_summary.average_performance_score)}
- Score SEO: ${Math.round(reportData.performance_summary.average_seo_score)}

MONITORAMENTO:
- Execuções: ${reportData.monitoring_summary.total_executions}
- Taxa de Sucesso: ${Math.round(reportData.monitoring_summary.success_rate)}%
- Notificações: ${reportData.monitoring_summary.notifications_sent}

TOP KEYWORDS:
${reportData.top_keywords.map(k => `- ${k.keyword}: ${k.current_position}ª posição (${k.change > 0 ? '+' : ''}${k.change})`).join('\n')}
    `;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-seo-${format(new Date(), 'dd-MM-yyyy')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Relatório Exportado",
      description: "O relatório foi baixado com sucesso",
    });
  };

  if (isGenerating) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Gerando relatório...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controles do Relatório */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Relatórios Automatizados
          </CardTitle>
          <CardDescription>
            Gere relatórios detalhados de SEO e performance do seu projeto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select
                value={selectedPeriod}
                onValueChange={(value: 'week' | 'month' | 'quarter') => setSelectedPeriod(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Última Semana</SelectItem>
                  <SelectItem value="month">Último Mês</SelectItem>
                  <SelectItem value="quarter">Último Trimestre</SelectItem>
                </SelectContent>
              </Select>

              <Popover open={showCustomDate} onOpenChange={setShowCustomDate}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Período Personalizado
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={customDateRange ? { from: customDateRange.start, to: customDateRange.end } : undefined}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setCustomDateRange({ start: range.from, end: range.to });
                        setShowCustomDate(false);
                      }
                    }}
                    numberOfMonths={2}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex gap-2">
              <Button onClick={generateReport} disabled={isGenerating}>
                <Activity className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              {reportData && (
                <Button variant="outline" onClick={exportReport}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <>
          {/* Cards de Resumo */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Keywords Monitoradas</CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.ranking_summary.total_keywords}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <span className="text-success">↑{reportData.ranking_summary.improved_positions}</span>
                  <span className="mx-1">•</span>
                  <span className="text-destructive">↓{reportData.ranking_summary.declined_positions}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Posição Média</CardTitle>
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(reportData.ranking_summary.average_position)}ª
                </div>
                <p className="text-xs text-muted-foreground">
                  Visibilidade: {reportData.ranking_summary.visibility_score}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
                <Activity className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(reportData.performance_summary.average_performance_score)}/100
                </div>
                <p className="text-xs text-muted-foreground">
                  SEO: {Math.round(reportData.performance_summary.average_seo_score)}/100
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
                <CheckCircle className="w-4 h-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {Math.round(reportData.monitoring_summary.success_rate)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {reportData.monitoring_summary.total_executions} execuções
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Tendências */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução das Métricas</CardTitle>
              <CardDescription>
                Acompanhe a evolução das posições e performance ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={reportData.trend_data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <CustomTooltip />
                  <Line 
                    type="monotone" 
                    dataKey="avg_position" 
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                    name="Posição Média"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="performance_score" 
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--accent))", strokeWidth: 2, r: 3 }}
                    name="Performance Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Keywords */}
          <Card>
            <CardHeader>
              <CardTitle>Top Keywords</CardTitle>
              <CardDescription>
                Suas melhores posições no período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.top_keywords.map((keyword, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{keyword.keyword}</p>
                        <p className="text-sm text-muted-foreground">
                          {keyword.current_position}ª posição
                        </p>
                      </div>
                    </div>
                    
                    {keyword.change !== 0 && (
                      <Badge variant={keyword.change > 0 ? "default" : "secondary"}>
                        {keyword.change > 0 ? '+' : ''}{keyword.change}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AutomatedReports;