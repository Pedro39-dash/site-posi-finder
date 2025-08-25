import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitCompare, Globe, Hash, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ComparisonFormProps {
  onCompare: (data: { websites: string[]; keywords: string[] }) => void;
}

const ComparisonForm = ({ onCompare }: ComparisonFormProps) => {
  const [websites, setWebsites] = useState<string[]>(["", ""]);
  const [keywords, setKeywords] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validWebsites = websites.filter(w => w.trim());
    
    if (validWebsites.length < 2 || !keywords) {
      toast({
        title: "Campos obrigatórios",
        description: "Adicione pelo menos 2 sites e algumas palavras-chave",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const keywordArray = keywords
      .split(",")
      .map(k => k.trim())
      .filter(k => k.length > 0);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      onCompare({ websites: validWebsites, keywords: keywordArray });
      
      toast({
        title: "Comparação realizada!",
        description: `Comparando ${validWebsites.length} sites para ${keywordArray.length} palavra(s)-chave`,
      });
    } catch (error) {
      toast({
        title: "Erro na comparação",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addWebsite = () => {
    if (websites.length < 5) {
      setWebsites([...websites, ""]);
    }
  };

  const removeWebsite = (index: number) => {
    if (websites.length > 2) {
      setWebsites(websites.filter((_, i) => i !== index));
    }
  };

  const updateWebsite = (index: number, value: string) => {
    const newWebsites = [...websites];
    newWebsites[index] = value;
    setWebsites(newWebsites);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-card">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
          <GitCompare className="h-6 w-6 text-primary" />
          Comparar Domínios
        </CardTitle>
        <p className="text-muted-foreground">
          Compare até 5 sites para as mesmas palavras-chave
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                Sites para Comparação
              </label>
              {websites.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addWebsite}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar Site
                </Button>
              )}
            </div>
            
            <div className="space-y-3">
              {websites.map((website, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="url"
                    placeholder={`https://site${index + 1}.com`}
                    value={website}
                    onChange={(e) => updateWebsite(index, e.target.value)}
                    className="h-12"
                  />
                  {websites.length > 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeWebsite(index)}
                      className="h-12 w-12 flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
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
              Digite até 10 palavras-chave para comparar entre os sites
            </p>
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-12 bg-gradient-primary hover:opacity-90 shadow-card"
            disabled={isLoading}
          >
            {isLoading ? (
              "Comparando sites..."
            ) : (
              <>
                <GitCompare className="mr-2 h-5 w-5" />
                Comparar Posições
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ComparisonForm;