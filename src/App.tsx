import React, { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { MonitoringProvider } from "@/contexts/MonitoringContext";
import { ProjectProvider } from "@/contexts/ProjectContext";
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
const ComparisonWithKey = () => {
  const { activeProject } = useProject();
  return <Comparison key={activeProject?.id || 'no-project'} />;
};

// Layout component with integrated onboarding and project management
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading: authLoading } = useAuth();
  const { projects, activeProject, isLoading: projectsLoading } = useProject();
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
            {children}
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
            <ProjectProvider>
              <MonitoringProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={
                      <ProtectedRoute>
                        <AppLayout>
                          <Index />
                        </AppLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/projects" element={
                      <ProtectedRoute>
                        <AppLayout>
                          <Projects />
                        </AppLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/comparison" element={
                      <ProtectedRoute>
                        <AppLayout>
                          <ComparisonWithKey />
                        </AppLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/monitoring" element={
                      <ProtectedRoute>
                        <AppLayout>
                          <Monitoring />
                        </AppLayout>
                      </ProtectedRoute>
                    } />
                    <Route path="/auto-monitoring" element={
                      <ProtectedRoute>
                        <AppLayout>
                          <AutoMonitoring />
                        </AppLayout>
                      </ProtectedRoute>
                    } />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={
                      <ProtectedRoute>
                        <AppLayout>
                          <NotFound />
                        </AppLayout>
                      </ProtectedRoute>
                    } />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </MonitoringProvider>
            </ProjectProvider>
          </AuthProvider>
        </AuthErrorBoundary>
      </ThemeProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
