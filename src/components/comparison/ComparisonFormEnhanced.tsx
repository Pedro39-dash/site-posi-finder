import { useState, useEffect } from "react";
import { Search, ArrowRight, Plus, X, Edit3 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useProjects } from "@/contexts/ProjectContext";
import { toast } from "sonner";

interface ComparisonFormEnhancedProps {
  onCompare: (data: { websites: string[]; keywords: string[]; projectName?: string }) => void;
}

const ComparisonFormEnhanced = ({ onCompare }: ComparisonFormEnhancedProps) => {
  const { projects, selectedProject, setSelectedProject } = useProjects();
  const [competitorDomain, setCompetitorDomain] = useState("");
  const [customKeywords, setCustomKeywords] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingKeywords, setIsEditingKeywords] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");

  useEffect(() => {
    if (selectedProject) {
      // Auto-seleciona as palavras-chave do projeto
      const projectKeywords = selectedProject.keywords.map(k => k.keyword);
      setSelectedKeywords(projectKeywords);
      setCustomKeywords(projectKeywords.join(", "));
    }
  }, [selectedProject]);

  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    setSelectedProject(project || null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProject) {
      toast.error("Selecione um projeto para comparar");
      return;
    }

    if (!competitorDomain.trim()) {
      toast.error("Digite o domínio do concorrente");
      return;
    }

    // Valida domínio do concorrente
    const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(competitorDomain.trim())) {
      toast.error("Digite um domínio válido para o concorrente");
      return;
    }

    const keywordsToAnalyze = customKeywords
      .split(",")
      .map(k => k.trim())
      .filter(k => k.length > 0);

    if (keywordsToAnalyze.length === 0) {
      toast.error("Digite pelo menos uma palavra-chave");
      return;
    }

    setIsLoading(true);
    
    setTimeout(() => {
      onCompare({
        websites: [selectedProject.mainDomain, competitorDomain.trim()],
        keywords: keywordsToAnalyze,
        projectName: selectedProject.name
      });
      setIsLoading(false);
    }, 1000);
  };

  const addSuggestedKeyword = (keyword: string) => {
    const currentKeywords = customKeywords
      .split(",")
      .map(k => k.trim())
      .filter(k => k.length > 0);
    
    if (!currentKeywords.includes(keyword)) {
      const newKeywords = [...currentKeywords, keyword];
      setCustomKeywords(newKeywords.join(", "));
      setSelectedKeywords(newKeywords);
    }
  };

  const addNewKeyword = () => {
    if (newKeyword.trim()) {
      addSuggestedKeyword(newKeyword.trim());
      setNewKeyword("");
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    const currentKeywords = customKeywords
      .split(",")
      .map(k => k.trim())
      .filter(k => k.length > 0 && k !== keywordToRemove);
    
    setCustomKeywords(currentKeywords.join(", "));
    setSelectedKeywords(currentKeywords);
  };

  const getKeywordsList = () => {
    return customKeywords
      .split(",")
      .map(k => k.trim())
      .filter(k => k.length > 0);
  };

  const competitorSuggestions = selectedProject
    ? selectedProject.competitors.slice(0, 3)
    : [];

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Comparação Competitiva
          </CardTitle>
          <CardDescription>
            Compare seu site com concorrentes usando suas palavras-chave estratégicas
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seleção de Projeto */}
            <div className="space-y-2">
              <Label htmlFor="project">Seu Projeto *</Label>
              <Select
                value={selectedProject?.id || ""}
                onValueChange={handleProjectChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um projeto para comparar" />
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
              
              {selectedProject && (
                <div className="flex items-center gap-2 p-3 bg-accent/20 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{selectedProject.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedProject.mainDomain}</p>
                  </div>
                  <Badge variant="secondary">Score: {selectedProject.currentScore}</Badge>
                </div>
              )}
            </div>

            {/* Visualização do Confronto */}
            {selectedProject && (
              <div className="flex items-center justify-center py-4">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-2">
                      <span className="text-primary font-bold text-xl">VS</span>
                    </div>
                    <p className="text-sm font-medium">Seu Site</p>
                    <p className="text-xs text-muted-foreground">{selectedProject.mainDomain}</p>
                  </div>
                  
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mb-2">
                      <span className="text-destructive font-bold text-xl">?</span>
                    </div>
                    <p className="text-sm font-medium">Concorrente</p>
                    <p className="text-xs text-muted-foreground">
                      {competitorDomain || "Digite o domínio"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Domínio do Concorrente */}
            <div className="space-y-2">
              <Label htmlFor="competitor">Domínio do Concorrente *</Label>
              <Input
                id="competitor"
                type="text"
                placeholder="concorrente.com.br"
                value={competitorDomain}
                onChange={(e) => setCompetitorDomain(e.target.value)}
                disabled={!selectedProject}
              />
              
              {/* Sugestões de Concorrentes */}
              {competitorSuggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Concorrentes cadastrados:</p>
                  <div className="flex flex-wrap gap-2">
                    {competitorSuggestions.map((competitor) => (
                      <Button
                        key={competitor.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCompetitorDomain(competitor.domain)}
                        className="text-xs"
                      >
                        {competitor.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Palavras-chave */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="keywords">Palavras-chave para Comparação *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingKeywords(!isEditingKeywords)}
                  className="text-xs"
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  {isEditingKeywords ? "Modo Lista" : "Editar Manualmente"}
                </Button>
              </div>

              {isEditingKeywords ? (
                /* Modo de Edição Manual */
                <textarea
                  id="keywords"
                  className="w-full min-h-[100px] p-3 border rounded-md resize-none"
                  placeholder="Digite as palavras-chave separadas por vírgula"
                  value={customKeywords}
                  onChange={(e) => {
                    setCustomKeywords(e.target.value);
                    setSelectedKeywords(e.target.value.split(",").map(k => k.trim()).filter(k => k.length > 0));
                  }}
                  disabled={!selectedProject}
                />
              ) : (
                /* Modo Visual com Tags */
                <div className="space-y-3">
                  {/* Keywords Selecionadas */}
                  <div className="min-h-[80px] p-3 border rounded-md bg-background">
                    {getKeywordsList().length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {getKeywordsList().map((keyword, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="flex items-center gap-1 text-sm py-1 px-2"
                          >
                            {keyword}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeKeyword(keyword)}
                              className="h-4 w-4 p-0 hover:bg-destructive/20 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        Selecione palavras-chave do projeto ou adicione manualmente
                      </p>
                    )}
                  </div>

                  {/* Adicionar Nova Keyword */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Adicionar nova palavra-chave"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addNewKeyword())}
                      disabled={!selectedProject}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addNewKeyword}
                      disabled={!selectedProject || !newKeyword.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              <Separator />
              
              {/* Sugestões de Palavras-chave do Projeto */}
              {selectedProject && selectedProject.keywords.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Palavras-chave do seu projeto ({selectedProject.keywords.length}):
                  </p>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {selectedProject.keywords.map((keyword) => {
                      const isSelected = getKeywordsList().includes(keyword.keyword);
                      return (
                        <Button
                          key={keyword.id}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => 
                            isSelected 
                              ? removeKeyword(keyword.keyword)
                              : addSuggestedKeyword(keyword.keyword)
                          }
                          className="text-xs h-8"
                        >
                          {isSelected && <X className="h-3 w-3 mr-1" />}
                          {!isSelected && <Plus className="h-3 w-3 mr-1" />}
                          {keyword.keyword}
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {keyword.searchVolume.toLocaleString()}
                          </Badge>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Botão de Comparação */}
            <Button
              type="submit"
              disabled={!selectedProject || !competitorDomain.trim() || !customKeywords.trim() || isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analisando posições...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Comparar Posições SEO
                </span>
              )}
            </Button>
            
            {!selectedProject && (
              <p className="text-sm text-muted-foreground text-center">
                Selecione um projeto para habilitar a comparação
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComparisonFormEnhanced;