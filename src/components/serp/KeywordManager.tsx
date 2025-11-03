import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface KeywordManagerProps {
  keywords: string[];
  onAdd: (keyword: string) => void;
  onRemove: (keyword: string) => void;
}

export function KeywordManager({ keywords, onAdd, onRemove }: KeywordManagerProps) {
  const [newKeyword, setNewKeyword] = useState("");

  const handleAdd = () => {
    const trimmed = newKeyword.trim();
    if (trimmed && !keywords.includes(trimmed.toLowerCase())) {
      onAdd(trimmed);
      setNewKeyword("");
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="keyword-input">Palavra-chave</Label>
        <div className="flex gap-2">
          <Input
            id="keyword-input"
            placeholder="Ex: marketing digital"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button 
            onClick={handleAdd}
            disabled={!newKeyword.trim() || keywords.includes(newKeyword.trim().toLowerCase())}
            size="sm"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw) => (
            <Badge key={kw} variant="secondary" className="gap-1 pr-1">
              <span>{kw}</span>
              <button
                onClick={() => onRemove(kw)}
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
