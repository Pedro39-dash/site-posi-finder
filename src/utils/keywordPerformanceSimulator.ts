/**
 * Gerador determinístico de dados de performance de palavra-chave
 * Usa hash SHA-256 para criar uma semente baseada em "palavra-chave::domínio"
 * Com persistência em localStorage e agregação adaptável por período
 */

export type PeriodFilter = 'day' | 'week' | 'month' | '3months' | '6months' | '12months';
export type AggregationType = 'daily' | 'weekly' | 'monthly';

export interface PerformanceDataPoint {
  date: string;
  position: number; // 1-100 (1 = melhor, 100 = pior)
  aggregationType?: AggregationType;
  label?: string; // Label customizado para tooltip
}

export interface PerformanceSummary {
  current: number;
  best: number;
  percentageChange: number;
}

interface StoredData {
  keyword: string;
  domain: string;
  data: PerformanceDataPoint[];
  timestamp: number;
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

const STORAGE_KEY = 'serp-position-cache';

/**
 * Carrega dados do localStorage
 */
function loadFromStorage(keyword: string, domain: string): PerformanceDataPoint[] | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const cache: StoredData[] = JSON.parse(stored);
    const found = cache.find(
      item => item.keyword.toLowerCase() === keyword.toLowerCase() && 
              item.domain.toLowerCase() === domain.toLowerCase()
    );
    
    return found ? found.data : null;
  } catch {
    return null;
  }
}

/**
 * Salva dados no localStorage
 */
function saveToStorage(keyword: string, domain: string, data: PerformanceDataPoint[]): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let cache: StoredData[] = stored ? JSON.parse(stored) : [];
    
    // Remove entrada antiga se existir
    cache = cache.filter(
      item => !(item.keyword.toLowerCase() === keyword.toLowerCase() && 
                item.domain.toLowerCase() === domain.toLowerCase())
    );
    
    // Adiciona nova entrada
    cache.push({
      keyword,
      domain,
      data,
      timestamp: Date.now()
    });
    
    // Limita a 50 entradas
    if (cache.length > 50) {
      cache = cache.slice(-50);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Erro ao salvar cache:', error);
  }
}

/**
 * Gera série completa de dados para 12 meses (365 dias)
 * Simula posições na SERP (1 = melhor, 100 = pior)
 */
async function generateRawData(keyword: string, domain: string): Promise<PerformanceDataPoint[]> {
  const seed = await hashString(`${keyword}::${domain}`);
  const rng = new SeededRandom(seed);

  const data: PerformanceDataPoint[] = [];
  const days = 365;
  
  // Configuração inicial baseada na semente
  const startPosition = Math.floor(rng.range(20, 80)); // Posição inicial entre 20 e 80
  const trendDirection = rng.next() > 0.5 ? -1 : 1; // -1 = melhora (diminui), 1 = piora (aumenta)
  const trendStrength = rng.range(0.05, 0.15); // Força da tendência
  
  const today = new Date();
  let currentPosition = startPosition;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Variação diária pequena (±1 a ±3 posições)
    const trendChange = trendDirection * trendStrength * (rng.next() > 0.7 ? 1 : 0);
    const randomChange = Math.floor((rng.next() - 0.5) * 6); // -3 a +3
    
    currentPosition += trendChange + randomChange;
    
    // Limitar entre 1 e 100
    currentPosition = Math.max(1, Math.min(100, currentPosition));
    
    // Arredondar para inteiro
    const position = Math.round(currentPosition);
    
    data.push({
      date: date.toISOString().split('T')[0],
      position: position,
      aggregationType: 'daily'
    });
  }

  return data;
}

/**
 * Gera ou recupera dados persistentes
 */
export async function generatePerformanceData(
  keyword: string,
  domain: string
): Promise<PerformanceDataPoint[]> {
  // Tentar carregar do cache
  const cached = loadFromStorage(keyword, domain);
  if (cached) {
    return cached;
  }
  
  // Gerar novos dados
  const data = await generateRawData(keyword, domain);
  
  // Salvar no cache
  saveToStorage(keyword, domain, data);
  
  return data;
}

/**
 * Calcula mediana de um array de números
 */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

/**
 * Agrupa dados diários em semanais (mediana)
 */
function aggregateByWeek(data: PerformanceDataPoint[]): PerformanceDataPoint[] {
  const weeks: { [key: string]: number[] } = {};
  
  data.forEach(point => {
    const date = new Date(point.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Domingo da semana
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeks[weekKey]) {
      weeks[weekKey] = [];
    }
    weeks[weekKey].push(point.position);
  });
  
  return Object.entries(weeks).map(([date, positions]) => {
    const weekDate = new Date(date);
    const weekNum = Math.ceil((weekDate.getDate() + weekDate.getDay()) / 7);
    return {
      date,
      position: median(positions),
      aggregationType: 'weekly' as AggregationType,
      label: `Semana ${weekNum} — ${weekDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`
    };
  }).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Agrupa dados diários em mensais (mediana)
 */
function aggregateByMonth(data: PerformanceDataPoint[]): PerformanceDataPoint[] {
  const months: { [key: string]: number[] } = {};
  
  data.forEach(point => {
    const date = new Date(point.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
    
    if (!months[monthKey]) {
      months[monthKey] = [];
    }
    months[monthKey].push(point.position);
  });
  
  return Object.entries(months).map(([date, positions]) => {
    const monthDate = new Date(date);
    return {
      date,
      position: median(positions),
      aggregationType: 'monthly' as AggregationType,
      label: monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    };
  }).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Filtra os dados de acordo com o período selecionado e aplica agregação quando necessário
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
  const sliced = data.slice(-days);
  
  // Agregação adaptável
  if (period === '6months') {
    return aggregateByWeek(sliced);
  } else if (period === '12months') {
    return aggregateByMonth(sliced);
  }
  
  // Períodos curtos: manter dados diários
  return sliced.map(point => ({
    ...point,
    aggregationType: 'daily' as AggregationType
  }));
}

/**
 * Calcula o resumo dos dados de posição SERP
 */
export function calculateSummary(
  data: PerformanceDataPoint[]
): PerformanceSummary {
  if (data.length === 0) {
    return {
      current: 0,
      best: 0,
      percentageChange: 0, // Agora representa "ganho de posições"
    };
  }

  const current = data[data.length - 1].position;
  const best = Math.min(...data.map(d => d.position)); // Melhor = menor número
  const first = data[0].position;
  
  // Ganho de posições: positivo = melhora (subiu posições)
  const positionGain = first - current;

  return {
    current: current,
    best: best,
    percentageChange: positionGain, // Reutilizando campo para ganho de posições
  };
}
