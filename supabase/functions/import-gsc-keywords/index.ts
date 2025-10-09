import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { projectId, limit = 100, period = '28d' } = await req.json();

    console.log(`[import-gsc-keywords] Starting for project: ${projectId}`);

    // Get integration
    const { data: integration, error: intError } = await supabase
      .from('project_integrations')
      .select('*')
      .eq('project_id', projectId)
      .eq('integration_type', 'search_console')
      .eq('is_active', true)
      .single();

    if (intError || !integration) {
      throw new Error('Search Console integration not found');
    }

    // Check if token needs refresh
    let accessToken = integration.access_token;
    
    if (integration.token_expires_at) {
      const expiresAt = new Date(integration.token_expires_at);
      if (expiresAt <= new Date()) {
        console.log('[import-gsc-keywords] Refreshing expired token...');
        
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
            client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
            refresh_token: integration.refresh_token,
            grant_type: 'refresh_token',
          }),
        });

        if (!refreshResponse.ok) {
          throw new Error('Failed to refresh access token');
        }

        const refreshData = await refreshResponse.json();
        accessToken = refreshData.access_token;

        await supabase
          .from('project_integrations')
          .update({
            access_token: refreshData.access_token,
            token_expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
          })
          .eq('id', integration.id);
      }
    }

    // Get existing keywords to exclude
    const { data: existingKeywords } = await supabase
      .from('keyword_rankings')
      .select('keyword')
      .eq('project_id', projectId);

    const existingKeywordSet = new Set(
      existingKeywords?.map(k => k.keyword.toLowerCase()) || []
    );

    // Calculate date range based on period
    const periodToDays = (p: string): number => {
      const map: Record<string, number> = {
        '24h': 1, '7d': 7, '28d': 28, '90d': 90,
        '180d': 180, '365d': 365, '16m': 480
      };
      return map[p] || 28;
    };
    
    const days = periodToDays(period);
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    const gscResponse = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(integration.property_id)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions: ['query'],
          rowLimit: limit,
        }),
      }
    );

    if (!gscResponse.ok) {
      const errorText = await gscResponse.text();
      throw new Error(`GSC API error: ${errorText}`);
    }

    const gscData = await gscResponse.json();

    // Filter keywords that already exist
    const newKeywords = (gscData.rows || [])
      .filter((row: any) => !existingKeywordSet.has(row.keys[0].toLowerCase()))
      .map((row: any) => ({
        keyword: row.keys[0],
        position: Math.round(row.position),
        impressions: row.impressions,
        clicks: row.clicks,
        ctr: row.ctr,
      }))
      .sort((a, b) => b.impressions - a.impressions);

    console.log(`[import-gsc-keywords] Found ${newKeywords.length} new keywords`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        keywords: newKeywords,
        excluded: existingKeywords?.length || 0
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[import-gsc-keywords] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
