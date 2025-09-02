/**
 * Utilities for competitive analysis calculations and projections
 */

import { CompetitorKeyword, CompetitorDomain } from "@/services/competitorAnalysisService";
import { getCTRByPosition, calculateKeywordDifficulty, getPositionCategory } from "./seoScoring";

export interface CompetitiveMetrics {
  averagePositionGap: number;
  lostTrafficPotential: number;
  topCompetitors: Array<{
    domain: string;
    winsCount: number;
    averagePosition: number;
    shareOfVoice: number;
  }>;
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
 * Calculate comprehensive competitive metrics
 */
export const calculateCompetitiveMetrics = (
  keywords: CompetitorKeyword[],
  competitors: CompetitorDomain[]
): CompetitiveMetrics => {
  // Calculate average position gap
  const positionGaps: number[] = [];
  let totalLostTraffic = 0;
  const competitorWins: { [domain: string]: number } = {};

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
    topCompetitors
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
  
  const recommendations: string[] = [];
  
  // Position-specific recommendations
  if (!potential.currentPosition) {
    recommendations.push("Criar conteúdo otimizado para esta palavra-chave");
    recommendations.push("Incluir a palavra-chave no título da página principal");
    recommendations.push("Desenvolver página específica para o termo");
  } else if (potential.currentPosition > 10) {
    recommendations.push("Melhorar a otimização on-page do conteúdo existente");
    recommendations.push("Aumentar a densidade da palavra-chave no conteúdo");
    recommendations.push("Otimizar meta-descrição e title tag");
  } else {
    recommendations.push("Aprimorar a qualidade e profundidade do conteúdo");
    recommendations.push("Melhorar a experiência do usuário na página");
    recommendations.push("Construir links internos relevantes");
  }
  
  // Difficulty-based recommendations
  if (difficulty.level === 'low') {
    recommendations.push("Oportunidade rápida - implementar melhorias básicas de SEO");
  } else if (difficulty.level === 'high' || difficulty.level === 'very-high') {
    recommendations.push("Considerar estratégia de link building");
    recommendations.push("Análise detalhada dos concorrentes top 3");
    recommendations.push("Investir em conteúdo de alta qualidade e autoridade");
  }
  
  // Competitor-based recommendations
  if (competitorsAhead.length > 0) {
    const topCompetitor = competitorsAhead[0];
    recommendations.push(`Analisar estratégia de ${topCompetitor.domain} (posição ${topCompetitor.position})`);
  }
  
  return recommendations.slice(0, 5); // Limit to top 5 recommendations
};