import React, { useState } from 'react';
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
import { useProject } from '@/hooks/useProject';
import { ProjectService } from '@/services/projectService';
import { toast } from 'sonner';

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  projectId?: string; // For editing existing project
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

export const ProjectModal: React.FC<ProjectModalProps> = ({ 
  open, 
  onClose,
  projectId
}) => {
  const { createProject, updateProject } = useProject();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form data
  const [projectName, setProjectName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [marketSegment, setMarketSegment] = useState('');
  const [focusKeywords, setFocusKeywords] = useState('');
  const [competitorDomains, setCompetitorDomains] = useState('');

  const isEdit = Boolean(projectId);

  const handleSubmit = async () => {
    if (!projectName || !websiteUrl) {
      toast.error('Nome do projeto e URL são obrigatórios');
      return;
    }

    setIsLoading(true);
    
    try {
      const cleanDomain = ProjectService.cleanDomain(websiteUrl);
      const keywordsArray = focusKeywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);
      const competitorsArray = competitorDomains
        .split(',')
        .map(d => ProjectService.cleanDomain(d.trim()))
        .filter(d => d.length > 0);

      const projectData = {
        name: projectName,
        domain: cleanDomain,
        market_segment: marketSegment || undefined,
        focus_keywords: keywordsArray,
        competitor_domains: competitorsArray
      };

      let result;
      if (isEdit) {
        result = await updateProject(projectId!, projectData);
      } else {
        result = await createProject(projectData);
      }

      if (result.success) {
        toast.success(isEdit ? 'Projeto atualizado!' : 'Projeto criado!');
        handleClose();
      } else {
        toast.error(result.error || 'Erro ao salvar projeto');
      }
    } catch (error) {
      toast.error('Erro ao salvar projeto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setProjectName('');
    setWebsiteUrl('');
    setMarketSegment('');
    setFocusKeywords('');
    setCompetitorDomains('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar Projeto' : 'Novo Projeto'}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Atualize as informações do seu projeto'
              : 'Configure um novo projeto para monitoramento SEO'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Nome do Projeto *</Label>
            <Input
              id="projectName"
              placeholder="Meu Site Principal"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">URL do Site *</Label>
            <Input
              id="website"
              placeholder="https://meusite.com.br"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
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

          <div className="space-y-2">
            <Label htmlFor="keywords">Palavras-chave Principais</Label>
            <Input
              id="keywords"
              placeholder="seo, marketing digital, otimização"
              value={focusKeywords}
              onChange={(e) => setFocusKeywords(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Separe as palavras-chave por vírgula
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="competitors">Domínios Concorrentes</Label>
            <Input
              id="competitors"
              placeholder="concorrente1.com, concorrente2.com"
              value={competitorDomains}
              onChange={(e) => setCompetitorDomains(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Separe os domínios por vírgula
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleClose} 
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!projectName || !websiteUrl || isLoading}
              className="flex-1"
            >
              {isLoading ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};