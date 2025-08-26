import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchResult {
  title: string;
  link: string;
  displayLink: string;
  snippet: string;
}

interface GoogleSearchResponse {
  items?: SearchResult[];
}

interface CompetitorPosition {
  domain: string;
  position: number;
  url: string;
  title: string;
}

interface KeywordAnalysis {
  keyword: string;
  target_domain_position: number | null;
  competitor_positions: CompetitorPosition[];
  search_volume?: number;
  competition_level: 'low' | 'medium' | 'high';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { auditReportId, targetDomain, userId, additionalCompetitors = [] } = await req.json();

    console.log(`🚀 Starting competitive analysis for: ${targetDomain}, Audit: ${auditReportId}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create initial competitive analysis entry
    const { data: analysisData, error: analysisError } = await supabase
      .from('competitor_analyses')
      .insert({
        user_id: userId,
        audit_report_id: auditReportId,
        target_domain: targetDomain,
        status: 'analyzing'
      })
      .select()
      .single();

    if (analysisError) {
      console.error('❌ Error creating analysis:', analysisError);
      return new Response(JSON.stringify({ error: 'Failed to create analysis' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Created analysis with ID: ${analysisData.id}`);

    // Start background analysis
    performCompetitiveAnalysis(supabase, analysisData.id, auditReportId, targetDomain, additionalCompetitors);

