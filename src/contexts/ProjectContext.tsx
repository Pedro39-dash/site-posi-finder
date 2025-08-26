import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Project {
  id: string;
  name: string;
  mainDomain: string;
  sector: string;
  createdAt: Date;
  competitors: Competitor[];
  keywords: ProjectKeyword[];
  currentScore: number;
  trend: 'up' | 'down' | 'stable';
}

export interface Competitor {
  id: string;
  domain: string;
  name: string;
  addedAt: Date;
}

export interface ProjectKeyword {
  id: string;
  keyword: string;
  searchVolume: number;
  priority: 'high' | 'medium' | 'low';
}

interface ProjectContextType {
  projects: Project[];
  selectedProject: Project | null;
  activeProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  setActiveProject: (project: Project | null) => void;
  createProject: (projectData: Omit<Project, 'id' | 'createdAt' | 'currentScore' | 'trend'>) => void;
  updateProject: (id: string, projectData: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addCompetitor: (projectId: string, competitor: Omit<Competitor, 'id' | 'addedAt'>) => void;
  removeCompetitor: (projectId: string, competitorId: string) => void;
  addKeyword: (projectId: string, keyword: Omit<ProjectKeyword, 'id'>) => void;
  removeKeyword: (projectId: string, keywordId: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// Dados mockados mais realistas
const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'E-commerce Principal',
    mainDomain: 'minhaloja.com.br',
    sector: 'E-commerce',
    createdAt: new Date('2024-01-15'),
    currentScore: 78,
    trend: 'up',
    competitors: [
      { id: 'c1', domain: 'concorrente1.com.br', name: 'Concorrente Loja', addedAt: new Date('2024-01-16') },
      { id: 'c2', domain: 'megaloja.com.br', name: 'Mega Loja', addedAt: new Date('2024-01-20') },
    ],
    keywords: [
      { id: 'k1', keyword: 'comprar online', searchVolume: 50000, priority: 'high' },
      { id: 'k2', keyword: 'loja virtual', searchVolume: 30000, priority: 'high' },
      { id: 'k3', keyword: 'produtos baratos', searchVolume: 25000, priority: 'medium' },
    ]
  },
  {
    id: '2',
    name: 'Blog Corporativo',
    mainDomain: 'blogempresa.com.br',
    sector: 'Conteúdo',
    createdAt: new Date('2024-02-01'),
    currentScore: 65,
    trend: 'stable',
    competitors: [
      { id: 'c3', domain: 'blogconcorrente.com.br', name: 'Blog Concorrente', addedAt: new Date('2024-02-02') },
    ],
    keywords: [
      { id: 'k4', keyword: 'dicas de negócio', searchVolume: 15000, priority: 'high' },
      { id: 'k5', keyword: 'marketing digital', searchVolume: 40000, priority: 'high' },
    ]
  },
  {
    id: '3',
    name: 'Serviços Locais',
    mainDomain: 'servicoslocais.com.br',
    sector: 'Serviços',
    createdAt: new Date('2024-03-10'),
    currentScore: 82,
    trend: 'up',
    competitors: [
      { id: 'c4', domain: 'servicosrapidos.com.br', name: 'Serviços Rápidos', addedAt: new Date('2024-03-11') },
      { id: 'c5', domain: 'profissionais.com.br', name: 'Profissionais', addedAt: new Date('2024-03-15') },
    ],
    keywords: [
      { id: 'k6', keyword: 'serviços domiciliares', searchVolume: 20000, priority: 'high' },
      { id: 'k7', keyword: 'manutenção residencial', searchVolume: 12000, priority: 'medium' },
    ]
  }
];

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  useEffect(() => {
    // Carrega projetos do localStorage ou usa dados mockados
    const savedProjects = localStorage.getItem('projects');
    if (savedProjects) {
      const parsedProjects = JSON.parse(savedProjects).map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        competitors: p.competitors.map((c: any) => ({
          ...c,
          addedAt: new Date(c.addedAt)
        }))
      }));
      setProjects(parsedProjects);
    } else {
      setProjects(MOCK_PROJECTS);
      localStorage.setItem('projects', JSON.stringify(MOCK_PROJECTS));
    }

    // Carrega projeto ativo se existir
    const savedActiveProject = localStorage.getItem('activeProject');
    if (savedActiveProject) {
      const parsedActiveProject = JSON.parse(savedActiveProject);
      setActiveProject({
        ...parsedActiveProject,
        createdAt: new Date(parsedActiveProject.createdAt),
        competitors: parsedActiveProject.competitors.map((c: any) => ({
          ...c,
          addedAt: new Date(c.addedAt)
        }))
      });
    }
  }, []);

  const saveProjects = (newProjects: Project[]) => {
    setProjects(newProjects);
    localStorage.setItem('projects', JSON.stringify(newProjects));
  };

  const createProject = (projectData: Omit<Project, 'id' | 'createdAt' | 'currentScore' | 'trend'>) => {
    const newProject: Project = {
      ...projectData,
      id: Date.now().toString(),
      createdAt: new Date(),
      currentScore: 50, // Score inicial
      trend: 'stable'
    };
    
    const newProjects = [...projects, newProject];
    saveProjects(newProjects);
  };

  const updateProject = (id: string, projectData: Partial<Project>) => {
    const newProjects = projects.map(p => 
      p.id === id ? { ...p, ...projectData } : p
    );
    saveProjects(newProjects);
    
    // Atualiza o projeto selecionado se necessário
    if (selectedProject?.id === id) {
      setSelectedProject(newProjects.find(p => p.id === id) || null);
    }
  };

  const deleteProject = (id: string) => {
    const newProjects = projects.filter(p => p.id !== id);
    saveProjects(newProjects);
    
    if (selectedProject?.id === id) {
      setSelectedProject(null);
    }
  };

  const addCompetitor = (projectId: string, competitor: Omit<Competitor, 'id' | 'addedAt'>) => {
    const newCompetitor: Competitor = {
      ...competitor,
      id: Date.now().toString(),
      addedAt: new Date()
    };
    
    updateProject(projectId, {
      competitors: [
        ...(projects.find(p => p.id === projectId)?.competitors || []),
        newCompetitor
      ]
    });
  };

  const removeCompetitor = (projectId: string, competitorId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      updateProject(projectId, {
        competitors: project.competitors.filter(c => c.id !== competitorId)
      });
    }
  };

  const addKeyword = (projectId: string, keyword: Omit<ProjectKeyword, 'id'>) => {
    const newKeyword: ProjectKeyword = {
      ...keyword,
      id: Date.now().toString()
    };
    
    updateProject(projectId, {
      keywords: [
        ...(projects.find(p => p.id === projectId)?.keywords || []),
        newKeyword
      ]
    });
  };

  const removeKeyword = (projectId: string, keywordId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      updateProject(projectId, {
        keywords: project.keywords.filter(k => k.id !== keywordId)
      });
    }
  };

  const handleSetActiveProject = (project: Project | null) => {
    setActiveProject(project);
    if (project) {
      localStorage.setItem('activeProject', JSON.stringify(project));
    } else {
      localStorage.removeItem('activeProject');
    }
  };

  return (
    <ProjectContext.Provider value={{
      projects,
      selectedProject,
      activeProject,
      setSelectedProject,
      setActiveProject: handleSetActiveProject,
      createProject,
      updateProject,
      deleteProject,
      addCompetitor,
      removeCompetitor,
      addKeyword,
      removeKeyword
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};