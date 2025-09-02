import React, { useState } from "react";
import { 
  X, 
  TrendingUp, 
  Target, 
  CheckCircle, 
  AlertTriangle, 
  BarChart3,
  FileText,
  Link,
  Image,
  Video,
  Hash
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { EnhancedChartContainer, CustomTooltip, ChartGradients } from "@/components/ui/enhanced-chart";
import { calculateAdvancedScore, getPositionCategory, calculateKeywordDifficulty } from "@/utils/seoScoring";
import { ComparisonResultEnhanced } from "./ComparisonResultsEnhanced";

interface KeywordAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  keyword: string;
  results: ComparisonResultEnhanced[];
  websites: string[];
}

interface OnPageAnalysis {
  title: boolean;
  url: boolean;
  metaDescription: boolean;
  h1: boolean;
  h2: boolean;
  imageAlt: boolean;
  contentLength: number;
  score: number;
}

interface CompetitorAnalysis {
  domain: string;
  position: number | null;
  onPage: OnPageAnalysis;
  contentQuality: {
    wordCount: number;
    hasImages: boolean;
    hasVideos: boolean;
    hasStructuredData: boolean;
  };
  backlinks: {
    totalBacklinks: number;
    domainAuthority: number;
  };
}

const KeywordAnalysisModal = ({ isOpen, onClose, keyword, results, websites }: KeywordAnalysisModalProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  const keywordResult = results.find(r => r.keyword === keyword);
  if (!keywordResult) return null;

  const clientDomain = websites[0];
  const competitorDomain = websites[1];
  
  const clientResult = keywordResult.results.find(r => r.website === clientDomain);
  const competitorResult = keywordResult.results.find(r => r.website === competitorDomain);

  const getDomainName = (url: string) => {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  };

  // 3.1 Dados para o gráfico de posicionamento (simulado com histórico)
  const generateHistoricalData = () => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    return months.map((month, index) => {
      const clientPos = clientResult?.position;
      const competitorPos = competitorResult?.position;
      
      // Simular variação histórica
      const variation = Math.floor(Math.random() * 6) - 3; // -3 a +3
      
      return {
        month,
        [getDomainName(clientDomain)]: clientPos ? Math.max(1, Math.min(50, clientPos + variation)) : null,
        [getDomainName(competitorDomain)]: competitorPos ? Math.max(1, Math.min(50, competitorPos + variation)) : null,
      };
    });
  };

  // 3.2 Análise da Concorrência (dados simulados)
  const generateCompetitorAnalysis = (): CompetitorAnalysis[] => {
    const analyses: CompetitorAnalysis[] = [];
    
    [clientDomain, competitorDomain].forEach((domain, index) => {
      const result = keywordResult.results.find(r => r.website === domain);
      const position = result?.position;
      
      // Simular análise on-page baseada na posição
      const onPageScore = position ? Math.max(60, 100 - (position * 2)) : 40;
      
      analyses.push({
        domain,
        position,
        onPage: {
          title: position ? position <= 20 : Math.random() > 0.5,
          url: position ? position <= 15 : Math.random() > 0.4,
          metaDescription: position ? position <= 25 : Math.random() > 0.6,
          h1: position ? position <= 30 : Math.random() > 0.3,
          h2: position ? position <= 35 : Math.random() > 0.7,
          imageAlt: Math.random() > 0.5,
          contentLength: Math.floor(Math.random() * 2000) + 500,
          score: onPageScore
        },
        contentQuality: {
          wordCount: Math.floor(Math.random() * 2000) + 800,
          hasImages: Math.random() > 0.3,
          hasVideos: Math.random() > 0.7,
          hasStructuredData: position ? position <= 20 : Math.random() > 0.6
        },
        backlinks: {
          totalBacklinks: Math.floor(Math.random() * 500) + 50,
          domainAuthority: Math.floor(Math.random() * 40) + 40
        }
      });
    });
    
    return analyses;
  };

  // 3.3 Projeção de Posição
  const generatePositionProjection = () => {
    const clientPos = clientResult?.position || 50;
    const targetPosition = Math.max(1, Math.min(10, Math.floor(clientPos * 0.6)));
    
    return {
      current: clientPos,
      target: targetPosition,
      improvement: clientPos - targetPosition,
      timeline: "3-6 meses",
      probability: Math.min(95, Math.max(60, 100 - (clientPos * 2)))
    };
  };

  // 3.4 Ações Recomendadas
  const generateRecommendations = () => {
    const clientAnalysis = competitorAnalyses.find(a => a.domain === clientDomain);
    const competitorAnalysis = competitorAnalyses.find(a => a.domain === competitorDomain);
    
    if (!clientAnalysis || !competitorAnalysis) return [];
    
    const recommendations = [];
    
    if (!clientAnalysis.onPage.title) {
      recommendations.push({
        priority: 'high' as const,
        category: 'On-Page',
        action: `Adicione "${keyword}" no título da página`,
        impact: 'Alto',
        effort: 'Baixo'
      });
    }
    
    if (!clientAnalysis.onPage.h1) {
      recommendations.push({
        priority: 'high' as const,
        category: 'On-Page',
        action: `Use "${keyword}" no H1 da página`,
        impact: 'Alto',
        effort: 'Baixo'
      });
    }
    
    if (clientAnalysis.contentQuality.wordCount < competitorAnalysis.contentQuality.wordCount) {
      const difference = competitorAnalysis.contentQuality.wordCount - clientAnalysis.contentQuality.wordCount;
      recommendations.push({
        priority: 'medium' as const,
        category: 'Conteúdo',
        action: `Aumente o conteúdo em ${difference} palavras aproximadamente`,
        impact: 'Médio',
        effort: 'Alto'
      });
    }
    
    if (!clientAnalysis.onPage.metaDescription) {
      recommendations.push({
        priority: 'medium' as const,
        category: 'On-Page',
        action: `Crie uma meta-descrição atrativa com "${keyword}"`,
        impact: 'Médio',
        effort: 'Baixo'
      });
    }
    
    if (!clientAnalysis.contentQuality.hasImages && competitorAnalysis.contentQuality.hasImages) {
      recommendations.push({
        priority: 'medium' as const,
        category: 'Conteúdo',
        action: 'Adicione imagens relevantes com alt-text otimizado',
        impact: 'Médio',
        effort: 'Médio'
      });
    }
    
    if (clientAnalysis.backlinks.totalBacklinks < competitorAnalysis.backlinks.totalBacklinks / 2) {
      recommendations.push({
        priority: 'low' as const,
        category: 'Off-Page',
        action: 'Desenvolva uma estratégia de link building',
        impact: 'Alto',
        effort: 'Alto'
      });
    }
    
    return recommendations;
  };

  const historicalData = generateHistoricalData();
  const competitorAnalyses = generateCompetitorAnalysis();
  const positionProjection = generatePositionProjection();
  const recommendations = generateRecommendations();

  const difficulty = calculateKeywordDifficulty([competitorResult?.position].filter(p => p !== null) as number[]);

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
    }
  };

  const getPriorityIcon = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Target className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-primary" />
              <div>
                <span>Análise Detalhada: </span>
                <span className="text-primary">{keyword}</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="positioning">Posicionamento</TabsTrigger>
            <TabsTrigger value="analysis">Análise Técnica</TabsTrigger>
            <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Situação Atual */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Posições Atuais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{getDomainName(clientDomain)} (Você)</span>
                    <Badge variant={getPositionCategory(clientResult?.position).badgeVariant}>
                      {clientResult?.position ? `${clientResult.position}ª posição` : 'Não ranqueia'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{getDomainName(competitorDomain)}</span>
                    <Badge variant={getPositionCategory(competitorResult?.position).badgeVariant}>
                      {competitorResult?.position ? `${competitorResult.position}ª posição` : 'Não ranqueia'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Dificuldade da Palavra-chave</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Nível de Dificuldade</span>
                      <Badge variant={difficulty.difficulty === 'low' ? 'default' : 
                                      difficulty.difficulty === 'medium' ? 'secondary' : 'destructive'}>
                        {difficulty.difficulty === 'low' ? 'Baixa' :
                         difficulty.difficulty === 'medium' ? 'Média' : 
                         difficulty.difficulty === 'high' ? 'Alta' : 'Muito Alta'}
                      </Badge>
                    </div>
                    <Progress value={difficulty.score} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      {difficulty.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Projeção de Melhoria */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Potencial de Melhoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-muted-foreground">
                      {positionProjection.current}ª
                    </div>
                    <div className="text-sm text-muted-foreground">Posição Atual</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {positionProjection.target}ª
                    </div>
                    <div className="text-sm text-muted-foreground">Meta Realista</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-accent">
                      +{positionProjection.improvement}
                    </div>
                    <div className="text-sm text-muted-foreground">Posições</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {positionProjection.probability}%
                    </div>
                    <div className="text-sm text-muted-foreground">Probabilidade</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="positioning" className="space-y-6">
            {/* 3.1 Gráfico de Posicionamento Histórico */}
            <EnhancedChartContainer
              title="Evolução de Posicionamento (Últimos 6 meses)"
              description="Comparação histórica das posições para esta palavra-chave"
              height={300}
            >
              <LineChart data={historicalData}>
                <ChartGradients />
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis 
                  reversed 
                  domain={[1, 50]}
                  stroke="hsl(var(--muted-foreground))"
                  label={{ value: 'Posição', angle: -90, position: 'insideLeft' }}
                />
                <CustomTooltip
                  formatter={(value: number, name: string) => [
                    value ? `${value}ª posição` : 'Não ranqueia',
                    name
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey={getDomainName(clientDomain)}
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey={getDomainName(competitorDomain)}
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </EnhancedChartContainer>

            {/* Comparação de Scores */}
            <Card>
              <CardHeader>
                <CardTitle>Scores de Otimização</CardTitle>
                <CardDescription>
                  Pontuação baseada na análise on-page de cada domínio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {competitorAnalyses.map((analysis, index) => (
                    <div key={analysis.domain} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {getDomainName(analysis.domain)}
                          {analysis.domain === clientDomain && " (Você)"}
                        </span>
                        <span className="text-lg font-bold">
                          {analysis.onPage.score}/100
                        </span>
                      </div>
                      <Progress 
                        value={analysis.onPage.score} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            {/* 3.2 Análise da Concorrência */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {competitorAnalyses.map((analysis) => (
                <Card key={analysis.domain}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {getDomainName(analysis.domain)}
                      {analysis.domain === clientDomain && (
                        <Badge variant="outline" className="ml-2">Seu site</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Posição: {analysis.position ? `${analysis.position}ª` : 'Não ranqueia'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* On-Page */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Otimização On-Page
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          {analysis.onPage.title ? 
                            <CheckCircle className="h-4 w-4 text-accent" /> : 
                            <X className="h-4 w-4 text-destructive" />
                          }
                          <span>Título otimizado</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {analysis.onPage.url ? 
                            <CheckCircle className="h-4 w-4 text-accent" /> : 
                            <X className="h-4 w-4 text-destructive" />
                          }
                          <span>URL otimizada</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {analysis.onPage.h1 ? 
                            <CheckCircle className="h-4 w-4 text-accent" /> : 
                            <X className="h-4 w-4 text-destructive" />
                          }
                          <span>H1 otimizado</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {analysis.onPage.metaDescription ? 
                            <CheckCircle className="h-4 w-4 text-accent" /> : 
                            <X className="h-4 w-4 text-destructive" />
                          }
                          <span>Meta-descrição</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Qualidade do Conteúdo */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        Qualidade do Conteúdo
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Palavras no texto:</span>
                          <span className="font-medium">{analysis.contentQuality.wordCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Contém imagens:</span>
                          <span className={analysis.contentQuality.hasImages ? "text-accent" : "text-muted-foreground"}>
                            {analysis.contentQuality.hasImages ? "Sim" : "Não"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Contém vídeos:</span>
                          <span className={analysis.contentQuality.hasVideos ? "text-accent" : "text-muted-foreground"}>
                            {analysis.contentQuality.hasVideos ? "Sim" : "Não"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Backlinks */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Link className="h-4 w-4" />
                        Autoridade & Links
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total de backlinks:</span>
                          <span className="font-medium">{analysis.backlinks.totalBacklinks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Domain Authority:</span>
                          <span className="font-medium">{analysis.backlinks.domainAuthority}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            {/* 3.3 Projeção Detalhada */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Projeção de Posição
                </CardTitle>
                <CardDescription>
                  Onde você pode chegar após implementar as melhorias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-accent/5 rounded-lg">
                    <div>
                      <div className="text-sm text-muted-foreground">Posição Atual</div>
                      <div className="text-2xl font-bold">{positionProjection.current}ª</div>
                    </div>
                    <div className="text-4xl text-muted-foreground">→</div>
                    <div>
                      <div className="text-sm text-muted-foreground">Meta Realista</div>
                      <div className="text-2xl font-bold text-primary">{positionProjection.target}ª</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-accent">+{positionProjection.improvement}</div>
                      <div className="text-sm text-muted-foreground">Posições de melhoria</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">{positionProjection.timeline}</div>
                      <div className="text-sm text-muted-foreground">Prazo estimado</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3.4 Lista de Ações Recomendadas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Plano de Ação Detalhado
                </CardTitle>
                <CardDescription>
                  Implemente essas melhorias em ordem de prioridade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getPriorityIcon(rec.priority)}
                          <div>
                            <div className="font-medium">{rec.action}</div>
                            <div className="text-sm text-muted-foreground">{rec.category}</div>
                          </div>
                        </div>
                        <Badge variant={getPriorityColor(rec.priority)}>
                          {rec.priority === 'high' ? 'Alta' : 
                           rec.priority === 'medium' ? 'Média' : 'Baixa'} Prioridade
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                        <div>
                          <span className="text-sm text-muted-foreground">Impacto: </span>
                          <span className="text-sm font-medium">{rec.impact}</span>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Esforço: </span>
                          <span className="text-sm font-medium">{rec.effort}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default KeywordAnalysisModal;