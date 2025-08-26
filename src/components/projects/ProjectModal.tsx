import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useProjects, Project, Competitor, ProjectKeyword } from "@/contexts/ProjectContext";
import { toast } from "sonner";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
}

const SECTORS = [
  "E-commerce",
  "Serviços",
  "Conteúdo",
  "SaaS",
  "Educação",
  "Saúde",
  "Imobiliário",
  "Tecnologia",
  "Alimentação",
  "Moda",
  "Outros"
];

const PRIORITIES = [
  { value: "high", label: "Alta", color: "destructive" },
  { value: "medium", label: "Média", color: "secondary" },
  { value: "low", label: "Baixa", color: "outline" }
] as const;

const ProjectModal = ({ isOpen, onClose, project }: ProjectModalProps) => {
  const { createProject, updateProject, deleteProject } = useProjects();
  const [formData, setFormData] = useState({
    name: "",
    mainDomain: "",
    sector: ""
  });
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [keywords, setKeywords] = useState<ProjectKeyword[]>([]);
  const [newCompetitor, setNewCompetitor] = useState({ domain: "", name: "" });
  const [newKeyword, setNewKeyword] = useState({ 
    keyword: "", 
    searchVolume: "", 
    priority: "medium" as const 
  });

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        mainDomain: project.mainDomain,
        sector: project.sector
      });
      setCompetitors(project.competitors);
      setKeywords(project.keywords);
    } else {
      setFormData({ name: "", mainDomain: "", sector: "" });
      setCompetitors([]);
      setKeywords([]);
    }
    setNewCompetitor({ domain: "", name: "" });
    setNewKeyword({ keyword: "", searchVolume: "", priority: "medium" });
  }, [project, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.mainDomain || !formData.sector) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Valida domínio
    const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(formData.mainDomain)) {
      toast.error("Digite um domínio válido (ex: exemplo.com.br)");
      return;
    }

    const projectData = {
      ...formData,
      competitors,
      keywords
    };

    if (project) {
      updateProject(project.id, projectData);
      toast.success("Projeto atualizado com sucesso!");
    } else {
      createProject(projectData);
      toast.success("Projeto criado com sucesso!");
    }
    
    onClose();
  };

  const handleDelete = () => {
    if (project && window.confirm("Tem certeza que deseja excluir este projeto?")) {
      deleteProject(project.id);
      toast.success("Projeto excluído com sucesso!");
      onClose();
    }
  };

  const addCompetitor = () => {
    if (!newCompetitor.domain || !newCompetitor.name) {
      toast.error("Preencha o domínio e nome do concorrente");
      return;
    }

    const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(newCompetitor.domain)) {
      toast.error("Digite um domínio válido");
      return;
    }

    const competitor: Competitor = {
      id: Date.now().toString(),
      domain: newCompetitor.domain,
      name: newCompetitor.name,
      addedAt: new Date()
    };

    setCompetitors([...competitors, competitor]);
    setNewCompetitor({ domain: "", name: "" });
  };

  const removeCompetitor = (id: string) => {
    setCompetitors(competitors.filter(c => c.id !== id));
  };

  const addKeyword = () => {
    if (!newKeyword.keyword || !newKeyword.searchVolume) {
      toast.error("Preencha a palavra-chave e volume de busca");
      return;
    }

    const volume = parseInt(newKeyword.searchVolume);
    if (isNaN(volume) || volume < 0) {
      toast.error("Volume de busca deve ser um número válido");
      return;
    }

    const keyword: ProjectKeyword = {
      id: Date.now().toString(),
      keyword: newKeyword.keyword,
      searchVolume: volume,
      priority: newKeyword.priority
    };

    setKeywords([...keywords, keyword]);
    setNewKeyword({ keyword: "", searchVolume: "", priority: "medium" });
  };

  const removeKeyword = (id: string) => {
    setKeywords(keywords.filter(k => k.id !== id));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {project ? "Editar Projeto" : "Novo Projeto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Projeto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Site Principal da Empresa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Domínio Principal *</Label>
              <Input
                id="domain"
                value={formData.mainDomain}
                onChange={(e) => setFormData({ ...formData, mainDomain: e.target.value })}
                placeholder="exemplo.com.br"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="sector">Setor *</Label>
              <Select
                value={formData.sector}
                onValueChange={(value) => setFormData({ ...formData, sector: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  {SECTORS.map((sector) => (
                    <SelectItem key={sector} value={sector}>
                      {sector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Concorrentes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Concorrentes</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input
                placeholder="Domínio do concorrente"
                value={newCompetitor.domain}
                onChange={(e) => setNewCompetitor({ ...newCompetitor, domain: e.target.value })}
              />
              <Input
                placeholder="Nome do concorrente"
                value={newCompetitor.name}
                onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
              />
              <Button type="button" onClick={addCompetitor} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {competitors.map((competitor) => (
                <Badge key={competitor.id} variant="secondary" className="gap-2">
                  {competitor.name}
                  <button
                    type="button"
                    onClick={() => removeCompetitor(competitor.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Palavras-chave */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Palavras-chave</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <Input
                placeholder="Palavra-chave"
                value={newKeyword.keyword}
                onChange={(e) => setNewKeyword({ ...newKeyword, keyword: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Volume de busca"
                value={newKeyword.searchVolume}
                onChange={(e) => setNewKeyword({ ...newKeyword, searchVolume: e.target.value })}
              />
              <Select
                value={newKeyword.priority}
                onValueChange={(value: any) => setNewKeyword({ ...newKeyword, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={addKeyword} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>

            <div className="space-y-2">
              {keywords.map((keyword) => (
                <div key={keyword.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{keyword.keyword}</span>
                    <Badge variant="outline">{keyword.searchVolume.toLocaleString()} buscas</Badge>
                    <Badge 
                      variant={PRIORITIES.find(p => p.value === keyword.priority)?.color || "secondary"}
                    >
                      {PRIORITIES.find(p => p.value === keyword.priority)?.label}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeKeyword(keyword.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-between pt-4">
            <div>
              {project && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir Projeto
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {project ? "Atualizar" : "Criar"} Projeto
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectModal;