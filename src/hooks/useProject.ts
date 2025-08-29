import React, { useState, useEffect, useCallback } from 'react';
import { ProjectService, Project } from '@/services/projectService';
import { useAuth } from '@/contexts/AuthContext';

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
        setProjects(userProjects);
        
        // Find active project
        const active = userProjects.find(p => p.is_active);
        setActiveProject(active || null);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const createProject = async (projectData: {
    name: string;
    domain: string;
    market_segment?: string;
    focus_keywords?: string[];
    competitor_domains?: string[];
  }) => {
    const result = await ProjectService.createProject(projectData);
    if (result.success) {
      await loadProjects();
    }
    return result;
  };

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    const result = await ProjectService.updateProject(projectId, updates);
    if (result.success) {
      await loadProjects();
    }
    return result;
  };

  const setActiveProjectById = async (projectId: string) => {
    const result = await ProjectService.setActiveProject(projectId);
    if (result.success) {
      await loadProjects();
    }
    return result;
  };

  const deleteProject = async (projectId: string) => {
    const result = await ProjectService.deleteProject(projectId);
    if (result.success) {
      await loadProjects();
    }
    return result;
  };

  return {
    projects,
    activeProject,
    isLoading,
    createProject,
    updateProject,
    setActiveProject: setActiveProjectById,
    deleteProject,
    refreshProjects: loadProjects
  };
};