import React, { ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { handleCriticalError } from '@/utils/cacheClearing';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
}

/**
 * Specialized error boundary for hook-related errors
 * Focuses on "Rendered more hooks" and similar React hook violations
 */
export class HookErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if this is a hook-related error
    const isHookError = error.message?.includes('hook') || 
                       error.message?.includes('Rendered') ||
                       error.message?.includes('useState') ||
                       error.message?.includes('useEffect') ||
                       error.message?.includes('useMemo');
    
    if (isHookError) {
      console.error('🚨 Hook Error Detected:', error.message);
      console.log('🧹 Triggering cache cleanup...');
      
      // Handle critical hook errors
      handleCriticalError(error);
    }

    return { 
      hasError: true, 
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🔥 Hook Error Boundary caught error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount
    });

    this.setState({ errorInfo });

    // Call parent error handler if provided
    this.props.onError?.(error, errorInfo);

    // If too many retries, trigger full page reload
    if (this.state.retryCount >= 2) {
      console.log('🔄 Too many hook errors, triggering full reload...');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }

  handleRetry = () => {
    console.log('🔄 Retrying after hook error...');
    this.setState(prevState => ({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      const isHookError = this.state.error?.message?.includes('hook') || 
                         this.state.error?.message?.includes('Rendered');

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="w-full max-w-lg mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {isHookError ? 'Hook Error Detected' : 'Component Error'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                {isHookError 
                  ? 'A React hook error occurred. This usually happens when components re-render unexpectedly.'
                  : 'An unexpected error occurred in this component.'
                }
              </AlertDescription>
            </Alert>
            
            {this.state.error && (
              <div className="text-sm text-muted-foreground">
                <strong>Error:</strong> {this.state.error.message}
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                onClick={this.handleRetry}
                variant="outline"
                size="sm"
                disabled={this.state.retryCount >= 2}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry ({this.state.retryCount}/2)
              </Button>
              
              {this.state.retryCount >= 2 && (
                <Button 
                  onClick={() => window.location.reload()}
                  variant="default"
                  size="sm"
                >
                  Reload Page
                </Button>
              )}
            </div>
            
            {isHookError && (
              <div className="text-xs text-muted-foreground">
                Cache has been automatically cleared. If the error persists, try refreshing the page.
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}