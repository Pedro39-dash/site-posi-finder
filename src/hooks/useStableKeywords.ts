import { useMemo } from 'react';
import { CompetitorKeyword } from '@/services/competitorAnalysisService';

/**
 * Hook to create stable keyword data that prevents unnecessary re-renders
 */
export const useStableKeywords = (keywords: CompetitorKeyword[] | undefined) => {
  return useMemo(() => {
    if (!keywords?.length) return [];
    
    // Create stable references by mapping to a clean object structure
    return keywords.map(keyword => ({
      id: keyword.id,
      analysis_id: keyword.analysis_id,
      keyword: keyword.keyword,
      target_domain_position: keyword.target_domain_position,
      competitor_positions: keyword.competitor_positions || [],
      search_volume: keyword.search_volume || 0,
      created_at: keyword.created_at,
      metadata: keyword.metadata || {}
    }));
  }, [keywords]);
};

/**
 * Calculate keyword difficulty based on search volume and competition
 */
export const calculateDifficulty = (searchVolume?: number): 'low' | 'medium' | 'high' => {
  if (searchVolume && searchVolume > 1000) return 'high';
  if (searchVolume && searchVolume > 100) return 'medium';
  return 'low';
};

/**
 * Calculate keyword potential based on current position vs competitors
 */
export const calculatePotential = (
  targetPosition: number | null,
  competitorPositions: { position: number }[]
): 'low' | 'medium' | 'high' => {
  const myPos = targetPosition || 999;
  const hasCompetitors = competitorPositions?.length > 0;
  const bestCompetitorPos = hasCompetitors ? 
    Math.min(...competitorPositions.map(c => c.position)) : 999;
  
  if (!hasCompetitors || myPos <= 3) return 'low';
  if (myPos > bestCompetitorPos + 5) return 'high';
  return 'medium';
};