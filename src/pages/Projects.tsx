import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Plus, Search, GitCompare, BarChart3, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useProject } from "@/hooks/useProject";
import { useNavigate } from "react-router-dom";
import { ProjectModal } from "@/components/projects/ProjectModal";
import { toast } from "sonner";
import type { Project } from "@/services/projectService";

const Projects = () => {
  const { projects, deleteProject } = useProject();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());

  const handleCreateProject = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const handleEditProject = (projectId: string) => {
    setEditingProject(projectId);
    setIsModalOpen(true);
  };

  const handleAnalyze = () => {
    navigate("/monitoring");
  };

  const handleCompare = () => {
    navigate("/comparison");
  };

  const handleMonitor = () => {
    navigate("/monitoring");
  };

  const handleSelectAll = () => {
    if (selectedProjects.size === projects.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(projects.map(p => p.id)));
    }
  };

  const handleToggleProject = (projectId: string) => {
    const newSelected = new Set(selectedProjects);
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId);
    } else {
      newSelected.add(projectId);
    }
    setSelectedProjects(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedProjects.size === 0) return;
    
    if (!confirm(`Tem certeza que deseja excluir ${selectedProjects.size} projeto(s)?`)) {
      return;
    }

    try {
      const deletePromises = Array.from(selectedProjects).map(id => deleteProject(id));
      await Promise.all(deletePromises);
      
      toast.success(`${selectedProjects.size} projeto(s) excluído(s) com sucesso`);
      setSelectedProjects(new Set());
    } catch (error) {
      toast.error("Erro ao excluir projetos");
    }
  };

  const handleDeleteSingle = async (projectId: string, projectName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o projeto "${projectName}"?`)) {
      return;
    }

    try {
      await deleteProject(projectId);
      toast.success("Projeto excluído com sucesso");
      
      // Remove from selection if it was selected
      const newSelected = new Set(selectedProjects);
      newSelected.delete(projectId);
      setSelectedProjects(newSelected);
    } catch (error) {
      toast.error("Erro ao excluir projeto");
    }
  };

  return (
    <>
      <Helmet>
        <title>Projetos SEO - Dashboard</title>
        <meta 
          name="description" 
          content="Gerencie seus projetos SEO, monitore concorrentes e acompanhe o desempenho das suas palavras-chave." 
        />
        <meta name="keywords" content="projetos seo, gerenciamento seo, monitoramento palavras-chave" />
        <link rel="canonical" href="/projects" />
      </Helmet>

      <div className="min-h-screen bg-background lg:pl-80">
        <div className="pt-16 lg:pt-0">
          <main className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-4xl font-bold text-foreground">
                  Meus Projetos
                </h1>
                <p className="text-lg text-muted-foreground mt-2">
                  Gerencie seus sites, monitore concorrentes e acompanhe performance
                </p>
              </div>
              
              <div className="flex gap-2">
                {/* {selectedProjects.size > 0 && (
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteSelected}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir ({selectedProjects.size})
                  </Button>
                )} */}
                <Button onClick={handleCreateProject} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Projeto
                </Button>
              </div>
            </div>

            {/* Bulk Actions */}
            {/* {projects.length > 0 && (
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedProjects.size === projects.length}
                    onCheckedChange={handleSelectAll}
                    id="select-all"
                  />
                  <label 
                    htmlFor="select-all"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Selecionar todos
                  </label>
                </div>
                {selectedProjects.size > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {selectedProjects.size} de {projects.length} selecionado(s)
                  </span>
                )}
              </div>
            )} */}

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total de Projetos
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {projects.length}
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Projetos Ativos
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {projects.filter(p => p.is_active).length}
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-accent" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Palavras-chave
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {projects.reduce((acc, p) => acc + (p.focus_keywords?.length || 0), 0)}
                      </p>
                    </div>
                    <Search className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="flex items-center justify-between h-[50px] mb-6">
              {projects.length > 0 && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedProjects.size === projects.length}
                      onCheckedChange={handleSelectAll}
                      id="select-all"
                    />
                    <label 
                      htmlFor="select-all"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Selecionar todos
                    </label>
                  </div>
                  {selectedProjects.size > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {selectedProjects.size} de {projects.length} selecionado(s)
                    </span>
                  )}
                </div>
                )}
                {selectedProjects.size > 0 && (
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteSelected}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir ({selectedProjects.size})
                    </Button>
                  )}
            </div>
            {/* Projects Grid */}
            {projects.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Nenhum projeto criado</h3>
                  <p className="text-muted-foreground mb-6">
                    Crie seu primeiro projeto para começar a monitorar seu SEO
                  </p>
                  <Button onClick={handleCreateProject} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Criar Primeiro Projeto
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <Card key={project.id} className="hover:shadow-card transition-shadow duration-200">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedProjects.has(project.id)}
                          onCheckedChange={() => handleToggleProject(project.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{project.name}</CardTitle>
                              <CardDescription className="mt-1">
                                {project.domain}
                              </CardDescription>
                            </div>
                            {project.is_active && (
                              <Badge variant="default">Ativo</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="w-fit">
                        {project.market_segment || 'N/A'}
                      </Badge>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Concorrentes:</span>
                          <span className="font-medium">{project.competitor_domains?.length || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Palavras-chave:</span>
                          <span className="font-medium">{project.focus_keywords?.length || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Criado em:</span>
                          <span className="font-medium">
                            {new Date(project.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAnalyze()}
                        className="gap-1 flex-1"
                      >
                        <Search className="h-3 w-3" />
                        Monitorar dominio
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCompare()}
                        className="gap-1 flex-1"
                        disabled={(project.competitor_domains?.length || 0) === 0}
                      >
                        <GitCompare className="h-3 w-3" />
                        Comparar
                      </Button>
                      <div className="flex gap-2 w-full mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProject(project.id)}
                          className="flex-1"
                        >
                          Editar Projeto
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteSingle(project.id, project.name)}
                          className="gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <ProjectModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={editingProject || undefined}
      />
    </>
  );
};

export default Projects;