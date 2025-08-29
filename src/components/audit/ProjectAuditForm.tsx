import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProject } from "@/hooks/useProject";
import { Search, Globe, Target, Clock } from "lucide-react";

interface ProjectAuditFormProps {
  onAudit: (url: string, focusKeyword: string) => void;
  isScanning: boolean;
  urlError: string;
  onUrlChange: (url: string) => void;
  url: string;
  focusKeyword: string;
  onFocusKeywordChange: (keyword: string) => void;
}

export const ProjectAuditForm = ({
  onAudit,
  isScanning,
  urlError,
  onUrlChange,
  url,
  focusKeyword,
  onFocusKeywordChange
}: ProjectAuditFormProps) => {
  const { activeProject } = useProject();
  const [useProjectData, setUseProjectData] = useState(true);

  const handleProjectDataToggle = () => {
    if (!useProjectData && activeProject) {
      // Auto-fill with project data
      onUrlChange(activeProject.domain);
      if (activeProject.focus_keywords && activeProject.focus_keywords.length > 0) {
        onFocusKeywordChange(activeProject.focus_keywords[0]);
      }
    } else if (useProjectData) {
      // Clear form
      onUrlChange('');
      onFocusKeywordChange('');
    }
    setUseProjectData(!useProjectData);
  };

  const handleQuickFill = () => {
    onUrlChange('https://example.com');
    onFocusKeywordChange('marketing digital');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Configurar Auditoria SEO
          </div>
          <div className="flex items-center gap-2">
            {activeProject && (
              <Button
                variant={useProjectData ? "default" : "outline"}
                size="sm"
                onClick={handleProjectDataToggle}
              >
                <Globe className="h-4 w-4 mr-2" />
                {useProjectData ? 'Usar Projeto Ativo' : 'Preencher Manual'}
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleQuickFill}
              disabled={isScanning}
            >
              🧪 Site Teste
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeProject && useProjectData && (
          <div className="mb-4 p-3 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="font-medium">Projeto Ativo: {activeProject.name}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Domínio:</span>
                <p className="font-medium">{activeProject.domain}</p>
              </div>
              {activeProject.focus_keywords && activeProject.focus_keywords.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Keywords:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {activeProject.focus_keywords.slice(0, 3).map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                    {activeProject.focus_keywords.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{activeProject.focus_keywords.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder={
                  activeProject && useProjectData 
                    ? `Auditoria para: ${activeProject.domain}`
                    : "Digite a URL do site (ex: example.com, itxcompany.com.br)"
                }
                value={useProjectData && activeProject ? activeProject.domain : url}
                onChange={(e) => onUrlChange(e.target.value)}
                disabled={isScanning || (useProjectData && !!activeProject)}
                className={urlError ? 'border-red-500' : ''}
              />
              {urlError && (
                <p className="text-sm text-red-500 mt-1">{urlError}</p>
              )}
            </div>
            <Button 
              onClick={() => onAudit(
                useProjectData && activeProject ? activeProject.domain : url,
                focusKeyword
              )}
              disabled={isScanning || (!url.trim() && !(useProjectData && activeProject)) || !!urlError}
              className="h-10"
            >
              {isScanning ? (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 animate-spin" />
                  Analisando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Iniciar Auditoria
                </div>
              )}
            </Button>
          </div>

          <div>
            <Input
              placeholder={
                activeProject && useProjectData && activeProject.focus_keywords && activeProject.focus_keywords.length > 0
                  ? `Keyword foco: ${activeProject.focus_keywords[0]}`
                  : "Palavra-chave principal (opcional) - ex: marketing digital"
              }
              value={
                useProjectData && activeProject && activeProject.focus_keywords && activeProject.focus_keywords.length > 0 
                  ? activeProject.focus_keywords[0] 
                  : focusKeyword
              }
              onChange={(e) => onFocusKeywordChange(e.target.value)}
              disabled={isScanning || (useProjectData && !!activeProject && !!activeProject?.focus_keywords?.length)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              A palavra-chave foco ajuda na análise específica de otimização de conteúdo
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};