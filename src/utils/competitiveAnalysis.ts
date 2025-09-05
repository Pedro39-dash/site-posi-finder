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
  
  const recommendations: string[] = [];
  
  // Calculate gap size and type
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
  
  // Priority 1: Critical Quick Wins based on gap analysis
  if (gapAnalysis.type === 'no-position') {
    recommendations.push(`🚨 CRÍTICO: Criar página específica para "${keyword.keyword}" (você não está rankeando)`);
    recommendations.push(`📝 Incluir "${keyword.keyword}" no título H1 da nova página`);
    recommendations.push(`🔗 Criar URL otimizada: /sua-palavra-chave (atual: sem página)`);
  } else if (gapAnalysis.type === 'small' && competitorsAhead.length > 0) {
    const topCompetitor = competitorsAhead[0];
    recommendations.push(`⚡ QUICK WIN: Você está apenas ${gapAnalysis.gap} posições atrás de ${topCompetitor.domain}`);
    recommendations.push(`🎯 Otimizar velocidade da página (concorrente provavelmente mais rápido)`);
    recommendations.push(`📊 Melhorar Core Web Vitals - foco em LCP e CLS`);
  }
  
  // Priority 2: Content Strategy based on competitors
  if (competitorsAhead.length >= 3) {
    const top3 = competitorsAhead.slice(0, 3);
    recommendations.push(`📚 Analisar conteúdo dos TOP 3: ${top3.map(c => c.domain).join(', ')}`);
    
    // Simulate content analysis findings
    if (searchVolume > 1000) {
      recommendations.push(`📈 Alto volume (${searchVolume}): Criar conteúdo completo 2000+ palavras`);
    } else {
      recommendations.push(`🎯 Baixo volume (${searchVolume}): Foco em long-tail relacionadas`);
    }
  }
  
  // Priority 3: Technical SEO based on position and difficulty
  if (currentPosition && currentPosition > 10) {
    recommendations.push(`🔧 TÉCNICO: Otimizar title tag - incluir "${keyword.keyword}" no início`);
    recommendations.push(`📝 Reescrever meta description com "${keyword.keyword}" e call-to-action`);
  } else if (currentPosition && currentPosition <= 10) {
    recommendations.push(`🏆 TOP 10! Foco em user experience e engagement metrics`);
    recommendations.push(`⏱️ Reduzir bounce rate - melhorar primeiro parágrafo da página`);
  }
  
  // Priority 4: Link Building Strategy based on difficulty
  if (difficulty.level === 'high' || difficulty.level === 'very-high') {
    recommendations.push(`🔗 BACKLINKS: Competição alta requer 15+ links de DR 40+`);
    if (competitorsAhead.length > 0) {
      recommendations.push(`📊 Replicar perfil de links de ${competitorsAhead[0].domain}`);
    }
  } else if (difficulty.level === 'low') {
    recommendations.push(`✅ FÁCIL: Links internos são suficientes - conectar páginas relacionadas`);
  }
  
  // Priority 5: Competitive Advantage based on specific gaps
  if (competitorsAhead.length > 0) {
    const topCompetitor = competitorsAhead[0];
    
    // Simulate competitive intelligence
    if (keyword.keyword.includes('como') || keyword.keyword.includes('tutorial')) {
      recommendations.push(`🎥 DIFERENCIAL: Criar vídeo tutorial (${topCompetitor.domain} só tem texto)`);
    } else if (keyword.keyword.includes('melhor') || keyword.keyword.includes('comparar')) {
      recommendations.push(`📊 DIFERENCIAL: Adicionar tabela comparativa interativa`);
    } else {
      recommendations.push(`💡 OPORTUNIDADE: Encontrar angle único que ${topCompetitor.domain} não cobre`);
    }
  }
  
  // Timeline estimation based on gap and difficulty
  const getTimelineEstimation = () => {
    if (gapAnalysis.type === 'small') return '2-4 semanas';
    if (gapAnalysis.type === 'medium') return '1-3 meses';
    if (gapAnalysis.type === 'large') return '3-6 meses';
    if (gapAnalysis.type === 'no-position') return '2-4 meses';
    return '1-2 meses';
  };
  
  // Add timeline context to first recommendation
  if (recommendations.length > 0) {
    const timeline = getTimelineEstimation();
    recommendations[0] += ` (Prazo estimado: ${timeline})`;
  }
  
  return recommendations.slice(0, 6); // Limit to top 6 recommendations
};