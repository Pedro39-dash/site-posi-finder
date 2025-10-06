import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MonitoringRequest {
  config_id: string;
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

    const { config_id } = await req.json() as MonitoringRequest;
    const startTime = Date.now();

    const { data: config } = await supabase
      .from('monitoring_configs')
      .select('*, projects(domain, user_id)')
      .eq('id', config_id)
      .eq('is_active', true)
      .single();

    if (!config) {
      return new Response(
        JSON.stringify({ error: 'Config not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: keywords } = await supabase
      .from('keyword_rankings')
      .select('*')
      .eq('project_id', config.project_id);

    const results = { keywords_checked: 0, notifications: [] as any[] };
    const projectDomain = config.projects.domain.replace(/^https?:\/\//, '').replace(/^www\./, '');

    for (const keyword of keywords || []) {
      try {
        const serpUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(keyword.keyword)}&location=${keyword.location || 'Brazil'}&api_key=${SERPAPI_KEY}&num=100`;
        const response = await fetch(serpUrl);
        const serpData = await response.json();

        let newPosition: number | null = null;
        let newUrl: string | null = null;

        if (serpData.organic_results) {
          for (let i = 0; i < serpData.organic_results.length; i++) {
            const result = serpData.organic_results[i];
            const resultDomain = result.link?.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
            
            if (resultDomain?.includes(projectDomain) || projectDomain?.includes(resultDomain)) {
              newPosition = i + 1;
              newUrl = result.link;
              break;
            }
          }
        }

        const positionChange = newPosition && keyword.current_position 
          ? newPosition - keyword.current_position 
          : 0;

        await supabase
          .from('keyword_rankings')
          .update({
            previous_position: keyword.current_position,
            current_position: newPosition,
            url: newUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', keyword.id);

        if (newPosition !== null) {
          await supabase
            .from('ranking_history')
            .insert({
              keyword_ranking_id: keyword.id,
              position: newPosition,
              change_from_previous: positionChange
            });
        }

        if (Math.abs(positionChange) >= 5) {
          results.notifications.push({
            user_id: config.projects.user_id,
            project_id: config.project_id,
            type: positionChange > 0 ? 'ranking_drop' : 'ranking_improvement',
            title: `${positionChange > 0 ? 'Queda' : 'Melhoria'}: ${keyword.keyword}`,
            message: `A keyword "${keyword.keyword}" ${positionChange > 0 ? 'caiu' : 'subiu'} ${Math.abs(positionChange)} posições`,
            priority: Math.abs(positionChange) >= 10 ? 'high' : 'medium'
          });
        }

        results.keywords_checked++;
        await new Promise(resolve => setTimeout(resolve, 350));

      } catch (error) {
        console.error(`Error checking keyword "${keyword.keyword}":`, error);
        results.keywords_checked++;
      }
    }

    if (results.notifications.length > 0) {
      await supabase.from('notifications').insert(results.notifications);
    }

    await supabase.from('monitoring_logs').insert({
      config_id,
      execution_type: config.monitoring_type,
      status: 'success',
      results,
      execution_time_ms: Date.now() - startTime
    });

    await supabase
      .from('monitoring_configs')
      .update({ last_run_at: new Date().toISOString() })
      .eq('id', config_id);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
