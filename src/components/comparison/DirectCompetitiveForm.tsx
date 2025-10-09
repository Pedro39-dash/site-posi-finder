import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Plus, Target, Users, Loader2, AlertTriangle, Check, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CompetitorAnalysisService } from '@/services/competitorAnalysisService';
import { toast } from '@/hooks/use-toast';
import { useActiveProject } from '@/contexts/ActiveProjectContext';
import { ProjectSelector } from '@/components/projects/ProjectSelector';
import AdvancedKeywordSuggestions from './AdvancedKeywordSuggestions';
import { RankingService, KeywordRanking } from '@/services/rankingService';

interface DirectCompetitiveFormProps {
  onAnalysisStarted: (analysisId: string) => void;
}

const DirectCompetitiveForm = ({ onAnalysisStarted }: DirectCompetitiveFormProps) => {
  const { activeProject } = useActiveProject();
  
  // Track if user has manually entered data
  const hasUserInputRef = useRef({
    domain: false,
    competitors: false,
    keywords: false
  });
  
  // Form data
  const [clientDomain, setClientDomain] = useState<string>("");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [competitorInput, setCompetitorInput] = useState<string>("");
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [currentKeywordInput, setCurrentKeywordInput] = useState('');
  
  // Monitored keywords state
  const [monitoredKeywords, setMonitoredKeywords] = useState<string[]>([]);
  const [isLoadingKeywords, setIsLoadingKeywords] = useState(false);
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);

  // Validation states
  const [errors, setErrors] = useState<{
    clientDomain?: string;
    competitors?: string;
    keywords?: string;
  }>({});

  // Reset and auto-fill when active project changes
  useEffect(() => {
    console.log('🎯 DirectCompetitiveForm useEffect disparado - activeProject:', activeProject?.name, activeProject?.id);
    
    if (!activeProject?.id) return;
    
    console.log('🔄 DirectCompetitiveForm: Projeto mudou para', activeProject.name);
    console.log('📌 Dados do projeto:', {
      domain: activeProject.domain,
      keywords: activeProject.focus_keywords,
      competitors: activeProject.competitor_domains
    });
    
    // 1. Reset user input flags FIRST
    hasUserInputRef.current = {
      domain: false,
      competitors: false,
      keywords: false
    };
    
    // 2. Clear all form states
    setClientDomain('');
    setCompetitors([]);
    setCompetitorInput('');
    setSelectedKeywords([]);
    setKeywordInput('');
    setCurrentKeywordInput('');
    setErrors({});
    
    // 3. Use setTimeout to ensure auto-fill happens AFTER clearing
    const timeoutId = setTimeout(() => {
      console.log('✅ Preenchendo formulário com dados do projeto');
      
      // Auto-fill with project data
      if (activeProject.domain) {
        setClientDomain(activeProject.domain);
        console.log('  → Domain:', activeProject.domain);
      }
      
      if (activeProject.focus_keywords?.length > 0) {
        const keywords = activeProject.focus_keywords.slice(0, 5);
        setSelectedKeywords(keywords);
        console.log('  → Keywords:', keywords);
      }
      
      if (activeProject.competitor_domains?.length > 0) {
        const comps = activeProject.competitor_domains.slice(0, 5);
        setCompetitors(comps);
        console.log('  → Competitors:', comps);
      }
    }, 100); // 100ms delay to ensure proper order
    
    return () => clearTimeout(timeoutId);
  }, [activeProject]);

  // Fetch monitored keywords when project changes
  useEffect(() => {
    const fetchMonitoredKeywords = async () => {
      if (!activeProject?.id) {
        setMonitoredKeywords([]);
        return;
      }

      setIsLoadingKeywords(true);
      try {
        const result = await RankingService.getProjectRankings(activeProject.id);
        
        if (result.success && result.rankings) {
          // Extrair apenas os nomes das keywords (sem duplicatas)
          const keywords = Array.from(
            new Set(result.rankings.map(r => r.keyword))
          );
          
          console.log('📊 Keywords monitoradas carregadas:', keywords.length);
          setMonitoredKeywords(keywords);
        }
      } catch (error) {
        console.error('Erro ao buscar keywords monitoradas:', error);
        setMonitoredKeywords([]);
      } finally {
        setIsLoadingKeywords(false);
      }
    };

    fetchMonitoredKeywords();
  }, [activeProject?.id]);

  const addCompetitor = () => {
    if (competitorInput.trim() && !competitors.includes(competitorInput.trim()) && competitors.length < 5) {
      const cleanedCompetitor = competitorInput.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
      if (cleanedCompetitor !== clientDomain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]) {
        hasUserInputRef.current.competitors = true;
        setCompetitors([...competitors, cleanedCompetitor]);
        setCompetitorInput("");
      } else {
        toast({
          title: "Erro",
          description: "Não é possível adicionar o próprio domínio como concorrente",
          variant: "destructive"
        });
      }
    }
  };

  const removeCompetitor = (index: number) => {
    hasUserInputRef.current.competitors = true;
    setCompetitors(competitors.filter((_, i) => i !== index));
  };

  const addKeyword = (keyword?: string) => {
    const keywordToAdd = keyword || keywordInput.trim();
    if (keywordToAdd && !selectedKeywords.includes(keywordToAdd) && selectedKeywords.length < 5) {
      hasUserInputRef.current.keywords = true;
      setSelectedKeywords(prev => [...prev, keywordToAdd]);
      if (!keyword) {
        setKeywordInput('');
        setCurrentKeywordInput('');
      }
    }
  };

  const removeKeyword = (index: number) => {
    hasUserInputRef.current.keywords = true;
    setSelectedKeywords(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Reset errors
    setErrors({});
    
    // Validation
    const newErrors: typeof errors = {};
    
    if (!clientDomain.trim()) {
      newErrors.clientDomain = "Digite o domínio do cliente";
    }


    if (selectedKeywords.length === 0) {
      newErrors.keywords = "Digite pelo menos uma palavra-chave";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsLoading(true);
      
      const result = await CompetitorAnalysisService.startAnalysis(
        null, // No audit required
        clientDomain,
        competitors,
        selectedKeywords
      );

      if (result.success && result.analysisId) {
        toast({
          title: "Sucesso",
          description: "Análise competitiva iniciada com sucesso"
        });
        onAnalysisStarted(result.analysisId);
      } else {
        toast({
          title: "Erro",
          description: result.error || "Falha ao iniciar análise competitiva",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao iniciar análise",
        variant: "destructive"
      });
      console.error('Error starting analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Project Selection */}
      <div className="space-y-4 p-6 border border-border rounded-lg">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Projeto Selecionado</Label>
          <ProjectSelector />
        </div>
        {activeProject && (
          <div className="p-3 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full" />
              <span className="font-medium">{activeProject.name}</span>
              <Badge variant="secondary">{activeProject.domain}</Badge>
            </div>
          </div>
        )}
      </div>

      {/* Client Domain Input */}
      <div className="space-y-4 p-6 border border-border rounded-lg">
        <Label htmlFor="clientDomain" className="text-base font-medium">
          Domínio Principal (Seu Site)
        </Label>
        <Input
          id="clientDomain"
          type="text"
          placeholder="exemplo.com"
          value={clientDomain}
          onChange={(e) => {
            hasUserInputRef.current.domain = true;
            setClientDomain(e.target.value);
          }}
          className={errors.clientDomain ? "border-red-500" : ""}
        />
        {errors.clientDomain && (
          <p className="text-sm text-red-500">{errors.clientDomain}</p>
        )}
      </div>

      {/* Competitors Section */}
      <div className="space-y-4 p-6 border border-border rounded-lg">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <Label className="text-base font-medium">Concorrentes</Label>
          <Badge variant="outline">Opcional</Badge>
          <Badge variant="secondary">{competitors.length}/5</Badge>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-xs">
                <p className="font-medium mb-1">Concorrentes Opcionais</p>
                <p className="text-xs">
                  Adicione concorrentes específicos que deseja destacar nos resultados. 
                  Se não adicionar nenhum, o sistema descobrirá automaticamente concorrentes 
                  baseado nas palavras-chave fornecidas.
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
        
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="concorrente.com (opcional)"
            value={competitorInput}
            onChange={(e) => {
              hasUserInputRef.current.competitors = true;
              setCompetitorInput(e.target.value);
            }}
            onKeyPress={(e) => e.key === 'Enter' && addCompetitor()}
            className="flex-1"
          />
          <Button 
            type="button" 
            onClick={addCompetitor}
            disabled={competitors.length >= 5}
            variant="outline"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {competitors.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Concorrentes adicionados:</p>
            <div className="flex flex-wrap gap-2">
              {competitors.map((competitor, index) => (
                <Badge key={index} variant="outline" className="px-3 py-1">
                  {competitor}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-2 text-muted-foreground hover:text-red-500"
                    onClick={() => removeCompetitor(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {errors.competitors && (
          <p className="text-sm text-red-500">{errors.competitors}</p>
        )}

        {/* Visual Comparison */}
        {clientDomain && (
          <div className="p-4 bg-muted/30 rounded-lg border border-dashed border-border">
            <div className="text-sm font-medium text-muted-foreground mb-3">Preview da Comparação:</div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="default" className="bg-primary/10 text-primary border-primary">
                {clientDomain} (Você)
              </Badge>
              {competitors.length > 0 && (
                <>
                  <span className="text-muted-foreground">vs</span>
                  {competitors.map((competitor, index) => (
                    <Badge key={index} variant="outline">
                      {competitor}
                    </Badge>
                  ))}
                </>
              )}
              {competitors.length === 0 && (
                <span className="text-muted-foreground text-sm">+ Concorrentes descobertos automaticamente</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Keywords Section */}
      <div className="space-y-4 p-6 border border-border rounded-lg">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <Label className="text-base font-medium">Palavras-chave</Label>
          <Badge variant="secondary">{selectedKeywords.length}/5</Badge>
        </div>
        
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Digite uma palavra-chave..."
            value={keywordInput}
            onChange={(e) => {
              hasUserInputRef.current.keywords = true;
              setKeywordInput(e.target.value);
              setCurrentKeywordInput(e.target.value);
            }}
            onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
            className="flex-1"
          />
          <Button 
            type="button" 
            onClick={() => addKeyword()}
            disabled={selectedKeywords.length >= 5}
            variant="outline"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

              {/* Advanced Keyword Suggestions */}
              <AdvancedKeywordSuggestions
                targetDomain={clientDomain}
                competitors={competitors}
                baseKeywords={selectedKeywords}
                onAddKeyword={addKeyword}
                existingKeywords={selectedKeywords}
              />

        {selectedKeywords.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Palavras-chave selecionadas:</p>
            <div className="flex flex-wrap gap-2">
              {selectedKeywords.map((keyword, index) => (
                <Badge key={index} variant="outline" className="px-3 py-1">
                  {keyword}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm" 
                    className="h-auto p-0 ml-2 text-muted-foreground hover:text-red-500"
                    onClick={() => removeKeyword(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Keywords being monitored (from Search Console or manually added) */}
        {monitoredKeywords.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                Keywords em Monitoramento
              </p>
              <Badge variant="secondary" className="text-xs">
                {monitoredKeywords.length} total
              </Badge>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">
                    Keywords vindas do Search Console ou adicionadas manualmente 
                    na tela de Monitoramento
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-dashed border-border rounded-lg">
              {isLoadingKeywords ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando keywords...
                </div>
              ) : (
                monitoredKeywords
                  .filter(keyword => !selectedKeywords.includes(keyword))
                  .slice(0, 20)
                  .map((keyword, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addKeyword(keyword)}
                      disabled={selectedKeywords.length >= 5}
                      className="text-xs px-2 py-1 h-7"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {keyword}
                    </Button>
                  ))
              )}
            </div>
          </div>
        )}

        {errors.keywords && (
          <p className="text-sm text-red-500">{errors.keywords}</p>
        )}
      </div>

      {/* Validation Alerts */}
      {(errors.clientDomain || errors.keywords) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Por favor, corrija os erros acima antes de continuar.
          </AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t border-border">
        <Button 
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-8"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Iniciando Análise...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Iniciar Análise Competitiva
            </>
          )}
        </Button>
      </div>
    </div>
    </TooltipProvider>
  );
};

export default DirectCompetitiveForm;