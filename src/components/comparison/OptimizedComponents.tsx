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
  const isReverifying = reverifyingKeywords.includes(keyword.keyword);
  
  return (
    <>
      <td className="font-medium">{keyword.keyword}</td>
      <td>
        <PositionBadge position={keyword.target_domain_position} />
      </td>
      <td>
        <DifficultyBadge difficulty={keyword.competition_level} />
      </td>
      <td>
        <PotentialBadge potential={keyword.competition_level || 'low'} />
      </td>
      <td>
        <span className="text-sm text-muted-foreground">
          {keyword.competitor_positions?.slice(0, 3).map(c => 
            `${c.domain.replace(/^https?:\/\//, '').replace(/^www\./, '')} (${c.position}º)`
          ).join(', ')}
        </span>
      </td>
      <td>
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
    </>
  );
});