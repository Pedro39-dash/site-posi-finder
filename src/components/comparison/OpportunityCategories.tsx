import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Target, Shield, AlertCircle, Lightbulb } from "lucide-react";
import { ComparisonResultEnhanced } from "./ComparisonResultsEnhanced";

interface OpportunityCategoriesProps {
  results: ComparisonResultEnhanced[];
  websites: string[];
}

interface Opportunity {
  keyword: string;
  clientPosition: number | null;
  competitorPosition: number | null;
  gap: number;
  priority: "high" | "medium" | "low";
  category: "lost" | "easy" | "defend";
}

const OpportunityCategories = ({ results, websites }: OpportunityCategoriesProps) => {
  const clientDomain = websites[0];
  const competitorDomain = websites[1];

  const categorizeOpportunities = (): {
    lostKeywords: Opportunity[];
    easyWins: Opportunity[];
    defendPositions: Opportunity[];
  } => {
    const opportunities = results.map(result => {
      const clientResult = result.results.find(r => r.website === clientDomain);
      const competitorResult = result.results.find(r => r.website === competitorDomain);
      
      return {
        keyword: result.keyword,
        clientPosition: clientResult?.position || null,
        competitorPosition: competitorResult?.position || null,
        gap: clientResult?.position && competitorResult?.position 
          ? clientResult.position - competitorResult.position 
          : 0,
      };
    });

    // Keywords Perdidas: concorrente ranqueia no top 20 e você não
    const lostKeywords: Opportunity[] = opportunities
      .filter(opp => opp.competitorPosition && opp.competitorPosition <= 20 && !opp.clientPosition)
      .map(opp => ({
        ...opp,
        gap: 100 - (opp.competitorPosition || 100),
        priority: (opp.competitorPosition || 100) <= 3 ? "high" as const : 
                 (opp.competitorPosition || 100) <= 10 ? "medium" as const : "low" as const,
        category: "lost" as const
      }))
      .sort((a, b) => (a.competitorPosition || 100) - (b.competitorPosition || 100));

    // Melhorias Fáceis: você está entre posições 4-15 (striking distance)
    const easyWins: Opportunity[] = opportunities
      .filter(opp => opp.clientPosition && opp.clientPosition >= 4 && opp.clientPosition <= 15)
      .map(opp => ({
        ...opp,
        gap: opp.gap,
        priority: opp.clientPosition! <= 7 ? "high" as const : 
                 opp.clientPosition! <= 10 ? "medium" as const : "low" as const,
        category: "easy" as const
      }))
      .sort((a, b) => (a.clientPosition || 100) - (b.clientPosition || 100));

    // Fortalezas a Defender: você está no top 5 mas concorrente também está próximo (top 10)
    const defendPositions: Opportunity[] = opportunities
      .filter(opp => 
        opp.clientPosition && opp.clientPosition <= 5 && 
        opp.competitorPosition && opp.competitorPosition <= 10 &&
        opp.competitorPosition > opp.clientPosition
      )
      .map(opp => ({
        ...opp,
        gap: opp.gap,
        priority: Math.abs(opp.gap) <= 2 ? "high" as const : 
                 Math.abs(opp.gap) <= 4 ? "medium" as const : "low" as const,
        category: "defend" as const
      }))
      .sort((a, b) => Math.abs(a.gap) - Math.abs(b.gap));

    return { lostKeywords, easyWins, defendPositions };
  };

  const { lostKeywords, easyWins, defendPositions } = categorizeOpportunities();

  const getDomainName = (url: string) => {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  };

  const getPriorityBadge = (priority: Opportunity['priority']) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">Alta Prioridade</Badge>;
      case "medium":
        return <Badge variant="secondary">Média Prioridade</Badge>;
      case "low":
        return <Badge variant="outline">Baixa Prioridade</Badge>;
    }
  };

  const getPositionText = (position: number | null) => {
    return position ? `${position}ª` : "Não encontrado";
  };

  const OpportunityCard = ({ opportunities, icon, title, description, actionText, emptyText }: {
    opportunities: Opportunity[];
    icon: React.ReactNode;
    title: string;
    description: string;
    actionText: string;
    emptyText: string;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title} ({opportunities.length})
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {opportunities.length > 0 ? (
          <div className="space-y-3">
            {opportunities.slice(0, 5).map((opp) => (
              <div 
                key={opp.keyword} 
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{opp.keyword}</span>
                    {getPriorityBadge(opp.priority)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {opp.category === "lost" && (
                      <>Concorrente: {getPositionText(opp.competitorPosition)} | Você: Não ranqueia</>
                    )}
                    {opp.category === "easy" && (
                      <>Você: {getPositionText(opp.clientPosition)} | Oportunidade de subir para o top 3</>
                    )}
                    {opp.category === "defend" && (
                      <>Você: {getPositionText(opp.clientPosition)} | Concorrente: {getPositionText(opp.competitorPosition)}</>
                    )}
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  {actionText}
                </Button>
              </div>
            ))}
            {opportunities.length > 5 && (
              <p className="text-sm text-muted-foreground text-center">
                +{opportunities.length - 5} mais oportunidades...
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{emptyText}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Análise Estratégica de Oportunidades</h2>
        <p className="text-muted-foreground">
          Oportunidades categorizadas por prioridade e facilidade de implementação
        </p>
      </div>

      <Tabs defaultValue="lost" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lost" className="gap-2">
            <Target className="h-4 w-4" />
            Keywords Perdidas
          </TabsTrigger>
          <TabsTrigger value="easy" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Melhorias Fáceis
          </TabsTrigger>
          <TabsTrigger value="defend" className="gap-2">
            <Shield className="h-4 w-4" />
            Defender Posições
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lost">
          <OpportunityCard
            opportunities={lostKeywords}
            icon={<Target className="h-5 w-5 text-destructive" />}
            title="Keywords Perdidas"
            description="Palavras-chave onde o concorrente ranqueia bem e você não aparece"
            actionText="Criar Conteúdo"
            emptyText="Parabéns! Você não está perdendo nenhuma keyword importante para este concorrente."
          />
        </TabsContent>

        <TabsContent value="easy">
          <OpportunityCard
            opportunities={easyWins}
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
            title="Melhorias Fáceis"
            description="Palavras-chave onde você já está próximo do topo (posições 4-15)"
            actionText="Otimizar Página"
            emptyText="Você já está bem posicionado! Não há melhorias fáceis identificadas no momento."
          />
        </TabsContent>

        <TabsContent value="defend">
          <OpportunityCard
            opportunities={defendPositions}
            icon={<Shield className="h-5 w-5 text-accent" />}
            title="Defender Posições"
            description="Suas posições de liderança que precisam ser protegidas da concorrência"
            actionText="Fortalecer"
            emptyText="Suas posições estão seguras! Nenhuma ameaça iminente foi detectada."
          />
        </TabsContent>
      </Tabs>

      {/* Resumo Executivo */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Resumo Executivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive mb-1">{lostKeywords.length}</div>
              <p className="text-sm text-muted-foreground">Keywords a conquistar</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">{easyWins.length}</div>
              <p className="text-sm text-muted-foreground">Melhorias rápidas</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent mb-1">{defendPositions.length}</div>
              <p className="text-sm text-muted-foreground">Posições a defender</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OpportunityCategories;