import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Gauge, 
  FileText, 
  Settings, 
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { DeepAnalysisData, CoreWebVital } from '@/services/deepAnalysisService';

interface DeepInsightsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: DeepAnalysisData | null;
}

const DeepInsightsModal: React.FC<DeepInsightsModalProps> = ({ open, onOpenChange, data }) => {
  if (!data) return null;

  const getStatusIcon = (status: 'good' | 'needs-improvement' | 'poor') => {
    if (status === 'good') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === 'needs-improvement') return <AlertCircle className="h-4 w-4 text-amber-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getTrendIcon = (target: number, avg: number) => {
    if (target > avg + 5) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (target < avg - 5) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getPriorityBadge = (priority: 'high' | 'medium' | 'low') => {
    if (priority === 'high') return <Badge variant="destructive">Alta</Badge>;
    if (priority === 'medium') return <Badge variant="default">Média</Badge>;
    return <Badge variant="secondary">Baixa</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">🔍 Análise Profunda de SEO</DialogTitle>
          <DialogDescription>
            Análise técnica completa de {data.target.domain} vs {data.competitors.length} concorrentes
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="performance">
              <Gauge className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="content">
              <FileText className="h-4 w-4 mr-2" />
              Conteúdo
            </TabsTrigger>
            <TabsTrigger value="technical">
              <Settings className="h-4 w-4 mr-2" />
              SEO Técnico
            </TabsTrigger>
            <TabsTrigger value="recommendations">
              <Target className="h-4 w-4 mr-2" />
              Recomendações
            </TabsTrigger>
          </TabsList>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Performance Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-3xl font-bold ${getScoreColor(data.target.performanceScore)}`}>
                      {data.target.performanceScore}
                    </span>
                    {getTrendIcon(data.target.performanceScore, data.competitorAverages.performanceScore)}
                  </div>
                  <Progress value={data.target.performanceScore} className="mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Média dos concorrentes: {Math.round(data.competitorAverages.performanceScore)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">SEO Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-3xl font-bold ${getScoreColor(data.target.seoScore)}`}>
                      {data.target.seoScore}
                    </span>
                    {getTrendIcon(data.target.seoScore, data.competitorAverages.seoScore)}
                  </div>
                  <Progress value={data.target.seoScore} className="mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Média dos concorrentes: {Math.round(data.competitorAverages.seoScore)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Core Web Vitals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(data.target.coreWebVitals.lcp.status)}
                    <span className="text-sm font-medium">LCP (Largest Contentful Paint)</span>
                  </div>
                  <span className="text-sm">{data.target.coreWebVitals.lcp.value}ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(data.target.coreWebVitals.fid.status)}
                    <span className="text-sm font-medium">FID (First Input Delay)</span>
                  </div>
                  <span className="text-sm">{data.target.coreWebVitals.fid.value}ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(data.target.coreWebVitals.cls.status)}
                    <span className="text-sm font-medium">CLS (Cumulative Layout Shift)</span>
                  </div>
                  <span className="text-sm">{data.target.coreWebVitals.cls.value}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Domain Authority Estimado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-3xl font-bold ${getScoreColor(data.target.estimatedDA)}`}>
                    {data.target.estimatedDA}
                  </span>
                  {getTrendIcon(data.target.estimatedDA, data.competitorAverages.estimatedDA)}
                </div>
                <Progress value={data.target.estimatedDA} className="mb-2" />
                <p className="text-xs text-muted-foreground">
                  Média dos concorrentes: {Math.round(data.competitorAverages.estimatedDA)}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Contagem de Palavras</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl font-bold">{data.target.onPage.wordCount}</span>
                    {getTrendIcon(data.target.onPage.wordCount, data.competitorAverages.wordCount)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Média dos concorrentes: {Math.round(data.competitorAverages.wordCount)} palavras
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Tamanho da Página</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl font-bold">{Math.round(data.target.pageSize / 1024)}KB</span>
                    {getTrendIcon(data.competitorAverages.pageSize, data.target.pageSize)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Média dos concorrentes: {Math.round(data.competitorAverages.pageSize / 1024)}KB
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Estrutura de Headings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">H1 Tags</span>
                  <Badge variant={data.target.onPage.h1Count === 1 ? "default" : "destructive"}>
                    {data.target.onPage.h1Count}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">H2 Tags</span>
                  <Badge variant="outline">{data.target.onPage.h2Count}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">H3 Tags</span>
                  <Badge variant="outline">{data.target.onPage.h3Count}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Imagens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total de imagens</span>
                    <span className="font-medium">{data.target.onPage.totalImages}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Imagens sem alt text</span>
                    <Badge variant={data.target.onPage.imagesWithoutAlt > 0 ? "destructive" : "default"}>
                      {data.target.onPage.imagesWithoutAlt}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Technical SEO Tab */}
          <TabsContent value="technical" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Meta Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Title Tag</span>
                    <Badge variant={data.target.onPage.titleLength >= 30 && data.target.onPage.titleLength <= 60 ? "default" : "secondary"}>
                      {data.target.onPage.titleLength} caracteres
                    </Badge>
                  </div>
                  {data.target.onPage.title && (
                    <p className="text-xs text-muted-foreground truncate">{data.target.onPage.title}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Meta Description</span>
                    <Badge variant={data.target.onPage.metaLength >= 120 && data.target.onPage.metaLength <= 160 ? "default" : "secondary"}>
                      {data.target.onPage.metaLength} caracteres
                    </Badge>
                  </div>
                  {data.target.onPage.metaDescription && (
                    <p className="text-xs text-muted-foreground truncate">{data.target.onPage.metaDescription}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Checklist Técnico</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Schema.org (Dados Estruturados)</span>
                  {data.target.onPage.hasSchema ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Open Graph Tags</span>
                  {data.target.onPage.hasOpenGraph ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Mobile Friendly</span>
                  {data.target.onPage.isMobileFriendly ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Estrutura de Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Links Internos</span>
                  <span className="font-medium">{data.target.onPage.internalLinks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Links Externos</span>
                  <span className="font-medium">{data.target.onPage.externalLinks}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-3 mt-4">
            {data.recommendations.map((rec, index) => (
              <Card key={index} className="border-l-4" style={{
                borderLeftColor: rec.priority === 'high' ? 'hsl(var(--destructive))' : 
                                 rec.priority === 'medium' ? 'hsl(var(--warning))' : 
                                 'hsl(var(--muted))'
              }}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm">{rec.title}</h4>
                    {getPriorityBadge(rec.priority)}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Impacto:</span> {rec.impact}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Gap:</span> {rec.gap}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}

            {data.recommendations.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Excelente! Nenhuma recomendação crítica encontrada.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default DeepInsightsModal;
