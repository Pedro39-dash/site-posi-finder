import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { MonitoringProvider } from "@/contexts/MonitoringContext";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Navigation from "@/components/layout/Navigation";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import Rankings from "./pages/Rankings";
import Comparison from "./pages/Comparison";
import Monitoring from "./pages/Monitoring";
import Audit from "./pages/Audit";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
                      <Navigation />
                      <Index />
                    </ProtectedRoute>
                  } />
                  <Route path="/projects" element={
                    <ProtectedRoute>
                      <Navigation />
                      <Projects />
                    </ProtectedRoute>
                  } />
                  <Route path="/rankings" element={
                    <ProtectedRoute>
                      <Navigation />
                      <Rankings />
                    </ProtectedRoute>
                  } />
                  <Route path="/comparison" element={
                    <ProtectedRoute>
                      <Navigation />
                      <Comparison />
                    </ProtectedRoute>
                  } />
                  <Route path="/monitoring" element={
                    <ProtectedRoute>
                      <Navigation />
                      <Monitoring />
                    </ProtectedRoute>
                  } />
                  <Route path="/audit" element={
                    <ProtectedRoute>
                      <Navigation />
                      <Audit />
                    </ProtectedRoute>
                  } />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={
                    <ProtectedRoute>
                      <Navigation />
                      <NotFound />
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
