import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Cell, PieChart, Pie, ResponsiveContainer, LineChart, Line, XAxis, YAxis } from 'recharts';

interface ShareOfVoiceData {
  domain: string;
  count: number;
  percentage: number;
}

interface ShareOfVoiceChartProps {
  data: ShareOfVoiceData[];
}

const COLORS = [
  'hsl(217, 89%, 61%)', // Primary
  'hsl(145, 63%, 49%)', // Accent  
  'hsl(0, 84%, 60%)',   // Destructive
  'hsl(45, 93%, 47%)',  // Warning
  'hsl(263, 85%, 66%)', // Purple
  'hsl(173, 80%, 40%)', // Teal
  'hsl(25, 95%, 53%)',  // Orange
  'hsl(142, 76%, 36%)', // Green
];

const ShareOfVoiceChart: React.FC<ShareOfVoiceChartProps> = ({ data }) => {
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(
    new Set(data.map(item => item.domain))
  );

  // Filter data based on selection
  const filteredData = useMemo(() => 
    data.filter(item => selectedDomains.has(item.domain)),
    [data, selectedDomains]
  );

  // Generate trend data (simulated)
  const trendData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      
      const totalVoice = filteredData.reduce((sum, item) => sum + item.percentage, 0);
      const variation = Math.sin((i / 7) * Math.PI * 2) * 5;
      
      return {
        date: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
        shareOfVoice: Math.max(0, totalVoice + variation)
      };
    });
  }, [filteredData]);

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
        <CardTitle>Share of Voice</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Donut Chart */}
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={filteredData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="percentage"
                  strokeWidth={2}
                  stroke="hsl(var(--background))"
                >
                  {filteredData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
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
              {data.map((item, index) => (
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
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {formatDomain(item.domain)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.count} palavras-chave
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
            
            {data.length === 0 && (
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