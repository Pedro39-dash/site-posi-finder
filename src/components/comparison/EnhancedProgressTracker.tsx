import React, { useEffect, useState } from 'react';
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock, Zap, Search, BarChart3, Target, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AnalysisStage {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  estimatedDuration: number; // in seconds
  status: 'pending' | 'in_progress' | 'completed' | 'error';
}

interface EnhancedProgressTrackerProps {
  status: string;
  totalKeywords?: number;
  processedKeywords?: number;
  currentStage?: string;
  estimatedTimeRemaining?: number;
  startTime?: string;
  errorMessage?: string;
  metadata?: any;
}

const EnhancedProgressTracker = ({
  status,
  totalKeywords = 0,
  processedKeywords = 0,
  currentStage,
  estimatedTimeRemaining,
  startTime,
  errorMessage,
  metadata
}: EnhancedProgressTrackerProps) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [stages, setStages] = useState<AnalysisStage[]>([]);

  // Initialize stages
  useEffect(() => {
    const analysisStages: AnalysisStage[] = [
      {
        id: 'initialization',
        name: 'Inicialização',
        description: 'Preparando análise e validando domínios',
        icon: <Zap className="h-4 w-4" />,
        estimatedDuration: 5,
        status: 'pending'
      },
      {
        id: 'keyword_extraction',
        name: 'Extração de Keywords',
        description: 'Identificando keywords do domínio alvo',
        icon: <Search className="h-4 w-4" />,
        estimatedDuration: 15,
        status: 'pending'
      },
      {
        id: 'serp_analysis',
        name: 'Análise SERP',
        description: 'Analisando posições nas páginas de resultado',
        icon: <BarChart3 className="h-4 w-4" />,
        estimatedDuration: 45,
        status: 'pending'
      },
      {
        id: 'competitor_discovery',
        name: 'Descoberta de Concorrentes',
        description: 'Identificando principais concorrentes',
        icon: <Users className="h-4 w-4" />,
        estimatedDuration: 20,
        status: 'pending'
      },
      {
        id: 'opportunity_analysis',
        name: 'Análise de Oportunidades',
        description: 'Identificando gaps e oportunidades de ranking',
        icon: <Target className="h-4 w-4" />,
        estimatedDuration: 15,
        status: 'pending'
      },
      {
        id: 'finalization',
        name: 'Finalização',
        description: 'Consolidando resultados e gerando relatório',
        icon: <CheckCircle className="h-4 w-4" />,
        estimatedDuration: 10,
        status: 'pending'
      }
    ];

    setStages(analysisStages);
  }, []);

  // Update stage status based on current stage and overall status
  useEffect(() => {
    setStages(prevStages => {
      return prevStages.map(stage => {
        if (status === 'failed' && stage.id === currentStage) {
          return { ...stage, status: 'error' as const };
        }
        
        if (status === 'completed') {
          return { ...stage, status: 'completed' as const };
        }
        
        if (stage.id === currentStage) {
          return { ...stage, status: 'in_progress' as const };
        }
        
        // Mark previous stages as completed
        const currentStageIndex = prevStages.findIndex(s => s.id === currentStage);
        const stageIndex = prevStages.findIndex(s => s.id === stage.id);
        
        if (currentStageIndex > -1 && stageIndex < currentStageIndex) {
          return { ...stage, status: 'completed' as const };
        }
        
        return stage;
      });
    });
  }, [status, currentStage]);

  // Calculate elapsed time
  useEffect(() => {
    if (!startTime || status === 'completed' || status === 'failed') return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, status]);

  // Calculate overall progress
  const overallProgress = React.useMemo(() => {
    if (status === 'completed') return 100;
    if (status === 'failed') return 0;
    
    const completedStages = stages.filter(s => s.status === 'completed').length;
    const inProgressStages = stages.filter(s => s.status === 'in_progress').length;
    const totalStages = stages.length;
    
    return Math.round(((completedStages + inProgressStages * 0.5) / totalStages) * 100);
  }, [stages, status]);

  // Calculate keyword progress
  const keywordProgress = totalKeywords > 0 ? Math.round((processedKeywords / totalKeywords) * 100) : 0;

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (stageStatus: string) => {
    switch (stageStatus) {
      case 'completed': return 'text-accent';
      case 'in_progress': return 'text-primary';
      case 'error': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (stage: AnalysisStage) => {
    switch (stage.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-accent" />;
      case 'in_progress':
        return <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Progresso da Análise</CardTitle>
              <CardDescription>
                {status === 'analyzing' ? 'Analisando dados competitivos...' : 
                 status === 'completed' ? 'Análise concluída com sucesso!' :
                 status === 'failed' ? 'Erro na análise' : 'Preparando análise...'}
              </CardDescription>
            </div>
            <Badge variant={status === 'completed' ? 'default' : status === 'failed' ? 'destructive' : 'secondary'}>
              {overallProgress}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={overallProgress} className="h-2" />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-muted-foreground">Tempo Decorrido</div>
              <div className="font-mono font-medium">{formatTime(elapsedTime)}</div>
            </div>
            
            {estimatedTimeRemaining && (
              <div className="text-center">
                <div className="text-muted-foreground">Tempo Restante</div>
                <div className="font-mono font-medium">{formatTime(estimatedTimeRemaining)}</div>
              </div>
            )}
            
            {totalKeywords > 0 && (
              <div className="text-center">
                <div className="text-muted-foreground">Keywords</div>
                <div className="font-medium">{processedKeywords}/{totalKeywords}</div>
              </div>
            )}
            
            <div className="text-center">
              <div className="text-muted-foreground">Status</div>
              <div className="font-medium capitalize">{status}</div>
            </div>
          </div>

          {totalKeywords > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Keywords Processadas</span>
                <span>{keywordProgress}%</span>
              </div>
              <Progress value={keywordProgress} className="h-1" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Stages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Etapas da Análise</CardTitle>
          <CardDescription>
            Acompanhe o progresso detalhado de cada etapa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stages.map((stage, index) => (
              <div key={stage.id} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(stage)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium ${getStatusColor(stage.status)}`}>
                      {stage.name}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      ~{stage.estimatedDuration}s
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stage.description}
                  </p>
                  
                  {stage.status === 'in_progress' && (
                    <div className="mt-2">
                      <Progress value={50} className="h-1" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Erro na Análise:</strong> {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Performance Metrics */}
      {metadata && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Métricas de Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {metadata.averageResponseTime && (
                <div>
                  <div className="text-muted-foreground">Tempo Resposta Médio</div>
                  <div className="font-medium">{metadata.averageResponseTime}ms</div>
                </div>
              )}
              
              {metadata.requestsPerSecond && (
                <div>
                  <div className="text-muted-foreground">Requests/s</div>
                  <div className="font-medium">{metadata.requestsPerSecond}</div>
                </div>
              )}
              
              {metadata.cacheHitRatio && (
                <div>
                  <div className="text-muted-foreground">Cache Hit Rate</div>
                  <div className="font-medium">{Math.round(metadata.cacheHitRatio * 100)}%</div>
                </div>
              )}
              
              {metadata.parallelBatches && (
                <div>
                  <div className="text-muted-foreground">Batches Paralelos</div>
                  <div className="font-medium">{metadata.parallelBatches}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedProgressTracker;