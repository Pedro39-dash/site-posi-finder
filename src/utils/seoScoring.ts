/**
 * Utilities for SEO scoring and position analysis
 */

export interface ScoringConfig {
  useNonLinearFormula?: boolean;
  weightTop3?: number;
  weightTop10?: number;
  penaltyNotFound?: number;
}

/**
 * Calculate SEO score using improved non-linear formula
 * Formula: Score = 100 / (position ^ 0.5) for better representation of ranking difficulty
 */
export const calculateAdvancedScore = (
  position: number | null,
  config: ScoringConfig = {}
): number => {
  const {
    useNonLinearFormula = true,
    weightTop3 = 1.2,
    weightTop10 = 1.0,
    penaltyNotFound = 0
  } = config;

  if (!position) return penaltyNotFound;

  let baseScore: number;

  if (useNonLinearFormula) {
    // Fórmula não-linear melhorada para dar mais peso às primeiras posições
    if (position === 1) return 100;
    if (position <= 3) return Math.max(75, 95 - (position - 1) * 8);
    if (position <= 10) return Math.max(40, 75 - (position - 3) * 5);
    if (position <= 20) return Math.max(15, 40 - (position - 10) * 2.5);
    return Math.max(1, 15 - (position - 20) * 0.3);
  } else {
    // Fórmula linear (legacy)
    if (position === 1) return 100;
    if (position <= 3) return 90;
    if (position <= 5) return 80;
    if (position <= 10) return 70;
    return 50;
  }
};

/**
 * Calculate overall score for a website across multiple keywords
 */
export const calculateOverallScore = (
  positions: (number | null)[],
  config?: ScoringConfig
): number => {
  if (positions.length === 0) return 0;

  const validPositions = positions.filter(pos => pos !== null) as number[];
  if (validPositions.length === 0) return 0;

  const totalScore = validPositions.reduce((acc, pos) => {
    return acc + calculateAdvancedScore(pos, config);
  }, 0);

  return Math.round(totalScore / validPositions.length);
};

/**
 * Get position category for styling and display
 */
export const getPositionCategory = (position: number | null): {
  category: 'top1' | 'top3' | 'top10' | 'page2' | 'notFound';
  label: string;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
  color: string;
} => {
  if (!position) {
    return {
      category: 'notFound',
      label: 'Não encontrado',
      badgeVariant: 'outline',
      color: 'text-muted-foreground'
    };
  }

  if (position === 1) {
    return {
      category: 'top1',
      label: '1ª posição',
      badgeVariant: 'default',
      color: 'text-accent'
    };
  }

  if (position <= 3) {
    return {
      category: 'top3',
      label: `${position}ª posição`,
      badgeVariant: 'default',
      color: 'text-primary'
    };
  }

  if (position <= 10) {
    return {
      category: 'top10',
      label: `${position}ª posição`,
      badgeVariant: 'secondary',
      color: 'text-foreground'
    };
  }

  return {
    category: 'page2',
    label: `${position}ª posição`,
    badgeVariant: 'destructive',
    color: 'text-destructive'
  };
};

/**
 * Calculate Share of Voice based on positions and search volumes
 */
export const calculateShareOfVoice = (
  keywordData: Array<{
    position: number | null;
    searchVolume: number;
  }>
): number => {
  const totalVolume = keywordData.reduce((acc, item) => acc + item.searchVolume, 0);
  
  if (totalVolume === 0) return 0;

  const weightedVolume = keywordData.reduce((acc, item) => {
    if (!item.position) return acc;
    
    // Estimated CTR based on position
    const ctr = getCTRByPosition(item.position);
    return acc + (item.searchVolume * ctr / 100);
  }, 0);

  return Math.round((weightedVolume / totalVolume) * 100);
};

/**
 * Get estimated CTR by position (based on industry studies)
 */
export const getCTRByPosition = (position: number): number => {
  const ctrMap: { [key: number]: number } = {
    1: 28.5,
    2: 15.7,
    3: 11.0,
    4: 8.0,
    5: 7.2,
    6: 5.1,
    7: 4.0,
    8: 3.2,
    9: 2.8,
    10: 2.5
  };

  if (position <= 10) {
    return ctrMap[position] || 0;
  }

  // Exponential decay for positions beyond 10
  return Math.max(0.1, 2.5 * Math.pow(0.8, position - 10));
};

/**
 * Determine win/loss between two positions
 */
export const comparePositions = (
  position1: number | null,
  position2: number | null
): 'win' | 'loss' | 'tie' | 'noData' => {
  if (!position1 && !position2) return 'noData';
  if (!position1) return 'loss';
  if (!position2) return 'win';
  
  if (position1 < position2) return 'win';
  if (position1 > position2) return 'loss';
  return 'tie';
};

/**
 * Calculate keyword difficulty based on competitor positions
 */
export const calculateKeywordDifficulty = (
  competitorPositions: number[]
): {
  difficulty: 'low' | 'medium' | 'high' | 'very-high';
  score: number;
  description: string;
} => {
  const topPositions = competitorPositions.filter(pos => pos <= 10);
  const averagePosition = topPositions.length > 0 
    ? topPositions.reduce((a, b) => a + b, 0) / topPositions.length
    : 50;

  const competitorCount = topPositions.length;
  const score = Math.min(100, (competitorCount * 10) + (50 - averagePosition) * 2);

  if (score < 30) {
    return {
      difficulty: 'low',
      score,
      description: 'Baixa concorrência, boa oportunidade'
    };
  }

  if (score < 60) {
    return {
      difficulty: 'medium',
      score,
      description: 'Concorrência moderada, esforço médio necessário'
    };
  }

  if (score < 80) {
    return {
      difficulty: 'high',
      score,
      description: 'Alta concorrência, muito esforço necessário'
    };
  }

  return {
    difficulty: 'very-high',
    score,
    description: 'Concorrência extrema, investimento significativo necessário'
  };
};