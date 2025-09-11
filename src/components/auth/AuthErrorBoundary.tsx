import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

export class AuthErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    console.error('Auth Error Boundary caught error:', error);
    
    // Check if it's an authentication-related error
    const isAuthError = error.message.includes('auth') || 
                       error.message.includes('session') ||
                       error.message.includes('user') ||
                       error.message.includes('login');
    
    if (isAuthError) {
      console.log('Auth-related error detected, triggering error boundary');
    }
    
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AuthErrorBoundary componentDidCatch:', error, errorInfo);
    
    this.props.onError?.(error, errorInfo);
    
    // Auto-retry for auth errors after a delay
    if (this.state.retryCount < this.maxRetries) {
      setTimeout(() => {
        this.handleRetry();
      }, 2000);
    }
  }

  handleRetry = () => {
    console.log('Retrying after auth error...');
    this.setState(prevState => ({
      hasError: false,
      error: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="max-w-md w-full">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="space-y-4">
                <div>
                  <p className="font-medium">Erro de Autenticação</p>
                  <p className="text-sm mt-1">
                    Ocorreu um erro relacionado à autenticação. 
                    Tentativa {this.state.retryCount} de {this.maxRetries}.
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={this.handleRetry}
                    disabled={this.state.retryCount >= this.maxRetries}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Tentar Novamente
                  </Button>
                  
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={this.handleReload}
                  >
                    Recarregar Página
                  </Button>
                </div>
                
                {process.env.NODE_ENV === 'development' && (
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer">Detalhes do erro</summary>
                    <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-auto">
                      {this.state.error?.message}
                    </pre>
                  </details>
                )}
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}