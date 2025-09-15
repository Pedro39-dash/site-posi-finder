import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Edit3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ManualPositionCorrectionProps {
  analysisId: string;
  keyword: string;
  targetDomain: string;
  currentPosition: number | null;
  onPositionUpdated: (newPosition: number) => void;
}

export const ManualPositionCorrection = ({
  analysisId,
  keyword,
  targetDomain,
  currentPosition,
  onPositionUpdated
}: ManualPositionCorrectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newPosition, setNewPosition] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSavePosition = async () => {
    if (!newPosition || isNaN(parseInt(newPosition))) {
      toast.error("Por favor, insira uma posição válida (número)");
      return;
    }

    const position = parseInt(newPosition);
    if (position < 1 || position > 100) {
      toast.error("A posição deve estar entre 1 e 100");
      return;
    }

    setIsLoading(true);

    try {
      // Update the competitor_keywords table with the manual position
      const { error } = await supabase
        .from('competitor_keywords')
        .update({
          target_domain_position: position,
          metadata: {
            manual_override: true,
            manual_override_timestamp: new Date().toISOString(),
            original_position: currentPosition,
            manual_correction_reason: 'user_verified_position'
          }
        })
        .eq('analysis_id', analysisId)
        .eq('keyword', keyword);

      if (error) {
        console.error('Error updating position:', error);
        toast.error("Erro ao atualizar posição");
        return;
      }

      toast.success(`Posição atualizada para ${position}ª`);
      onPositionUpdated(position);
      setIsEditing(false);
      setNewPosition("");
    } catch (error) {
      console.error('Error updating position:', error);
      toast.error("Erro ao atualizar posição");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isEditing) {
    return (
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-sm">Posição não detectada</CardTitle>
            </div>
            <Badge variant="outline" className="text-orange-700 border-orange-300">
              {currentPosition ? `${currentPosition}ª posição` : "Não encontrado"}
            </Badge>
          </div>
          <CardDescription className="text-sm">
            O domínio <strong>{targetDomain}</strong> não foi encontrado automaticamente 
            para a palavra-chave "<strong>{keyword}</strong>". Você pode definir a posição manualmente se souber onde está ranqueando.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => setIsEditing(true)}
            variant="outline"
            size="sm"
            className="w-full border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Definir Posição Manualmente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Edit3 className="h-4 w-4 text-blue-600" />
          Definir Posição Manual
        </CardTitle>
        <CardDescription className="text-sm">
          Em qual posição você encontrou o domínio <strong>{targetDomain}</strong> para "{keyword}"?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            type="number"
            placeholder="Digite a posição (ex: 15)"
            value={newPosition}
            onChange={(e) => setNewPosition(e.target.value)}
            min="1"
            max="100"
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Posição entre 1 (primeiro resultado) e 100
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleSavePosition}
            disabled={isLoading || !newPosition}
            size="sm"
            className="flex-1"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {isLoading ? "Salvando..." : "Salvar Posição"}
          </Button>
          <Button 
            onClick={() => {
              setIsEditing(false);
              setNewPosition("");
            }}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};