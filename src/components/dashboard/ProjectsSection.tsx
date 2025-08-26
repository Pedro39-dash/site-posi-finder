import { FolderOpen, Plus, TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProjects, Project } from "@/contexts/ProjectContext";
import { useNavigate } from "react-router-dom";

const ProjectsSection = () => {
  const { projects, setSelectedProject } = useProjects();
  const navigate = useNavigate();

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    navigate("/projects");
  };

  const handleCompareProject = (project: Project) => {
    setSelectedProject(project);
    navigate("/comparison");
  };

  const getTrendIcon = (trend: Project['trend']) => {
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

  // Mostra os 3 projetos mais importantes
  const featuredProjects = projects
    .sort((a, b) => b.currentScore - a.currentScore)
    .slice(0, 3);

  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            Seus Projetos
          </CardTitle>
          <CardDescription>
            Gerencie seus sites e monitore a performance SEO
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum projeto criado</h3>
          <p className="text-muted-foreground mb-6">
            Crie seu primeiro projeto para começar a monitorar seu SEO
          </p>
          <Button onClick={() => navigate("/projects")} className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Primeiro Projeto
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              Seus Projetos ({projects.length})
            </CardTitle>
            <CardDescription>
              Performance dos seus principais projetos SEO
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => navigate("/projects")} className="gap-2">
            Ver Todos
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {featuredProjects.map((project) => (
          <div
            key={project.id}
            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => handleViewProject(project)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{project.name}</h4>
                <p className="text-sm text-muted-foreground">{project.mainDomain}</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {getTrendIcon(project.trend)}
                  <span className={`text-lg font-bold ${getScoreColor(project.currentScore)}`}>
                    {project.currentScore}
                  </span>
                </div>
                <Badge variant="secondary">{project.sector}</Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">
                  {project.competitors.length} concorrentes
                </span>
                <span className="text-muted-foreground">
                  {project.keywords.length} palavras-chave
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCompareProject(project);
                  }}
                  disabled={project.competitors.length === 0}
                  className="text-xs"
                >
                  Comparar
                </Button>
              </div>
            </div>
          </div>
        ))}
        
        {projects.length > 3 && (
          <div className="text-center pt-2">
            <Button variant="outline" onClick={() => navigate("/projects")} className="w-full">
              Ver mais {projects.length - 3} projetos
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectsSection;