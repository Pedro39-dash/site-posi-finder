import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/hooks/useProject';
import { CompetitorAnalysisService } from '@/services/competitorAnalysisService';
import DirectCompetitiveForm from '@/components/comparison/DirectCompetitiveForm';
import CompetitiveResultsDisplay from '@/components/comparison/CompetitiveResultsDisplay';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { KeywordFilterProvider } from '@/contexts/KeywordFilterContext'; // Importar o Provider

// Interface para os valores do formulário
interface AnalysisFormValues {
  targetDomain: string;
  competitors: string[];
  keywords: string[];
}

const Comparison = () => {
  const { user } = useAuth();
  const { activeProject } = useProject();

  // Controlo para saber se mostramos o formulário ou os resultados
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartAnalysis = async (values: AnalysisFormValues) => {
    const { targetDomain, competitors, keywords } = values;

    if (!user || !activeProject?.id) {
      toast.error('É necessário estar autenticado e ter um projeto ativo.');
      return;
    }

    setIsLoading(true);

    try {
      const { success, analysisId, error: startError } = await CompetitorAnalysisService.startAnalysis(
        targetDomain,
        competitors,
        keywords,
        activeProject.id
      );

      if (!success || !analysisId) {
        throw new Error(startError || 'Falha ao iniciar a análise.');
      }

      toast.info('Análise iniciada!', {
        description: 'Os dados serão carregados em breve. Isto pode demorar alguns minutos.',
      });

      // Definir o ID da análise para mudar para a vista de resultados
      setCurrentAnalysisId(analysisId);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast.error('Ocorreu um erro ao iniciar a análise', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para voltar ao formulário a partir dos resultados
  const handleBackToForm = () => {
    setCurrentAnalysisId(null);
  };

  // Renderização condicional: ou mostra o formulário ou os resultados
  return (
    // Envolver a página com o Provider do contexto
    <KeywordFilterProvider>
      <Helmet>
        <title>Análise Competitiva - PosiFinder</title>
        <meta name="description" content="Compare o seu domínio com concorrentes e descubra oportunidades." />
      </Helmet>
      <div className="container mx-auto px-4 py-8">
        {!activeProject && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Nenhum Projeto Ativo</AlertTitle>
            <AlertDescription>
              Por favor, selecione um projeto ativo para iniciar uma análise.
            </AlertDescription>
          </Alert>
        )}

        {/* Se não houver uma análise ativa, mostra o formulário */}
        {!currentAnalysisId ? (
          <DirectCompetitiveForm
            onSubmit={handleStartAnalysis}
            isLoading={isLoading}
            disabled={!activeProject}
          />
        ) : (
          // Se houver uma análise ativa, mostra os resultados
          <CompetitiveResultsDisplay
            analysisId={currentAnalysisId}
            onBackToForm={handleBackToForm}
          />
        )}
      </div>
    </KeywordFilterProvider>
  );
};

export default Comparison;