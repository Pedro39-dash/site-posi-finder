import { useState, useEffect } from "react";
import { Search, Plus, X, Target, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { AuditService, AuditReport } from "@/services/auditService";
import { CompetitorAnalysisService } from "@/services/competitorAnalysisService";

interface CompetitiveAnalysisFormProps {
  onAnalysisStarted: (analysisId: string) => void;
}

const CompetitiveAnalysisForm = ({ onAnalysisStarted }: CompetitiveAnalysisFormProps) => {
  const [audits, setAudits] = useState<AuditReport[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<string>("");
  const [targetDomain, setTargetDomain] = useState<string>("");
  const [additionalCompetitors, setAdditionalCompetitors] = useState<string[]>([]);
  const [newCompetitor, setNewCompetitor] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingAudits, setLoadingAudits] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadUserAudits();
  }, []);

  const loadUserAudits = async () => {
    try {
      setLoadingAudits(true);
      const result = await AuditService.getUserAudits(20);
      if (result.success && result.audits) {
        // Filter only completed audits
        const completedAudits = result.audits.filter(audit => audit.status === 'completed');
        setAudits(completedAudits);
      } else {
        toast({
          title: "Erro",
          description: result.error || "Não foi possível carregar as auditorias",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar auditorias",
        variant: "destructive",
      });
    } finally {
      setLoadingAudits(false);
    }
  };

  const handleAuditSelect = (auditId: string) => {
    setSelectedAudit(auditId);
    const selectedAuditData = audits.find(audit => audit.id === auditId);
    if (selectedAuditData) {
      // Extract domain from audit URL
      const domain = extractDomainFromUrl(selectedAuditData.url);
      setTargetDomain(domain);
    }
  };

  const extractDomainFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    }
  };

  const addCompetitor = () => {
    if (newCompetitor.trim() && !additionalCompetitors.includes(newCompetitor.trim())) {
      const domain = extractDomainFromUrl(newCompetitor.trim());
      if (domain !== targetDomain) {
        setAdditionalCompetitors([...additionalCompetitors, domain]);
        setNewCompetitor("");
      } else {
        toast({
          title: "Domínio Inválido",
          description: "Não é possível adicionar o próprio domínio como concorrente",
          variant: "destructive",
        });
      }
    }
  };

  const removeCompetitor = (competitor: string) => {
    setAdditionalCompetitors(additionalCompetitors.filter(c => c !== competitor));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAudit || !targetDomain) {
      toast({
        title: "Campos Obrigatórios",
        description: "Selecione uma auditoria para continuar",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const result = await CompetitorAnalysisService.startAnalysis(
        selectedAudit,
        targetDomain,
        additionalCompetitors
      );

      if (result.success && result.analysisId) {
        toast({
          title: "Análise Iniciada",
          description: "A análise competitiva foi iniciada com sucesso",
        });
        onAnalysisStarted(result.analysisId);
      } else {
        toast({
          title: "Erro",
          description: result.error || "Falha ao iniciar análise competitiva",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao iniciar análise",
        variant: "destructive",
      });
      console.error('Error starting analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAuditScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">Excelente</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Bom</Badge>;
    if (score >= 40) return <Badge className="bg-orange-100 text-orange-800">Regular</Badge>;
    return <Badge className="bg-red-100 text-red-800">Precisa Melhorar</Badge>;
  };

  if (loadingAudits) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Carregando auditorias...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (audits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Análise Competitiva
          </CardTitle>
          <CardDescription>
            Para usar a análise competitiva, você precisa ter pelo menos uma auditoria SEO concluída
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Target className="h-4 w-4" />
            <AlertDescription>
              Faça uma auditoria SEO primeiro para identificar as palavras-chave do seu site e então analisar a concorrência.
            </AlertDescription>
          </Alert>
          <div className="mt-6">
            <Button asChild className="w-full">
              <a href="/audit">Fazer Auditoria SEO</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Análise Competitiva Avançada
        </CardTitle>
        <CardDescription>
          Analise posições reais no Google e identifique concorrentes automaticamente baseado nas suas auditorias SEO
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Audit Selection */}
          <div className="space-y-2">
            <Label htmlFor="audit-select">Selecionar Auditoria Base</Label>
            <Select value={selectedAudit} onValueChange={handleAuditSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha uma auditoria concluída" />
              </SelectTrigger>
              <SelectContent>
                {audits.map((audit) => (
                  <SelectItem key={audit.id} value={audit.id}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[200px]">
                          {extractDomainFromUrl(audit.url)}
                        </span>
                        {getAuditScoreBadge(audit.overall_score)}
                      </div>
                      <span className="text-xs text-muted-foreground ml-2">
                        {new Date(audit.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Usaremos as palavras-chave extraídas desta auditoria para analisar a concorrência
            </p>
          </div>

          {/* Target Domain Display */}
          {targetDomain && (
            <div className="space-y-2">
              <Label>Domínio a ser Analisado</Label>
              <div className="p-3 bg-muted/50 rounded-md">
                <span className="font-medium">{targetDomain}</span>
              </div>
            </div>
          )}

          {/* Additional Competitors */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="competitor-input">Concorrentes Adicionais (Opcional)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Além dos concorrentes detectados automaticamente, você pode adicionar domínios específicos
              </p>
              <div className="flex gap-2">
                <Input
                  id="competitor-input"
                  value={newCompetitor}
                  onChange={(e) => setNewCompetitor(e.target.value)}
                  placeholder="exemplo.com"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCompetitor())}
                />
                <Button type="button" onClick={addCompetitor} variant="outline" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Added Competitors */}
            {additionalCompetitors.length > 0 && (
              <div className="space-y-2">
                <Label>Concorrentes Adicionados</Label>
                <div className="flex flex-wrap gap-2">
                  {additionalCompetitors.map((competitor) => (
                    <Badge key={competitor} variant="secondary" className="flex items-center gap-1">
                      {competitor}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => removeCompetitor(competitor)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={loading || !selectedAudit} className="w-full gap-2">
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Iniciando Análise...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Iniciar Análise Competitiva
              </>
            )}
          </Button>

          {/* Info Alert */}
          <Alert>
            <Target className="h-4 w-4" />
            <AlertDescription>
              <strong>Como funciona:</strong> Analisaremos as posições reais no Google para as palavras-chave 
              da auditoria selecionada, identificaremos automaticamente seus principais concorrentes e 
              mostraremos oportunidades específicas de melhoria.
            </AlertDescription>
          </Alert>
        </form>
      </CardContent>
    </Card>
  );
};

export default CompetitiveAnalysisForm;