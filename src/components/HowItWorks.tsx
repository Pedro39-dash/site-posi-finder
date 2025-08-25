import { Search, BarChart3, Eye, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const HowItWorks = () => {
  const steps = [
    {
      icon: Search,
      title: "Digite seu site e palavras-chave",
      description: "Insira a URL do seu site e as palavras-chave que você quer monitorar no Google."
    },
    {
      icon: BarChart3,
      title: "Analisamos sua posição",
      description: "Nossa ferramenta verifica automaticamente onde seu site aparece nos resultados de busca."
    },
    {
      icon: Eye,
      title: "Receba relatórios detalhados",
      description: "Visualize sua posição atual, histórico de mudanças e insights sobre seu desempenho."
    },
    {
      icon: TrendingUp,
      title: "Monitore mudanças",
      description: "Acompanhe a evolução do seu ranking ao longo do tempo e otimize sua estratégia SEO."
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Como Funciona
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Descubra a posição do seu site no Google em apenas alguns passos simples
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <Card key={index} className="relative group hover:shadow-card transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="mb-4 relative">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-lg text-muted-foreground mb-6">
            Pronto para descobrir onde seu site está rankeando?
          </p>
          <button 
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-lg font-semibold transition-colors shadow-elegant"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Começar Agora
          </button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;