import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Search } from "lucide-react";
import heroImage from "@/assets/seo-hero.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
      <div className="absolute inset-0 bg-black/10"></div>
      
      <div className="container mx-auto px-4 z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start mb-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6">
              Descubra a Posição do Seu Site
              <span className="block text-accent-foreground">nos Resultados de Busca</span>
            </h1>
            
            <p className="text-xl text-white/90 mb-8 max-w-2xl">
              Digite seu site e palavras-chave para descobrir exatamente onde você está rankeando no Google. 
              Monitore sua posição e otimize sua estratégia de SEO.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button variant="hero" size="lg" className="shadow-elegant">
                <Search className="mr-2 h-5 w-5" />
                Verificar Posição Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
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
      <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent/20 rounded-full blur-xl"></div>
    </section>
  );
};

export default HeroSection;