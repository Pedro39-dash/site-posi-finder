import { supabase } from "@/integrations/supabase/client";

export interface CompetitorAnalysis {
  id: string;
  user_id: string;
  audit_report_id: string;
  target_domain: string;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  total_keywords: number;
  total_competitors: number;
  overall_competitiveness_score: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  metadata?: { [key: string]: any };
}

export interface CompetitorDomain {
  id: string;
  analysis_id: string;
  domain: string;
  relevance_score: number;
  total_keywords_found: number;
  average_position: number;
  share_of_voice: number;
  detected_automatically: boolean;
  created_at: string;
  metadata?: { [key: string]: any };
}

export interface CompetitorKeyword {
  id: string;
  analysis_id: string;
  keyword: string;
  target_domain_position: number | null;
  competitor_positions: {
    domain: string;
    position: number;
    url: string;
    title: string;
  }[];
  search_volume?: number;
  competition_level: 'low' | 'medium' | 'high';
  created_at: string;
  metadata?: { [key: string]: any };
}

export interface KeywordOpportunity {
  id: string;
  analysis_id: string;
  keyword: string;
  opportunity_type: 'missing_keyword' | 'low_position' | 'competitor_advantage';
  target_position: number | null;
  best_competitor_position: number;
  best_competitor_domain: string;
  priority_score: number;
  gap_size: number;
  recommended_action: string;
  created_at: string;
  metadata?: { [key: string]: any };
}

export interface CompetitiveAnalysisData {
  analysis: CompetitorAnalysis;
  competitors: CompetitorDomain[];
  keywords: CompetitorKeyword[];
  opportunities: KeywordOpportunity[];
}

export class CompetitorAnalysisService {
  
  static async startAnalysis(
    auditReportId: string, 
    targetDomain: string, 
    additionalCompetitors: string[] = []
  ): Promise<{ success: boolean; analysisId?: string; error?: string }> {
    try {
      console.log(`🚀 Starting competitive analysis for: ${targetDomain}`);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('❌ User not authenticated');
        return { success: false, error: 'User not authenticated' };
      }

      console.log(`👤 User authenticated: ${user.id}`);

      const { data, error } = await supabase.functions.invoke('competitor-analysis', {
        body: {
          auditReportId,
          targetDomain,
          userId: user.id,
          additionalCompetitors
        }
      });

      if (error) {
        console.error('❌ Error invoking competitor-analysis function:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Competitive analysis started successfully:', data);
      return { success: true, analysisId: data.analysisId };
    } catch (error) {
      console.error('❌ Unexpected error in startAnalysis:', error);
      return { success: false, error: 'Failed to start competitive analysis' };
    }
  }

  static async getAnalysisStatus(analysisId: string): Promise<{ success: boolean; analysis?: CompetitorAnalysis; error?: string }> {
    try {
      const { data: analysis, error } = await supabase
        .from('competitor_analyses')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (error) {
        console.error('Error fetching analysis:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        analysis: analysis as CompetitorAnalysis
      };
    } catch (error) {
      console.error('Error in getAnalysisStatus:', error);
      return { success: false, error: 'Failed to get analysis status' };
    }
  }

  static async getAnalysisData(analysisId: string): Promise<{ success: boolean; data?: CompetitiveAnalysisData; error?: string }> {
    try {
      // Get main analysis
      const { data: analysis, error: analysisError } = await supabase
        .from('competitor_analyses')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (analysisError) {
        console.error('Error fetching analysis:', analysisError);
        return { success: false, error: analysisError.message };
      }

      // Get competitors
      const { data: competitors, error: competitorsError } = await supabase
        .from('competitor_domains')
        .select('*')
        .eq('analysis_id', analysisId)
        .order('relevance_score', { ascending: false });

      if (competitorsError) {
        console.error('Error fetching competitors:', competitorsError);
        return { success: false, error: competitorsError.message };
      }

      // Get keywords
      const { data: keywords, error: keywordsError } = await supabase
        .from('competitor_keywords')
        .select('*')
        .eq('analysis_id', analysisId)
        .order('created_at', { ascending: false });

      if (keywordsError) {
        console.error('Error fetching keywords:', keywordsError);
        return { success: false, error: keywordsError.message };
      }

      // Get opportunities
      const { data: opportunities, error: opportunitiesError } = await supabase
        .from('keyword_opportunities')
        .select('*')
        .eq('analysis_id', analysisId)
        .order('priority_score', { ascending: false });

      if (opportunitiesError) {
        console.error('Error fetching opportunities:', opportunitiesError);
        return { success: false, error: opportunitiesError.message };
      }

      return {
        success: true,
        data: {
          analysis: analysis as CompetitorAnalysis,
          competitors: (competitors || []) as CompetitorDomain[],
          keywords: (keywords || []) as CompetitorKeyword[],
          opportunities: (opportunities || []) as KeywordOpportunity[]
        }
      };
    } catch (error) {
      console.error('Error in getAnalysisData:', error);
      return { success: false, error: 'Failed to get analysis data' };
    }
  }

  static async getUserAnalyses(limit: number = 10): Promise<{ success: boolean; analyses?: CompetitorAnalysis[]; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: analyses, error } = await supabase
        .from('competitor_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user analyses:', error);
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        analyses: (analyses || []) as CompetitorAnalysis[]
      };
    } catch (error) {
      console.error('Error in getUserAnalyses:', error);
      return { success: false, error: 'Failed to get user analyses' };
    }
  }

  static async deleteAnalysis(analysisId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('competitor_analyses')
        .delete()
        .eq('id', analysisId);

      if (error) {
        console.error('Error deleting analysis:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteAnalysis:', error);
      return { success: false, error: 'Failed to delete analysis' };
    }
  }

  // Helper method to format domain name
  static formatDomainName(domain: string): string {
    return domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }

  // Helper method to get position badge variant
  static getPositionBadgeVariant(position: number | null): "default" | "secondary" | "outline" {
    if (!position) return "secondary";
    if (position <= 3) return "default";
    if (position <= 10) return "secondary";
    return "outline";
  }

  // Helper method to get position text
  static getPositionText(position: number | null): string {
    return position ? `${position}ª` : "Não encontrado";
  }

  // Helper method to get competition level color
  static getCompetitionLevelColor(level: 'low' | 'medium' | 'high'): string {
    switch (level) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  // Helper method to get opportunity type text
  static getOpportunityTypeText(type: string): string {
    switch (type) {
      case 'missing_keyword': return 'Palavra-chave ausente';
      case 'low_position': return 'Posição baixa';
      case 'competitor_advantage': return 'Vantagem do concorrente';
      default: return type;
    }
  }
}