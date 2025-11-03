import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SeriesSummary {
  id: string;
  keyword: string;
  domain: string;
  color: string;
  current: number;
  best: number;
  positionGain: number;
}

interface SummaryCardsProps {
  summaries: SeriesSummary[];
  selectedId?: string;
  onSelectSeries?: (id: string) => void;
}

export function SummaryCards({ summaries, selectedId, onSelectSeries }: SummaryCardsProps) {
  if (summaries.length === 0) return null;

  const selected = summaries.find(s => s.id === selectedId) || summaries[0];

  return (
    <>
      {summaries.length > 1 && onSelectSeries && (
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Série de Referência:</span>
              <Select value={selectedId || summaries[0].id} onValueChange={onSelectSeries}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {summaries.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: s.color }}
                        />
                        <span>{s.keyword} — {s.domain}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Posição Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {selected.current}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Último ponto do período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Melhor Posição
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {selected.best}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Menor posição no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ganho de Posições
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold flex items-center gap-2 ${
              selected.positionGain > 0 
                ? 'text-green-500' 
                : selected.positionGain < 0 
                  ? 'text-red-500' 
                  : 'text-muted-foreground'
            }`}>
              {selected.positionGain > 0 && <TrendingUp className="h-6 w-6" />}
              {selected.positionGain < 0 && <TrendingDown className="h-6 w-6" />}
              {selected.positionGain === 0 && <Minus className="h-6 w-6" />}
              {selected.positionGain > 0 ? '+' : ''}{selected.positionGain}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Início vs. Fim (positivo = melhora)
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
