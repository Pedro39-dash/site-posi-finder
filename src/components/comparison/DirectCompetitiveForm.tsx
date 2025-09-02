import { useState, useEffect } from "react";
import { Search, Plus, X, Target, ArrowRight, RefreshCw, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useProjects } from "@/contexts/ProjectContext";
import { AuditService, AuditReport } from "@/services/auditService";
import { CompetitorAnalysisService } from "@/services/competitorAnalysisService";
import { toast } from "sonner";

interface DirectCompetitiveFormProps {
  onAnalysisStarted: (analysisId: string) => void;
}

const DirectCompetitiveForm = ({ onAnalysisStarted }: DirectCompetitiveFormProps) => {
  const { projects, selectedProject, setSelectedProject } = useProjects();
  
  // Project and audit data
  const [audits, setAudits] = useState<AuditReport[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<string>("");
  const [loadingAudits, setLoadingAudits] = useState(true);
  
  // Form data
  const [clientDomain, setClientDomain] = useState<string>("");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [newCompetitor, setNewCompetitor] = useState<string>("");
  const [customKeywords, setCustomKeywords] = useState<string>("");
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  
  // UI states
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserAudits();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      setClientDomain(selectedProject.mainDomain);
      // Auto-load project keywords
      const projectKeywords = selectedProject.keywords.map(k => k.keyword);
      setSelectedKeywords(projectKeywords);
      setCustomKeywords(projectKeywords.join(", "));
      
      // Auto-load project competitors
      const projectCompetitors = selectedProject.competitors.map(c => c.domain);
      setCompetitors(projectCompetitors);
    }
  }, [selectedProject]);

  const loadUserAudits = async () => {
    try {
      setLoadingAudits(true);
      const result = await AuditService.getUserAudits(20);
      if (result.success && result.audits) {
        const completedAudits = result.audits.filter(audit => audit.status === 'completed');
        setAudits(completedAudits);
      }
    } catch (error) {
      console.error('Error loading audits:', error);
    } finally {
      setLoadingAudits(false);
    }
  };

  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    setSelectedProject(project || null);
  };

  const handleAuditSelect = (auditId: string) => {
    setSelectedAudit(auditId);
    const selectedAuditData = audits.find(audit => audit.id === auditId);
    if (selectedAuditData) {
      const domain = extractDomainFromUrl(selectedAuditData.url);
      setClientDomain(domain);
    }
  };

  const extractDomainFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    }
  };

  const addCompetitor = () => {
    if (newCompetitor.trim() && !competitors.includes(newCompetitor.trim())) {
      const domain = extractDomainFromUrl(newCompetitor.trim());
      if (domain !== clientDomain) {
        setCompetitors([...competitors, domain]);
        setNewCompetitor("");
      } else {
        toast.error("Não é possível adicionar o próprio domínio como concorrente");
      }
    }
  };

  const removeCompetitor = (competitor: string) => {
    setCompetitors(competitors.filter(c => c !== competitor));
  };

  const addKeyword = () => {
    if (newKeyword.trim()) {
      const keyword = newKeyword.trim();
      if (!selectedKeywords.includes(keyword)) {
        const newKeywords = [...selectedKeywords, keyword];
        setSelectedKeywords(newKeywords);
        setCustomKeywords(newKeywords.join(", "));
        setNewKeyword("");
      }
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    const newKeywords = selectedKeywords.filter(k => k !== keywordToRemove);
    setSelectedKeywords(newKeywords);
    setCustomKeywords(newKeywords.join(", "));
  };

  const addSuggestedKeyword = (keyword: string) => {
    if (!selectedKeywords.includes(keyword)) {
      const newKeywords = [...selectedKeywords, keyword];
      setSelectedKeywords(newKeywords);
      setCustomKeywords(newKeywords.join(", "));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!selectedAudit) {
      toast.error("Selecione uma auditoria base para realizar a análise");
      return;
    }

    if (!clientDomain.trim()) {
      toast.error("Digite o domínio do cliente");
      return;
    }

    if (competitors.length === 0) {
      toast.error("Adicione pelo menos um concorrente");
      return;
    }

    if (selectedKeywords.length === 0) {
      toast.error("Digite pelo menos uma palavra-chave");
      return;
    }

    try {
      setLoading(true);
      
      const result = await CompetitorAnalysisService.startAnalysis(
        selectedAudit,
        clientDomain,
        competitors
      );

      if (result.success && result.analysisId) {
        toast.success("Análise competitiva iniciada com sucesso");
        onAnalysisStarted(result.analysisId);
      } else {
        toast.error(result.error || "Falha ao iniciar análise competitiva");
      }
    } catch (error) {
      toast.error("Erro inesperado ao iniciar análise");
      console.error('Error starting analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAuditScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">Excelente</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Bom</Badge>;
    if (score >= 40) return <Badge className="bg-orange-100 text-orange-800">Regular</Badge>;
    return <Badge className="bg-red-100 text-red-800">Precisa Melhorar</Badge>;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Análise Competitiva SEO
          </CardTitle>
          <CardDescription>
            Compare seu site com concorrentes usando dados reais do Google. Selecione uma auditoria base para iniciar a análise.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Data Source Selection */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Project Selection */}
              <div className="space-y-3">
                <Label>Selecionar Projeto (Opcional)</Label>
                <Select
                  value={selectedProject?.id || ""}
                  onValueChange={handleProjectChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Carregar dados de um projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{project.name}</span>
                          <span className="text-sm text-muted-foreground">{project.mainDomain}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Audit Selection */}
              <div className="space-y-3">
                <Label>Auditoria Base *</Label>
                {loadingAudits ? (
                  <div className="flex items-center gap-2 p-3 border rounded-md">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Carregando auditorias...</span>
                  </div>
                ) : audits.length > 0 ? (
                  <Select value={selectedAudit} onValueChange={handleAuditSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma auditoria base" />
                    </SelectTrigger>
                    <SelectContent>
                      {audits.map((audit) => (
                        <SelectItem key={audit.id} value={audit.id}>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <span className="truncate max-w-[200px]">
                                {extractDomainFromUrl(audit.url)}
                              </span>
                              {getAuditScoreBadge(audit.overall_score)}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                      <strong>Auditoria Obrigatória:</strong> Você precisa ter pelo menos uma auditoria SEO completada para realizar a análise competitiva. 
                      <br />
                      <a href="/audit" className="underline font-medium hover:text-amber-900 dark:hover:text-amber-100">
                        ➜ Criar sua primeira auditoria agora
                      </a>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            <Separator />

            {/* Client Domain */}
            <div className="space-y-3">
              <Label htmlFor="client-domain">Site do Cliente *</Label>
              <Input
                id="client-domain"
                type="text"
                placeholder="meusite.com.br"
                value={clientDomain}
                onChange={(e) => setClientDomain(e.target.value)}
              />
            </div>

            {/* Competitors */}
            <div className="space-y-4">
              <Label>Concorrentes *</Label>
              
              <div className="flex gap-2">
                <Input
                  placeholder="concorrente.com"
                  value={newCompetitor}
                  onChange={(e) => setNewCompetitor(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCompetitor())}
                  className="flex-1"
                />
                <Button type="button" onClick={addCompetitor} variant="outline" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {competitors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Concorrentes adicionados:</p>
                  <div className="flex flex-wrap gap-2">
                    {competitors.map((competitor) => (
                      <Badge key={competitor} variant="secondary" className="flex items-center gap-1">
                        {competitor}
                        <X 
                          className="h-3 w-3 cursor-pointer hover:text-destructive" 
                          onClick={() => removeCompetitor(competitor)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* VS Visual */}
              {clientDomain && competitors.length > 0 && (
                <div className="flex items-center justify-center py-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-2">
                        <span className="text-primary font-bold">1</span>
                      </div>
                      <p className="text-xs font-medium">{clientDomain}</p>
                    </div>
                    
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    <div className="text-sm font-medium text-muted-foreground">VS</div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    
                    <div className="text-center">
                      <div className="w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center mb-2">
                        <span className="text-destructive font-bold">{competitors.length}</span>
                      </div>
                      <p className="text-xs font-medium">
                        {competitors.length === 1 ? competitors[0] : `${competitors.length} concorrentes`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Keywords */}
            <div className="space-y-4">
              <Label>Palavras-chave *</Label>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar palavra-chave"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addKeyword}
                  disabled={!newKeyword.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {selectedKeywords.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Palavras-chave selecionadas ({selectedKeywords.length}):</p>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {selectedKeywords.map((keyword, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {keyword}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-destructive"
                          onClick={() => removeKeyword(keyword)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Project Keywords Suggestions */}
              {selectedProject && selectedProject.keywords && selectedProject.keywords.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Palavras-chave do projeto:
                  </p>
                  <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                    {selectedProject.keywords.filter(kw => !selectedKeywords.includes(kw.keyword)).map((keywordObj) => (
                      <Button
                        key={keywordObj.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addSuggestedKeyword(keywordObj.keyword)}
                        className="text-xs h-7"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {keywordObj.keyword}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Analysis Info */}
            <Alert>
              <Target className="h-4 w-4" />
              <AlertDescription>
                <strong>Análise Competitiva:</strong> Compararemos o desempenho SEO do seu site com os concorrentes usando dados reais do Google. A edge function possui fallbacks automáticos caso as APIs não estejam configuradas.
              </AlertDescription>
            </Alert>

            {/* Requirements Check */}
            {(!selectedAudit || !clientDomain.trim() || competitors.length === 0 || selectedKeywords.length === 0) && (
              <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  <strong>Para iniciar a análise, você precisa:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    {!selectedAudit && <li>• Selecionar uma auditoria base</li>}
                    {!clientDomain.trim() && <li>• Informar o domínio do cliente</li>}
                    {competitors.length === 0 && <li>• Adicionar pelo menos um concorrente</li>}
                    {selectedKeywords.length === 0 && <li>• Adicionar pelo menos uma palavra-chave</li>}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!selectedAudit || !clientDomain.trim() || competitors.length === 0 || selectedKeywords.length === 0 || loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Iniciando análise...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Iniciar Análise Competitiva
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DirectCompetitiveForm;