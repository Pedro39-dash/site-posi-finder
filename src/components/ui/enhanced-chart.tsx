import { ResponsiveContainer, Tooltip, TooltipProps } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReactNode, ReactElement } from "react";

// Sistema de cores consistente para gráficos
export const CHART_COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
  destructive: "hsl(var(--destructive))",
  muted: "hsl(var(--muted-foreground))",
  success: "hsl(var(--accent))",
  warning: "hsl(45 93% 58%)",
  info: "hsl(217 89% 61%)",
  // Gradientes
  primaryGradient: "url(#primaryGradient)",
  accentGradient: "url(#accentGradient)",
  destructiveGradient: "url(#destructiveGradient)",
} as const;

// Palette de cores para múltiplos dados
export const CHART_PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.accent,
  CHART_COLORS.destructive,
  CHART_COLORS.warning,
  CHART_COLORS.info,
  "hsl(270 95% 75%)",
  "hsl(340 75% 55%)",
  "hsl(30 90% 55%)",
] as const;

interface EnhancedChartContainerProps {
  children: ReactElement;
  title: string;
  description?: string;
  badge?: { text: string; variant?: "default" | "secondary" | "destructive" | "outline" };
  className?: string;
  height?: number;
  icon?: ReactNode;
}

export const EnhancedChartContainer = ({ 
  children, 
  title, 
  description, 
  badge, 
  className = "", 
  height = 320,
  icon 
}: EnhancedChartContainerProps) => {
  return (
    <Card className={`shadow-card animate-fade-in ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {icon}
            {title}
          </CardTitle>
          {badge && (
            <Badge variant={badge.variant || "secondary"} className="animate-scale-in">
              {badge.text}
            </Badge>
          )}
        </div>
        {description && (
          <CardDescription className="text-sm">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pb-2">
        <div className="w-full" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Tooltip customizado e animado
interface CustomTooltipProps extends TooltipProps<any, any> {
  labelFormatter?: (label: string, payload?: any[]) => string;
  formatter?: (value: any, name: string, props: any) => [string, string];
  showAnimation?: boolean;
}

export const CustomTooltip = ({ 
  active, 
  payload, 
  label, 
  labelFormatter, 
  formatter,
  showAnimation = true 
}: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const animationClass = showAnimation ? "animate-scale-in" : "";

  return (
    <div className={`bg-card border border-border rounded-lg shadow-lg p-3 max-w-xs ${animationClass}`}>
      <div className="space-y-2">
        {label && (
          <p className="font-medium text-foreground border-b border-border pb-1">
            {labelFormatter ? labelFormatter(label, payload) : label}
          </p>
        )}
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-muted-foreground">
                {entry.name}
              </span>
            </div>
            <span className="font-medium text-foreground">
              {formatter ? formatter(entry.value, entry.name || '', entry)[0] : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente para gradientes SVG
export const ChartGradients = () => (
  <defs>
    <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
    </linearGradient>
    <linearGradient id="accentGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.8}/>
      <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.2}/>
    </linearGradient>
    <linearGradient id="destructiveGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.8}/>
      <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.2}/>
    </linearGradient>
  </defs>
);

// Configurações padrão para gráficos
export const DEFAULT_CHART_CONFIG = {
  margin: { top: 20, right: 30, left: 20, bottom: 60 },
  animationDuration: 800,
  animationEasing: "ease-out",
} as const;

// Utilitários para formatação
export const formatPosition = (position: number | null): string => {
  if (!position) return "Não encontrado";
  return `${position}ª posição`;
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const formatDomain = (url: string): string => {
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
};