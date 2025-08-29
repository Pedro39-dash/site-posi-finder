import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, CheckCircle, AlertTriangle, XCircle, Globe, Smartphone, Zap, Link, FileText, Eye, Search, Brain } from "lucide-react";
import { useState } from "react";

interface Issue {
  type: 'success' | 'warning' | 'error';
  message: string;
  priority: 'high' | 'medium' | 'low';
  recommendation?: string;
}

interface CategoryCardProps {
  category: string;
  score: number;
  status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
  issues: Issue[];
}

export const CategoryCard = ({ category, score, status, issues }: CategoryCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-yellow-600';
      case 'needs_improvement': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'excellent': return { label: 'Excelente', className: 'bg-green-100 text-green-800' };
      case 'good': return { label: 'Bom', className: 'bg-yellow-100 text-yellow-800' };
      case 'needs_improvement': return { label: 'Melhorar', className: 'bg-orange-100 text-orange-800' };
      case 'critical': return { label: 'Crítico', className: 'bg-red-100 text-red-800' };
      default: return { label: 'Indefinido', className: 'bg-muted text-muted-foreground' };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'meta_tags': return <FileText className="h-5 w-5" />;
      case 'html_structure': return <Globe className="h-5 w-5" />;
      case 'performance': return <Zap className="h-5 w-5" />;
      case 'links_analysis': return <Link className="h-5 w-5" />;
      case 'mobile_friendly': return <Smartphone className="h-5 w-5" />;
      case 'images': return <Eye className="h-5 w-5" />;
      case 'keyword_optimization': return <Search className="h-5 w-5" />;
      case 'content_structure': return <FileText className="h-5 w-5" />;
      case 'technical_seo': return <Globe className="h-5 w-5" />;
      case 'readability': return <FileText className="h-5 w-5" />;
      case 'ai_search_optimization': return <Brain className="h-5 w-5" />;
      default: return <Eye className="h-5 w-5" />;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category.toLowerCase()) {
      case 'meta_tags': return 'Meta Tags';
      case 'html_structure': return 'Estrutura HTML';
      case 'performance': return 'Performance';
      case 'links_analysis': return 'Análise de Links';
      case 'mobile_friendly': return 'Mobile-Friendly';
      case 'images': return 'Otimização de Imagens';
      case 'keyword_optimization': return 'Palavras-chave';
      case 'content_structure': return 'Estrutura de Conteúdo';
      case 'technical_seo': return 'SEO Técnico';
      case 'readability': return 'Legibilidade';
      case 'ai_search_optimization': return 'Otimização para IAs';
      default: return category;
    }
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50/50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50/50';
      case 'low': return 'border-l-green-500 bg-green-50/50';
      default: return 'border-l-muted bg-muted/20';
    }
  };

  // Group issues by type
  const criticalIssues = issues.filter(issue => issue.type === 'error');
  const warnings = issues.filter(issue => issue.type === 'warning');
  const successes = issues.filter(issue => issue.type === 'success');

  const statusBadge = getStatusBadge(status);

  return (
    <Card className="transition-all duration-200 hover:shadow-lg">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-primary/10 ${getStatusColor(status)}`}>
                  {getCategoryIcon(category)}
                </div>
                <div>
                  <div className="font-semibold">{getCategoryName(category)}</div>
                  <div className="text-sm text-muted-foreground font-normal">
                    {criticalIssues.length > 0 && `${criticalIssues.length} críticos • `}
                    {warnings.length > 0 && `${warnings.length} avisos • `}
                    {successes.length > 0 && `${successes.length} corretos`}
                  </div>
                </div>
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getStatusColor(status)}`}>
                    {score}
                  </div>
                  <Badge className={statusBadge.className}>
                    {statusBadge.label}
                  </Badge>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>
            <Progress value={score} className="mt-3" />
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent>
            <div className="space-y-4">
              {/* Critical Issues First */}
              {criticalIssues.length > 0 && (
                <div>
                  <h4 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Problemas Críticos ({criticalIssues.length})
                  </h4>
                  <div className="space-y-2">
                    {criticalIssues.map((issue, index) => (
                      <div key={index} className={`p-3 border-l-4 rounded-r-lg ${getPriorityColor(issue.priority)}`}>
                        <div className="flex items-start gap-2">
                          {getIssueIcon(issue.type)}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{issue.message}</p>
                            {issue.recommendation && (
                              <p className="text-xs text-muted-foreground mt-1">
                                <strong>Recomendação:</strong> {issue.recommendation}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {warnings.length > 0 && (
                <div>
                  <h4 className="font-semibold text-yellow-600 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Recomendações ({warnings.length})
                  </h4>
                  <div className="space-y-2">
                    {warnings.map((issue, index) => (
                      <div key={index} className={`p-3 border-l-4 rounded-r-lg ${getPriorityColor(issue.priority)}`}>
                        <div className="flex items-start gap-2">
                          {getIssueIcon(issue.type)}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{issue.message}</p>
                            {issue.recommendation && (
                              <p className="text-xs text-muted-foreground mt-1">
                                <strong>Recomendação:</strong> {issue.recommendation}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Successes */}
              {successes.length > 0 && (
                <div>
                  <h4 className="font-semibold text-green-600 mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Implementado Corretamente ({successes.length})
                  </h4>
                  <div className="space-y-2">
                    {successes.slice(0, 3).map((issue, index) => (
                      <div key={index} className={`p-3 border-l-4 rounded-r-lg ${getPriorityColor(issue.priority)}`}>
                        <div className="flex items-start gap-2">
                          {getIssueIcon(issue.type)}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{issue.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {successes.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        ... e mais {successes.length - 3} itens implementados corretamente
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};