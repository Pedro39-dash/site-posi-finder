import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveProject } from '@/contexts/ActiveProjectContext';
import { useRole } from '@/hooks/useRole';
import { ClientDashboard } from '@/components/dashboard/ClientDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { DisplayDashboard } from '@/components/dashboard/DisplayDashboard';

export default function Index() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { activeProject } = useActiveProject();
  const { isAdmin, isClient, isDisplay, isLoading } = useRole();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Render appropriate dashboard based on user role
  if (isDisplay) {
    return <DisplayDashboard />;
  }

  if (isAdmin) {
    return <AdminDashboard />;
  }

  if (isClient) {
    return <ClientDashboard />;
  }

  // Fallback for users without a defined role
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Bem-vindo</h2>
        <p className="text-muted-foreground mb-6">
          Configure seu primeiro projeto para começar
        </p>
        <button
          onClick={() => navigate('/projects/new')}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Criar Projeto
        </button>
      </div>
    </div>
  );
}