import { supabase } from "@/integrations/supabase/client";

export interface KeywordAnalysisData {
  keyword: string;
  currentPosition: number;
  bestPosition: number;
  worstPosition: number;
  averagePosition: number;
  estimatedSearchVolume: number;
  estimatedTraffic: number;
  estimatedCTR: number;
  url: string;
  device: string;
  location: string;
}

export interface CompetitorPosition {
  domain: string;
  position: number;
  url: string;
  title?: string;
}

export interface RelatedKeyword {
  keyword: string;
  searchVolume?: number;
  difficulty?: number;
  relevanceScore: number;
}

export interface OptimizationSuggestion {
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  actionable: boolean;
}

export interface SignificantChange {
  date: string;
  oldPosition: number;
  newPosition: number;
  change: number;
  reason?: string;
}

export class KeywordAnalysisService {
  private estimateTrafficFromPosition(position: number, searchVolume: number = 1000): number {
    const ctrByPosition: Record<number, number> = {
      1: 0.28, 2: 0.15, 3: 0.11, 4: 0.08, 5: 0.07,
      6: 0.05, 7: 0.04, 8: 0.03, 9: 0.03, 10: 0.02
    };
    const ctr = ctrByPosition[position] || (position <= 20 ? 0.01 : 0.005);
    return Math.round(searchVolume * ctr);
  }

  private estimateCTR(position: number): number {
    const ctrByPosition: Record<number, number> = {
      1: 28, 2: 15, 3: 11, 4: 8, 5: 7,
      6: 5, 7: 4, 8: 3, 9: 3, 10: 2
    };
    return ctrByPosition[position] || (position <= 20 ? 1 : 0.5);
  }

  async getKeywordAnalysis(keywordRankingId: string): Promise<KeywordAnalysisData | null> {
    const { data: ranking, error } = await supabase
      .from('keyword_rankings')
      .select('*')
      .eq('id', keywordRankingId)
      .single();

    if (error || !ranking) return null;

    // Get historical data for best/worst/average
    const { data: history } = await supabase
      .from('ranking_history')
      .select('position')
      .eq('keyword_ranking_id', keywordRankingId)
      .order('recorded_at', { ascending: false })
      .limit(90);

    const positions = history?.map(h => h.position) || [ranking.current_position];
    const bestPosition = Math.min(...positions);
    const worstPosition = Math.max(...positions);
    const averagePosition = positions.reduce((a, b) => a + b, 0) / positions.length;

    const estimatedSearchVolume = 1000; // Mock - poderia vir de API externa
    const currentPos = ranking.current_position || 100;

    return {
      keyword: ranking.keyword,
      currentPosition: currentPos,
      bestPosition,
      worstPosition,
      averagePosition: Math.round(averagePosition * 10) / 10,
      estimatedSearchVolume,
      estimatedTraffic: this.estimateTrafficFromPosition(currentPos, estimatedSearchVolume),
      estimatedCTR: this.estimateCTR(currentPos),
      url: ranking.url || '',
      device: ranking.device || 'desktop',
      location: ranking.location || 'brazil'
    };
  }

  async getCompetitorPositions(keyword: string, projectId: string): Promise<CompetitorPosition[]> {
    // Simulated competitor data - em produção viria de scraping/API
    const mockCompetitors: CompetitorPosition[] = [
      { domain: 'competitor1.com', position: 3, url: 'https://competitor1.com/page' },
      { domain: 'competitor2.com', position: 5, url: 'https://competitor2.com/article' },
      { domain: 'competitor3.com', position: 8, url: 'https://competitor3.com/blog' }
    ];
    
    return mockCompetitors;
  }

