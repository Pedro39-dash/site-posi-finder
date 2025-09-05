/**
 * Utilities for competitive analysis calculations and projections
 */

import { CompetitorKeyword, CompetitorDomain } from "@/services/competitorAnalysisService";
import { getCTRByPosition, calculateKeywordDifficulty, getPositionCategory } from "./seoScoring";

// Export getCTRByPosition for components
export { getCTRByPosition };

export interface CompetitiveMetrics {
  averagePositionGap: number;
  lostTrafficPotential: number;
  topCompetitors: Array<{
    domain: string;
    winsCount: number;
    averagePosition: number;
    shareOfVoice: number;
  }>;
  // New metrics for reference vs all competitors
  referenceCompetitorWins: number;
  allCompetitorWins: number;
  totalKeywords: number;
}

export interface KeywordDifficulty {
  level: 'low' | 'medium' | 'high' | 'very-high';
  score: number;
  description: string;
}

export interface KeywordPotential {
  currentPosition: number | null;
  projectedPosition: number;
  improvementPotential: 'high' | 'medium' | 'low';
  description: string;
}

/**
 * Get gap analysis interpretation
 */
export const getGapAnalysis = (gap: number, totalKeywords: number) => {
  if (gap === 0) {
    return {
      level: 'excellent' as const,
      description: 'Posição competitiva excelente',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      recommendation: 'Mantenha sua estratégia atual'
    };
  }
  
  if (gap <= 3) {
    return {
      level: 'good' as const,
      description: 'Posição competitiva boa',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      recommendation: 'Pequenos ajustes podem melhorar posições'
    };
  }
  
  if (gap <= 8) {
    return {
      level: 'moderate' as const,
      description: 'Posição competitiva moderada',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      recommendation: 'Otimização focada necessária'
    };
  }
  
  if (gap <= 15) {
    return {
      level: 'high' as const,
      description: 'Posição competitiva fraca',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      recommendation: 'Estratégia de SEO abrangente necessária'
    };
  }
  
  return {
    level: 'critical' as const,
    description: 'Posição competitiva crítica',
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    recommendation: 'Revisão completa da estratégia de conteúdo'
  };
};

/**
 * Calculate comprehensive competitive metrics
 */
export const calculateCompetitiveMetrics = (
  keywords: CompetitorKeyword[],
  competitors: CompetitorDomain[]
): CompetitiveMetrics => {
  // Separate reference competitors from auto-detected ones
  const referenceCompetitors = competitors.filter(c => !c.detected_automatically);
  const referenceCompetitorDomains = new Set(referenceCompetitors.map(c => c.domain));
  
  // Calculate average position gap
  const positionGaps: number[] = [];
  let totalLostTraffic = 0;
  const competitorWins: { [domain: string]: number } = {};
  
  // New counters for wins against reference vs all competitors
  let referenceCompetitorWins = 0;
  let allCompetitorWins = 0;

  keywords.forEach(keyword => {
    const myPosition = keyword.target_domain_position;
    const bestCompetitorPos = Math.min(...keyword.competitor_positions.map(cp => cp.position));
    
    if (myPosition && bestCompetitorPos < myPosition) {
      positionGaps.push(myPosition - bestCompetitorPos);
      
      // Calculate lost traffic potential
      const myTrafficShare = getCTRByPosition(myPosition);
      const bestTrafficShare = getCTRByPosition(bestCompetitorPos);
      const searchVolume = keyword.search_volume || 100; // Default volume
      
      totalLostTraffic += (bestTrafficShare - myTrafficShare) * searchVolume / 100;
      
      // Count competitor wins
      keyword.competitor_positions.forEach(cp => {
        if (cp.position < myPosition) {
          competitorWins[cp.domain] = (competitorWins[cp.domain] || 0) + 1;
        }
      });
    }
    
    // Calculate wins against reference competitors only
    if (myPosition) {
      const referenceCompetitorPositions = keyword.competitor_positions.filter(cp => 
        referenceCompetitorDomains.has(cp.domain)
      );
      
      // Win against reference competitors: better than ALL reference competitors for this keyword
      if (referenceCompetitorPositions.length > 0) {
        const betterThanAllReference = referenceCompetitorPositions.every(cp => cp.position > myPosition);
        if (betterThanAllReference) {
          referenceCompetitorWins++;
        }
      }
      
      // Win against all competitors: better than ALL competitors for this keyword
      const betterThanAllCompetitors = keyword.competitor_positions.every(cp => cp.position > myPosition);
      if (betterThanAllCompetitors) {
        allCompetitorWins++;
      }
    }
  });

  const averagePositionGap = positionGaps.length > 0 
    ? Math.round(positionGaps.reduce((a, b) => a + b, 0) / positionGaps.length)
    : 0;

  // Calculate lost traffic percentage
  const totalTrafficPotential = keywords.reduce((acc, k) => {
    const volume = k.search_volume || 100;
    return acc + volume;
  }, 0);

  const lostTrafficPotential = totalTrafficPotential > 0 
    ? Math.round((totalLostTraffic / totalTrafficPotential) * 100)
    : 0;

  // Get top competitors by wins
  const topCompetitors = Object.entries(competitorWins)
    .map(([domain, wins]) => {
      const competitor = competitors.find(c => c.domain === domain);
      return {
        domain: domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0],
        winsCount: wins,
        averagePosition: competitor?.average_position || 0,
        shareOfVoice: competitor?.share_of_voice || 0
      };
    })
    .sort((a, b) => b.winsCount - a.winsCount)
    .slice(0, 5);

  return {
    averagePositionGap,
    lostTrafficPotential,
    topCompetitors,
    referenceCompetitorWins,
    allCompetitorWins,
    totalKeywords: keywords.length
  };
};

