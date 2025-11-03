import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface CompetitorManagerProps {
  competitors: string[];
  onAdd: (domain: string) => void;
  onRemove: (domain: string) => void;
  disabled?: boolean;
}

export function CompetitorManager({ competitors, onAdd, onRemove, disabled }: CompetitorManagerProps) {
  const [newCompetitor, setNewCompetitor] = useState("");

  const handleAdd = () => {
    const trimmed = newCompetitor.trim();
    if (trimmed && !competitors.includes(trimmed.toLowerCase())) {
      onAdd(trimmed);
      setNewCompetitor("");
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="competitor-input">Concorrentes (opcional)</Label>
        <div className="flex gap-2">
          <Input
            id="competitor-input"
            placeholder="Ex: concorrente.com.br"
            value={newCompetitor}
            onChange={(e) => setNewCompetitor(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            disabled={disabled}
          />
          <Button 
            onClick={handleAdd}
            disabled={disabled || !newCompetitor.trim() || competitors.includes(newCompetitor.trim().toLowerCase())}
            size="sm"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {competitors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {competitors.map((comp) => (
            <Badge key={comp} variant="outline" className="gap-1 pr-1">
              <span>{comp}</span>
              <button
                onClick={() => onRemove(comp)}
                className="ml-1 rounded-full hover:bg-background/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
