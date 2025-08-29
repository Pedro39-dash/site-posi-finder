import React, { useState } from 'react';
import { useProject } from '@/hooks/useProject';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProjectService } from '@/services/projectService';
import { UserService } from '@/services/userService';
import { toast } from 'sonner';

interface OnboardingFlowProps {
  open: boolean;
  onComplete: () => void;
}

const MARKET_SEGMENTS = [
  'E-commerce',
  'Saúde e Bem-estar',
  'Educação',
  'Tecnologia',
  'Serviços Financeiros',
  'Imobiliário',
  'Turismo e Viagem',
  'Alimentação e Bebidas',
  'Moda e Beleza',
  'Consultoria',
  'Outro'
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ 
  open, 
  onComplete 
}) => {
  const { createProject } = useProject();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form data
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [projectName, setProjectName] = useState('');
  const [marketSegment, setMarketSegment] = useState('');
  const [companyName, setCompanyName] = useState('');

  const handleNext = () => {
    if (step === 1) {
      // Auto-generate project name from URL
      if (websiteUrl && !projectName) {
        const domain = ProjectService.cleanDomain(websiteUrl);
        setProjectName(domain.charAt(0).toUpperCase() + domain.slice(1));
      }
      setStep(2);
    } else if (step === 2) {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    
    try {
      // Update user profile
      await UserService.updateProfile({
        company_name: companyName,
        market_segment: marketSegment
      });

      // Create first project
      const cleanDomain = ProjectService.cleanDomain(websiteUrl);
      const result = await createProject({
        name: projectName,
        domain: cleanDomain,
        market_segment: marketSegment
      });

      if (result.success) {
        toast.success('Projeto criado com sucesso!');
        onComplete();
      } else {
        toast.error(result.error || 'Erro ao criar projeto');
      }
    } catch (error) {
      toast.error('Erro ao finalizar configuração');
    } finally {
      setIsLoading(false);
    }
  };

  const isStep1Valid = websiteUrl.length > 0;
  const isStep2Valid = projectName.length > 0 && marketSegment.length > 0;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🎯 Bem-vindo ao SEO Dashboard!
          </DialogTitle>
          <DialogDescription>
            Vamos configurar seu primeiro projeto em apenas 2 passos.
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="website">URL do seu site</Label>
              <Input
                id="website"
                placeholder="https://meusite.com.br"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Digite a URL completa do site que você deseja monitorar
              </p>
            </div>

            <Button 
              onClick={handleNext} 
              disabled={!isStep1Valid}
              className="w-full"
            >
              Próximo
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Nome do Projeto</Label>
              <Input
                id="projectName"
                placeholder="Meu Site Principal"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Nome da Empresa</Label>
              <Input
                id="companyName"
                placeholder="Minha Empresa Ltda"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="segment">Segmento de Mercado</Label>
              <Select value={marketSegment} onValueChange={setMarketSegment}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o segmento" />
                </SelectTrigger>
                <SelectContent>
                  {MARKET_SEGMENTS.map((segment) => (
                    <SelectItem key={segment} value={segment}>
                      {segment}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => setStep(1)} 
                variant="outline"
                className="flex-1"
              >
                Voltar
              </Button>
              <Button 
                onClick={handleComplete}
                disabled={!isStep2Valid || isLoading}
                className="flex-1"
              >
                {isLoading ? 'Criando...' : 'Finalizar'}
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-center mt-4">
          <div className="flex space-x-2">
            <div className={`w-2 h-2 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-2 h-2 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};