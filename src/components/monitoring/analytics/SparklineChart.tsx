import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface SparklineChartProps {
  data: { value: number }[];
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export const SparklineChart = ({ data, color, trend = 'neutral' }: SparklineChartProps) => {
  const strokeColor = color || (
    trend === 'up' ? 'hsl(var(--chart-2))' :
    trend === 'down' ? 'hsl(var(--destructive))' :
    'hsl(var(--primary))'
  );

  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={strokeColor}
          strokeWidth={2}
          dot={false}
          animationDuration={300}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
