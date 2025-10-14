import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, PlusCircle } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { toast } from 'sonner';

// Interface que define as propriedades que o componente aceita
interface DirectCompetitiveFormProps {
  onSubmit: (data: {
    targetDomain: string;
    competitors: string[];
    keywords: string[];
  }) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const DirectCompetitiveForm: React.FC<DirectCompetitiveFormProps> = ({ onSubmit, isLoading, disabled }) => {
  const { activeProject } = useProject();
  const [targetDomain, setTargetDomain] = useState('');
  const [competitors, setCompetitors] = useState(['']);
  const [keywords, setKeywords] = useState(['']);

  useEffect(() => {
    if (activeProject?.domain) {
      setTargetDomain(activeProject.domain);
    }
  }, [activeProject]);

  const handleCompetitorChange = (index: number, value: string) => {
    const newCompetitors = [...competitors];
    newCompetitors[index] = value;
    setCompetitors(newCompetitors);
  };

  const addCompetitor = () => setCompetitors([...competitors, '']);
  const removeCompetitor = (index: number) => {
    if (competitors.length > 1) {
      setCompetitors(competitors.filter((_, i) => i !== index));
    }
  };

  const handleKeywordChange = (index: number, value: string) => {
    const newKeywords = [...keywords];
    newKeywords[index] = value;
    setKeywords(newKeywords);
  };

  const addKeyword = () => setKeywords([...keywords, '']);
  const removeKeyword = (index: number) => {
    if (keywords.length > 1) {
      setKeywords(keywords.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || isLoading) return;

    const finalKeywords = keywords.map(k => k.trim()).filter(Boolean);
    if (!targetDomain.trim()) {
      toast.error('O domínio alvo é obrigatório.');
      return;
    }
    if (finalKeywords.length === 0) {
      toast.error('Pelo menos uma palavra-chave é obrigatória.');
      return;
    }

    onSubmit({
      targetDomain: targetDomain.trim(),
      competitors: competitors.map(c => c.trim()).filter(Boolean),
      keywords: finalKeywords,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="targetDomain">Seu Domínio (Alvo)</Label>
        <Input
          id="targetDomain"
          value={targetDomain}
          onChange={(e) => setTargetDomain(e.target.value)}
          placeholder="https://seusite.com.br"
          disabled={disabled || isLoading}
        />
      </div>

      <div>
        <Label>Domínio dos Concorrentes (Opcional)</Label>
        <div className="space-y-2 mt-2">
          {competitors.map((competitor, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                value={competitor}
                onChange={(e) => handleCompetitorChange(index, e.target.value)}
                placeholder={`https://concorrente${index + 1}.com.br`}
                disabled={disabled || isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeCompetitor(index)}
                disabled={disabled || isLoading || competitors.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={addCompetitor}
          disabled={disabled || isLoading}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Concorrente
        </Button>
      </div>
      
      <Card className="bg-secondary/30">
        <CardHeader>
          <CardTitle>Palavras-chave</CardTitle>
          <CardDescription>Insira as palavras-chave que deseja analisar.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {keywords.map((keyword, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  value={keyword}
                  onChange={(e) => handleKeywordChange(index, e.target.value)}
                  placeholder="ex: melhor agência de seo"
                  disabled={disabled || isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeKeyword(index)}
                  disabled={disabled || isLoading || keywords.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={addKeyword}
            disabled={disabled || isLoading}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Palavra-chave
          </Button>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isLoading || disabled} className="w-full">
        {isLoading ? 'Analisando...' : 'Iniciar Análise Competitiva'}
      </Button>
    </form>
  );
};

export default DirectCompetitiveForm;