    return new Response(JSON.stringify({ 
      success: true, 
      analysisId: analysisData.id,
      message: 'Competitive analysis started'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in competitor-analysis function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function performCompetitiveAnalysis(
  supabase: any,
  analysisId: string,
  auditReportId: string,
  targetDomain: string,
  additionalCompetitors: string[]
) {
  try {
    console.log(`🔍 Starting analysis for ${targetDomain}`);

    // Get keywords from the audit report
    const keywords = await extractKeywordsFromAudit(supabase, auditReportId);
    console.log(`📝 Extracted ${keywords.length} keywords from audit`);

    // Perform search analysis for each keyword
    const keywordAnalyses: KeywordAnalysis[] = [];
    const competitorDomains = new Set<string>();

    // Limit to top 20 keywords to avoid API limits
    const topKeywords = keywords.slice(0, 20);

    for (const keyword of topKeywords) {
      console.log(`🔍 Analyzing keyword: "${keyword}"`);
      
      try {
        const analysis = await analyzeKeywordPositions(keyword, targetDomain);
        keywordAnalyses.push(analysis);

        // Collect competitor domains
        analysis.competitor_positions.forEach(pos => {
          if (pos.domain !== targetDomain) {
            competitorDomains.add(pos.domain);
          }
        });

        // Add delay to respect API limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.warn(`⚠️ Failed to analyze keyword "${keyword}":`, error.message);
      }
    }

    // Add manually specified competitors
    additionalCompetitors.forEach(domain => competitorDomains.add(domain));

    // Analyze and rank competitors
    const competitorAnalysis = analyzeCompetitors(Array.from(competitorDomains), keywordAnalyses);
    
    // Save competitor domains
    for (const competitor of competitorAnalysis) {
      await supabase
        .from('competitor_domains')
        .insert({
          analysis_id: analysisId,
          domain: competitor.domain,
          relevance_score: competitor.relevance_score,
          total_keywords_found: competitor.total_keywords_found,
          average_position: competitor.average_position,
          share_of_voice: competitor.share_of_voice,
          detected_automatically: !additionalCompetitors.includes(competitor.domain)
        });
    }

    // Save keyword analyses
    for (const keywordAnalysis of keywordAnalyses) {
      await supabase
        .from('competitor_keywords')
        .insert({
          analysis_id: analysisId,
          keyword: keywordAnalysis.keyword,
          target_domain_position: keywordAnalysis.target_domain_position,
          competitor_positions: keywordAnalysis.competitor_positions,
          search_volume: keywordAnalysis.search_volume,
          competition_level: keywordAnalysis.competition_level
        });
    }

    // Identify opportunities
    const opportunities = identifyOpportunities(keywordAnalyses, targetDomain);
    
    // Save opportunities
    for (const opportunity of opportunities) {
      await supabase
        .from('keyword_opportunities')
        .insert({
          analysis_id: analysisId,
          keyword: opportunity.keyword,
          opportunity_type: opportunity.opportunity_type,
          target_position: opportunity.target_position,
          best_competitor_position: opportunity.best_competitor_position,
          best_competitor_domain: opportunity.best_competitor_domain,
          priority_score: opportunity.priority_score,
          gap_size: opportunity.gap_size,
          recommended_action: opportunity.recommended_action
        });
    }

    // Calculate overall competitiveness score
    const overallScore = calculateOverallCompetitivenessScore(keywordAnalyses, targetDomain);

    // Update analysis status
    await supabase
      .from('competitor_analyses')
      .update({
        status: 'completed',
        total_keywords: keywordAnalyses.length,
        total_competitors: competitorDomains.size,
        overall_competitiveness_score: overallScore,
        completed_at: new Date().toISOString(),
        metadata: {
          keywords_analyzed: keywordAnalyses.length,
          competitors_found: competitorDomains.size,
          opportunities_identified: opportunities.length
        }
      })
      .eq('id', analysisId);

    console.log(`✅ Competitive analysis completed successfully for ${targetDomain}`);
    console.log(`📊 Final Results: ${overallScore}% competitiveness score from ${keywordAnalyses.length} keywords`);

  } catch (error) {
    console.error('❌ Error in performCompetitiveAnalysis:', error);
    
    // Update status to failed
    await supabase
      .from('competitor_analyses')
      .update({
        status: 'failed',
        metadata: { error: error.message }
      })
      .eq('id', analysisId);
  }
}

async function extractKeywordsFromAudit(supabase: any, auditReportId: string): Promise<string[]> {
  try {
    // First get the audit category ID
    const { data: categories, error: categoryError } = await supabase
      .from('audit_categories')
      .select('id')
      .eq('audit_report_id', auditReportId)
      .eq('category', 'ai_search_optimization');

    if (categoryError || !categories || categories.length === 0) {
      console.warn('Could not find audit category:', categoryError);
      return [];
    }

    const categoryId = categories[0].id;

    // Get keywords from audit issues metadata
    const { data: issues, error } = await supabase
      .from('audit_issues')
      .select('metadata')
      .eq('audit_category_id', categoryId);

    if (error) {
      console.warn('Could not fetch keywords from audit:', error);
      return [];
    }

    const keywords = new Set<string>();

    // Extract keywords from metadata
    issues?.forEach(issue => {
      if (issue.metadata?.keywords) {
        issue.metadata.keywords.forEach((keyword: string) => {
          if (keyword && keyword.length > 2) {
            keywords.add(keyword.toLowerCase().trim());
          }
        });
      }
    });

    return Array.from(keywords);
  } catch (error) {
    console.warn('Error extracting keywords from audit:', error);
    return [];
  }
}

async function analyzeKeywordPositions(keyword: string, targetDomain: string): Promise<KeywordAnalysis> {
  const apiKey = Deno.env.get('GOOGLE_CUSTOM_SEARCH_API_KEY');
  const cx = Deno.env.get('GOOGLE_CUSTOM_SEARCH_CX');

  if (!apiKey || !cx) {
    throw new Error('Google Custom Search API credentials not configured');
  }

  const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(keyword)}&num=10`;

  const response = await fetch(searchUrl);
  const data: GoogleSearchResponse = await response.json();

  if (!response.ok) {
    throw new Error(`Google Search API error: ${JSON.stringify(data)}`);
  }

  const competitorPositions: CompetitorPosition[] = [];
  let targetDomainPosition: number | null = null;

  data.items?.forEach((item, index) => {
    const domain = extractDomain(item.link);
    const position = index + 1;

    if (domain === targetDomain) {
      targetDomainPosition = position;
    }

    competitorPositions.push({
      domain,
      position,
      url: item.link,
      title: item.title
    });
  });

  // Estimate competition level based on results diversity
  const uniqueDomains = new Set(competitorPositions.map(p => p.domain));
  const competitionLevel: 'low' | 'medium' | 'high' = 
    uniqueDomains.size <= 3 ? 'high' : 
    uniqueDomains.size <= 6 ? 'medium' : 'low';

  return {
    keyword,
    target_domain_position: targetDomainPosition,
    competitor_positions: competitorPositions,
    competition_level: competitionLevel
  };
}

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function analyzeCompetitors(competitorDomains: string[], keywordAnalyses: KeywordAnalysis[]) {
  const competitorStats = new Map();

  // Initialize competitor stats
  competitorDomains.forEach(domain => {
    competitorStats.set(domain, {
      domain,
      total_keywords_found: 0,
      positions: [],
      relevance_score: 0
    });
  });

  // Analyze each keyword
  keywordAnalyses.forEach(analysis => {
    analysis.competitor_positions.forEach(pos => {
      if (competitorStats.has(pos.domain)) {
        const stats = competitorStats.get(pos.domain);
        stats.total_keywords_found++;
        stats.positions.push(pos.position);
      }
    });
  });

  // Calculate metrics for each competitor
  const competitors = Array.from(competitorStats.values()).map((stats: any) => {
    const averagePosition = stats.positions.length > 0 
      ? stats.positions.reduce((a: number, b: number) => a + b, 0) / stats.positions.length 
      : 100;

    const shareOfVoice = (stats.total_keywords_found / keywordAnalyses.length) * 100;
    
    // Relevance score based on keyword count and average position
    const relevanceScore = Math.round(
      (stats.total_keywords_found * 10) + (100 - averagePosition)
    );

    return {
      domain: stats.domain,
      total_keywords_found: stats.total_keywords_found,
      average_position: Math.round(averagePosition * 100) / 100,
      share_of_voice: Math.round(shareOfVoice * 100) / 100,
      relevance_score: Math.max(0, relevanceScore)
    };
  });

  // Sort by relevance score
  return competitors.sort((a, b) => b.relevance_score - a.relevance_score);
}

function identifyOpportunities(keywordAnalyses: KeywordAnalysis[], targetDomain: string) {
  const opportunities = [];

  keywordAnalyses.forEach(analysis => {
    const targetPosition = analysis.target_domain_position;
    const competitorPositions = analysis.competitor_positions.filter(p => p.domain !== targetDomain);
    
    if (competitorPositions.length === 0) return;

    const bestCompetitor = competitorPositions.reduce((best, current) => 
      current.position < best.position ? current : best
    );

    // Missing keyword opportunity
    if (!targetPosition) {
      opportunities.push({
        keyword: analysis.keyword,
        opportunity_type: 'missing_keyword',
        target_position: null,
        best_competitor_position: bestCompetitor.position,
        best_competitor_domain: bestCompetitor.domain,
        priority_score: 100 - bestCompetitor.position,
        gap_size: 100,
        recommended_action: `Create content targeting "${analysis.keyword}" to compete with ${bestCompetitor.domain}`
      });
      return;
    }

    // Low position opportunity
    if (targetPosition > bestCompetitor.position && targetPosition > 3) {
      const gap = targetPosition - bestCompetitor.position;
      opportunities.push({
        keyword: analysis.keyword,
        opportunity_type: 'low_position',
        target_position: targetPosition,
        best_competitor_position: bestCompetitor.position,
        best_competitor_domain: bestCompetitor.domain,
        priority_score: Math.max(0, 50 - bestCompetitor.position),
        gap_size: gap,
        recommended_action: `Improve content for "${analysis.keyword}" to move from position ${targetPosition} to compete with ${bestCompetitor.domain} at position ${bestCompetitor.position}`
      });
    }
  });

  // Sort by priority score
  return opportunities.sort((a, b) => b.priority_score - a.priority_score);
}

function calculateOverallCompetitivenessScore(keywordAnalyses: KeywordAnalysis[], targetDomain: string): number {
  if (keywordAnalyses.length === 0) return 0;

  let totalScore = 0;
  let scoredKeywords = 0;

  keywordAnalyses.forEach(analysis => {
    if (analysis.target_domain_position) {
      const position = analysis.target_domain_position;
      let score = 0;

      if (position === 1) score = 100;
      else if (position <= 3) score = 80;
      else if (position <= 5) score = 60;
      else if (position <= 10) score = 40;
      else score = 20;

      totalScore += score;
      scoredKeywords++;
    }
  });

  return scoredKeywords > 0 ? Math.round(totalScore / scoredKeywords) : 0;
}