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
    const { projectId, period = '28d' } = await req.json();

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

    // Get project keywords (excluir keywords manuais da sincronização GSC)
    const { data: keywords, error: keywordsError } = await supabase
      .from('keyword_rankings')
      .select('id, keyword, data_source, metadata')
      .eq('project_id', projectId)
      .neq('data_source', 'manual'); // Excluir keywords manuais

    if (keywordsError) throw keywordsError;

    // Log keywords manuais ignoradas
    const { data: manualKeywords } = await supabase
      .from('keyword_rankings')
      .select('keyword')
      .eq('project_id', projectId)
      .eq('data_source', 'manual');

    if (manualKeywords && manualKeywords.length > 0) {
      console.log(`ℹ️ Skipping ${manualKeywords.length} manual keywords:`, 
        manualKeywords.map(k => k.keyword).join(', '));
    }

    if (!keywords || keywords.length === 0) {
      console.log('No GSC keywords found for sync');
      return new Response(
        JSON.stringify({ 
          success: true, 
          synced: 0,
          inactive: 0,
          total: 0,
          message: 'No GSC keywords to sync'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Found ${keywords.length} GSC keywords to sync`);

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
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const updates = [];
    const inactiveKeywords = [];

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
          // Keyword TEM dados no período - marcar como ativa
          const latestRow = gscData.rows[gscData.rows.length - 1];
          const newPosition = Math.round(latestRow.position);
          
          // Buscar posição atual antes de atualizar para usar como previous_position
          const { data: currentRanking } = await supabase
            .from('keyword_rankings')
            .select('current_position')
            .eq('id', kw.id)
            .single();
          
          updates.push({
            id: kw.id,
            current_position: newPosition,
            previous_position: currentRanking?.current_position || null,
            impressions: latestRow.impressions,
            clicks: latestRow.clicks,
            ctr: latestRow.ctr,
            url: latestRow.keys[1],
            data_source: 'search_console',
            tracking_status: 'active',
            last_seen_at: new Date().toISOString(),
            metadata: {
              ...(kw.metadata || {}),
              missing_in_period: false
            }
          });

          // Insert historical data
          const historyEntries = gscData.rows.map((row: any, index: number) => ({
            keyword_ranking_id: kw.id,
            position: Math.round(row.position),
            recorded_at: row.keys[2],
            change_from_previous: index > 0 ? Math.round(row.position) - Math.round(gscData.rows[index - 1].position) : 0,
            metadata: {
              impressions: row.impressions,
              clicks: row.clicks,
              ctr: row.ctr,
              data_source: 'search_console'
            }
          }));

          for (const entry of historyEntries) {
            const { error } = await supabase
              .from('ranking_history')
              .upsert(entry, { ignoreDuplicates: true });
            
            if (error) {
              console.error(`Failed to insert history for ${entry.recorded_at}:`, error);
            }
          }

          console.log(`✅ Processed ${historyEntries.length} records for "${kw.keyword}"`);
        } else {
          // SOFT DELETE: Keyword NÃO tem dados no período
          console.log(`⚠️ No data for "${kw.keyword}" in period ${period}`);
          
          // Verificar há quanto tempo não tem dados
          const { data: lastHistory } = await supabase
            .from('ranking_history')
            .select('recorded_at')
            .eq('keyword_ranking_id', kw.id)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .single();
          
          const daysSinceLastSeen = lastHistory 
            ? Math.floor((Date.now() - new Date(lastHistory.recorded_at).getTime()) / (24 * 60 * 60 * 1000))
            : 999;
          
          const newStatus = daysSinceLastSeen > 7 ? 'missing' : 'inactive';
          
          inactiveKeywords.push({
            id: kw.id,
            tracking_status: newStatus,
            metadata: {
              ...(kw.metadata || {}),
              missing_in_period: true,
              missing_since: lastHistory?.recorded_at || null,
              days_missing: daysSinceLastSeen
            }
          });
        }
      } catch (error) {
        console.error(`Error fetching GSC data for "${kw.keyword}":`, error);
      }
    }

    // Bulk update active keywords
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

    // Bulk update inactive/missing keywords
    if (inactiveKeywords.length > 0) {
      for (const inactive of inactiveKeywords) {
        const { error: updateError } = await supabase
          .from('keyword_rankings')
          .update({
            tracking_status: inactive.tracking_status,
            metadata: inactive.metadata
          })
          .eq('id', inactive.id);

        if (updateError) {
          console.error('Error updating inactive keyword:', updateError);
        }
      }
      
      // Criar notificação para keywords que ficaram missing
      const missingCount = inactiveKeywords.filter(k => k.tracking_status === 'missing').length;
      if (missingCount > 0) {
        await supabase
          .from('notifications')
          .insert({
            user_id: (await supabase
              .from('projects')
              .select('user_id')
              .eq('id', projectId)
              .single()).data?.user_id,
            project_id: projectId,
            type: 'ranking_alert',
            title: `${missingCount} keywords sem dados`,
            message: `${missingCount} palavras-chave não aparecem no GSC há mais de 7 dias`,
            priority: 'high'
          });
      }
    }

    // Update last_sync_at
    await supabase
      .from('project_integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', integration.id);

    console.log(`GSC sync completed. Active: ${updates.length}, Inactive: ${inactiveKeywords.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        synced: updates.length,
        inactive: inactiveKeywords.length,
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
