/**
 * Gerador determinístico de dados de performance de palavra-chave
 * Usa hash SHA-256 para criar uma semente baseada em "palavra-chave::domínio"
 */

export type PeriodFilter = 'day' | 'week' | 'month' | '3months' | '6months' | '12months';

export interface PerformanceDataPoint {
  date: string;
  visibility: number; // 0-100
}

export interface PerformanceSummary {
  current: number;
  best: number;
  percentageChange: number;
}

/**
 * Hash simples para gerar semente a partir de uma string
 */
async function hashString(str: string): Promise<number> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // Usar os primeiros 4 bytes como semente
  return hashArray.slice(0, 4).reduce((acc, byte, i) => acc + byte * (256 ** i), 0);
}

/**
 * Gerador pseudoaleatório (PRNG) com semente
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    // Algoritmo LCG (Linear Congruential Generator)
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

/**
 * Gera série completa de dados para 12 meses (365 dias)
 */
export async function generatePerformanceData(
  keyword: string,
  domain: string
): Promise<PerformanceDataPoint[]> {
  const seed = await hashString(`${keyword}::${domain}`);
  const rng = new SeededRandom(seed);

  const data: PerformanceDataPoint[] = [];
  const days = 365;
  
  // Configuração inicial baseada na semente
  const baseValue = rng.range(30, 70); // Valor base entre 30 e 70
  const trendDirection = rng.next() > 0.5 ? 1 : -1; // Tendência positiva ou negativa
  const trendStrength = rng.range(0.02, 0.08); // Força da tendência
  const volatility = rng.range(3, 8); // Volatilidade do ruído

  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Cálculo do valor com tendência + ruído
    const dayProgress = (days - i) / days;
    const trend = trendDirection * trendStrength * dayProgress * 100;
    const noise = (rng.next() - 0.5) * volatility * 2;
    const seasonality = Math.sin(dayProgress * Math.PI * 4) * 3; // Variação sazonal
    
    let visibility = baseValue + trend + noise + seasonality;
    
    // Limitar entre 0 e 100
    visibility = Math.max(0, Math.min(100, visibility));
    
    data.push({
      date: date.toISOString().split('T')[0],
      visibility: Math.round(visibility * 10) / 10, // 1 casa decimal
    });
  }

  return data;
}

/**
 * Filtra os dados de acordo com o período selecionado
 */
export function filterDataByPeriod(
  data: PerformanceDataPoint[],
  period: PeriodFilter
): PerformanceDataPoint[] {
  const periodMap: Record<PeriodFilter, number> = {
    'day': 1,
    'week': 7,
    'month': 30,
    '3months': 90,
    '6months': 180,
    '12months': 365,
  };

  const days = periodMap[period];
  return data.slice(-days);
}

/**
 * Calcula o resumo dos dados
 */
export function calculateSummary(
  data: PerformanceDataPoint[]
): PerformanceSummary {
  if (data.length === 0) {
    return {
      current: 0,
      best: 0,
      percentageChange: 0,
    };
  }

  const current = data[data.length - 1].visibility;
  const best = Math.max(...data.map(d => d.visibility));
  const first = data[0].visibility;
  
  const percentageChange = first !== 0 
    ? ((current - first) / first) * 100 
    : 0;

  return {
    current: Math.round(current * 10) / 10,
    best: Math.round(best * 10) / 10,
    percentageChange: Math.round(percentageChange * 10) / 10,
  };
}
