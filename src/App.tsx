import React, { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { MonitoringProvider } from "@/contexts/MonitoringContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AuthErrorBoundary } from "@/components/auth/AuthErrorBoundary";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { TopBar } from "@/components/layout/TopBar";
import { ProjectModal } from "@/components/projects/ProjectModal";
import { useProject } from "@/hooks/useProject";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import Comparison from "./pages/Comparison";
import Monitoring from "./pages/Monitoring";
import AutoMonitoring from "./pages/AutoMonitoring";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Wrapper for Comparison to force re-render on project change
const ComparisonWithKey = ({ activeProject }: { activeProject: any }) => {
  const [renderKey, setRenderKey] = useState(0);
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>();
  
  useEffect(() => {
    // Detecta mudança real no ID do projeto
    if (activeProject?.id && activeProject?.id !== currentProjectId) {
      console.log('🔑 ComparisonWithKey: activeProject mudou', {
        de: currentProjectId,
        para: activeProject?.id,
        name: activeProject?.name,
        novoRenderKey: renderKey + 1
      });
      
      setCurrentProjectId(activeProject?.id);
      setRenderKey(prev => prev + 1);
    }
  }, [activeProject?.id, currentProjectId]);
  
  console.log('🎨 ComparisonWithKey render:', {
    projectId: activeProject?.id,
    projectName: activeProject?.name,
    currentProjectId,
    renderKey,
    key: `${activeProject?.id}-${renderKey}`
  });
  
  return <Comparison 
    key={`${activeProject?.id}-${renderKey}`} 
    activeProject={activeProject}
  />;
};

// Wrapper to provide activeProject for key-based remounting
const AppLayoutWrapper = ({ children }: { children: React.ReactNode | ((activeProject: any) => React.ReactNode) }) => {
  const { activeProject } = useProject();
  return <AppLayout key={activeProject?.id} activeProject={activeProject}>{children}</AppLayout>;
};

// Layout component with integrated onboarding and project management
const AppLayout = ({ activeProject, children }: { activeProject: any; children: React.ReactNode | ((activeProject: any) => React.ReactNode) }) => {
  const { user, isLoading: authLoading } = useAuth();
  const { projects, isLoading: projectsLoading } = useProject();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Check if user needs onboarding (first time user with no projects)
    if (user && !authLoading && !projectsLoading && projects.length === 0) {
      setShowOnboarding(true);
    }
  }, [user, authLoading, projectsLoading, projects]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const handleCreateProject = () => {
    setEditingProjectId(undefined);
    setShowProjectModal(true);
  };

  const handleEditProject = () => {
    if (activeProject) {
      setEditingProjectId(activeProject.id);
      setShowProjectModal(true);
    }
  };

  if (authLoading || projectsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex flex-col">
        {/* Top bar spanning 100% width */}
        <TopBar onCreateProject={handleCreateProject} />
        
        {/* Content area with fixed sidebar - remaining height */}
        <div className="flex w-full" style={{ height: 'calc(100vh - var(--topbar-height))' }}>
          <AppSidebar 
            onEditProject={handleEditProject}
            onCreateProject={handleCreateProject}
          />
          <main className="flex-1 overflow-auto bg-zinc-950">
            {typeof children === 'function' ? children(activeProject) : children}
          </main>
        </div>
      </div>
        
      {/* Modals */}
      <OnboardingFlow 
        open={showOnboarding} 
        onComplete={handleOnboardingComplete} 
      />
      
      <ProjectModal 
        open={showProjectModal}
        onClose={() => {
          setShowProjectModal(false);
          setEditingProjectId(undefined);
        }}
        projectId={editingProjectId}
      />
    </SidebarProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <ThemeProvider defaultTheme="dark">
        <AuthErrorBoundary>
          <AuthProvider>
            <MonitoringProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={
                      <ProtectedRoute>
                        <AppLayoutWrapper>
                          <Index />
                        </AppLayoutWrapper>
                      </ProtectedRoute>
                    } />
                    <Route path="/projects" element={
                      <ProtectedRoute>
                        <AppLayoutWrapper>
                          <Projects />
                        </AppLayoutWrapper>
                      </ProtectedRoute>
                    } />
                    <Route path="/comparison" element={
                      <ProtectedRoute>
                        <AppLayoutWrapper>
                          {(activeProject) => <ComparisonWithKey activeProject={activeProject} />}
                        </AppLayoutWrapper>
                      </ProtectedRoute>
                    } />
                    <Route path="/monitoring" element={
                      <ProtectedRoute>
                        <AppLayoutWrapper>
                          <Monitoring />
                        </AppLayoutWrapper>
                      </ProtectedRoute>
                    } />
                    <Route path="/auto-monitoring" element={
                      <ProtectedRoute>
                        <AppLayoutWrapper>
                          <AutoMonitoring />
                        </AppLayoutWrapper>
                      </ProtectedRoute>
                    } />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={
                      <ProtectedRoute>
                        <AppLayoutWrapper>
                          <NotFound />
                        </AppLayoutWrapper>
                      </ProtectedRoute>
                    } />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </MonitoringProvider>
          </AuthProvider>
        </AuthErrorBoundary>
      </ThemeProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
