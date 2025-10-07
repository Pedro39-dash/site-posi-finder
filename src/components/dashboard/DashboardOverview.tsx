import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Eye, AlertTriangle, Target, BarChart3 } from 'lucide-react';
import { MonitoringService, DashboardMetric } from '@/services/monitoringService';
import { useProject } from '@/hooks/useProject';
import { useRole } from '@/hooks/useRole';

interface MetricCardProps {
  title: string;
  value: number;
  previousValue?: number;
  icon: React.ReactNode;
  suffix?: string;
  description?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  previousValue, 
  icon, 
  suffix = '', 
  description 
}) => {
  const change = previousValue ? ((value - previousValue) / previousValue) * 100 : 0;
  const hasIncreased = change > 0;
  const hasChanged = Math.abs(change) > 0.1;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value.toLocaleString('pt-BR')}{suffix}
        </div>
        {hasChanged && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {hasIncreased ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={hasIncreased ? 'text-green-500' : 'text-red-500'}>
              {Math.abs(change).toFixed(1)}%
            </span>
            <span>vs. período anterior</span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

export const DashboardOverview: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { activeProject } = useProject();
  const { isAdmin, isClient } = useRole();

  useEffect(() => {
    // Limpar métricas antigas
    setMetrics([]);
    
    if (activeProject) {
      loadMetrics();
    }
  }, [activeProject?.id]);

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      // Calcular métricas atuais
      await MonitoringService.calculateMetrics(activeProject?.id);
      
      // Buscar métricas
      const { success, metrics: data } = await MonitoringService.getDashboardMetrics(
        activeProject?.id, 
        'daily'
      );
      
      if (success) {
        setMetrics(data);
      }
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMetricValue = (type: string) => {
    const latestMetric = metrics
      .filter(m => m.metric_type === type)
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())[0];
    
    return {
      current: latestMetric?.current_value || 0,
      previous: latestMetric?.previous_value || 0
    };
  };

  const totalKeywords = getMetricValue('total_keywords');
  const avgPosition = getMetricValue('avg_position');
  const visibilityScore = getMetricValue('visibility_score');
  const rankingChanges = getMetricValue('ranking_changes');

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Visão Geral</h2>
          <p className="text-muted-foreground">
            {activeProject ? `Projeto: ${activeProject.name}` : 'Todos os projetos'}
          </p>
        </div>
        {(isAdmin || isClient) && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {isAdmin ? 'Admin' : 'Cliente'}
          </Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Keywords"
          value={totalKeywords.current}
          previousValue={totalKeywords.previous}
          icon={<Target className="h-4 w-4 text-muted-foreground" />}
          description="Palavras-chave monitoradas"
        />
        
        <MetricCard
          title="Posição Média"
          value={avgPosition.current}
          previousValue={avgPosition.previous}
          icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
          description="Posição média no ranking"
        />
        
        <MetricCard
          title="Score de Visibilidade"
          value={visibilityScore.current}
          previousValue={visibilityScore.previous}
          icon={<Eye className="h-4 w-4 text-muted-foreground" />}
          suffix="%"
          description="Visibilidade geral do site"
        />
        
        <MetricCard
          title="Mudanças Recentes"
          value={rankingChanges.current}
          previousValue={rankingChanges.previous}
          icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
          description="Mudanças nas últimas 24h"
        />
      </div>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Status do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm">Monitoramento Ativo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-sm">Processando Auditorias</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm">APIs Funcionando</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};