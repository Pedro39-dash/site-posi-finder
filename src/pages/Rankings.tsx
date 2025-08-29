import { Helmet } from "react-helmet-async";
import { RankingDashboard } from "@/components/ranking/RankingDashboard";

const Rankings = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 py-8">
      <Helmet>
        <title>Monitoramento de Rankings - Análise de Posições SEO</title>
        <meta 
          name="description" 
          content="Monitore as posições das suas palavras-chave nos resultados de busca. Receba alertas sobre mudanças importantes e descubra novas oportunidades de ranking."
        />
        <meta name="keywords" content="monitoramento seo, ranking keywords, posição google, alertas seo, tracking posições" />
        <link rel="canonical" href="/rankings" />
      </Helmet>

      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
            Monitoramento de Rankings
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Acompanhe as posições das suas palavras-chave nos resultados de busca, 
            receba alertas sobre mudanças importantes e descubra novas oportunidades de ranking.
          </p>
        </div>

        <RankingDashboard />
      </div>
    </div>
  );
};

export default Rankings;