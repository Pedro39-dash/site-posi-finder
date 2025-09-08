import { useState, useEffect } from "react";
import { Play, ArrowRight, ArrowLeft, X, Lightbulb, Target, BarChart3, Download, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface TourStep {
  id: string;
  title: string;
  description: string;
  element?: string;
  icon: any;
  content: React.ReactNode;
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const GuidedTour = ({ isOpen, onClose, onComplete }: GuidedTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const tourSteps: TourStep[] = [
    {
      id: 'welcome',
      title: 'Bem-vindo à Análise Competitiva',
      description: 'Descubra como superar seus concorrentes no Google',
      icon: Target,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground">
              Esta ferramenta analisa seu site contra concorrentes usando dados reais do Google, 
              identificando oportunidades de melhoria e palavras-chave estratégicas.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="text-center p-3 border rounded-lg">
              <BarChart3 className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium">Visualizações</p>
              <p className="text-xs text-muted-foreground">Gráficos interativos</p>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <Download className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium">Relatórios</p>
              <p className="text-xs text-muted-foreground">PDF e CSV</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'form',
      title: 'Configuração da Análise',
      description: 'Como configurar uma análise competitiva eficaz',
      icon: Target,
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Passo a passo:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Digite o <strong>domínio do seu site</strong></li>
              <li>Adicione <strong>concorrentes relevantes</strong> (2-5 sites)</li>
              <li>Selecione <strong>palavras-chave estratégicas</strong> (10-50)</li>
              <li>Inicie a análise e aguarde os resultados</li>
            </ol>
          </div>
          
          <div className="p-3 border-l-4 border-primary bg-primary/5">
            <p className="text-sm">
              <strong>Dica:</strong> Use palavras-chave específicas do seu nicho para 
              obter insights mais relevantes sobre a concorrência.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'results',
      title: 'Interpretando os Resultados',
      description: 'Como ler e usar os dados da análise',
      icon: BarChart3,
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">1-10</span>
              </div>
              <div>
                <p className="font-medium">Primeira Página</p>
                <p className="text-sm text-muted-foreground">Posições de alto tráfego</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 font-bold text-sm">11-20</span>
              </div>
              <div>
                <p className="font-medium">Oportunidades</p>
                <p className="text-sm text-muted-foreground">Próximas da primeira página</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold text-sm">21+</span>
              </div>
              <div>
                <p className="font-medium">Trabalho Necessário</p>
                <p className="text-sm text-muted-foreground">Precisa de otimização</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'filters',
      title: 'Filtros Avançados',
      description: 'Personalize a visualização dos dados',
      icon: Filter,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-2">Por Posição</h4>
              <p className="text-sm text-muted-foreground">
                Filtre keywords por ranking (1-10, 11-20, etc.)
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-2">Por Oportunidade</h4>
              <p className="text-sm text-muted-foreground">
                Encontre gaps competitivos e quick wins
              </p>
            </div>
          </div>
          
          <div className="p-3 border-l-4 border-primary bg-primary/5">
            <p className="text-sm">
              <strong>Produtividade:</strong> Salve combinações de filtros frequentes 
              para análises futuras mais rápidas.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'opportunities',
      title: 'Oportunidades Inteligentes',
      description: 'Sistema de alertas e sugestões automáticas',
      icon: Lightbulb,
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="p-3 border rounded-lg border-green-200 bg-green-50">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">Quick Win</Badge>
                <span className="font-medium">Vitórias Rápidas</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Keywords onde você pode facilmente superar concorrentes fracos
              </p>
            </div>
            
            <div className="p-3 border rounded-lg border-blue-200 bg-blue-50">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">Alto Impacto</Badge>
                <span className="font-medium">Alta Prioridade</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Oportunidades na segunda página que podem ir para a primeira
              </p>
            </div>
            
            <div className="p-3 border rounded-lg border-red-200 bg-red-50">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="bg-red-100 text-red-800">Alerta</Badge>
                <span className="font-medium">Ação Necessária</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Concorrentes dominando keywords importantes suas
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'export',
      title: 'Relatórios e Exportação',
      description: 'Compartilhe insights com sua equipe',
      icon: Download,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Download className="h-4 w-4 text-primary" />
                <span className="font-medium">CSV Detalhado</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Dados completos para análise em planilhas
              </p>
            </div>
            
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Download className="h-4 w-4 text-primary" />
                <span className="font-medium">Relatório PDF</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Resumo executivo com gráficos e insights
              </p>
            </div>
          </div>
          
          <div className="p-3 border-l-4 border-primary bg-primary/5">
            <p className="text-sm">
              <strong>Automação:</strong> Configure relatórios automáticos 
              para monitoramento contínuo da concorrência.
            </p>
          </div>
        </div>
      )
    }
  ];

  const progress = ((currentStep + 1) / tourSteps.length) * 100;
  const currentTourStep = tourSteps[currentStep];

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('comparison-tour-completed', 'true');
    onComplete();
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem('comparison-tour-skipped', 'true');
    onClose();
  };

  if (!isOpen) return null;

  if (!hasStarted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              Tour Guiado
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <p className="text-muted-foreground">
                Quer fazer um tour rápido para conhecer todas as funcionalidades 
                da análise competitiva?
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button onClick={() => setHasStarted(true)} className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                Iniciar Tour
              </Button>
              <Button variant="ghost" onClick={handleSkip}>
                Pular
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <currentTourStep.icon className="h-5 w-5 text-primary" />
              {currentTourStep.title}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Passo {currentStep + 1} de {tourSteps.length}
              </span>
              <span className="text-muted-foreground">
                {Math.round(progress)}% concluído
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <div className="min-h-[300px]">
            <p className="text-muted-foreground mb-6">
              {currentTourStep.description}
            </p>
            {currentTourStep.content}
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleSkip}>
                Pular Tour
              </Button>
              <Button onClick={handleNext}>
                {currentStep === tourSteps.length - 1 ? 'Finalizar' : 'Próximo'}
                {currentStep < tourSteps.length - 1 && (
                  <ArrowRight className="h-4 w-4 ml-2" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuidedTour;