import { useState } from "react";
import { Plus, Building2, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProject } from "@/hooks/useProject";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ProjectSelectionModalProps {
  onComplete: () => void;
}

const ProjectSelectionModal = ({ onComplete }: ProjectSelectionModalProps) => {
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mainDomain: '',
    sector: ''
  });
  
  const { projects, createProject, setActiveProject } = useProject();
  const { user } = useAuth();

  const handleSelectProject = async (projectId: string) => {
    try {
      await setActiveProject(projectId);
      onComplete();
    } catch (error) {
      console.error('Error selecting project:', error);
      toast.error('Erro ao selecionar projeto');
    }
  };

  const handleCreateProject = async () => {
    if (!formData.name || !formData.mainDomain || !formData.sector) return;
    
    setIsCreating(true);
    try {
      await createProject({
        name: formData.name,
        domain: formData.mainDomain,
        market_segment: formData.sector,
        focus_keywords: [],
        competitor_domains: []
      });
      
      toast.success('Projeto criado com sucesso!');
      onComplete();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Erro ao criar projeto');
    } finally {
      setIsCreating(false);
    }
  };

  if (mode === 'create') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Criar Novo Projeto
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Vamos configurar o monitoramento SEO do seu domínio
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Nome do Projeto</Label>
              <Input
                id="projectName"
                placeholder="Ex: Minha Loja Online"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Domínio Principal</Label>
              <Input
                id="domain"
                placeholder="Ex: minhaloja.com.br"
                value={formData.mainDomain}
                onChange={(e) => setFormData(prev => ({ ...prev, mainDomain: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sector">Setor</Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, sector: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha o setor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="E-commerce">E-commerce</SelectItem>
                  <SelectItem value="Serviços">Serviços</SelectItem>
                  <SelectItem value="Conteúdo">Blog/Conteúdo</SelectItem>
                  <SelectItem value="Corporativo">Site Corporativo</SelectItem>
                  <SelectItem value="Local">Negócio Local</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setMode('select')}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button 
                onClick={handleCreateProject}
                disabled={!formData.name || !formData.mainDomain || !formData.sector || isCreating}
                className="flex-1"
              >
                {isCreating ? 'Criando...' : 'Criar Projeto'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Bem-vindo, {user?.email}!
          </CardTitle>
          <p className="text-muted-foreground">
            Para começar, selecione ou crie um projeto para monitorarmos o SEO do seu domínio.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {projects.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Seus Projetos Existentes</h3>
              <div className="grid gap-3">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleSelectProject(project.id)}
                    className="p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 rounded-lg p-2 group-hover:bg-primary/20 transition-colors">
                          <Globe className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{project.name}</h4>
                          <p className="text-sm text-muted-foreground">{project.domain}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">{project.market_segment || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground">
                          {project.focus_keywords?.length || 0} palavras-chave
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-6">
            <Button 
              onClick={() => setMode('create')} 
              className="w-full"
              size="lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Novo Projeto
            </Button>
            
            {projects.length > 0 && (
              <p className="text-sm text-muted-foreground text-center mt-3">
                Ou escolha um projeto existente acima
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectSelectionModal;