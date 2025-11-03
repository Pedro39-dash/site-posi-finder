import { Switch } from "@/components/ui/switch";
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
}

export function SeriesLegend({ series, onToggle }: SeriesLegendProps) {
  if (series.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Séries no Gráfico</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {series.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
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
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id={`series-${item.id}`}
                  checked={item.active}
                  onCheckedChange={() => onToggle(item.id)}
                />
                <Label 
                  htmlFor={`series-${item.id}`}
                  className="text-xs text-muted-foreground cursor-pointer"
                >
                  {item.active ? 'ON' : 'OFF'}
                </Label>
              </div>
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
