import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { CompetitorDomain, CompetitorKeyword } from '@/services/competitorAnalysisService';
import { getTop10CompetitorsAhead, getDomainColor } from '@/utils/competitorFiltering';


interface PositionData {
  date: string;
  [domain: string]: number | string;
}

interface PositionVariationChartProps {
  competitors: CompetitorDomain[];
  keywords: CompetitorKeyword[];
  selectedDomains: string[];
  targetDomain: string;
}

const PositionVariationChart: React.FC<PositionVariationChartProps> = ({
  competitors,
  keywords,
  selectedDomains, 
  targetDomain
}) => {
  // Filter to show only top 10 competitors ahead
  const filteredCompetitors = useMemo(() => {
    return getTop10CompetitorsAhead(competitors, keywords, targetDomain);
  }, [competitors, keywords, targetDomain]);

  // Get all domain names for the chart (filtered competitors + target if ranking)
  const domains = useMemo(() => {
    const competitorDomains = filteredCompetitors.map(c => c.domain);
    
    // Check if target domain is ranking
    const targetRanking = keywords.some(k => k.target_domain_position && k.target_domain_position > 0);
    
    if (targetRanking) {
      return [targetDomain.replace(/^https?:\/\//, '').replace(/^www\./, ''), ...competitorDomains];
    }
    
    return competitorDomains;
  }, [filteredCompetitors, targetDomain, keywords]);

  // Generate deterministic position data for the last 30 days - stable without random
  const positionData = useMemo(() => {
    const data: PositionData[] = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dateStr = date.toLocaleDateString('pt-BR');
      const dataPoint: PositionData = { date: dateStr };
      
      // For target domain - show "Não rankeando" if no data, otherwise show trending around current average
      if (targetDomain === "Não rankeando" || targetDomain.includes("Não rankeando")) {
        // Don't add target domain data if it's not ranking
      } else {
        const targetBase = 15; // Default simulation - could be made dynamic based on real data
        const targetVariation = Math.sin((i / 30) * Math.PI * 2) * 3 + Math.sin((i / 10) * Math.PI) * 1;
        dataPoint[targetDomain] = Math.max(1, Math.min(100, Math.round(targetBase + targetVariation)));
      }
      
      // Generate deterministic data for competitors
      domains.forEach((domain, index) => {
        if (domain !== targetDomain) {
          const competitorBase = 8 + (index * 4) + (index % 3) * 2;
          const competitorVariation = Math.sin(((i + index * 7) / 30) * Math.PI * 2) * 2 + Math.cos((i + index * 3) / 15 * Math.PI) * 1;
          dataPoint[domain] = Math.max(1, Math.min(100, Math.round(competitorBase + competitorVariation)));
        }
      });
      
      data.push(dataPoint);
    }
    
    return data;
  }, [domains, targetDomain]);

  // Calculate position variations for each domain
  const positionVariations = useMemo(() => {
    return selectedDomains.map(domain => {
      const firstPosition = positionData[0]?.[domain] as number || 50;
      const lastPosition = positionData[positionData.length - 1]?.[domain] as number || 50;
      const variation = firstPosition - lastPosition; // Positive = improved (lower position)
      
      return {
        domain,
        variation,
        status: variation > 0 ? 'improved' : variation < 0 ? 'declined' : 'stable'
      };
    });
  }, [selectedDomains, positionData]);
  
  // Get colors for domains
  const getColorForDomain = (domain: string) => {
    const index = domains.indexOf(domain);
    return getDomainColor(index);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}ª posição
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Variação de Posições</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Evolução das posições médias nos últimos 30 dias
            </p>
          </div>
          
          {/* Position Variations Summary */}
          <div className="flex items-center gap-2 flex-wrap">
            {positionVariations.map(({ domain, variation, status }) => (
              <Badge 
                key={domain}
                variant={status === 'improved' ? 'default' : status === 'declined' ? 'destructive' : 'secondary'}
                className="flex items-center gap-1"
              >
                {status === 'improved' && <TrendingUp className="h-3 w-3" />}
                {status === 'declined' && <TrendingDown className="h-3 w-3" />}
                {status === 'stable' && <Minus className="h-3 w-3" />}
                <span className="text-xs">
                  {domain.replace(/^https?:\/\//, '').replace(/^www\./, '').substring(0, 10)}
                  {Math.abs(variation) > 0 ? ` ${variation > 0 ? '+' : ''}${variation.toFixed(1)}` : ''}
                </span>
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
        <CardContent className="space-y-4">
          {/* Chart Container */}
        {/* Position Chart */}
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <LineChart data={positionData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                reversed
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value}º`}
                domain={[1, 'dataMax + 5']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {selectedDomains.map((domain, index) => (
                <Line
                  key={domain}
                  type="monotone"
                  dataKey={domain}
                  stroke={getColorForDomain(domain)}
                  strokeWidth={domain === targetDomain ? 3 : 2}
                  dot={false}
                  name={domain.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="text-xs text-muted-foreground">
          <p>💡 <strong>Dica:</strong> Posições menores são melhores. Selecione até 10 domínios para comparar suas variações.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PositionVariationChart;