import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PeriodOption = '7d' | '30d' | '90d' | '180d' | '365d';

interface PeriodSelectorProps {
  value: PeriodOption;
  onChange: (period: PeriodOption) => void;
}

export const PeriodSelector = ({ value, onChange }: PeriodSelectorProps) => {
  const periods: { value: PeriodOption; label: string }[] = [
    { value: '7d', label: '7 dias' },
    { value: '30d', label: '30 dias' },
    { value: '90d', label: '3 meses' },
    { value: '180d', label: '6 meses' },
    { value: '365d', label: '1 ano' },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-medium text-muted-foreground">Período:</span>
      {periods.map((period) => (
        <Button
          key={period.value}
          variant={value === period.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(period.value)}
          className={cn(
            "transition-all",
            value === period.value && "shadow-md"
          )}
        >
          {period.label}
        </Button>
      ))}
    </div>
  );
};
