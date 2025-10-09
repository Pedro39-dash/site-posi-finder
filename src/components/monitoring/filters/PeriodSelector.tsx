import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PeriodOption = '24h' | '7d' | '28d' | '90d' | '180d' | '365d' | '16m';

interface PeriodSelectorProps {
  value: PeriodOption;
  onChange: (period: PeriodOption) => void;
}

export const PeriodSelector = ({ value, onChange }: PeriodSelectorProps) => {
  const periods: { value: PeriodOption; label: string }[] = [
    { value: '24h', label: '24 horas' },
    { value: '7d', label: '7 dias' },
    { value: '28d', label: '28 dias' },
    { value: '90d', label: '3 meses' },
    { value: '180d', label: '6 meses' },
    { value: '365d', label: '12 meses' },
    { value: '16m', label: '16 meses' },
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