  async getRelatedKeywords(keyword: string): Promise<RelatedKeyword[]> {
    // Simulated related keywords - em produção viria de API de keywords
    const words = keyword.split(' ');
    const mockRelated: RelatedKeyword[] = [
      { keyword: `${keyword} gratis`, searchVolume: 800, difficulty: 40, relevanceScore: 90 },
      { keyword: `${keyword} online`, searchVolume: 1200, difficulty: 55, relevanceScore: 85 },
      { keyword: `melhor ${keyword}`, searchVolume: 600, difficulty: 45, relevanceScore: 80 },
      { keyword: `como ${keyword}`, searchVolume: 900, difficulty: 35, relevanceScore: 75 },
      { keyword: `${words[0]} ${words[1] || 'premium'}`, searchVolume: 500, difficulty: 50, relevanceScore: 70 }
    ];
    
    return mockRelated.slice(0, 5);
  }

  async getOptimizationSuggestions(keywordRankingId: string): Promise<OptimizationSuggestion[]> {
    const analysis = await this.getKeywordAnalysis(keywordRankingId);
    if (!analysis) return [];

    const suggestions: OptimizationSuggestion[] = [];

    // Baseado na posição atual
    if (analysis.currentPosition > 10) {
      suggestions.push({
        priority: 'high',
        category: 'Conteúdo',
        title: 'Otimizar conteúdo da página',
        description: 'Palavra-chave fora do Top 10. Revise o conteúdo para melhor alinhamento com a intenção de busca.',
        actionable: true
      });
    } else if (analysis.currentPosition > 3) {
      suggestions.push({
        priority: 'high',
        category: 'Quick Win',
        title: 'Oportunidade de Quick Win',
        description: 'Palavra-chave próxima ao Top 3. Pequenas otimizações podem trazer grandes resultados.',
        actionable: true
      });
    }

    // Sugestões técnicas
    suggestions.push({
      priority: 'medium',
      category: 'Técnico',
      title: 'Verificar velocidade da página',
      description: 'Core Web Vitals afetam o ranking. Teste a velocidade no PageSpeed Insights.',
      actionable: true
    });

    suggestions.push({
      priority: 'medium',
      category: 'Link Building',
      title: 'Aumentar autoridade da página',
      description: 'Construa backlinks de qualidade para esta página específica.',
      actionable: true
    });

    // Se está caindo
    if (analysis.currentPosition > analysis.bestPosition + 5) {
      suggestions.push({
        priority: 'high',
        category: 'Urgente',
        title: 'Reverter queda de posição',
        description: `Palavra-chave caiu ${analysis.currentPosition - analysis.bestPosition} posições desde seu melhor desempenho.`,
        actionable: true
      });
    }

    return suggestions;
  }

  async getSignificantChanges(keywordRankingId: string, days: number = 30): Promise<SignificantChange[]> {
    const { data: history, error } = await supabase
      .from('ranking_history')
      .select('*')
      .eq('keyword_ranking_id', keywordRankingId)
      .gte('recorded_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('recorded_at', { ascending: false });

    if (error || !history) return [];

    const changes: SignificantChange[] = [];
    
    for (let i = 0; i < history.length - 1; i++) {
      const current = history[i];
      const previous = history[i + 1];
      const change = current.position - previous.position;

      // Apenas mudanças significativas (>= 5 posições)
      if (Math.abs(change) >= 5) {
        changes.push({
          date: new Date(current.recorded_at).toLocaleDateString('pt-BR'),
          oldPosition: previous.position,
          newPosition: current.position,
          change: change,
          reason: Math.abs(change) >= 10 ? 'Mudança significativa detectada' : undefined
        });
      }
    }

    return changes;
  }

  async getHistoricalData(keywordRankingId: string, days: number = 90): Promise<{ date: string; position: number }[]> {
    const { data, error } = await supabase
      .from('ranking_history')
      .select('position, recorded_at')
      .eq('keyword_ranking_id', keywordRankingId)
      .gte('recorded_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('recorded_at', { ascending: true });

    if (error || !data) return [];

    return data.map(item => ({
      date: new Date(item.recorded_at).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
      position: item.position
    }));
  }
}

export const keywordAnalysisService = new KeywordAnalysisService();
