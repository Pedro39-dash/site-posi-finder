import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckRankingsRequest {
  project_id: string;
  keyword_ids?: string[];
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
    
    const { project_id, keyword_ids } = await req.json() as CheckRankingsRequest;

    console.log(`[check-rankings] Starting check for project ${project_id}`);

    // Fetch project details
    const { data: project } = await supabase
      .from('projects')
      .select('domain')
      .eq('id', project_id)
      .single();

    if (!project) {
      throw new Error('Project not found');
    }

    // Fetch keywords to check
    let query = supabase
      .from('keyword_rankings')
      .select('*')
      .eq('project_id', project_id);

    if (keyword_ids && keyword_ids.length > 0) {
      query = query.in('id', keyword_ids);
    }

    const { data: keywords, error: keywordsError } = await query;

    if (keywordsError) throw keywordsError;
    if (!keywords || keywords.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No keywords to check', updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[check-rankings] Checking ${keywords.length} keywords`);

    let updatedCount = 0;
    let notificationsCount = 0;
    const notifications = [];

    for (const kw of keywords) {
      try {
        // Call SerpAPI
        const serpUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(kw.keyword)}&location=${kw.location || 'Brazil'}&api_key=${SERPAPI_KEY}&num=100`;
        
        const response = await fetch(serpUrl);
        const serpData = await response.json();

        let newPosition: number | null = null;
        let newUrl: string | null = null;

        // Find position of target domain in organic results
        if (serpData.organic_results) {
          const targetDomain = project.domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
          
          for (let i = 0; i < serpData.organic_results.length; i++) {
            const result = serpData.organic_results[i];
            const resultDomain = result.link?.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
            
            if (resultDomain?.includes(targetDomain) || targetDomain?.includes(resultDomain)) {
              newPosition = i + 1;
              newUrl = result.link;
              break;
            }
          }
        }

        // Update keyword_rankings
        const { error: updateError } = await supabase
          .from('keyword_rankings')
          .update({
            previous_position: kw.current_position,
            current_position: newPosition,
            url: newUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', kw.id);

        if (updateError) {
          console.error(`Error updating keyword ${kw.keyword}:`, updateError);
          continue;
        }

        updatedCount++;

        // Create ranking history entry
        if (newPosition !== null) {
          const changeFromPrevious = kw.current_position ? newPosition - kw.current_position : 0;
          
          await supabase
            .from('ranking_history')
            .insert({
              keyword_ranking_id: kw.id,
              position: newPosition,
              change_from_previous: changeFromPrevious,
              recorded_at: new Date().toISOString()
            });

          // Check if we need to create a notification (change >= 5 positions)
          if (Math.abs(changeFromPrevious) >= 5) {
            const notification = {
              user_id: (await supabase.from('projects').select('user_id').eq('id', project_id).single()).data?.user_id,
              project_id: project_id,
              type: changeFromPrevious > 0 ? 'ranking_drop' : 'ranking_improvement',
              title: changeFromPrevious > 0 
                ? `Queda no Ranking: ${kw.keyword}`
                : `Melhoria no Ranking: ${kw.keyword}`,
              message: `A keyword "${kw.keyword}" ${changeFromPrevious > 0 ? 'caiu' : 'subiu'} ${Math.abs(changeFromPrevious)} posições (${kw.current_position || 'N/A'} → ${newPosition})`,
              priority: Math.abs(changeFromPrevious) >= 10 ? 'high' : 'medium',
              metadata: {
                keyword: kw.keyword,
                previous_position: kw.current_position,
                new_position: newPosition,
                change: changeFromPrevious
              }
            };
            
            notifications.push(notification);
          }
        }

        // Respect rate limits: 3 req/s = ~350ms delay
        await new Promise(resolve => setTimeout(resolve, 350));

      } catch (error) {
        console.error(`Error checking keyword "${kw.keyword}":`, error);
      }
    }

    // Insert notifications
    if (notifications.length > 0) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);
      
      if (!notifError) {
        notificationsCount = notifications.length;
      }
    }

    console.log(`[check-rankings] Updated ${updatedCount} keywords, created ${notificationsCount} notifications`);

    return new Response(
      JSON.stringify({
        success: true,
        updated: updatedCount,
        notifications: notificationsCount,
        message: `${updatedCount} keywords atualizadas, ${notificationsCount} notificações criadas`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[check-rankings] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
