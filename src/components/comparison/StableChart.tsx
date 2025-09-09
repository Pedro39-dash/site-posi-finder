import React, { memo, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Line, LineChart, Tooltip } from 'recharts';

// Stable color palette - never changes
const STABLE_COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  accent: 'hsl(var(--accent))',
  muted: 'hsl(var(--muted))',
  destructive: 'hsl(var(--destructive))',
  chart: [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ]
} as const;

interface StableBarChartProps {
  data: any[];
  dataKey: string;
  xAxisKey: string;
  height?: number;
  color?: string;
}

export const StableBarChart = memo<StableBarChartProps>(({ 
  data, 
  dataKey, 
  xAxisKey, 
  height = 300,
  color = STABLE_COLORS.primary 
}) => {
  const stableData = useMemo(() => data, [JSON.stringify(data)]);
  
  const CustomTooltip = useCallback(({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover p-3 rounded-lg border shadow-md">
          <p className="text-sm font-medium">{`${label}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  }, []);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={stableData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis 
          dataKey={xAxisKey} 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <Bar 
          dataKey={dataKey} 
          fill={color}
          radius={[2, 2, 0, 0]}
        />
        <Tooltip content={<CustomTooltip />} />
      </BarChart>
    </ResponsiveContainer>
  );
});

interface StablePieChartProps {
  data: any[];
  dataKey: string;
  nameKey: string;
  height?: number;
}

export const StablePieChart = memo<StablePieChartProps>(({ data, dataKey, nameKey, height = 300 }) => {
  const stableData = useMemo(() => data, [JSON.stringify(data)]);
  
  const CustomTooltip = useCallback(({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover p-3 rounded-lg border shadow-md">
          <p className="text-sm font-medium">{`${data[nameKey]}: ${data[dataKey]}%`}</p>
        </div>
      );
    }
    return null;
  }, [dataKey, nameKey]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={stableData}
          cx="50%"
          cy="50%"
          outerRadius={80}
          dataKey={dataKey}
          strokeWidth={0}
        >
          {stableData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={STABLE_COLORS.chart[index % STABLE_COLORS.chart.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
});

interface StableAreaChartProps {
  data: any[];
  dataKey: string;
  xAxisKey: string;
  height?: number;
  color?: string;
}

export const StableAreaChart = memo<StableAreaChartProps>(({ 
  data, 
  dataKey, 
  xAxisKey, 
  height = 300,
  color = STABLE_COLORS.primary 
}) => {
  const stableData = useMemo(() => data, [JSON.stringify(data)]);
  
  const CustomTooltip = useCallback(({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover p-3 rounded-lg border shadow-md">
          <p className="text-sm font-medium">{`${label}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  }, []);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={stableData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis 
          dataKey={xAxisKey} 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <Area 
          type="monotone" 
          dataKey={dataKey} 
          stroke={color} 
          fill={color} 
          fillOpacity={0.3}
        />
        <Tooltip content={<CustomTooltip />} />
      </AreaChart>
    </ResponsiveContainer>
  );
});