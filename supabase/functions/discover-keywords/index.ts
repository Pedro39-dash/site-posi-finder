import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiscoverKeywordsRequest {
  project_id: string;
  sources?: Array<'competitors' | 'related' | 'semantic' | 'gap'>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const SERPAPI_KEY = Deno.env.get('SERPAPI_KEY')!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { project_id, sources = ['competitors', 'related', 'semantic', 'gap'] } = await req.json() as DiscoverKeywordsRequest;

    console.log(`[discover-keywords] Starting discovery for project ${project_id}`);

    // Fetch project details
    const { data: project } = await supabase
      .from('projects')
      .select('domain, focus_keywords, competitor_domains')
      .eq('id', project_id)
      .single();

    if (!project) {
      throw new Error('Project not found');
    }

    // Fetch existing keywords
    const { data: existingKeywords } = await supabase
      .from('keyword_rankings')
      .select('keyword')
      .eq('project_id', project_id);

    const existingKeywordSet = new Set(existingKeywords?.map(k => k.keyword.toLowerCase()) || []);
    const suggestions = [];

    // 1. COMPETITOR ANALYSIS
    if (sources.includes('competitors') && project.competitor_domains) {
      console.log('[discover-keywords] Analyzing competitors...');
      
      for (const competitorDomain of project.competitor_domains.slice(0, 3)) {
        try {
          // Get top pages from competitor
          const serpUrl = `https://serpapi.com/search.json?engine=google&q=site:${competitorDomain}&api_key=${SERPAPI_KEY}&num=20`;
          const response = await fetch(serpUrl);
          const serpData = await response.json();

          if (serpData.organic_results) {
            for (const result of serpData.organic_results) {
              // Extract keywords from title and snippet
              const text = `${result.title} ${result.snippet}`.toLowerCase();
              const words = text.match(/\b[\w\u00C0-\u024F]+(?:\s+[\w\u00C0-\u024F]+){0,2}\b/g) || [];
              
              for (const word of words) {
                if (word.length > 5 && !existingKeywordSet.has(word)) {
                  suggestions.push({
                    project_id,
                    suggested_keyword: word,
                    source_type: 'competitor',
                    relevance_score: 70,
                    metadata: { competitor_domain: competitorDomain }
                  });
                }
              }
            }
          }

          await new Promise(resolve => setTimeout(resolve, 350));
        } catch (error) {
          console.error(`Error analyzing competitor ${competitorDomain}:`, error);
        }
      }
    }

    // 2. RELATED SEARCHES
    if (sources.includes('related') && project.focus_keywords) {
      console.log('[discover-keywords] Finding related searches...');
      
      for (const keyword of project.focus_keywords.slice(0, 5)) {
        try {
          const serpUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(keyword)}&api_key=${SERPAPI_KEY}`;
          const response = await fetch(serpUrl);
          const serpData = await response.json();

          // Related searches
          if (serpData.related_searches) {
            for (const related of serpData.related_searches) {
              const relatedKeyword = related.query.toLowerCase();
              if (!existingKeywordSet.has(relatedKeyword)) {
                suggestions.push({
                  project_id,
                  suggested_keyword: relatedKeyword,
                  source_type: 'related',
                  relevance_score: 85,
                  metadata: { base_keyword: keyword }
                });
              }
            }
          }

          // People also ask
          if (serpData.related_questions) {
            for (const question of serpData.related_questions) {
              const questionKeyword = question.question.toLowerCase();
              if (!existingKeywordSet.has(questionKeyword)) {
                suggestions.push({
                  project_id,
                  suggested_keyword: questionKeyword,
                  source_type: 'related',
                  relevance_score: 75,
                  metadata: { base_keyword: keyword, type: 'question' }
                });
              }
            }
          }

          await new Promise(resolve => setTimeout(resolve, 350));
        } catch (error) {
          console.error(`Error finding related for ${keyword}:`, error);
        }
      }
    }

    // 3. SEMANTIC VARIATIONS
    if (sources.includes('semantic') && project.focus_keywords) {
      console.log('[discover-keywords] Generating semantic variations...');
      
      const prefixes = ['como', 'melhor', 'onde', 'quando', 'porque', 'o que é', 'guia'];
      const suffixes = ['gratis', 'online', 'brasil', '2024', 'profissional', 'preço', 'curso'];
      
      for (const keyword of project.focus_keywords) {
        for (const prefix of prefixes) {
          const variation = `${prefix} ${keyword}`.toLowerCase();
          if (!existingKeywordSet.has(variation)) {
            suggestions.push({
              project_id,
              suggested_keyword: variation,
              source_type: 'semantic',
              relevance_score: 60,
              metadata: { base_keyword: keyword, variation_type: 'prefix' }
            });
          }
        }
        
        for (const suffix of suffixes) {
          const variation = `${keyword} ${suffix}`.toLowerCase();
          if (!existingKeywordSet.has(variation)) {
            suggestions.push({
              project_id,
              suggested_keyword: variation,
              source_type: 'semantic',
              relevance_score: 60,
              metadata: { base_keyword: keyword, variation_type: 'suffix' }
            });
          }
        }
      }
    }

    // 4. KEYWORD GAP ANALYSIS
    if (sources.includes('gap') && project.competitor_domains && project.focus_keywords) {
      console.log('[discover-keywords] Performing gap analysis...');
      
      // This would require checking which keywords competitors rank for that we don't
      // For now, we'll combine competitor + related data above
    }

    // Remove duplicates and limit
    const uniqueSuggestions = suggestions
      .filter((s, i, arr) => arr.findIndex(x => x.suggested_keyword === s.suggested_keyword) === i)
      .slice(0, 100);

    // Insert suggestions into database
    if (uniqueSuggestions.length > 0) {
      const { error: insertError } = await supabase
        .from('keyword_suggestions')
        .insert(uniqueSuggestions);

      if (insertError) {
        console.error('Error inserting suggestions:', insertError);
      }
    }

    console.log(`[discover-keywords] Created ${uniqueSuggestions.length} new suggestions`);

    return new Response(
      JSON.stringify({
        success: true,
        suggestions_created: uniqueSuggestions.length,
        message: `${uniqueSuggestions.length} novas sugestões de keywords criadas`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[discover-keywords] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
