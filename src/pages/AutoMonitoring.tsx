import { Helmet } from "react-helmet-async";
import AutoMonitoringDashboard from "@/components/monitoring/AutoMonitoringDashboard";
import AutomatedReports from "@/components/reports/AutomatedReports";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AutoMonitoring = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 py-8">
      <Helmet>
        <title>Monitoramento Automático - Sistema Avançado de SEO</title>
        <meta 
          name="description" 
          content="Sistema completo de monitoramento automático com cron jobs, análise de performance, alertas inteligentes e relatórios automatizados."
        />
        <meta name="keywords" content="monitoramento automático, seo automation, cron jobs, performance analysis, alertas seo" />
        <link rel="canonical" href="/auto-monitoring" />
      </Helmet>

      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
            Monitoramento Automático
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Sistema completo de monitoramento com execução automática, análise de performance em tempo real,
            alertas inteligentes e relatórios automatizados para otimização contínua de SEO.
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard">Dashboard de Monitoramento</TabsTrigger>
            <TabsTrigger value="reports">Relatórios Automatizados</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <AutoMonitoringDashboard />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <AutomatedReports />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AutoMonitoring;