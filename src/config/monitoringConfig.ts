import { PeriodOption } from '@/components/monitoring/filters/PeriodSelector';

/**
 * Configuração de thresholds de relevância para validação de keywords
 */
export const RELEVANCE_THRESHOLDS = {
  // Percentual mínimo de cobertura de dados para considerar keyword relevante
  // Reduzido de 70% para 50% para acomodar dados esparsos do GSC
  minCoveragePercentage: 50,
  
  // Número mínimo de pontos de dados por período
  // Ajustado para refletir a frequência real de coleta do GSC (não diária)
  minPointsByPeriod: {
    'today': 0,    // Hoje: busca em tempo real via SerpAPI
    '7d': 3,       // Pelo menos 3 pontos em 7 dias (50% cobertura ~3-4 coletas)
    '28d': 10,     // Pelo menos 10 pontos em 28 dias (50% cobertura ~2-3x/semana)
    '90d': 30,     // Pelo menos 30 pontos em 90 dias (50% cobertura ~2x/semana)
    '180d': 60,    // Pelo menos 60 pontos em 180 dias (50% cobertura ~2x/semana)
    '365d': 120,   // Pelo menos 120 pontos em 365 dias (50% cobertura ~2-3x/semana)
    '16m': 160,    // Pelo menos 160 pontos em 16 meses (50% cobertura ~2-3x/semana)
  } as Record<PeriodOption, number>
} as const;

/**
 * Labels de período para exibição na UI
 */
export const PERIOD_LABELS: Record<PeriodOption, string> = {
  'today': 'hoje (tempo real)',
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
  'today': 1,
  '7d': 7,
  '28d': 28,
  '90d': 90,
  '180d': 180,
  '365d': 365,
  '16m': 480, // aproximadamente 16 meses
};
