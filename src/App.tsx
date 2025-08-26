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
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppSidebar } from "@/components/layout/AppSidebar";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import Rankings from "./pages/Rankings";
import Comparison from "./pages/Comparison";
import Monitoring from "./pages/Monitoring";
import Audit from "./pages/Audit";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider>
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <header className="lg:hidden h-12 flex items-center border-b bg-background px-4">
          <SidebarTrigger />
        </header>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  </SidebarProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <ThemeProvider defaultTheme="dark">
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
                  <Route path="/rankings" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Rankings />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/comparison" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Comparison />
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
                  <Route path="/audit" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Audit />
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
      </ThemeProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
