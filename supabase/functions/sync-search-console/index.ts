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
    const { projectId } = await req.json();

    console.log('Starting GSC sync for project:', projectId);

    // Get integration
    const { data: integration, error: intError } = await supabase
      .from('project_integrations')
      .select('*')
      .eq('project_id', projectId)
      .eq('integration_type', 'search_console')
      .single();

    if (intError || !integration) {
      throw new Error('Search Console integration not found');
    }

    // Check if token needs refresh
    const now = new Date();
    const expiresAt = new Date(integration.token_expires_at);
    
    if (now >= expiresAt) {
      console.log('Token expired, refreshing...');
      // Refresh token via google-oauth function
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/google-oauth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('Authorization')!,
        },
        body: JSON.stringify({ integrationId: integration.id }),
      });

      // Fetch updated integration
      const { data: updated } = await supabase
        .from('project_integrations')
        .select('*')
        .eq('id', integration.id)
        .single();
      
      if (updated) {
        integration.access_token = updated.access_token;
      }
    }

    // Get project keywords
    const { data: keywords, error: keywordsError } = await supabase
      .from('keyword_rankings')
      .select('id, keyword')
      .eq('project_id', projectId);

    if (keywordsError) throw keywordsError;

    if (!keywords || keywords.length === 0) {
      throw new Error('No keywords found for project');
    }

    console.log(`Found ${keywords.length} keywords to sync`);

    // Fetch data from GSC for each keyword (16 months for historical data)
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 480 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const updates = [];

    for (const kw of keywords) {
      try {
        const gscResponse = await fetch(
          `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(integration.property_id)}/searchAnalytics/query`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${integration.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              startDate,
              endDate,
              dimensions: ['query', 'page', 'date'],
              dimensionFilterGroups: [{
                filters: [{
                  dimension: 'query',
                  operator: 'equals',
                  expression: kw.keyword,
                }],
              }],
              rowLimit: 500,
            }),
          }
        );

        if (!gscResponse.ok) {
          console.error(`GSC API error for keyword "${kw.keyword}":`, await gscResponse.text());
          continue;
        }

        const gscData = await gscResponse.json();
        
        if (gscData.rows && gscData.rows.length > 0) {
          // Update current position with most recent data
          const latestRow = gscData.rows[gscData.rows.length - 1];
          updates.push({
            id: kw.id,
            current_position: Math.round(latestRow.position),
            impressions: latestRow.impressions,
            clicks: latestRow.clicks,
            ctr: latestRow.ctr,
            url: latestRow.keys[1],
            data_source: 'search_console',
          });

          // Insert historical data into ranking_history
          const historyEntries = gscData.rows.map((row: any, index: number) => ({
            keyword_ranking_id: kw.id,
            position: Math.round(row.position),
            recorded_at: row.keys[2], // date dimension
            change_from_previous: index > 0 ? Math.round(row.position) - Math.round(gscData.rows[index - 1].position) : 0,
            metadata: {
              impressions: row.impressions,
              clicks: row.clicks,
              ctr: row.ctr,
              data_source: 'search_console'
            }
          }));

          // Insert history entries in batch
          for (const entry of historyEntries) {
            const { error } = await supabase
              .from('ranking_history')
              .upsert(entry, { 
                ignoreDuplicates: true 
              });
            
            if (error) {
              console.error(`Failed to insert history for ${entry.recorded_at}:`, error);
            }
          }

          console.log(`Processed ${historyEntries.length} historical records for "${kw.keyword}"`);
        }
      } catch (error) {
        console.error(`Error fetching GSC data for "${kw.keyword}":`, error);
      }
    }

    // Bulk update keywords
    if (updates.length > 0) {
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('keyword_rankings')
          .update(update)
          .eq('id', update.id);

        if (updateError) {
          console.error('Error updating keyword:', updateError);
        }
      }
    }

    // Update last_sync_at
    await supabase
      .from('project_integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', integration.id);

    console.log(`GSC sync completed. Updated ${updates.length} keywords.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        synced: updates.length,
        total: keywords.length 
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in sync-search-console:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
