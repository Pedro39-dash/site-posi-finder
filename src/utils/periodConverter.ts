import { PeriodOption } from "@/components/monitoring/filters/PeriodSelector";

/**
 * Converte o período selecionado pelo usuário para dias (padrão GSC)
 */
export function periodToDays(period: PeriodOption): number {
  const periodMap: Record<PeriodOption, number> = {
    'today': 1,
    '7d': 7,
    '28d': 28,
    '90d': 90,
    '180d': 180,
    '365d': 365,
    '16m': 480, // 16 meses = máximo do GSC
  };
  
  return periodMap[period] || 28; // default 28 dias
}

/**
 * Calcula as datas de início e fim baseadas no período
 */
export function periodToDateRange(period: PeriodOption): {
  startDate: string;
  endDate: string;
} {
  const days = periodToDays(period);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}
