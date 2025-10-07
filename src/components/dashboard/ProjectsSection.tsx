import { FolderOpen, Plus, TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProject } from "@/hooks/useProject";
import { useNavigate } from "react-router-dom";
import type { Project } from "@/services/projectService";

const ProjectsSection = () => {
  const { projects, activeProject, setActiveProject } = useProject();
  const navigate = useNavigate();

  const handleViewProject = (project: Project) => {
    navigate("/projects");
  };

  const handleSwitchProject = (project: Project) => {
    setActiveProject(project.id);
  };

  const handleCompareProject = (project: Project) => {
    navigate("/comparison");
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-accent" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-accent";
    if (score >= 60) return "text-primary";
    return "text-destructive";
  };

  // Filtra outros projetos (exceto o ativo) e mostra os top 3
  const otherProjects = projects
    .filter(project => project.id !== activeProject?.id)
    .slice(0, 3);

  if (otherProjects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Outros Projetos</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/projects')}
            >
              Gerenciar todos
            </Button>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Você tem apenas um projeto de monitoramento SEO
          </p>
        </CardHeader>
        <CardContent className="text-center py-8">
          <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Apenas um projeto</h3>
          <p className="text-muted-foreground mb-6">
            Crie mais projetos para monitorar outros domínios
          </p>
          <Button onClick={() => navigate("/projects")} className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Novo Projeto
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Outros Projetos</span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/projects')}
          >
            Gerenciar todos
          </Button>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Seus outros projetos de monitoramento SEO
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {otherProjects.map((project) => (
          <div
            key={project.id}
            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{project.name}</h4>
                <p className="text-sm text-muted-foreground">{project.domain}</p>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{project.market_segment || 'N/A'}</Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">
                  {project.competitor_domains?.length || 0} concorrentes
                </span>
                <span className="text-muted-foreground">
                  {project.focus_keywords?.length || 0} palavras-chave
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSwitchProject(project)}
                  className="text-xs"
                >
                  Ativar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewProject(project)}
                  className="text-xs"
                >
                  Gerenciar
                </Button>
              </div>
            </div>
          </div>
        ))}
        
        {projects.length > 4 && (
          <div className="text-center pt-2">
            <Button variant="outline" onClick={() => navigate("/projects")} className="w-full">
              Ver mais {projects.length - 4} projetos
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectsSection;