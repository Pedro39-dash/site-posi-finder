import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Globe, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SearchFormProps {
  onSearch: (data: { website: string; keywords: string[] }) => void;
}

const SearchForm = ({ onSearch }: SearchFormProps) => {
  const [website, setWebsite] = useState("");
  const [keywords, setKeywords] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!website || !keywords) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o site e palavras-chave",
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
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      onSearch({ website, keywords: keywordArray });
      
      toast({
        title: "Busca realizada!",
        description: `Analisando posições para ${keywordArray.length} palavra(s)-chave`,
      });
    } catch (error) {
      toast({
        title: "Erro na busca",
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
          <Search className="h-6 w-6 text-primary" />
          Verificar Posições SEO
        </CardTitle>
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
              Digite até 10 palavras-chave separadas por vírgula
            </p>
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-12 bg-gradient-primary hover:opacity-90 shadow-card"
            disabled={isLoading}
          >
            {isLoading ? (
              "Analisando posições..."
            ) : (
              <>
                <Search className="mr-2 h-5 w-5" />
                Verificar Posições
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SearchForm;