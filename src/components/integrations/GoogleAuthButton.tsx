import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { IntegrationService } from "@/services/integrationService";
import { toast } from "sonner";

interface GoogleAuthButtonProps {
  projectId: string;
  integrationType: 'search_console' | 'analytics';
  isConnected: boolean;
  onSuccess?: () => void;
}

const GoogleAuthButton = ({ 
  projectId, 
  integrationType, 
  isConnected,
  onSuccess 
}: GoogleAuthButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    
    const result = await IntegrationService.startOAuthFlow(projectId, integrationType);
    
    if (result.success) {
      toast.success('Janela de autenticação aberta. Faça login com sua conta Google.');
      
      // Listen for successful connection
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'integration_success') {
          toast.success('Integração conectada com sucesso!');
          onSuccess?.();
          window.removeEventListener('message', handleMessage);
        }
      };
      
      window.addEventListener('message', handleMessage);
    } else {
      toast.error('Erro ao iniciar autenticação: ' + result.error);
    }
    
    setIsLoading(false);
  };

  const label = integrationType === 'search_console' 
    ? 'Google Search Console' 
    : 'Google Analytics';

  const icon = integrationType === 'search_console' ? '🔍' : '📊';

  return (
    <Button
      onClick={handleConnect}
      disabled={isLoading || isConnected}
      variant={isConnected ? "outline" : "default"}
      className="w-full"
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {!isLoading && <span className="mr-2">{icon}</span>}
      {isConnected ? `✓ ${label} Conectado` : `Conectar ${label}`}
    </Button>
  );
};

export default GoogleAuthButton;
