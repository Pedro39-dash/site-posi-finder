import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

const SimulationNotice = () => {
  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
      <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="text-amber-800 dark:text-amber-200">
        <strong>Dados Simulados:</strong> Esta é uma versão demonstrativa. 
        Os resultados apresentados são simulados e não refletem as posições reais no Google. 
        Para dados precisos, integre com APIs oficiais como Google Search Console.
      </AlertDescription>
    </Alert>
  );
};

export default SimulationNotice;