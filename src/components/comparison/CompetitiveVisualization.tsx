import React, { memo, useMemo, useCallback } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target, Crown, Eye } from "lucide-react";
import { CompetitiveAnalysisData, CompetitorDomain, CompetitorKeyword } from "@/services/competitorAnalysisService";

interface CompetitiveVisualizationProps {
  analysisData: CompetitiveAnalysisData;
}

const CompetitiveVisualization: React.FC<CompetitiveVisualizationProps> = memo(({ analysisData }) => {
  // Stable reference for analysis data
  const stableAnalysisData = useMemo(() => analysisData, [
    analysisData?.analysis?.id,
    analysisData?.keywords?.length,
    analysisData?.competitors?.length
  ]);

  const { analysis, competitors, keywords } = stableAnalysisData;

  // Chart colors using design system (stable reference)
  const chartColors = useMemo(() => ({
    primary: 'hsl(217 89% 61%)',
    secondary: 'hsl(145 63% 49%)',
    accent: 'hsl(38 92% 50%)',
    muted: 'hsl(220 14% 96%)',
    destructive: 'hsl(0 84% 60%)'
  }), []);

  // Prepare position distribution data
  const positionDistribution = useMemo(() => {
    const distribution = {
      '1-3': 0,
      '4-10': 0,
      '11-20': 0,
      '21-50': 0,
      '50+': 0,
      'Not Found': 0
    };

    keywords.forEach(keyword => {
      const position = keyword.target_domain_position;
      if (!position) {
        distribution['Not Found']++;
      } else if (position <= 3) {
        distribution['1-3']++;
      } else if (position <= 10) {
        distribution['4-10']++;
      } else if (position <= 20) {
        distribution['11-20']++;
      } else if (position <= 50) {
        distribution['21-50']++;
      } else {
        distribution['50+']++;
      }
    });

    return Object.entries(distribution).map(([range, count]) => ({
      range,
      count,
      percentage: Math.round((count / keywords.length) * 100)
    }));
  }, [keywords]);

  // Prepare competitor comparison data
  const competitorComparison = useMemo(() => {
    const targetDomain = analysis.target_domain;
    
    return competitors.map(competitor => {
      const competitorKeywords = keywords.filter(k => 
        k.competitor_positions?.some((cp: any) => cp.domain === competitor.domain)
      );

      const avgPosition = competitorKeywords.length > 0 
        ? competitorKeywords.reduce((sum, k) => {
            const position = k.competitor_positions?.find((cp: any) => cp.domain === competitor.domain)?.position || 100;
            return sum + position;
          }, 0) / competitorKeywords.length
        : 100;

      return {
        domain: competitor.domain.replace(/^https?:\/\//, '').replace(/^www\./, ''),
        avgPosition: Math.round(avgPosition),
        totalKeywords: competitor.total_keywords_found || 0,
        shareOfVoice: competitor.share_of_voice || 0
      };
    }).slice(0, 5); // Top 5 competitors
  }, [competitors, keywords, analysis.target_domain]);

  // Prepare opportunity trend data (simulated)
  const opportunityTrend = useMemo(() => {
    const days = 30;
    const data = [];
    const baseOpportunities = keywords.filter(k => 
      k.target_domain_position && k.target_domain_position > 10
    ).length;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Simulate trend with some randomness
      const variation = Math.sin(i * 0.1) * 5 + Math.random() * 3;
      const opportunities = Math.max(0, baseOpportunities + variation);
      
      data.push({
        date: date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
        opportunities: Math.round(opportunities),
        improved: Math.round(opportunities * 0.15),
        declined: Math.round(opportunities * 0.08)
      });
    }
    
    return data;
  }, [keywords]);

  // Share of Voice data
  const shareOfVoiceData = useMemo(() => {
    const targetDomain = analysis.target_domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
    const targetSOV = keywords.filter(k => k.target_domain_position && k.target_domain_position <= 10).length / keywords.length * 100;
    
    const data = [
      {
        name: targetDomain,
        value: Math.round(targetSOV),
        color: chartColors.primary
      }
    ];

    competitors.slice(0, 4).forEach((competitor, index) => {
      const competitorSOV = keywords.filter(k => 
        k.competitor_positions?.some((cp: any) => cp.domain === competitor.domain && cp.position <= 10)
      ).length / keywords.length * 100;

      data.push({
        name: competitor.domain.replace(/^https?:\/\//, '').replace(/^www\./, ''),
        value: Math.round(competitorSOV),
        color: [chartColors.secondary, chartColors.accent, chartColors.muted, chartColors.destructive][index]
      });
    });

    return data.sort((a, b) => b.value - a.value);
  }, [analysis.target_domain, competitors, keywords, chartColors]);

  // Custom tooltip component (memoized)
  const CustomTooltip = useCallback(({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-elegant">
          <p className="text-card-foreground font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.name.includes('Position') && 'ª posição'}
              {entry.name.includes('Share') && '%'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  }, []);

  return (
    <div className="space-y-6">
      {/* Position Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Distribuição de Posições
          </CardTitle>
          <CardDescription>
            Como suas keywords estão distribuídas nas SERPs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={positionDistribution} key="position-dist">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="range" 
                  className="text-muted-foreground text-xs"
                />
                <YAxis className="text-muted-foreground text-xs" />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="count" 
                  fill={chartColors.primary}
                  radius={[4, 4, 0, 0]}
                  animationDuration={0}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-4">
            {positionDistribution.map((item) => (
              <div key={item.range} className="text-center">
                <Badge variant="outline" className="text-xs">
                  {item.range}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  {item.percentage}%
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Share of Voice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Share of Voice
          </CardTitle>
          <CardDescription>
            Participação nas primeiras posições por domínio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart key="share-voice">
                <Pie
                  data={shareOfVoiceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                  labelLine={false}
                  animationDuration={0}
                >
                  {shareOfVoiceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Competitor Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Comparação de Concorrentes
          </CardTitle>
          <CardDescription>
            Performance média dos principais concorrentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={competitorComparison} layout="horizontal" key="competitor-comp">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  type="number" 
                  className="text-muted-foreground text-xs"
                  domain={[0, 50]}
                />
                <YAxis 
                  type="category" 
                  dataKey="domain" 
                  className="text-muted-foreground text-xs"
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="avgPosition" 
                  fill={chartColors.secondary}
                  radius={[0, 4, 4, 0]}
                  name="Posição Média"
                  animationDuration={0}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Opportunity Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Tendência de Oportunidades
          </CardTitle>
          <CardDescription>
            Evolução das oportunidades de ranking nos últimos 30 dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={opportunityTrend} key="opportunity-trend">
                <defs>
                  <linearGradient id="opportunityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  className="text-muted-foreground text-xs"
                />
                <YAxis className="text-muted-foreground text-xs" />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="opportunities"
                  stroke={chartColors.primary}
                  fillOpacity={1}
                  fill="url(#opportunityGradient)"
                  name="Oportunidades"
                  animationDuration={0}
                />
                <Line
                  type="monotone"
                  dataKey="improved"
                  stroke={chartColors.secondary}
                  strokeWidth={2}
                  name="Melhoradas"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

export default CompetitiveVisualization;