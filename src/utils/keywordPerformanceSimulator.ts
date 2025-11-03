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

export interface SeriesData {
  keyword: string;
  domain: string;
  seedHash: number;
  dailySeries: PerformanceDataPoint[];
  lastGeneratedAt: string;
  color: string;
}

const NAMESPACE = 'kwSERP::';

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

/**
 * Gera cor consistente a partir de um hash
 */
function colorFromHash(hash: number): string {
  const hue = hash % 360;
  const saturation = 65 + (hash % 20);
  const lightness = 50 + (hash % 15);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Gera chave de storage para uma série
 */
function seriesKey(keyword: string, domain: string): string {
  return `${NAMESPACE}series::${keyword.toLowerCase()}::${domain.toLowerCase()}`;
}

/**
 * Gera chave de lista de palavras por domínio
 */
function listKey(domain: string): string {
  return `${NAMESPACE}list::${domain.toLowerCase()}`;
}

/**
 * Carrega série completa do localStorage
 */
function loadSeriesFromStorage(keyword: string, domain: string): SeriesData | null {
  try {
    const key = seriesKey(keyword, domain);
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Salva série completa no localStorage
 */
function saveSeriesToStorage(series: SeriesData): void {
  try {
    const key = seriesKey(series.keyword, series.domain);
    localStorage.setItem(key, JSON.stringify(series));
    
    // Atualizar lista de palavras para este domínio
    const lKey = listKey(series.domain);
    const stored = localStorage.getItem(lKey);
    let list: string[] = stored ? JSON.parse(stored) : [];
    
    if (!list.includes(series.keyword.toLowerCase())) {
      list.push(series.keyword.toLowerCase());
      localStorage.setItem(lKey, JSON.stringify(list));
    }
  } catch (error) {
    console.warn('Erro ao salvar série:', error);
  }
}

/**
 * Limpa todos os dados salvos do app
 */
export function clearAllSavedData(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(NAMESPACE)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Erro ao limpar dados:', error);
  }
}

/**
 * Lista todas as séries salvas
 */
export function listSavedSeries(): Array<{ keyword: string; domain: string }> {
  try {
    const keys = Object.keys(localStorage);
    const seriesKeys = keys.filter(key => key.startsWith(`${NAMESPACE}series::`));
    return seriesKeys.map(key => {
      const parts = key.replace(`${NAMESPACE}series::`, '').split('::');
      return { keyword: parts[0], domain: parts[1] };
    });
  } catch {
    return [];
  }
}

/**
 * Mapa global de posições ocupadas por data (para evitar duplicatas)
 */
interface OccupiedPositions {
  [date: string]: Set<number>;
}

/**
 * Gera série completa de dados para 12 meses (365 dias)
 * Simula posições na SERP (1 = melhor, 100 = pior)
 * Com garantia de posições únicas por data
 */
async function generateRawData(
  keyword: string, 
  domain: string,
  occupiedPositions?: OccupiedPositions
): Promise<PerformanceDataPoint[]> {
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
    const dateKey = date.toISOString().split('T')[0];
    
    // Variação diária pequena (±1 a ±3 posições)
    const trendChange = trendDirection * trendStrength * (rng.next() > 0.7 ? 1 : 0);
    const randomChange = Math.floor((rng.next() - 0.5) * 6); // -3 a +3
    
    currentPosition += trendChange + randomChange;
    
    // Limitar entre 1 e 100
    currentPosition = Math.max(1, Math.min(100, currentPosition));
    
    // Arredondar para inteiro
    let position = Math.round(currentPosition);
    
    // Verificar se a posição já está ocupada neste dia
    if (occupiedPositions && occupiedPositions[dateKey]) {
      let attempts = 0;
      const maxAttempts = 100;
      
      // Se a posição está ocupada, procurar a próxima livre
      while (occupiedPositions[dateKey].has(position) && attempts < maxAttempts) {
        // Tentar posições próximas alternadamente (±1, ±2, ±3...)
        const offset = Math.ceil(attempts / 2) * (attempts % 2 === 0 ? 1 : -1);
        position = Math.round(currentPosition) + offset;
        
        // Manter dentro dos limites
        position = Math.max(1, Math.min(100, position));
        attempts++;
      }
      
      // Registrar a posição como ocupada
      occupiedPositions[dateKey].add(position);
    }
    
    data.push({
      date: dateKey,
      position: position,
      aggregationType: 'daily'
    });
  }

  return data;
}

/**
 * Gera ou recupera série completa persistente
 */
export async function getSeries(
  keyword: string,
  domain: string,
  occupiedPositions?: OccupiedPositions
): Promise<SeriesData> {
  // Tentar carregar do cache
  const cached = loadSeriesFromStorage(keyword, domain);
  if (cached) {
    // Se temos posições ocupadas, atualizar o registro com as posições desta série
    if (occupiedPositions) {
      cached.dailySeries.forEach(point => {
        if (!occupiedPositions[point.date]) {
          occupiedPositions[point.date] = new Set();
        }
        occupiedPositions[point.date].add(point.position);
      });
    }
    return cached;
  }
  
  // Gerar novos dados
  const seed = await hashString(`${keyword}::${domain}`);
  const dailySeries = await generateRawData(keyword, domain, occupiedPositions);
  const color = colorFromHash(seed);
  
  const series: SeriesData = {
    keyword,
    domain,
    seedHash: seed,
    dailySeries,
    lastGeneratedAt: new Date().toISOString(),
    color
  };
  
  // Salvar no cache
  saveSeriesToStorage(series);
  
  return series;
}

/**
 * Gera múltiplas séries com garantia de posições únicas
 * Prioridade: domínio principal > outras palavras-chave > concorrentes
 */
export async function getMultipleSeries(
  requests: Array<{ keyword: string; domain: string; isPrimary?: boolean }>
): Promise<SeriesData[]> {
  const occupiedPositions: OccupiedPositions = {};
  const results: SeriesData[] = [];
  
  // Ordenar: primárias primeiro, depois o resto
  const sorted = [...requests].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return 0;
  });
  
  // Gerar cada série sequencialmente, registrando posições ocupadas
  for (const req of sorted) {
    const series = await getSeries(req.keyword, req.domain, occupiedPositions);
    results.push(series);
  }
  
  return results;
}

/**
 * Gera ou recupera dados persistentes (legacy - mantido para compatibilidade)
 */
export async function generatePerformanceData(
  keyword: string,
  domain: string
): Promise<PerformanceDataPoint[]> {
  const series = await getSeries(keyword, domain);
  return series.dailySeries;
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
  if (days <= 30) {
    // Dia, Semana, Mês: mostrar diário
    return sliced.map(point => ({
      ...point,
      aggregationType: 'daily' as AggregationType
    }));
  } else if (days <= 180) {
    // 3M e 6M: agregar por semana (mediana semanal)
    return aggregateByWeek(sliced);
  } else {
    // 12M: agregar por mês (mediana mensal)
    return aggregateByMonth(sliced);
  }
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
