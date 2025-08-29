import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface AuditScoreCardProps {
  score: number;
  previousScore?: number;
  url: string;
  date: string;
}

export const AuditScoreCard = ({ score, previousScore, url, date }: AuditScoreCardProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    if (score >= 50) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: "A+", color: "bg-green-100 text-green-800" };
    if (score >= 80) return { grade: "A", color: "bg-green-100 text-green-800" };
    if (score >= 70) return { grade: "B", color: "bg-yellow-100 text-yellow-800" };
    if (score >= 60) return { grade: "C", color: "bg-orange-100 text-orange-800" };
    if (score >= 50) return { grade: "D", color: "bg-red-100 text-red-800" };
    return { grade: "F", color: "bg-red-100 text-red-800" };
  };

  const getProgressColor = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 70) return "bg-yellow-500";
    if (score >= 50) return "bg-orange-500";
    return "bg-red-500";
  };

  const getTrendIcon = () => {
    if (!previousScore) return <Minus className="h-4 w-4 text-muted-foreground" />;
    
    const difference = score - previousScore;
    if (difference > 5) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (difference < -5) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const scoreGrade = getScoreGrade(score);

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
      <CardContent className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Score Geral SEO</h3>
            <p className="text-xs text-muted-foreground mt-1">{url}</p>
          </div>
          <Badge className={scoreGrade.color}>
            {scoreGrade.grade}
          </Badge>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="text-4xl font-bold">
            <span className={getScoreColor(score)}>{score}</span>
            <span className="text-2xl text-muted-foreground">/100</span>
          </div>
          <div className="flex items-center gap-1">
            {getTrendIcon()}
            {previousScore && (
              <span className="text-sm text-muted-foreground">
                {previousScore > 0 ? `vs ${previousScore}` : ''}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso</span>
            <span>{score}%</span>
          </div>
          <div className="relative">
            <Progress value={score} className="h-2" />
            <div 
              className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-500 ${getProgressColor(score)}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          Analisado em {new Date(date).toLocaleDateString('pt-BR')}
        </div>
      </CardContent>
    </Card>
  );
};