import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { AuditService } from "@/services/auditService";
import { Settings, CheckCircle, XCircle, AlertTriangle, Play } from "lucide-react";

interface TestResult {
  step: string;
  status: 'pending' | 'success' | 'error' | 'running';
  message: string;
  timestamp?: string;
}

export const AuditTestPanel = () => {
  const { toast } = useToast();
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  
  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, { ...result, timestamp: new Date().toISOString() }]);
  };

  const updateTestResult = (step: string, updates: Partial<TestResult>) => {
    setTestResults(prev => 
      prev.map(result => 
        result.step === step 
          ? { ...result, ...updates, timestamp: new Date().toISOString() }
          : result
      )
    );
  };

  const runFullTest = async () => {
    setIsTesting(true);
    setTestResults([]);

    const testUrl = 'https://example.com';

    // Step 1: Start Audit
    addTestResult({
      step: 'start_audit',
      status: 'running',
      message: 'Iniciando auditoria de teste...'
    });

    try {
      const result = await AuditService.startAudit(testUrl);
      
      if (result.success && result.auditId) {
        updateTestResult('start_audit', {
          status: 'success',
          message: `Auditoria iniciada com ID: ${result.auditId}`
        });

        // Step 2: Poll Status
        addTestResult({
          step: 'poll_status',
          status: 'running',
          message: 'Aguardando conclusão da auditoria...'
        });

        let attempts = 0;
        const maxAttempts = 24; // 2 minutes max
        
        const pollInterval = setInterval(async () => {
          attempts++;
          
          try {
            const statusResult = await AuditService.getAuditStatus(result.auditId!);
            
            if (statusResult.success && statusResult.report) {
              const report = statusResult.report;
              
              if (report.status === 'completed') {
                clearInterval(pollInterval);
                updateTestResult('poll_status', {
                  status: 'success',
                  message: `Auditoria concluída! Score: ${report.overall_score}%`
                });

                // Step 3: Validate Results
                addTestResult({
                  step: 'validate_results',
                  status: 'running',
                  message: 'Validando resultados...'
                });

                if (report.categories && report.categories.length > 0) {
                  updateTestResult('validate_results', {
                    status: 'success',
                    message: `${report.categories.length} categorias analisadas com sucesso`
                  });

                  toast({
                    title: "✅ Teste Completo!",
                    description: `Auditoria funcionando perfeitamente. Score: ${report.overall_score}%`,
                  });
                } else {
                  updateTestResult('validate_results', {
                    status: 'error',
                    message: 'Nenhuma categoria encontrada nos resultados'
                  });
                }
                
                setIsTesting(false);
              } else if (report.status === 'failed') {
                clearInterval(pollInterval);
                updateTestResult('poll_status', {
                  status: 'error',
                  message: 'Auditoria falhou'
                });
                setIsTesting(false);
              } else if (attempts >= maxAttempts) {
                clearInterval(pollInterval);
                updateTestResult('poll_status', {
                  status: 'error',
                  message: 'Timeout - auditoria demorou mais que o esperado'
                });
                setIsTesting(false);
              }
            } else {
              throw new Error(statusResult.error || 'Erro ao verificar status');
            }
          } catch (error) {
            clearInterval(pollInterval);
            updateTestResult('poll_status', {
              status: 'error',
              message: `Erro no polling: ${error}`
            });
            setIsTesting(false);
          }
        }, 5000); // Poll every 5 seconds

      } else {
        throw new Error(result.error || 'Falha ao iniciar auditoria');
      }
    } catch (error) {
      updateTestResult('start_audit', {
        status: 'error',
        message: `Erro: ${error}`
      });
      setIsTesting(false);

      toast({
        title: "❌ Teste Falhou",
        description: "Verifique os logs para detalhes do erro",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running': return <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />;
      default: return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'running': return 'text-blue-600';
      default: return 'text-yellow-600';
    }
  };

  return (
    <Card className="border-dashed border-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Painel de Testes
          </div>
          <Badge variant="secondary">Sistema de Auditoria</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={runFullTest}
              disabled={isTesting}
              className="min-w-[150px]"
            >
              <Play className="h-4 w-4 mr-2" />
              {isTesting ? "Testando..." : "Executar Teste"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Testa toda a funcionalidade de auditoria end-to-end
            </p>
          </div>

          {testResults.length > 0 && (
            <div className="space-y-2 mt-4 p-4 bg-secondary/30 rounded-lg">
              <h4 className="font-semibold text-sm">Resultados do Teste:</h4>
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  {getStatusIcon(result.status)}
                  <span className={getStatusColor(result.status)}>
                    <strong>{result.step.replace('_', ' ').toUpperCase()}:</strong> {result.message}
                  </span>
                  {result.timestamp && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};