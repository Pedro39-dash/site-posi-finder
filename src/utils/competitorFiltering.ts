import { CompetitorDomain, CompetitorKeyword } from '@/services/competitorAnalysisService';

export interface FilteredCompetitor {
  domain: string;
  originalDomain: string;
  averagePosition: number | null;
  detectedAutomatically: boolean;
}

/**
 * Filters competitors to show domains around the target domain for comparative analysis
 * Logic: Shows up to 10 competitors ahead + up to 10 competitors behind the target domain
 * @param competitors - Array of competitor domains
 * @param keywords - Array of keywords with position data
 * @param targetDomain - The domain being analyzed
 * @returns Filtered array of up to 21 competitors (10 ahead + target + 10 behind)
 */
export function getTop10CompetitorsAroundTarget(
  competitors: CompetitorDomain[],
  keywords: CompetitorKeyword[],
  targetDomain: string
): FilteredCompetitor[] {
  if (!competitors.length || !keywords.length) return [];

  // Calculate average position for target domain
  const targetPositions = keywords
    .filter(k => k.target_domain_position && k.target_domain_position > 0)
    .map(k => k.target_domain_position!);
  
  const targetAvgPosition = targetPositions.length > 0
    ? Math.round(targetPositions.reduce((sum, pos) => sum + pos, 0) / targetPositions.length)
    : null;

  // Process competitors and calculate their average positions
  const competitorData: FilteredCompetitor[] = competitors.map(competitor => {
    const cleanDomain = competitor.domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
    
    // Calculate average position for this competitor
    const competitorPositions = keywords
      .map(keyword => {
        const position = keyword.competitor_positions?.find(pos => 
          pos.domain?.replace(/^https?:\/\//, '').replace(/^www\./, '') === cleanDomain
        );
        return position?.position;
      })
      .filter((pos): pos is number => pos !== undefined && pos > 0);
    
    const averagePosition = competitorPositions.length > 0 
      ? Math.round(competitorPositions.reduce((sum, pos) => sum + pos, 0) / competitorPositions.length)
      : null;

    return {
      domain: cleanDomain,
      originalDomain: competitor.domain,
      averagePosition,
      detectedAutomatically: competitor.detected_automatically
    };
  });

  // Filter and sort competitors
  let filteredCompetitors: FilteredCompetitor[] = [];

  if (targetAvgPosition === null) {
    // If target doesn't rank, show top 20 competitors by position
    filteredCompetitors = competitorData
      .filter(comp => comp.averagePosition !== null)
      .sort((a, b) => (a.averagePosition || 999) - (b.averagePosition || 999))
      .slice(0, 20);
  } else {
    // Get competitors ahead of target position (better positions - lower numbers)
    const competitorsAhead = competitorData
      .filter(comp => comp.averagePosition !== null && comp.averagePosition < targetAvgPosition)
      .sort((a, b) => (a.averagePosition || 999) - (b.averagePosition || 999))
      .slice(0, 10); // Top 10 ahead

    // Get competitors behind target position (worse positions - higher numbers)
    const competitorsBehind = competitorData
      .filter(comp => comp.averagePosition !== null && comp.averagePosition > targetAvgPosition)
      .sort((a, b) => (a.averagePosition || 999) - (b.averagePosition || 999))
      .slice(0, 10); // Top 10 behind (closest to target)

    filteredCompetitors = [...competitorsAhead, ...competitorsBehind];
  }

  console.log('Competitor Filtering Debug (Around Target):', {
    targetDomain,
    targetAvgPosition,
    totalCompetitors: competitors.length,
    filteredCount: filteredCompetitors.length,
    competitorsAhead: filteredCompetitors.filter(c => c.averagePosition && targetAvgPosition && c.averagePosition < targetAvgPosition).length,
    competitorsBehind: filteredCompetitors.filter(c => c.averagePosition && targetAvgPosition && c.averagePosition > targetAvgPosition).length,
    filteredCompetitors: filteredCompetitors.map(c => ({ 
      domain: c.domain, 
      position: c.averagePosition 
    }))
  });

  return filteredCompetitors;
}

/**
 * Filters competitors using new logic: Top 3 + 10 before target + 10 after target
 * Logic: Always show top 3 positions + positions around target (excluding target itself)
 * Examples:
 * - Target in 5th: Show 1st-3rd + 4th + 6th-15th = 14 competitors total
 * - Target in 22nd: Show 1st-3rd + 12th-21st + 23rd-32nd = 23 competitors total
 * - Target in 2nd: Show 1st + 3rd-12th = 11 competitors total
 * @param competitors - Array of competitor domains
 * @param keywords - Array of keywords with position data
 * @param targetDomain - The domain being analyzed
 * @returns Filtered array of competitors excluding target domain position
 */
export function getTop10CompetitorsAhead(
  competitors: CompetitorDomain[],
  keywords: CompetitorKeyword[],
  targetDomain: string
): FilteredCompetitor[] {
  if (!competitors.length || !keywords.length) return [];

  // Calculate average position for target domain
  const targetPositions = keywords
    .filter(k => k.target_domain_position && k.target_domain_position > 0)
    .map(k => k.target_domain_position!);
  
  const targetAvgPosition = targetPositions.length > 0
    ? Math.round(targetPositions.reduce((sum, pos) => sum + pos, 0) / targetPositions.length)
    : null;

  // Process competitors and calculate their average positions
  const competitorData: FilteredCompetitor[] = competitors.map(competitor => {
    const cleanDomain = competitor.domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
    
    // Calculate average position for this competitor
    const competitorPositions = keywords
      .map(keyword => {
        const position = keyword.competitor_positions?.find(pos => 
          pos.domain?.replace(/^https?:\/\//, '').replace(/^www\./, '') === cleanDomain
        );
        return position?.position;
      })
      .filter((pos): pos is number => pos !== undefined && pos > 0);
    
    const averagePosition = competitorPositions.length > 0 
      ? Math.round(competitorPositions.reduce((sum, pos) => sum + pos, 0) / competitorPositions.length)
      : null;

    return {
      domain: cleanDomain,
      originalDomain: competitor.domain,
      averagePosition,
      detectedAutomatically: competitor.detected_automatically
    };
  });

  // Filter and sort competitors using new logic
  let filteredCompetitors: FilteredCompetitor[] = [];

  if (targetAvgPosition === null) {
    // If target doesn't rank, show top 20 competitors by position
    filteredCompetitors = competitorData
      .filter(comp => comp.averagePosition !== null)
      .sort((a, b) => {
        const positionDiff = (a.averagePosition || 999) - (b.averagePosition || 999);
        return positionDiff !== 0 ? positionDiff : a.domain.localeCompare(b.domain);
      })
      .slice(0, 20);
  } else {
    // New logic: Top 3 + 10 before target + 10 after target
    const competitorsWithPositions = competitorData
      .filter(comp => comp.averagePosition !== null && comp.averagePosition !== targetAvgPosition)
      .sort((a, b) => {
        const positionDiff = (a.averagePosition || 999) - (b.averagePosition || 999);
        return positionDiff !== 0 ? positionDiff : a.domain.localeCompare(b.domain);
      });

    // 1. Always include top 3 positions
    const top3Competitors = competitorsWithPositions
      .filter(comp => comp.averagePosition! >= 1 && comp.averagePosition! <= 3);

    // 2. Include 10 positions before target (N-10 to N-1)
    const beforeTarget = competitorsWithPositions
      .filter(comp => 
        comp.averagePosition! >= Math.max(1, targetAvgPosition - 10) && 
        comp.averagePosition! < targetAvgPosition &&
        comp.averagePosition! > 3 // Exclude positions already in top 3
      )
      .slice(-10); // Get last 10 (closest to target)

    // 3. Include 10 positions after target (N+1 to N+10)
    const afterTarget = competitorsWithPositions
      .filter(comp => 
        comp.averagePosition! > targetAvgPosition && 
        comp.averagePosition! <= targetAvgPosition + 10
      )
      .slice(0, 10);

    // Combine all competitors, avoiding duplicates
    const allSelected = [...top3Competitors, ...beforeTarget, ...afterTarget];
    const uniqueCompetitors = allSelected.filter((comp, index, arr) => 
      arr.findIndex(c => c.domain === comp.domain) === index
    );

    filteredCompetitors = uniqueCompetitors.sort((a, b) => {
      const positionDiff = (a.averagePosition || 999) - (b.averagePosition || 999);
      return positionDiff !== 0 ? positionDiff : a.domain.localeCompare(b.domain);
    });
  }

  console.log('Competitor Filtering Debug (New Logic):', {
    targetDomain,
    targetAvgPosition,
    totalCompetitors: competitors.length,
    filteredCount: filteredCompetitors.length,
    breakdown: {
      top3: filteredCompetitors.filter(c => c.averagePosition! <= 3).length,
      beforeTarget: targetAvgPosition ? filteredCompetitors.filter(c => 
        c.averagePosition! > 3 && c.averagePosition! < targetAvgPosition
      ).length : 0,
      afterTarget: targetAvgPosition ? filteredCompetitors.filter(c => 
        c.averagePosition! > targetAvgPosition
      ).length : 0
    },
    filteredCompetitors: filteredCompetitors.map(c => ({ 
      domain: c.domain, 
      position: c.averagePosition 
    }))
  });

  return filteredCompetitors;
}

/**
 * Formats domain name for display
 */
export function formatDomainForDisplay(domain: string): string {
  return domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
}

/**
 * Get color for domain based on its index in the filtered list
 */
export function getDomainColor(index: number): string {
  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', 
    '#d084d0', '#ff69b4', '#00ced1', '#ffd700', '#ff6347'
  ];
  return colors[index % colors.length];
}