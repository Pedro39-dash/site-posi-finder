import { useState, useEffect } from "react";
import { Plus, X, Target, ArrowRight, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useProjects } from "@/contexts/ProjectContext";
import { CompetitorAnalysisService } from "@/services/competitorAnalysisService";
import { toast } from "sonner";

interface DirectCompetitiveFormProps {
  onAnalysisStarted: (analysisId: string) => void;
}

const DirectCompetitiveForm = ({ onAnalysisStarted }: DirectCompetitiveFormProps) => {
  const { projects, selectedProject, setSelectedProject } = useProjects();
  
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

  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    setSelectedProject(project || null);
  };

  const addCompetitor = () => {
    if (newCompetitor.trim() && !competitors.includes(newCompetitor.trim())) {
      const cleanedCompetitor = newCompetitor.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
      if (cleanedCompetitor !== clientDomain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]) {
        setCompetitors([...competitors, cleanedCompetitor]);
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
        null, // No audit required
        clientDomain,
        competitors,
        selectedKeywords
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

  return (
    <Card className="bg-sidebar-primary border-sidebar-border">
      <CardHeader className="border-b border-sidebar-border">
        <CardTitle className="flex items-center gap-2 text-sidebar-foreground">
          <Target className="h-5 w-5 text-primary" />
          Análise Competitiva SEO
        </CardTitle>
        <CardDescription className="text-sidebar-muted-foreground">
          Analise seu site diretamente comparando com concorrentes usando dados reais do Google. A análise coletará automaticamente os dados necessários durante o processo.
        </CardDescription>
      </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Data Source Selection */}
            <div className="space-y-3">
              <Label className="text-sidebar-foreground">Selecionar Projeto (Opcional)</Label>
              <Select
                value={selectedProject?.id || ""}
                onValueChange={handleProjectChange}
              >
                <SelectTrigger className="bg-sidebar-background border-sidebar-border text-sidebar-foreground">
                  <SelectValue placeholder="Carregar dados de um projeto" />
                </SelectTrigger>
                <SelectContent className="bg-sidebar-background border-sidebar-border">
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id} className="text-sidebar-foreground hover:bg-sidebar-accent">
                      <div className="flex flex-col">
                        <span className="font-medium">{project.name}</span>
                        <span className="text-sm text-sidebar-muted-foreground">{project.mainDomain}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator className="bg-sidebar-border" />

            {/* Client Domain */}
            <div className="space-y-3">
              <Label htmlFor="client-domain" className="text-sidebar-foreground">Site do Cliente *</Label>
              <Input
                id="client-domain"
                type="text"
                placeholder="meusite.com.br"
                value={clientDomain}
                onChange={(e) => setClientDomain(e.target.value)}
                className="bg-sidebar-background border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-muted-foreground focus:border-primary"
              />
            </div>

            {/* Competitors */}
            <div className="space-y-4">
              <Label className="text-sidebar-foreground">Concorrentes *</Label>
              
              <div className="flex gap-2">
                <Input
                  placeholder="concorrente.com"
                  value={newCompetitor}
                  onChange={(e) => setNewCompetitor(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCompetitor())}
                  className="flex-1 bg-sidebar-background border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-muted-foreground focus:border-primary"
                />
                <Button type="button" onClick={addCompetitor} variant="outline" size="icon" className="border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {competitors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-sidebar-muted-foreground">Concorrentes adicionados:</p>
                  <div className="flex flex-wrap gap-2">
                    {competitors.map((competitor) => (
                      <Badge key={competitor} variant="secondary" className="flex items-center gap-1 bg-sidebar-accent text-sidebar-accent-foreground">
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
                      <p className="text-xs font-medium text-sidebar-foreground">{clientDomain}</p>
                    </div>
                    
                    <ArrowRight className="h-5 w-5 text-sidebar-muted-foreground" />
                    <div className="text-sm font-medium text-sidebar-muted-foreground">VS</div>
                    <ArrowRight className="h-5 w-5 text-sidebar-muted-foreground" />
                    
                    <div className="text-center">
                      <div className="w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center mb-2">
                        <span className="text-destructive font-bold">{competitors.length}</span>
                      </div>
                      <p className="text-xs font-medium text-sidebar-foreground">
                        {competitors.length === 1 ? competitors[0] : `${competitors.length} concorrentes`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Keywords */}
            <div className="space-y-4">
              <Label className="text-sidebar-foreground">Palavras-chave *</Label>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar palavra-chave"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                  className="flex-1 bg-sidebar-background border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-muted-foreground focus:border-primary"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addKeyword}
                  disabled={!newKeyword.trim()}
                  className="border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {selectedKeywords.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-sidebar-muted-foreground">Palavras-chave selecionadas ({selectedKeywords.length}):</p>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {selectedKeywords.map((keyword, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1 bg-sidebar-accent text-sidebar-accent-foreground"
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
                  <p className="text-sm text-sidebar-muted-foreground">
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
                        className="text-xs h-7 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent"
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
            <Alert className="bg-sidebar-background border-sidebar-border">
              <Target className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sidebar-foreground">
                <strong>Análise Competitiva:</strong> Compararemos o desempenho SEO do seu site com os concorrentes usando dados reais do Google. A edge function possui fallbacks automáticos caso as APIs não estejam configuradas.
              </AlertDescription>
            </Alert>

            {/* Requirements Check */}
            {(!clientDomain.trim() || competitors.length === 0 || selectedKeywords.length === 0) && (
              <Alert className="border-primary/30 bg-primary/10">
                <AlertDescription className="text-sidebar-foreground">
                  <strong>Para iniciar a análise, você precisa:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
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
              disabled={!clientDomain.trim() || competitors.length === 0 || selectedKeywords.length === 0 || loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
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
  );
};

export default DirectCompetitiveForm;