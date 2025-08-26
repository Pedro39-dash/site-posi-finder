import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
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
  Eye,
  History,
  Trash2,
  Brain
} from "lucide-react";
import { AuditService, type AuditResult, type AuditReport } from "@/services/auditService";
import { AuditTestPanel } from "@/components/AuditTestPanel";
import { EdgeFunctionMonitor } from "@/components/EdgeFunctionMonitor";
import { SystemStatusPanel } from "@/components/SystemStatusPanel";

const Audit = () => {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [focusKeyword, setFocusKeyword] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<AuditResult[] | null>(null);
  const [overallScore, setOverallScore] = useState<number>(0);
  const [currentAuditId, setCurrentAuditId] = useState<string | null>(null);
  const [previousAudits, setPreviousAudits] = useState<AuditReport[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [urlError, setUrlError] = useState<string>("");
  const [auditError, setAuditError] = useState<string>("");

  // Load previous audits on component mount
  useEffect(() => {
    loadPreviousAudits();
  }, []);

  const loadPreviousAudits = async () => {
    const result = await AuditService.getUserAudits(5);
    if (result.success && result.audits) {
      setPreviousAudits(result.audits);
    }
  };

  // Validate and normalize URL with flexible validation
  const validateAndNormalizeUrl = (inputUrl: string): { isValid: boolean; normalizedUrl: string; error: string } => {
    if (!inputUrl.trim()) {
      return { isValid: false, normalizedUrl: '', error: 'URL é obrigatória' };
    }

    let normalizedUrl = inputUrl.trim().toLowerCase();
    
    // Remove common prefixes that users might add
    normalizedUrl = normalizedUrl.replace(/^(https?:\/\/)?(www\.)?/, '');
    
    // Add https:// and www. for better compatibility
    normalizedUrl = 'https://www.' + normalizedUrl;
    
    try {
      const urlObj = new URL(normalizedUrl);
      
      // Basic validation - hostname should exist and have reasonable length
      if (!urlObj.hostname || urlObj.hostname.length < 4) {
        return { isValid: false, normalizedUrl, error: 'URL inválida' };
      }
      
      // More flexible domain pattern that accepts:
      // - Subdomains (www, blog, api, etc.)
      // - Multiple levels (example.com.br, subdomain.example.com)
      // - Hyphens and numbers in domain names
      // - International domains
      const domainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
      
      if (!domainPattern.test(urlObj.hostname)) {
        return { isValid: false, normalizedUrl, error: 'Formato de domínio inválido' };
      }
      
      // Check if domain has at least one dot and valid TLD
      const parts = urlObj.hostname.split('.');
      if (parts.length < 2 || parts[parts.length - 1].length < 2) {
        return { isValid: false, normalizedUrl, error: 'Domínio deve ter uma extensão válida' };
      }
      
      return { isValid: true, normalizedUrl, error: '' };
    } catch {
      return { isValid: false, normalizedUrl, error: 'Formato de URL inválido' };
    }
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setUrlError('');
    setAuditError('');
    
    // Only validate if user has typed something substantial and paused
    if (value.trim() && value.length > 3) {
      // Use a timeout to avoid validating while user is still typing
      const timeoutId = setTimeout(() => {
        const validation = validateAndNormalizeUrl(value);
        if (!validation.isValid && value.length > 5) {
          setUrlError(validation.error);
        }
      }, 1000);
      
      // Clear timeout if component unmounts or value changes quickly
      return () => clearTimeout(timeoutId);
    }
  };

  const handleAudit = async () => {
    const validation = validateAndNormalizeUrl(url);
    
    if (!validation.isValid) {
      setUrlError(validation.error);
      return;
    }
    
    setIsScanning(true);
    setResults(null);
    setOverallScore(0);
    setCurrentAuditId(null);
    setAuditError('');
    
    try {
      const result = await AuditService.startAudit(validation.normalizedUrl, focusKeyword.trim() || undefined);
      
      if (result.success && result.auditId) {
        setCurrentAuditId(result.auditId);
        setUrl(validation.normalizedUrl); // Update with normalized URL
        toast({
          title: "Auditoria iniciada",
          description: "Analisando seu site... isso pode levar alguns minutos.",
        });
        
        // Poll for results
        pollAuditStatus(result.auditId);
      } else {
        throw new Error(result.error || 'Failed to start audit');
      }
    } catch (error) {
      console.error('Error starting audit:', error);
      setAuditError(error.message || 'Falha ao iniciar auditoria');
      toast({
        title: "Erro",
        description: "Falha ao iniciar auditoria. Verifique a URL e tente novamente.",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  const pollAuditStatus = async (auditId: string) => {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;
    
    const poll = async () => {
      attempts++;
      
      try {
        const result = await AuditService.getAuditStatus(auditId);
        
        if (result.success && result.report) {
          const report = result.report;
          
          if (report.status === 'completed' && report.categories) {
            setResults(report.categories);
            setOverallScore(report.overall_score);
            setIsScanning(false);
            setAuditError('');
            loadPreviousAudits(); // Refresh the history
            
            toast({
              title: "Auditoria concluída",
              description: `Score geral: ${report.overall_score}%`,
            });
            return;
          } else if (report.status === 'failed') {
            const errorMsg = report.metadata?.error || 'Falha na auditoria';
            setAuditError(errorMsg);
            setIsScanning(false);
            toast({
              title: "Auditoria falhou",
              description: errorMsg,
              variant: "destructive",
            });
            return; // Stop polling
          } else if (attempts < maxAttempts) {
            // Continue polling
            setTimeout(poll, 5000); // Poll every 5 seconds
          } else {
            throw new Error('Auditoria expirou - tempo limite excedido');
          }
        } else {
          throw new Error(result.error || 'Failed to get audit status');
        }
      } catch (error) {
        console.error('Error polling audit status:', error);
        setIsScanning(false);
        toast({
          title: "Erro",
          description: "Falha ao obter resultados da auditoria.",
          variant: "destructive",
        });
      }
    };
    
    poll();
  };

  const loadPreviousAudit = async (auditId: string) => {
    try {
      const result = await AuditService.getAuditStatus(auditId);
      
      if (result.success && result.report && result.report.categories) {
        setResults(result.report.categories);
        setOverallScore(result.report.overall_score);
        setUrl(result.report.url);
        setShowHistory(false);
      }
    } catch (error) {
      console.error('Error loading previous audit:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar auditoria anterior.",
        variant: "destructive",
      });
    }
  };

  const deletePreviousAudit = async (auditId: string) => {
    try {
      const result = await AuditService.deleteAudit(auditId);
      
      if (result.success) {
        loadPreviousAudits();
        toast({
          title: "Auditoria excluída",
          description: "A auditoria foi removida com sucesso.",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error deleting audit:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir auditoria.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-yellow-600';
      case 'needs_improvement': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'good': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'needs_improvement': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
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
      case 'images': return 'Imagens';
      case 'keyword_optimization': return 'Otimização de Palavras-chave';
      case 'content_structure': return 'Estrutura de Conteúdo';
      case 'technical_seo': return 'SEO Técnico';
      case 'readability': return 'Legibilidade';
      case 'ai_search_optimization': return 'Otimização para IAs';
      default: return category;
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
              Análise técnica completa do seu site para identificar oportunidades de otimização para mecanismos de busca e IAs
            </p>
          </div>

          {/* Formulário de Auditoria */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Iniciar Auditoria
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setUrl('https://example.com')}
                    disabled={isScanning}
                  >
                    🧪 Site Teste
                  </Button>
                  {previousAudits.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setShowHistory(!showHistory)}
                    >
                      <History className="h-4 w-4 mr-2" />
                      Histórico ({previousAudits.length})
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Digite a URL do site (ex: example.com, www.seusite.com.br)"
                      value={url}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      disabled={isScanning}
                      className={`${urlError ? 'border-red-500' : url.length > 5 ? 'border-green-500' : ''}`}
                    />
                    {urlError && url.length > 5 && (
                      <p className="text-sm text-red-500 mt-1">{urlError}</p>
                    )}
                    {url && !urlError && url.length > 3 && (() => {
                      const validation = validateAndNormalizeUrl(url);
                      return validation.isValid && validation.normalizedUrl !== url ? (
                        <p className="text-sm text-green-600 mt-1">
                          ✓ URL será normalizada para: {validation.normalizedUrl}
                        </p>
                      ) : validation.isValid ? (
                        <p className="text-sm text-green-600 mt-1">✓ URL válida</p>
                      ) : null;
                    })()}
                  </div>
                  <Button 
                    onClick={handleAudit}
                    disabled={isScanning || !url.trim() || !!urlError}
                    className="min-w-[120px]"
                  >
                    {isScanning ? "Analisando..." : "Auditar"}
                  </Button>
                </div>
                <div className="flex gap-4">
                  <Input
                    placeholder="Palavra-chave principal (opcional) - ex: marketing digital"
                    value={focusKeyword}
                    onChange={(e) => setFocusKeyword(e.target.value)}
                    disabled={isScanning}
                    className="flex-1"
                  />
                  <div className="min-w-[120px] flex items-center text-sm text-muted-foreground">
                    Palavra-chave foco
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status do Sistema */}
          <SystemStatusPanel />

          {/* Painel de Testes */}
          <AuditTestPanel />

          {/* Monitor da Edge Function */}
          <EdgeFunctionMonitor />

          {/* Histórico de Auditorias */}
          {showHistory && previousAudits.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Auditorias Anteriores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {previousAudits.map((audit) => (
                    <div 
                      key={audit.id} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{audit.url}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(audit.created_at).toLocaleDateString('pt-BR')} - 
                          Score: {audit.overall_score}%
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={audit.status === 'completed' ? 'default' : 
                                      audit.status === 'failed' ? 'destructive' : 'secondary'}>
                          {audit.status === 'completed' ? 'Completa' :
                           audit.status === 'failed' ? 'Falhou' :
                           audit.status === 'analyzing' ? 'Analisando' : 'Pendente'}
                        </Badge>
                        {audit.status === 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadPreviousAudit(audit.id)}
                          >
                            Ver
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deletePreviousAudit(audit.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {auditError && !isScanning && (
            <Card className="mb-8 border-red-200">
              <CardContent className="py-6">
                <div className="text-center">
                  <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-red-700 mb-2">Erro na Auditoria</h3>
                  <p className="text-red-600 mb-4">{auditError}</p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Possíveis causas:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>URL inacessível ou site fora do ar</li>
                      <li>Bloqueio por robots.txt ou firewall</li>
                      <li>Formato de URL inválido</li>
                      <li>Timeout de conexão</li>
                    </ul>
                  </div>
                  <Button 
                    onClick={() => {
                      setAuditError('');
                      setUrl('');
                    }}
                    variant="outline"
                    className="mt-4"
                  >
                    Tentar Nova URL
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isScanning && (
            <Card className="mb-8">
              <CardContent className="py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <h3 className="text-lg font-semibold mb-2">Analisando seu site...</h3>
                    <p className="text-muted-foreground mb-4">
                      Verificando meta tags, estrutura, performance, otimização para IAs e muito mais
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Este processo pode levar alguns minutos para uma análise completa
                    </p>
                    <Progress value={33} className="max-w-md mx-auto" />
                    {currentAuditId && (
                      <p className="text-xs text-muted-foreground mt-2">
                        ID da auditoria: {currentAuditId}
                      </p>
                    )}
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
                          {getCategoryName(result.category)}
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
                                {issue.recommendation && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    💡 {issue.recommendation}
                                  </div>
                                )}
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
                    {/* High Priority Issues */}
                    {(() => {
                      const highPriorityIssues = results?.flatMap(result => 
                        result.issues.filter(issue => issue.priority === 'high')
                      ) || [];
                      
                      return highPriorityIssues.length > 0 && (
                        <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 rounded-lg">
                          <h4 className="font-semibold text-red-800 dark:text-red-400 mb-2">Prioridade Alta</h4>
                          <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
                            {highPriorityIssues.slice(0, 5).map((issue, index) => (
                              <li key={index}>• {issue.message}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    })()}
                    
                    {/* Medium Priority Issues */}
                    {(() => {
                      const mediumPriorityIssues = results?.flatMap(result => 
                        result.issues.filter(issue => issue.priority === 'medium')
                      ) || [];
                      
                      return mediumPriorityIssues.length > 0 && (
                        <div className="p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800 rounded-lg">
                          <h4 className="font-semibold text-yellow-800 dark:text-yellow-400 mb-2">Prioridade Média</h4>
                          <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                            {mediumPriorityIssues.slice(0, 5).map((issue, index) => (
                              <li key={index}>• {issue.message}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    })()}
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