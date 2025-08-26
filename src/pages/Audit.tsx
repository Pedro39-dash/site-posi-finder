import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Globe,
  Smartphone,
  Zap,
  Link,
  FileText,
  Eye
} from "lucide-react";

interface AuditResult {
  category: string;
  score: number;
  status: 'excellent' | 'good' | 'critical';
  issues: Array<{
    type: 'success' | 'warning' | 'error';
    message: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

const Audit = () => {
  const [url, setUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<AuditResult[] | null>(null);
  const [overallScore, setOverallScore] = useState<number>(0);

  const mockAuditResults: AuditResult[] = [
    {
      category: "Meta Tags",
      score: 85,
      status: 'good',
      issues: [
        { type: 'success', message: 'Title tag presente e otimizado', priority: 'low' },
        { type: 'warning', message: 'Meta description pode ser mais descritiva', priority: 'medium' },
        { type: 'success', message: 'Meta robots configurado corretamente', priority: 'low' }
      ]
    },
    {
      category: "Estrutura HTML",
      score: 92,
      status: 'excellent',
      issues: [
        { type: 'success', message: 'Hierarquia de headings (H1-H6) correta', priority: 'low' },
        { type: 'success', message: 'HTML semântico implementado', priority: 'low' },
        { type: 'warning', message: 'Algumas imagens sem alt text', priority: 'medium' }
      ]
    },
    {
      category: "Performance",
      score: 78,
      status: 'good',
      issues: [
        { type: 'warning', message: 'Tempo de carregamento pode ser otimizado', priority: 'high' },
        { type: 'error', message: 'Imagens não otimizadas encontradas', priority: 'high' },
        { type: 'success', message: 'CSS e JS minificados', priority: 'low' }
      ]
    },
    {
      category: "Links",
      score: 68,
      status: 'critical',
      issues: [
        { type: 'error', message: '3 links quebrados encontrados', priority: 'high' },
        { type: 'warning', message: 'Poucos links internos para SEO', priority: 'medium' },
        { type: 'success', message: 'Links externos com rel="noopener"', priority: 'low' }
      ]
    },
    {
      category: "Mobile-Friendly",
      score: 95,
      status: 'excellent',
      issues: [
        { type: 'success', message: 'Design responsivo implementado', priority: 'low' },
        { type: 'success', message: 'Viewport meta tag configurada', priority: 'low' },
        { type: 'success', message: 'Touch targets adequados', priority: 'low' }
      ]
    }
  ];

  const handleAudit = async () => {
    if (!url.trim()) return;
    
    setIsScanning(true);
    setResults(null);
    
    // Simular scan com delay
    setTimeout(() => {
      const totalScore = mockAuditResults.reduce((sum, result) => sum + result.score, 0) / mockAuditResults.length;
      setOverallScore(Math.round(totalScore));
      setResults(mockAuditResults);
      setIsScanning(false);
    }, 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'good': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return null;
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

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'meta tags': return <FileText className="h-5 w-5" />;
      case 'estrutura html': return <Globe className="h-5 w-5" />;
      case 'performance': return <Zap className="h-5 w-5" />;
      case 'links': return <Link className="h-5 w-5" />;
      case 'mobile-friendly': return <Smartphone className="h-5 w-5" />;
      default: return <Eye className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <Helmet>
        <title>Auditoria SEO - Análise Técnica Completa</title>
        <meta 
          name="description" 
          content="Realize uma auditoria SEO completa do seu site. Análise de meta tags, estrutura HTML, performance, links e compatibilidade mobile."
        />
      </Helmet>

      <main className="py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
              Auditoria SEO
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Análise técnica completa do seu site para identificar oportunidades de otimização para mecanismos de busca
            </p>
          </div>

          {/* Formulário de Auditoria */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Iniciar Auditoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="Digite a URL do site (ex: https://seusite.com)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isScanning}
                  className="flex-1"
                />
                <Button 
                  onClick={handleAudit}
                  disabled={isScanning || !url.trim()}
                  className="min-w-[120px]"
                >
                  {isScanning ? "Analisando..." : "Auditar"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {isScanning && (
            <Card className="mb-8">
              <CardContent className="py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold mb-2">Analisando seu site...</h3>
                  <p className="text-muted-foreground mb-4">
                    Verificando meta tags, estrutura, performance e muito mais
                  </p>
                  <Progress value={65} className="max-w-md mx-auto" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resultados */}
          {results && (
            <div className="space-y-6">
              {/* Score Geral */}
              <Card className="border-2 border-primary/20">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Score Geral da Auditoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className={`text-6xl font-bold mb-4 ${
                      overallScore >= 90 ? 'text-green-600' : 
                      overallScore >= 70 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {overallScore}%
                    </div>
                    <Badge variant={
                      overallScore >= 90 ? 'default' : 
                      overallScore >= 70 ? 'secondary' : 'destructive'
                    } className="text-lg px-4 py-1">
                      {overallScore >= 90 ? 'Excelente' : 
                       overallScore >= 70 ? 'Bom' : 'Precisa Melhorar'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Resultados por Categoria */}
              <div className="grid md:grid-cols-2 gap-6">
                {results.map((result, index) => (
                  <Card key={index} className="border border-border hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(result.category)}
                          {result.category}
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          <span className={`font-bold text-lg ${getStatusColor(result.status)}`}>
                            {result.score}%
                          </span>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Progress value={result.score} className="mb-4" />
                      
                      <div className="space-y-2">
                        {result.issues.map((issue, issueIndex) => (
                          <div key={issueIndex} className="flex items-start gap-2 text-sm">
                            {getIssueIcon(issue.type)}
                            <div className="flex-1">
                              <span className="text-foreground">{issue.message}</span>
                              <Badge 
                                variant={issue.priority === 'high' ? 'destructive' : 
                                        issue.priority === 'medium' ? 'secondary' : 'outline'}
                                className="ml-2 text-xs"
                              >
                                {issue.priority === 'high' ? 'Alta' : 
                                 issue.priority === 'medium' ? 'Média' : 'Baixa'} prioridade
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Resumo de Ações */}
              <Card>
                <CardHeader>
                  <CardTitle>Próximas Ações Recomendadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 rounded-lg">
                      <h4 className="font-semibold text-red-800 dark:text-red-400 mb-2">Prioridade Alta</h4>
                      <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
                        <li>• Corrigir 3 links quebrados encontrados</li>
                        <li>• Otimizar imagens para melhor performance</li>
                        <li>• Melhorar tempo de carregamento da página</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800 rounded-lg">
                      <h4 className="font-semibold text-yellow-800 dark:text-yellow-400 mb-2">Prioridade Média</h4>
                      <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                        <li>• Expandir meta description para ser mais descritiva</li>
                        <li>• Adicionar alt text nas imagens restantes</li>
                        <li>• Aumentar número de links internos</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Audit;