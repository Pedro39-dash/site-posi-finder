import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type PositionRange = 'all' | 'top3' | 'top10' | 'top20' | 'top50' | 'top100';

interface PositionFiltersProps {
  value: PositionRange;
  onChange: (range: PositionRange) => void;
  counts?: {
    all: number;
    top3: number;
    top10: number;
    top20: number;
    top50: number;
    top100: number;
  };
}

export const PositionFilters = ({ value, onChange, counts }: PositionFiltersProps) => {
  const filters: { value: PositionRange; label: string; color?: string }[] = [
    { value: 'all', label: 'Todas', color: 'default' },
    { value: 'top3', label: 'Top 3', color: 'default' },
    { value: 'top10', label: '4-10', color: 'secondary' },
    { value: 'top20', label: '11-20', color: 'secondary' },
    { value: 'top50', label: '21-50', color: 'outline' },
    { value: 'top100', label: '51-100', color: 'outline' },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-medium text-muted-foreground">Filtrar por posição:</span>
      {filters.map((filter) => (
        <Badge
          key={filter.value}
          variant={value === filter.value ? 'default' : 'outline'}
          className={cn(
            "cursor-pointer transition-all hover:scale-105",
            value === filter.value && "shadow-md"
          )}
          onClick={() => onChange(filter.value)}
        >
          {filter.label}
          {counts && counts[filter.value] > 0 && (
            <span className="ml-1.5 text-xs opacity-80">
              ({counts[filter.value]})
            </span>
          )}
        </Badge>
      ))}
    </div>
  );
};
