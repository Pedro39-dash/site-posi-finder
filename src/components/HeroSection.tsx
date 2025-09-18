import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, BarChart3 } from "lucide-react";
import heroImage from "@/assets/seo-hero.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-red-50">
      <div className="absolute inset-0 bg-black/10"></div>
      
      <div className="container mx-auto px-4 z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start mb-6">
              <div className="bg-primary/20 backdrop-blur-sm rounded-full p-3 border border-primary/30">
                <TrendingUp className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
              Painel Exclusivo ITX Company de <span className="font-bold"> monitoramento de SEO / AIO</span>
            </h1>
            
            <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl">
              Você contratou nossos serviços de SEO e agora tem acesso total ao acompanhamento dos seus resultados. 
              Monitore posições, compare com concorrentes e veja o progresso do seu investimento em tempo real.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button variant="hero" size="lg" className="shadow-elegant">
                <BarChart3 className="mr-2 h-5 w-5" />
                Acessar Meu Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                onClick={() => {
                  document.getElementById('how-it-works')?.scrollIntoView({ 
                    behavior: 'smooth' 
                  });
                }}
              >
                Como Funciona
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-elegant">
              <img 
                src={heroImage} 
                alt="SEO Dashboard Analytics" 
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent/20 rounded-full blur-xl"></div>
    </section>
  );
};

export default HeroSection;