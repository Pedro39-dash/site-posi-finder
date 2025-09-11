import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TrafficData {
  date: string;
  [domain: string]: number | string;
}

interface TrafficChartProps {
  domains: string[];
  targetDomain: string;
}

const TrafficChart: React.FC<TrafficChartProps> = ({ domains, targetDomain }) => {
  // Generate realistic traffic data for the last 30 days
  const generateTrafficData = (): TrafficData[] => {
    const data: TrafficData[] = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dateStr = date.toLocaleDateString('pt-BR');
      const dataPoint: TrafficData = { date: dateStr };
      
      // Generate data for target domain (higher baseline)
      const targetBase = 15000 + Math.random() * 5000;
      const targetVariation = Math.sin((i / 30) * Math.PI * 2) * 2000;
      dataPoint[targetDomain] = Math.max(0, Math.round(targetBase + targetVariation));
      
      // Generate data for competitors
      domains.forEach((domain, index) => {
        if (domain !== targetDomain) {
          const competitorBase = 8000 + (index * 3000) + Math.random() * 4000;
          const competitorVariation = Math.sin(((i + index * 5) / 30) * Math.PI * 2) * 1500;
          dataPoint[domain] = Math.max(0, Math.round(competitorBase + competitorVariation));
        }
      });
      
      data.push(dataPoint);
    }
    
    return data;
  };

  const trafficData = generateTrafficData();
  
  // Colors for different domains
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tráfego Orgânico Estimado</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <LineChart data={trafficData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                formatter={(value: number) => [`${value.toLocaleString()} visitas`, '']}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              {domains.map((domain, index) => (
                <Line
                  key={domain}
                  type="monotone"
                  dataKey={domain}
                  stroke={colors[index % colors.length]}
                  strokeWidth={domain === targetDomain ? 3 : 2}
                  dot={false}
                  name={domain.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrafficChart;