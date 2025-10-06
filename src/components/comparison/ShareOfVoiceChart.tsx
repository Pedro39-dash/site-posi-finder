import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Cell, PieChart, Pie, ResponsiveContainer, LineChart, Line, XAxis, YAxis } from 'recharts';
import { RefreshCw } from 'lucide-react';
import { CompetitorDomain, CompetitorKeyword } from '@/services/competitorAnalysisService';
import { getTop10CompetitorsAhead, getDomainColor } from '@/utils/competitorFiltering';
import { useKeywordFilter } from '@/contexts/KeywordFilterContext';
import { useAnalysisCache } from '@/hooks/useAnalysisCache';
import { getCTRByPosition } from '@/utils/seoScoring';

interface ShareOfVoiceData {
  domain: string;
  ctr: number;
  percentage: number;
}

interface ShareOfVoiceChartProps {
  data: ShareOfVoiceData[];
  competitors: CompetitorDomain[];
  keywords: CompetitorKeyword[];
  targetDomain: string;
}


const ShareOfVoiceChart: React.FC<ShareOfVoiceChartProps> = ({ data, competitors, keywords, targetDomain }) => {
  const { selectedKeyword } = useKeywordFilter();
  const { invalidatePattern } = useAnalysisCache();

  // Filter keywords to only the selected one
  const filteredKeywords = useMemo(() => {
    if (!selectedKeyword) return keywords;
    return keywords.filter(k => k.id === selectedKeyword.id);
  }, [keywords, selectedKeyword]);

  // Filter data to show only competitors for the selected keyword (excluding target domain position)
  const filteredData = useMemo(() => {
    // If 1 keyword filtered, recalculate from scratch based only on that keyword
    if (filteredKeywords.length === 1) {
      const keyword = filteredKeywords[0];
      const voiceData = new Map<string, number>();
      
      // Target domain
      if (keyword.target_domain_position && keyword.target_domain_position <= 10) {
        const cleanTargetDomain = targetDomain.replace(/^https?:\/\//, '').replace(/^www\./, '');
        const ctr = getCTRByPosition(keyword.target_domain_position);
        voiceData.set(cleanTargetDomain, ctr);
      }
      
      // Competitors
      keyword.competitor_positions?.forEach(comp => {
        if (comp.position <= 10) {
          const domain = comp.domain?.replace(/^https?:\/\//, '').replace(/^www\./, '');
          const ctr = getCTRByPosition(comp.position);
          voiceData.set(domain, ctr);
        }
      });
      
      const totalCTR = Array.from(voiceData.values()).reduce((sum, ctr) => sum + ctr, 0);
      
      return Array.from(voiceData.entries())
        .map(([domain, ctr]) => ({
          domain,
          ctr: Math.round(ctr * 10) / 10,
          percentage: totalCTR > 0 ? Math.round((ctr / totalCTR) * 100) : 0
        }))
        .filter(item => item.ctr > 0)
        .sort((a, b) => b.ctr - a.ctr);
    }
    
    // Multiple keywords: use aggregated data from parent
    const filteredCompetitors = getTop10CompetitorsAhead(competitors, filteredKeywords, targetDomain);
    const filteredDomains = filteredCompetitors.map(c => c.domain);
    
    // Filter original data to only include these domains
    const filtered = data.filter(item => {
      const cleanItemDomain = item.domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
      return filteredDomains.includes(cleanItemDomain);
    });
    
    // Sort by the same logic as competitor filtering (position + domain name)
    const sortedFiltered = filtered.sort((a, b) => {
      const competitorA = filteredCompetitors.find(c => c.domain === a.domain.replace(/^https?:\/\//, '').replace(/^www\./, ''));
      const competitorB = filteredCompetitors.find(c => c.domain === b.domain.replace(/^https?:\/\//, '').replace(/^www\./, ''));
      
      const positionA = competitorA?.averagePosition || 999;
      const positionB = competitorB?.averagePosition || 999;
      
      // Sort by position, then by domain name for tie-breaking
      const positionDiff = positionA - positionB;
      return positionDiff !== 0 ? positionDiff : a.domain.localeCompare(b.domain);
    });
    
    // Recalculate percentages based on CTR
    const totalCTR = sortedFiltered.reduce((sum, item) => sum + item.ctr, 0);
    
    return sortedFiltered.map(item => ({
      ...item,
      percentage: totalCTR > 0 ? Math.round((item.ctr / totalCTR) * 100) : 0
    }));
  }, [data, competitors, filteredKeywords, targetDomain, selectedKeyword]);
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());

  // Update selected domains when filteredData changes
  useEffect(() => {
    if (filteredData.length > 0) {
      setSelectedDomains(new Set(filteredData.map(item => item.domain)));
    }
  }, [filteredData]);

  // Filter data based on selection
  const displayData = useMemo(() => 
    filteredData.filter(item => selectedDomains.has(item.domain)),
    [filteredData, selectedDomains]
  );

  // Generate trend data (simulated)
  const trendData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      
      const totalVoice = displayData.reduce((sum, item) => sum + item.percentage, 0);
      const variation = Math.sin((i / 7) * Math.PI * 2) * 5;
      
      return {
        date: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
        shareOfVoice: Math.max(0, totalVoice + variation)
      };
    });
  }, [displayData]);

  const handleRefreshData = () => {
    // Clear cache to ensure fresh data
    invalidatePattern('competitive-analysis');
    // Force component refresh
    window.location.reload();
  };

  const handleDomainToggle = (domain: string, checked: boolean) => {
    const newSelected = new Set(selectedDomains);
    if (checked) {
      newSelected.add(domain);
    } else {
      newSelected.delete(domain);
    }
    setSelectedDomains(newSelected);
  };

  const formatDomain = (domain: string) => {
    return domain.length > 20 ? `${domain.substring(0, 20)}...` : domain;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Share of Voice
          <Badge variant="outline" className="text-xs">
            {filteredData.length} domínios
          </Badge>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefreshData}
            className="ml-auto"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Donut Chart */}
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
                <Pie
                  data={displayData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="percentage"
                  strokeWidth={2}
                  stroke="hsl(var(--background))"
                  label={(props) => {
                    const { cx, cy, midAngle, outerRadius, index, domain, percentage } = props;
                    const isTop3 = index < 3;
                    
                    if (!isTop3) {
                      // Labels internos para não TOP 3
                      const RADIAN = Math.PI / 180;
                      const radius = 60 + (90 - 60) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      
                      return (
                        <text 
                          x={x} 
                          y={y} 
                          fill="hsl(var(--background))" 
                          textAnchor="middle" 
                          dominantBaseline="central"
                          className="text-xs font-semibold"
                        >
                          {percentage}%
                        </text>
                      );
                    }
                    
                    // TOP 3: label externo com linha
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius + 30;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    const lineX = cx + outerRadius * Math.cos(-midAngle * RADIAN);
                    const lineY = cy + outerRadius * Math.sin(-midAngle * RADIAN);
                    
                    const truncatedDomain = domain.length > 15 
                      ? `${domain.substring(0, 15)}...` 
                      : domain;
                    
                    return (
                      <g>
                        <line
                          x1={lineX}
                          y1={lineY}
                          x2={x}
                          y2={y}
                          stroke={getDomainColor(index)}
                          strokeWidth={1.5}
                        />
                        <text 
                          x={x + (x > cx ? 5 : -5)} 
                          y={y} 
                          textAnchor={x > cx ? "start" : "end"}
                          dominantBaseline="central"
                          className="text-xs font-semibold fill-foreground"
                        >
                          {percentage}% {truncatedDomain}
                        </text>
                      </g>
                    );
                  }}
                  labelLine={false}
                >
                  {displayData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getDomainColor(index)}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            {/* Trend Line */}
            <div className="w-full mt-4">
              <h4 className="text-sm font-medium mb-2">Tendência (7 dias)</h4>
              <ResponsiveContainer width="100%" height={80}>
                <LineChart data={trendData}>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis hide />
                  <Line 
                    type="monotone" 
                    dataKey="shareOfVoice" 
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Interactive Legend */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium mb-4">Domínios</h4>
            <div className="max-h-80 overflow-y-auto space-y-3">
              {filteredData.map((item, index) => (
                <div 
                  key={item.domain}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedDomains.has(item.domain)}
                      onCheckedChange={(checked) => 
                        handleDomainToggle(item.domain, checked as boolean)
                      }
                    />
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getDomainColor(index) }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {formatDomain(item.domain)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        CTR: {item.ctr}% {filteredKeywords.length > 1 ? `(${filteredKeywords.length} kws)` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-foreground">
                      {item.percentage}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredData.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Nenhum dado disponível</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShareOfVoiceChart;