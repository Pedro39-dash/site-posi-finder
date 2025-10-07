import React, { createContext, useContext, ReactNode } from 'react';
import { useProject } from '@/hooks/useProject';

interface ActiveProjectContextType {
  activeProject: any;
  projects: any[];
  isLoading: boolean;
  createProject: (data: any) => Promise<any>;
  updateProject: (id: string, data: any) => Promise<any>;
  setActiveProject: (id: string) => Promise<any>;
  deleteProject: (id: string) => Promise<any>;
  refreshProjects: () => Promise<void>;
}

const ActiveProjectContext = createContext<ActiveProjectContextType | undefined>(undefined);

export const ActiveProjectProvider = ({ children }: { children: ReactNode }) => {
  const projectData = useProject();

  console.log('🏗️ ActiveProjectProvider render:', {
    projectId: projectData.activeProject?.id,
    projectName: projectData.activeProject?.name,
    timestamp: Date.now()
  });

  return (
    <ActiveProjectContext.Provider value={projectData}>
      {children}
    </ActiveProjectContext.Provider>
  );
};

export const useActiveProject = () => {
  const context = useContext(ActiveProjectContext);
  if (context === undefined) {
    throw new Error('useActiveProject must be used within ActiveProjectProvider');
  }
  return context;
};
