import { PeriodOption } from '@/components/monitoring/filters/PeriodSelector';

/**
 * Configuração de thresholds de relevância para validação de keywords
 */
export const RELEVANCE_THRESHOLDS = {
  // Percentual mínimo de cobertura de dados para considerar keyword relevante
  minCoveragePercentage: 70,
  
  // Número mínimo de pontos de dados por período
  minPointsByPeriod: {
    '24h': 1,      // Pelo menos 1 ponto nas últimas 24h
    '7d': 5,       // Pelo menos 5 pontos em 7 dias (70% cobertura)
    '28d': 20,     // Pelo menos 20 pontos em 28 dias (70% cobertura)
    '90d': 60,     // Pelo menos 60 pontos em 90 dias (70% cobertura)
    '180d': 120,   // Pelo menos 120 pontos em 180 dias (70% cobertura)
    '365d': 240,   // Pelo menos 240 pontos em 365 dias (70% cobertura)
    '16m': 320,    // Pelo menos 320 pontos em 16 meses (70% cobertura)
  } as Record<PeriodOption, number>
} as const;

/**
 * Labels de período para exibição na UI
 */
export const PERIOD_LABELS: Record<PeriodOption, string> = {
  '24h': 'últimas 24h',
  '7d': 'últimos 7 dias',
  '28d': 'últimos 28 dias',
  '90d': 'últimos 90 dias',
  '180d': 'últimos 6 meses',
  '365d': 'último ano',
  '16m': 'últimos 16 meses',
};

/**
 * Número de dias por período
 */
export const PERIOD_DAYS: Record<PeriodOption, number> = {
  '24h': 1,
  '7d': 7,
  '28d': 28,
  '90d': 90,
  '180d': 180,
  '365d': 365,
  '16m': 480, // aproximadamente 16 meses
};
