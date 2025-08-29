import React from 'react';
import { useProject } from '@/hooks/useProject';
import { useRole } from '@/hooks/useRole';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Globe } from 'lucide-react';

interface ProjectSelectorProps {
  onCreateProject?: () => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({ 
  onCreateProject 
}) => {
  const { projects, activeProject, setActiveProject, isLoading } = useProject();
  const { isClient } = useRole();

  // Only show for clients
  if (!isClient) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">Carregando projetos...</span>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Button 
          onClick={onCreateProject}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Criar Primeiro Projeto
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select
        value={activeProject?.id || ''}
        onValueChange={(value) => setActiveProject(value)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Selecione um projeto">
            {activeProject ? activeProject.name : 'Selecione um projeto'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              <div className="flex flex-col">
                <span className="font-medium">{project.name}</span>
                <span className="text-xs text-muted-foreground">{project.domain}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {onCreateProject && (
        <Button 
          onClick={onCreateProject}
          size="sm"
          variant="outline"
          className="flex items-center gap-1"
        >
          <Plus className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};