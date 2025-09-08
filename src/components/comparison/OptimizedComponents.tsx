import React, { memo, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RotateCcw, Eye } from 'lucide-react';
import { CompetitorKeyword } from '@/services/competitorAnalysisService';

// Memoized position badge to prevent re-renders
export const PositionBadge = memo(({ position }: { position: number | null }) => {
  const variant = useMemo(() => {
    if (!position) return 'destructive';
    if (position <= 10) return 'default';
    if (position <= 20) return 'secondary';
    return 'destructive';
  }, [position]);

  return (
    <Badge variant={variant} className="font-mono">
      {position ? `${position}º` : 'N/F'}
    </Badge>
  );
});

// Memoized difficulty badge to prevent re-renders
export const DifficultyBadge = memo(({ difficulty }: { difficulty: string }) => {
  const variant = useMemo(() => {
    switch (difficulty) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'outline';
    }
  }, [difficulty]);

  return (
    <Badge variant={variant}>
      {difficulty === 'high' ? 'Alta' : difficulty === 'medium' ? 'Média' : 'Baixa'}
    </Badge>
  );
});

// Memoized potential badge to prevent re-renders
export const PotentialBadge = memo(({ potential }: { potential: string }) => {
  const variant = useMemo(() => {
    switch (potential) {
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  }, [potential]);

  return (
    <Badge variant={variant}>
      {potential === 'high' ? 'Alto' : potential === 'medium' ? 'Médio' : 'Baixo'}
    </Badge>
  );
});

// Memoized keyword row to prevent unnecessary re-renders
export const KeywordRow = memo(({ 
  keyword, 
  reverifyingKeywords, 
  onViewDetails, 
  onReverify 
}: {
  keyword: CompetitorKeyword;
  reverifyingKeywords: string[];
  onViewDetails: (keyword: CompetitorKeyword) => void;
  onReverify: (keyword: CompetitorKeyword) => void;
}) => {
  const isReverifying = useMemo(
    () => reverifyingKeywords.includes(keyword.keyword), 
    [reverifyingKeywords, keyword.keyword]
  );
  
  const competitorDisplay = useMemo(() => {
    if (!keyword.competitor_positions?.length) return 'Nenhum concorrente';
    
    return keyword.competitor_positions
      .slice(0, 3)
      .map(c => 
        `${c.domain.replace(/^https?:\/\//, '').replace(/^www\./, '')} (${c.position}º)`
      )
      .join(', ');
  }, [keyword.competitor_positions]);

  // Stable primitive values for calculations
  const searchVolume = keyword.search_volume;
  const targetPosition = keyword.target_domain_position;
  const competitorPositionsLength = keyword.competitor_positions?.length || 0;
  const competitorPositions = keyword.competitor_positions || [];

  // Calculate difficulty based on search volume - fully stable
  const difficulty = useMemo(() => {
    return searchVolume && searchVolume > 1000 ? 'high' : 
           searchVolume && searchVolume > 100 ? 'medium' : 'low';
  }, [searchVolume]);

  // Calculate potential based on position and competitors - fully stable
  const potential = useMemo(() => {
    const myPos = targetPosition || 999;
    const hasCompetitors = competitorPositionsLength > 0;
    const bestCompetitorPos = hasCompetitors ? 
      Math.min(...competitorPositions.map(c => c.position)) : 999;
    
    if (!hasCompetitors || myPos <= 3) return 'low';
    if (myPos > bestCompetitorPos + 5) return 'high';
    return 'medium';
  }, [targetPosition, competitorPositionsLength, competitorPositions]);
  
  return (
    <tr className="border-b transition-colors hover:bg-muted/50">
      <td className="p-4 align-middle font-medium">{keyword.keyword}</td>
      <td className="p-4 align-middle">
        <PositionBadge position={keyword.target_domain_position} />
      </td>
      <td className="p-4 align-middle">
        <DifficultyBadge difficulty={difficulty} />
      </td>
      <td className="p-4 align-middle">
        <PotentialBadge potential={potential} />
      </td>
      <td className="p-4 align-middle">
        <span className="text-sm text-muted-foreground">
          {competitorDisplay}
        </span>
      </td>
      <td className="p-4 align-middle">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(keyword)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReverify(keyword)}
            disabled={isReverifying}
          >
            <RotateCcw className={`h-4 w-4 ${isReverifying ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better memoization
  return (
    prevProps.keyword.id === nextProps.keyword.id &&
    prevProps.keyword.target_domain_position === nextProps.keyword.target_domain_position &&
    prevProps.reverifyingKeywords.includes(prevProps.keyword.keyword) === 
    nextProps.reverifyingKeywords.includes(nextProps.keyword.keyword)
  );
});