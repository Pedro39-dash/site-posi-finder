/**
 * Utilities for generating stable, deterministic domain metrics
 */

/**
 * Simple hash function to generate consistent numbers from domain names
 */
const hashDomain = (domain: string): number => {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    const char = domain.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

/**
 * Generate stable backlink estimates based on domain characteristics
 */
export const generateBacklinkEstimate = (domain: string, isTargetDomain = false): number => {
  const hash = hashDomain(domain);
  
  // Use domain characteristics to influence the estimate
  const domainLength = domain.length;
  const hasWww = domain.includes('www.');
  const tldBonus = domain.endsWith('.com') ? 1.2 : domain.endsWith('.org') ? 1.1 : 1.0;
  
  // Base range depends on domain type
  const baseMin = isTargetDomain ? 25000 : 10000;
  const baseMax = isTargetDomain ? 75000 : 50000;
  const range = baseMax - baseMin;
  
  // Generate stable number between baseMin and baseMax
  const normalizedHash = (hash % 1000000) / 1000000; // Normalize to 0-1
  let estimate = baseMin + (range * normalizedHash);
  
  // Apply domain characteristics multipliers
  estimate *= tldBonus;
  
  // Adjust based on domain length (shorter domains tend to be more established)
  if (domainLength <= 10) estimate *= 1.3;
  else if (domainLength >= 20) estimate *= 0.8;
  
  // Add some variance but keep it deterministic
  const variance = ((hash % 100) - 50) / 100 * 0.2; // ±20% variance
  estimate *= (1 + variance);
  
  return Math.floor(estimate);
};

/**
 * Generate stable traffic estimates based on keywords and positions
 */
export const calculateTrafficEstimate = (
  keywords: any[], 
  domain: string, 
  isTargetDomain = false
): number => {
  if (!keywords.length) return 0;
  
  return keywords.reduce((total, keyword) => {
    let position: number;
    
    if (isTargetDomain) {
      position = keyword.target_domain_position || 100;
    } else {
      const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
      const competitorPos = keyword.competitor_positions?.find((pos: any) => 
        pos.domain?.replace(/^https?:\/\//, '').replace(/^www\./, '') === cleanDomain
      );
      position = competitorPos?.position || 100;
    }
    
    const searchVolume = keyword.search_volume || 0;
    
    // CTR rates based on position
    let ctr = 0.01; // Default 1%
    if (position <= 1) ctr = 0.35;
    else if (position <= 3) ctr = 0.25;
    else if (position <= 5) ctr = 0.15;
    else if (position <= 10) ctr = 0.08;
    else if (position <= 20) ctr = 0.03;
    
    return total + (searchVolume * ctr);
  }, 0);
};

/**
 * Check if a domain appears to be a specific page URL
 */
export const isSpecificPage = (domain: string): boolean => {
  return domain.includes('/') && !domain.endsWith('/');
};

/**
 * Extract base domain from URL
 */
export const getBaseDomain = (url: string): string => {
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
};

/**
 * Format domain for display with page indication
 */
export const formatDomainDisplay = (domain: string): { display: string; isPage: boolean; fullUrl: string } => {
  const cleaned = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
  const isPage = isSpecificPage(cleaned);
  
  return {
    display: isPage ? getBaseDomain(cleaned) : cleaned,
    isPage,
    fullUrl: domain.startsWith('http') ? domain : `https://${domain}`
  };
};
