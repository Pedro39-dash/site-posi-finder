import { supabase } from '@/integrations/supabase/client';

export interface CoreWebVital {
  value: number;
  status: 'good' | 'needs-improvement' | 'poor';
}

export interface OnPageData {
  title: string | null;
  titleLength: number;
  metaDescription: string | null;
  metaLength: number;
  h1Count: number;
  h2Count: number;
  h3Count: number;
  wordCount: number;
  imagesWithoutAlt: number;
  totalImages: number;
  internalLinks: number;
  externalLinks: number;
  hasSchema: boolean;
  hasOpenGraph: boolean;
  isMobileFriendly: boolean;
}

export interface DomainAnalysis {
  domain: string;
  performanceScore: number;
  seoScore: number;
  coreWebVitals: {
    lcp: CoreWebVital;
    fid: CoreWebVital;
    cls: CoreWebVital;
  };
  onPage: OnPageData;
  estimatedDA: number;
  pageSize: number;
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  title: string;
  impact: string;
  gap: string;
}

export interface DeepAnalysisData {
  analysis_id: string;
  target: DomainAnalysis;
  competitors: DomainAnalysis[];
  competitorAverages: {
    performanceScore: number;
    seoScore: number;
    wordCount: number;
    pageSize: number;
    hasSchema: number;
    estimatedDA: number;
  };
  recommendations: Recommendation[];
  analyzedAt: string;
}

export class DeepAnalysisService {
  static async startDeepAnalysis(
    analysisId: string,
    targetDomain: string,
    competitorDomains: string[]
  ): Promise<{ success: boolean; data?: DeepAnalysisData; error?: string }> {
    try {
      console.log('🔍 Starting deep SEO analysis...', { analysisId, targetDomain, competitorCount: competitorDomains.length });

      const { data, error } = await supabase.functions.invoke('deep-seo-analysis', {
        body: {
          analysis_id: analysisId,
          target_domain: targetDomain,
          competitor_domains: competitorDomains
        }
      });

      if (error) {
        console.error('❌ Deep analysis error:', error);
        return { success: false, error: error.message };
      }

      if (!data?.success) {
        return { success: false, error: data?.error || 'Analysis failed' };
      }

      console.log('✅ Deep analysis completed:', data.data);
      return { success: true, data: data.data };
    } catch (error) {
      console.error('❌ Deep analysis exception:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}
