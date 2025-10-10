import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/assets/logo-itxcompany-02.png';


const Login = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleLoginSuccess = () => {
    const from = (location.state as any)?.from || '/';
    navigate(from, { replace: true });
  };

  return (
    <>
      <Helmet>
        <title>Login - SEO Dashboard</title>
        <meta name="description" content="Faça login para acessar o SEO Dashboard e gerenciar suas análises de SEO." />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              SEO Dashboard
            </h1>
            <img src={Logo} alt="Logo ITX Company" />
            <p className="text-muted-foreground">
              Análise e monitoramento de SEO
            </p>
          </div>
          
          <LoginForm onSuccess={handleLoginSuccess} />
        </div>
      </div>
    </>
  );
};

export default Login;