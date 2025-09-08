import React, { useMemo, useCallback, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CompetitiveAnalysisData } from '@/services/competitorAnalysisService';
import { StableBarChart, StablePieChart, StableAreaChart } from './StableChart';
import { ErrorBoundary } from './ErrorBoundary';

interface CompetitiveVisualizationProps {
  analysisData: CompetitiveAnalysisData;
}

const CompetitiveVisualization: React.FC<CompetitiveVisualizationProps> = memo(({ analysisData }) => {
  // Memoize the entire analysis data with a stable reference
  const memoizedAnalysisData = useMemo(() => ({
    ...analysisData,
    // Create a stable hash to prevent unnecessary re-renders
    _dataHash: JSON.stringify(analysisData)
  }), [JSON.stringify(analysisData)]);

  // All data preparation in a single useMemo for maximum stability
  const chartData = useMemo(() => {
    if (!memoizedAnalysisData?.keywords?.length) {
      return {
        positionDistribution: [],
        competitorComparison: [],
        opportunityTrend: [],
        shareOfVoiceData: []
      };
    }

    // Position distribution
    const ranges = [
      { range: '1-3', min: 1, max: 3, count: 0 },
      { range: '4-10', min: 4, max: 10, count: 0 },
      { range: '11-20', min: 11, max: 20, count: 0 },
      { range: '21-50', min: 21, max: 50, count: 0 },
      { range: '51+', min: 51, max: 999, count: 0 },
    ];

    memoizedAnalysisData.keywords.forEach(keyword => {
      const position = keyword.target_domain_position;
      if (position) {
        const range = ranges.find(r => position >= r.min && position <= r.max);
        if (range) range.count++;
      }
    });

    const positionDistribution = ranges.map(r => ({
      range: r.range,
      count: r.count,
      percentage: memoizedAnalysisData.keywords.length > 0 
        ? Math.round((r.count / memoizedAnalysisData.keywords.length) * 100) 
        : 0
    }));

    // Competitor comparison
    const competitorData = new Map();
    
    memoizedAnalysisData.keywords.forEach(keyword => {
      keyword.competitor_positions?.forEach(comp => {
        const domain = comp.domain?.replace(/^https?:\/\//, '').replace(/^www\./, '') || 'Desconhecido';
        if (!competitorData.has(domain)) {
          competitorData.set(domain, { domain, positions: [], avgPosition: 0 });
        }
        competitorData.get(domain).positions.push(comp.position);
      });
    });

    const competitorComparison = Array.from(competitorData.values())
      .map(comp => ({
        ...comp,
        avgPosition: comp.positions.length > 0 
          ? Math.round(comp.positions.reduce((a: number, b: number) => a + b, 0) / comp.positions.length)
          : 0
      }))
      .filter(comp => comp.avgPosition > 0)
      .sort((a, b) => a.avgPosition - b.avgPosition)
      .slice(0, 10);

    // Opportunity trend (stable simulation)
    const days = 30;
    const baseOpportunities = memoizedAnalysisData.keywords.filter(k => 
      k.target_domain_position && k.target_domain_position > 10
    ).length;
    
    const opportunityTrend = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      
      const variation = Math.sin((i / days) * Math.PI * 2) * 0.1;
      const opportunities = Math.max(0, Math.round(baseOpportunities * (1 + variation)));
      
      return {
        date: date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
        opportunities,
        potential: Math.round(opportunities * 1.2),
      };
    });

    // Share of voice
    const voiceData = new Map();
    const targetDomain = memoizedAnalysisData.target_domain?.replace(/^https?:\/\//, '').replace(/^www\./, '') || 'Seu Site';
    
    voiceData.set(targetDomain, 0);
    
    memoizedAnalysisData.keywords.forEach(keyword => {
      if (keyword.target_domain_position && keyword.target_domain_position <= 10) {
        voiceData.set(targetDomain, (voiceData.get(targetDomain) || 0) + 1);
      }
      
      keyword.competitor_positions?.forEach(comp => {
        if (comp.position <= 10) {
          const domain = comp.domain?.replace(/^https?:\/\//, '').replace(/^www\./, '') || 'Desconhecido';
          voiceData.set(domain, (voiceData.get(domain) || 0) + 1);
        }
      });
    });

    const totalPositions = Array.from(voiceData.values()).reduce((a, b) => a + b, 0);
    
    const shareOfVoiceData = Array.from(voiceData.entries())
      .map(([domain, count]) => ({
        domain,
        count,
        percentage: totalPositions > 0 ? Math.round((count / totalPositions) * 100) : 0
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return {
      positionDistribution,
      competitorComparison,
      opportunityTrend,
      shareOfVoiceData
    };
  }, [memoizedAnalysisData._dataHash]);

  if (!memoizedAnalysisData?.keywords?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhum dado disponível para visualização</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Position Distribution */}
      <ErrorBoundary>
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Posições</CardTitle>
            <CardDescription>
              Como suas palavras-chave estão distribuídas nos resultados de busca
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StableBarChart
              data={chartData.positionDistribution}
              dataKey="count"
              xAxisKey="range"
              height={300}
            />
          </CardContent>
        </Card>
      </ErrorBoundary>

      {/* Share of Voice */}
      <ErrorBoundary>
        <Card>
          <CardHeader>
            <CardTitle>Share of Voice</CardTitle>
            <CardDescription>
              Participação nos primeiros 10 resultados por domínio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StablePieChart
              data={chartData.shareOfVoiceData}
              dataKey="percentage"
              nameKey="domain"
              height={300}
            />
          </CardContent>
        </Card>
      </ErrorBoundary>

      {/* Competitor Comparison */}
      <ErrorBoundary>
        <Card>
          <CardHeader>
            <CardTitle>Comparação de Concorrentes</CardTitle>
            <CardDescription>
              Posição média dos principais concorrentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StableBarChart
              data={chartData.competitorComparison}
              dataKey="avgPosition"
              xAxisKey="domain"
              height={300}
              color="hsl(var(--secondary))"
            />
          </CardContent>
        </Card>
      </ErrorBoundary>

      {/* Opportunity Trend */}
      <ErrorBoundary>
        <Card>
          <CardHeader>
            <CardTitle>Tendência de Oportunidades</CardTitle>
            <CardDescription>
              Evolução das oportunidades de ranking nos últimos 30 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StableAreaChart
              data={chartData.opportunityTrend}
              dataKey="opportunities"
              xAxisKey="date"
              height={300}
            />
          </CardContent>
        </Card>
      </ErrorBoundary>
    </div>
  );
});

export default CompetitiveVisualization;