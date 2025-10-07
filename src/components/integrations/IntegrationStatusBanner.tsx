import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info, Link as LinkIcon } from "lucide-react";
import { ProjectIntegration } from "@/services/integrationService";
import { useNavigate } from "react-router-dom";

interface IntegrationStatusBannerProps {
  projectId: string;
  integrations: ProjectIntegration[];
}

const IntegrationStatusBanner = ({ projectId, integrations }: IntegrationStatusBannerProps) => {
  const navigate = useNavigate();
  
  const hasGSC = integrations?.some(
    int => int.integration_type === 'search_console' && int.is_active && int.sync_status === 'active'
  );
  
  const hasGA = integrations?.some(
    int => int.integration_type === 'analytics' && int.is_active && int.sync_status === 'active'
  );

  // Don't show if both are connected
  if (hasGSC && hasGA) return null;

  const missingIntegrations = [];
  if (!hasGSC) missingIntegrations.push('Google Search Console');
  if (!hasGA) missingIntegrations.push('Google Analytics');

  return (
    <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertDescription className="flex items-center justify-between text-blue-800 dark:text-blue-200">
        <div>
          <strong>Dados Simulados:</strong> Conecte o {missingIntegrations.join(' e ')} para obter dados reais de posições, impressões e cliques.
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate('/projects')}
          className="ml-4 flex items-center gap-2"
        >
          <LinkIcon className="h-4 w-4" />
          Conectar Agora
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default IntegrationStatusBanner;
