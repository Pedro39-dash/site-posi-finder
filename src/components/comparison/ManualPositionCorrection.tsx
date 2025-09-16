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
      <Card className="border-amber-200 bg-amber-50 border">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 flex-1">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">Posição não detectada</span>
                  <Badge variant="outline" className="text-xs text-amber-700 border-amber-300 bg-amber-100">
                    {currentPosition ? `${currentPosition}ª` : "Não encontrado"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  <strong>{targetDomain}</strong> não foi encontrado para "<strong>{keyword}</strong>"
                </p>
                <Button 
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs border-amber-300 text-amber-700 hover:bg-amber-100 h-8"
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  Definir Posição
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50 border">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Edit3 className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-foreground">Definir Posição Manual</span>
          </div>
          
          <p className="text-xs text-slate-700">
            Posição de <strong>{targetDomain}</strong> para "<strong>{keyword}</strong>"
          </p>
          
          <div className="space-y-2">
            <Input
              type="number"
              placeholder="Ex: 15"
              value={newPosition}
              onChange={(e) => setNewPosition(e.target.value)}
              min="1"
              max="100"
              className="w-full h-8 text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Entre 1 (primeiro) e 100
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleSavePosition}
              disabled={isLoading || !newPosition}
              size="sm"
              className="flex-1 h-8 text-xs"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
            <Button 
              onClick={() => {
                setIsEditing(false);
                setNewPosition("");
              }}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="h-8 text-xs"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};