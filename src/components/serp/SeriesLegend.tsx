import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface SeriesItem {
  id: string;
  keyword: string;
  domain: string;
  color: string;
  active: boolean;
  isMain?: boolean;
}

interface SeriesLegendProps {
  series: SeriesItem[];
  onToggle: (id: string) => void;
  onToggleAll: () => void;
}

export function SeriesLegend({ series, onToggle, onToggleAll }: SeriesLegendProps) {
  if (series.length === 0) return null;

  const allActive = series.every(s => s.active);
  const someActive = series.some(s => s.active);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Séries no Gráfico</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Marcar todos */}
          {series.length > 1 && (
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              <Checkbox
                id="toggle-all"
                checked={allActive}
                onCheckedChange={onToggleAll}
                className={someActive && !allActive ? "opacity-50" : ""}
              />
              <Label 
                htmlFor="toggle-all"
                className="text-sm font-medium cursor-pointer"
              >
                {allActive ? 'Desmarcar todos' : 'Marcar todos'}
              </Label>
            </div>
          )}

          {/* Lista de séries */}
          {series.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <Checkbox
                id={`series-${item.id}`}
                checked={item.active}
                onCheckedChange={() => onToggle(item.id)}
              />
              <Label 
                htmlFor={`series-${item.id}`}
                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
              >
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {item.keyword}
                    </span>
                    {item.isMain && (
                      <Badge variant="secondary" className="text-xs">Principal</Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground truncate">
                    {item.domain}
                  </span>
                </div>
              </Label>
            </div>
          ))}
        </div>
        {series.length > 8 && (
          <div className="mt-3 text-xs text-amber-600 dark:text-amber-500">
            ⚠️ Muitas séries ativas podem afetar a performance do gráfico.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
