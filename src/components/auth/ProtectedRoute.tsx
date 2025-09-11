import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Add a small delay to prevent race conditions
    const timeoutId = setTimeout(() => {
      console.log('ProtectedRoute check:', { isLoading, isAuthenticated, path: location.pathname });
      if (!isLoading && !isAuthenticated) {
        console.log('Redirecting to login from:', location.pathname);
        // Save the attempted location for redirecting after login
        navigate('/login', { 
          state: { from: location.pathname },
          replace: true 
        });
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, isLoading, navigate, location]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};