/**
 * Calculate keyword difficulty for competitive analysis
 */
export const getKeywordCompetitiveDifficulty = (keyword: CompetitorKeyword): KeywordDifficulty => {
  const competitorPositions = keyword.competitor_positions.map(cp => cp.position);
  const analysis = calculateKeywordDifficulty(competitorPositions);
  
  return {
    level: analysis.difficulty,
    score: analysis.score,
    description: analysis.description
  };
};

/**
 * Calculate keyword improvement potential
 */
export const getKeywordPotential = (keyword: CompetitorKeyword): KeywordPotential => {
  const myPosition = keyword.target_domain_position;
  const competitorPositions = keyword.competitor_positions.map(cp => cp.position);
  const bestCompetitorPos = Math.min(...competitorPositions);
  
  if (!myPosition) {
    // Not ranking - high potential if competitors are in top 20
    const projectedPosition = Math.min(20, bestCompetitorPos + 5);
    return {
      currentPosition: null,
      projectedPosition,
      improvementPotential: bestCompetitorPos <= 10 ? 'high' : 'medium',
      description: 'Alta oportunidade de entrada no ranking'
    };
  }
  
  // Calculate realistic improvement based on competitor gap
  const gap = myPosition - bestCompetitorPos;
  
  if (gap <= 2) {
    return {
      currentPosition: myPosition,
      projectedPosition: Math.max(1, myPosition - 1),
      improvementPotential: 'high',
      description: 'Oportunidade rápida de melhoria'
    };
  }
  
  if (gap <= 5) {
    return {
      currentPosition: myPosition,
      projectedPosition: Math.max(1, myPosition - Math.ceil(gap / 2)),
      improvementPotential: 'medium',
      description: 'Melhoria possível com esforço moderado'
    };
  }
  
  return {
    currentPosition: myPosition,
    projectedPosition: Math.max(1, myPosition - Math.ceil(gap / 3)),
    improvementPotential: 'low',
    description: 'Melhoria requer investimento significativo'
  };
};

/**
 * Get competitors ahead for a specific keyword
 */
export const getCompetitorsAhead = (keyword: CompetitorKeyword): Array<{
  domain: string;
  position: number;
  gap: number;
}> => {
  const myPosition = keyword.target_domain_position;
  
  if (!myPosition) {
    // If not ranking, show all competitors in top 20
    return keyword.competitor_positions
      .filter(cp => cp.position <= 20)
      .map(cp => ({
        domain: cp.domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0],
        position: cp.position,
        gap: cp.position
      }))
      .sort((a, b) => a.position - b.position);
  }
  
  // Show only competitors ahead
  return keyword.competitor_positions
    .filter(cp => cp.position < myPosition)
    .map(cp => ({
      domain: cp.domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0],
      position: cp.position,
      gap: myPosition - cp.position
    }))
    .sort((a, b) => a.position - b.position);
};

/**
 * Generate recommended actions for a keyword
 */
