import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ProjectService, Project } from '@/services/projectService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useProject = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setActiveProject(null);
      setIsLoading(false);
      return;
    }

    try {
      const { success, projects: userProjects } = await ProjectService.getUserProjects();
      
      if (success && userProjects) {
        console.log('✅ Projetos carregados:', userProjects.length, 'projetos');
        setProjects(userProjects);
        
        // Find active project
        const active = userProjects.find(p => p.is_active);
        if (active) {
          setActiveProject({ ...active });
          console.log('📌 Projeto ativo:', active.name, {
            id: active.id,
            domain: active.domain,
            keywords: active.focus_keywords?.length || 0,
            competitors: active.competitor_domains?.length || 0
          });
        } else {
          setActiveProject(null);
        }
      }
    } catch (error) {
      console.error('❌ Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const createProject = useCallback(async (projectData: {
    name: string;
    domain: string;
    market_segment?: string;
    focus_keywords?: string[];
    competitor_domains?: string[];
  }) => {
    console.log('🚀 Criando projeto:', projectData);
    const result = await ProjectService.createProject(projectData);
    if (result.success) {
      console.log('✅ Projeto criado com sucesso:', result.project);
      toast.success(`Projeto "${result.project?.name}" criado com sucesso!`);
      await loadProjects();
    } else {
      console.error('❌ Erro ao criar projeto:', result.error);
      toast.error(result.error || 'Erro ao criar projeto');
    }
    return result;
  }, [loadProjects]);

  const updateProject = useCallback(async (projectId: string, updates: Partial<Project>) => {
    console.log('📝 Atualizando projeto:', projectId, updates);
    const result = await ProjectService.updateProject(projectId, updates);
    if (result.success) {
      console.log('✅ Projeto atualizado com sucesso');
      toast.success('Projeto atualizado com sucesso!');
      await loadProjects();
    } else {
      console.error('❌ Erro ao atualizar projeto:', result.error);
      toast.error(result.error || 'Erro ao atualizar projeto');
    }
    return result;
  }, [loadProjects]);

  const setActiveProjectById = useCallback(async (projectId: string) => {
    console.log('🔄 Alterando projeto ativo para:', projectId);
    const result = await ProjectService.setActiveProject(projectId);
    if (result.success) {
      console.log('✅ Projeto ativo alterado com sucesso');
      toast.success('Projeto alterado com sucesso!');
      await loadProjects();
    } else {
      console.error('❌ Erro ao alterar projeto ativo:', result.error);
      toast.error(result.error || 'Erro ao alterar projeto');
    }
    return result;
  }, [loadProjects]);

  const deleteProject = useCallback(async (projectId: string) => {
    const result = await ProjectService.deleteProject(projectId);
    if (result.success) {
      await loadProjects();
    }
    return result;
  }, [loadProjects]);

  return useMemo(() => ({
    projects,
    activeProject,
    isLoading,
    createProject,
    updateProject,
    setActiveProject: setActiveProjectById,
    deleteProject,
    refreshProjects: loadProjects
  }), [projects, activeProject, isLoading, createProject, updateProject, setActiveProjectById, deleteProject, loadProjects]);
};