import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Monitor, Globe, Hash, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMonitoring } from "@/contexts/MonitoringContext";

const MonitoringSetup = () => {
  const [website, setWebsite] = useState("");
  const [keywords, setKeywords] = useState("");
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { addSite } = useMonitoring();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!website || !keywords) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o site e palavras-chave",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const keywordArray = keywords
      .split(",")
      .map(k => k.trim())
      .filter(k => k.length > 0);
    
    if (keywordArray.length === 0) {
      toast({
        title: "Palavras-chave inválidas",
        description: "Adicione pelo menos uma palavra-chave válida",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      addSite(website, keywordArray, frequency);
      
      // Reset form
      setWebsite("");
      setKeywords("");
      setFrequency('daily');
    } catch (error) {
      toast({
        title: "Erro ao adicionar monitoramento",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-card">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
          <Monitor className="h-6 w-6 text-primary" />
          Configurar Monitoramento
        </CardTitle>
        <p className="text-muted-foreground">
          Monitore automaticamente as posições do seu site
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              Site (URL)
            </label>
            <Input
              type="url"
              placeholder="https://seusite.com.br"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="h-12"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Hash className="h-4 w-4 text-primary" />
              Palavras-chave (separadas por vírgula)
            </label>
            <Input
              placeholder="marketing digital, seo, otimização"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="h-12"
            />
            <p className="text-xs text-muted-foreground">
              Digite as palavras-chave que deseja monitorar
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Frequência de Verificação
            </label>
            <Select value={frequency} onValueChange={(value: 'daily' | 'weekly') => setFrequency(value)}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diariamente</SelectItem>
                <SelectItem value="weekly">Semanalmente</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Com que frequência verificar as posições
            </p>
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-12 bg-gradient-primary hover:opacity-90 shadow-card"
            disabled={isLoading}
          >
            {isLoading ? (
              "Configurando monitoramento..."
            ) : (
              <>
                <Monitor className="mr-2 h-5 w-5" />
                Iniciar Monitoramento
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default MonitoringSetup;