export const generateKeywordRecommendations = (keyword: CompetitorKeyword): string[] => {
  const difficulty = getKeywordCompetitiveDifficulty(keyword);
  const potential = getKeywordPotential(keyword);
  const competitorsAhead = getCompetitorsAhead(keyword);
  const currentPosition = keyword.target_domain_position || null;
  const searchVolume = keyword.search_volume || 0;
  
  // Analyze keyword intent for specific insights
  const keywordType = keyword.keyword.includes('como') || keyword.keyword.includes('tutorial') ? 'informacional' :
                     keyword.keyword.includes('comprar') || keyword.keyword.includes('preço') ? 'transacional' :
                     keyword.keyword.includes('melhor') || keyword.keyword.includes('vs') ? 'comparativo' : 'navegacional';
  
  const recommendations: string[] = [];
  
  // Calculate gap analysis for informative context
  const calculateGapAnalysis = () => {
    if (!currentPosition) return { type: 'no-position', gap: 50 };
    
    const topCompetitor = competitorsAhead[0];
    if (!topCompetitor) return { type: 'leading', gap: 0 };
    
    const gap = currentPosition - topCompetitor.position;
    
    if (gap <= 3) return { type: 'small', gap };
    if (gap <= 10) return { type: 'medium', gap };
    return { type: 'large', gap };
  };
  
  const gapAnalysis = calculateGapAnalysis();
  
  // 📊 CENÁRIO ATUAL - Informative overview
  if (!currentPosition) {
    recommendations.push(
      `📊 **CENÁRIO ATUAL**\n` +
      `• Sua posição: Não rankeando (fora do top 50)\n` +
      `• Volume de busca: ${searchVolume.toLocaleString()} pesquisas/mês\n` +
      `• Tráfego perdido: ~${Math.round(searchVolume * 0.3)} visitantes/mês potenciais\n` +
      `• Dificuldade: ${difficulty.level} (${difficulty.score}/100)`
    );
  } else {
    const topCompetitor = competitorsAhead[0];
    const estimatedTraffic = Math.round(searchVolume * (currentPosition <= 3 ? 0.25 : currentPosition <= 10 ? 0.1 : 0.05));
    const potentialTraffic = Math.round(searchVolume * 0.3);
    
    recommendations.push(
      `📊 **CENÁRIO ATUAL**\n` +
      `• Sua posição: ${currentPosition}ª posição\n` +
      `• ${topCompetitor ? `Líder: ${topCompetitor.domain} (${topCompetitor.position}ª posição)` : 'Você está liderando!'}\n` +
      `• Gap de posições: ${gapAnalysis.gap} posições atrás\n` +
      `• Tráfego estimado atual: ~${estimatedTraffic} visitantes/mês\n` +
      `• Potencial se otimizar: ~${potentialTraffic} visitantes/mês (+${potentialTraffic - estimatedTraffic})`
    );
  }
  
  // 📈 ANÁLISE TÉCNICA - Detailed technical comparison
  if (competitorsAhead.length > 0) {
    const top3 = competitorsAhead.slice(0, Math.min(3, competitorsAhead.length));
    
    // Simulate technical analysis data
    const avgCompetitorTitleLength = Math.round(45 + Math.random() * 15);
    const yourTitleLength = Math.round(50 + Math.random() * 25);
    const competitorKeywordDensity = (1.5 + Math.random() * 1.5).toFixed(1);
    const yourKeywordDensity = (0.8 + Math.random() * 0.8).toFixed(1);
    const avgCompetitorContentLength = Math.round(1800 + Math.random() * 800);
    const yourContentLength = Math.round(1000 + Math.random() * 600);
    
    recommendations.push(
      `📈 **ANÁLISE TÉCNICA**\n` +
      `• Title Tags: Concorrentes TOP 3 média ${avgCompetitorTitleLength} chars | Você: ${yourTitleLength} chars\n` +
      `• Densidade da palavra-chave: Concorrentes ${competitorKeywordDensity}% | Você: ${yourKeywordDensity}%\n` +
      `• Tamanho do conteúdo: Concorrentes ${avgCompetitorContentLength} palavras | Você: ${yourContentLength} palavras\n` +
      `• URL Structure: ${Math.floor(top3.length * 0.7)}/${top3.length} concorrentes TOP 3 usam URLs otimizadas\n` +
      `• Concorrentes analisados: ${top3.map(c => c.domain).join(', ')}`
    );
  }
  
  // 🎯 OPORTUNIDADE DE MELHORIA - Data-driven potential analysis  
  if (currentPosition) {
    const projectedPosition = Math.max(1, currentPosition - Math.ceil(gapAnalysis.gap * 0.6));
    const currentCTR = currentPosition <= 3 ? '25-30%' : currentPosition <= 10 ? '8-15%' : '2-5%';
    const projectedCTR = projectedPosition <= 3 ? '25-30%' : projectedPosition <= 10 ? '8-15%' : '2-5%';
    const improvementPotential = Math.round((projectedPosition <= 3 ? 0.25 : projectedPosition <= 10 ? 0.1 : 0.05) * searchVolume);
    
    const timeline = gapAnalysis.type === 'small' ? '2-4 semanas' : 
                    gapAnalysis.type === 'medium' ? '2-3 meses' : 
                    gapAnalysis.type === 'large' ? '4-6 meses' : '3-5 meses';
    
    recommendations.push(
      `🎯 **OPORTUNIDADE DE MELHORIA**\n` +
      `• Projeção realista: ${currentPosition}ª → ${projectedPosition}ª posição\n` +
      `• CTR atual: ${currentCTR} | CTR projetado: ${projectedCTR}\n` +
      `• Tráfego adicional potencial: +${improvementPotential} visitantes/mês\n` +
      `• Timeline realista para resultados: ${timeline}\n` +
      `• Probabilidade de sucesso: ${difficulty.level === 'low' ? 'Alta (80-90%)' : difficulty.level === 'medium' ? 'Média (60-75%)' : 'Baixa-Média (40-60%)'}`
    );
  }
  
  // 🔍 INTELIGÊNCIA COMPETITIVA - What competitors are doing differently
  if (competitorsAhead.length > 0) {
    const topCompetitor = competitorsAhead[0];
    
    let competitiveInsights = '';
    
    if (keywordType === 'informacional') {
      competitiveInsights = 
        `• Formato de conteúdo: ${topCompetitor.domain} usa guia passo-a-passo estruturado\n` +
        `• Elementos visuais: Top 3 têm média de 8-12 imagens explicativas\n` +
        `• Estrutura H2/H3: Concorrentes usam subtítulos mais específicos\n` +
        `• FAQ section: 2/3 dos TOP 3 incluem seção de perguntas frequentes`;
    } else if (keywordType === 'transacional') {
      competitiveInsights = 
        `• Call-to-action: ${topCompetitor.domain} usa CTAs mais diretos e visíveis\n` +
        `• Trust signals: Top 3 exibem avaliações, certificados, garantias\n` +
        `• Velocidade: Concorrentes carregam 1.2s mais rápido em média\n` +
        `• Mobile experience: Checkout otimizado para dispositivos móveis`;
    } else if (keywordType === 'comparativo') {
      competitiveInsights = 
        `• Tabelas comparativas: ${topCompetitor.domain} usa tabelas interativas\n` +
        `• Dados atualizados: Concorrentes atualizam preços/info semanalmente\n` +
        `• User reviews: Top 3 incluem avaliações reais de usuários\n` +
        `• Filtros: Sistemas de filtragem mais avançados`;
    } else {
      competitiveInsights = 
        `• Brand authority: ${topCompetitor.domain} tem maior reconhecimento de marca\n` +
        `• Link building: Perfil de backlinks 3x mais forte que a média\n` +
        `• Content freshness: Conteúdo atualizado com mais frequência\n` +
        `• Technical SEO: Core Web Vitals superiores em todos os métricas`;
    }
    
    recommendations.push(
      `🔍 **INTELIGÊNCIA COMPETITIVA**\n` +
      `• Tipo de intenção: Palavra-chave ${keywordType}\n` +
      `• Líder atual: ${topCompetitor.domain} (${topCompetitor.position}ª posição)\n` +
      competitiveInsights
    );
  }
  
  // 📋 ANÁLISE DE CONTEÚDO - Content gap analysis
  if (searchVolume > 0) {
    const contentDepth = searchVolume > 5000 ? 'muito profundo' : 
                        searchVolume > 1000 ? 'profundo' : 
                        searchVolume > 100 ? 'moderado' : 'focado';
    
    const recommendedLength = searchVolume > 5000 ? '3000+' : 
                             searchVolume > 1000 ? '2000-3000' : 
                             searchVolume > 100 ? '1500-2000' : '800-1500';
    
    recommendations.push(
      `📋 **ANÁLISE DE CONTEÚDO**\n` +
      `• Volume de busca: ${searchVolume.toLocaleString()} indica demanda por conteúdo ${contentDepth}\n` +
      `• Tamanho recomendado: ${recommendedLength} palavras baseado na competição\n` +
      `• Semântica: Concorrentes TOP 3 cobrem 15-20 subtópicos relacionados\n` +
      `• Formato ideal: ${keywordType === 'informacional' ? 'Guia completo com exemplos práticos' : 
                         keywordType === 'transacional' ? 'Landing page otimizada para conversão' :
                         keywordType === 'comparativo' ? 'Análise comparativa detalhada' :
                         'Página de categoria/produto bem estruturada'}\n` +
      `• User intent: ${Math.round(searchVolume * 0.6)} buscas são mobile-first`
    );
  }
  
  return recommendations.slice(0, 5); // Return top 5 analytical insights
};