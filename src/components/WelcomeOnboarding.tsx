import { useState } from "react";
import { X, TrendingUp, Eye, BarChart3, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface WelcomeOnboardingProps {
  onComplete: () => void;
}

const WelcomeOnboarding = ({ onComplete }: WelcomeOnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuth();

  const steps = [
    {
      title: "Bem-vindo à sua ferramenta de SEO!",
      icon: TrendingUp,
      content: (
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Olá <strong>{user?.email}</strong>! Esta é sua ferramenta exclusiva de monitoramento SEO. 
            Criamos esta plataforma especialmente para nossos clientes acompanharem os resultados 
            dos nossos serviços de consultoria em SEO.
          </p>
          <div className="bg-primary/10 rounded-lg p-4">
            <p className="text-sm font-medium text-primary">
              ✨ Acesso exclusivo para clientes da nossa consultoria
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Transparência Total no seu SEO",
      icon: Eye,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Acabaram os dias de esperar relatórios semanais. Agora você pode:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-secondary/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">📊 Ver posições em tempo real</h4>
              <p className="text-sm text-muted-foreground">
                Consulte a posição de qualquer palavra-chave instantaneamente
              </p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">📈 Acompanhar tendências</h4>
              <p className="text-sm text-muted-foreground">
                Veja se suas posições estão melhorando ou precisam de atenção
              </p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">🔍 Comparar com concorrentes</h4>
              <p className="text-sm text-muted-foreground">
                Entenda como você está se posicionando frente à concorrência
              </p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">⚡ Auditoria técnica</h4>
              <p className="text-sm text-muted-foreground">
                Identifique problemas técnicos que impactam seu SEO
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Maximize o valor do seu investimento",
      icon: BarChart3,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Nossa consultoria trabalha todos os dias para melhorar suas posições. 
            Com esta ferramenta, você pode:
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-green-500/20 rounded-full p-1 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <div>
                <h4 className="font-medium text-green-500">Acompanhar resultados diários</h4>
                <p className="text-sm text-muted-foreground">
                  Veja o impacto das nossas otimizações em tempo real
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary/20 rounded-full p-1 mt-1">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
              </div>
              <div>
                <h4 className="font-medium text-primary">Ter autonomia para consultas</h4>
                <p className="text-sm text-muted-foreground">
                  Não precisa mais esperar relatórios para saber como está
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-accent/20 rounded-full p-1 mt-1">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
              </div>
              <div>
                <h4 className="font-medium text-accent">Identificar oportunidades</h4>
                <p className="text-sm text-muted-foreground">
                  Descubra onde você pode superar seus concorrentes
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skip = () => {
    onComplete();
  };

  const currentStepData = steps[currentStep];
  const IconComponent = currentStepData.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="relative">
          <button
            onClick={skip}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/20 rounded-full p-3">
              <IconComponent className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Passo {currentStep + 1} de {steps.length}
              </p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="bg-secondary rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {currentStepData.content}
          
          <div className="flex justify-between items-center pt-4">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              Anterior
            </Button>
            
            <div className="flex gap-2">
              <Button variant="ghost" onClick={skip}>
                Pular
              </Button>
              <Button onClick={nextStep}>
                {currentStep === steps.length - 1 ? 'Começar!' : 'Próximo'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WelcomeOnboarding;