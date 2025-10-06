import { CompetitorKeyword } from '@/services/competitorAnalysisService';

// Standard CTR rates by position (industry average)
export const getCTRByPosition = (position: number): number => {
  const ctrRates: { [key: number]: number } = {
    1: 0.284, // 28.4%
    2: 0.153, // 15.3%
    3: 0.108, // 10.8%
    4: 0.081, // 8.1%
    5: 0.061, // 6.1%
    6: 0.047, // 4.7%
    7: 0.037, // 3.7%
    8: 0.030, // 3.0%
    9: 0.025, // 2.5%
    10: 0.021, // 2.1%
  };
  
  if (position <= 10) return ctrRates[position] || 0.015;
  if (position <= 20) return 0.01;
  if (position <= 30) return 0.005;
  return 0.002;
};

export type ImprovementType = 'performance' | 'seo-score' | 'content' | 'images-links' | 'domain-authority' | 'page-size';

interface TrafficProjection {
  current: number;
  projected: number;
  increase: number;
  increasePercentage: number;
}

/**
 * Calcula tráfego atual baseado em posições reais e volumes de busca
 */
export const calculateCurrentTraffic = (keywords: CompetitorKeyword[]): number => {
  return keywords.reduce((sum, keyword) => {
    const position = keyword.target_domain_position;
    if (!position || position > 100) return sum;
    
    const searchVolume = keyword.search_volume || 1000;
    const ctr = getCTRByPosition(position);
    
    return sum + (searchVolume * ctr);
  }, 0);
};

/**
 * Calcula tráfego projetado baseado no tipo de melhoria
 */
export const calculateProjectedTraffic = (
  keywords: CompetitorKeyword[],
  improvementType: ImprovementType
): TrafficProjection => {
  const currentTraffic = calculateCurrentTraffic(keywords);
  let projectedTraffic = currentTraffic;

  switch (improvementType) {
    case 'performance':
      // Melhoria de Core Web Vitals aumenta CTR em ~20%
      projectedTraffic = currentTraffic * 1.20;
      break;
      
    case 'seo-score':
      // Schema.org + Open Graph pode subir 2-3 posições
      projectedTraffic = keywords.reduce((sum, keyword) => {
        const position = keyword.target_domain_position;
        if (!position || position > 100) return sum;
        
        const newPosition = Math.max(1, position - 2.5);
        const searchVolume = keyword.search_volume || 1000;
        const newCTR = getCTRByPosition(Math.round(newPosition));
        
        return sum + (searchVolume * newCTR);
      }, 0);
      break;
      
    case 'content':
      // Conteúdo mais completo pode subir 1-2 posições
      projectedTraffic = keywords.reduce((sum, keyword) => {
        const position = keyword.target_domain_position;
        if (!position || position > 100) return sum;
        
        const newPosition = Math.max(1, position - 1.5);
        const searchVolume = keyword.search_volume || 1000;
        const newCTR = getCTRByPosition(Math.round(newPosition));
        
        return sum + (searchVolume * newCTR);
      }, 0);
      break;
      
    case 'images-links':
      // Melhor UX aumenta CTR em ~8%
      projectedTraffic = currentTraffic * 1.08;
      break;
      
    case 'domain-authority':
      // Domain Authority maior pode subir 3-5 posições
      projectedTraffic = keywords.reduce((sum, keyword) => {
        const position = keyword.target_domain_position;
        if (!position || position > 100) return sum;
        
        const newPosition = Math.max(1, position - 4);
        const searchVolume = keyword.search_volume || 1000;
        const newCTR = getCTRByPosition(Math.round(newPosition));
        
        return sum + (searchVolume * newCTR);
      }, 0);
      break;
      
    case 'page-size':
      // Melhor velocidade aumenta conversão em ~12%
      projectedTraffic = currentTraffic * 1.12;
      break;
  }

  const increase = projectedTraffic - currentTraffic;
  const increasePercentage = currentTraffic > 0 ? (increase / currentTraffic) * 100 : 0;

  return {
    current: Math.round(currentTraffic),
    projected: Math.round(projectedTraffic),
    increase: Math.round(increase),
    increasePercentage: Math.round(increasePercentage)
  };
};
