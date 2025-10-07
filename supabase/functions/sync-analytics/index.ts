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

    console.log('Starting Analytics sync for project:', projectId);

    // Get integration
    const { data: integration, error: intError } = await supabase
      .from('project_integrations')
      .select('*')
      .eq('project_id', projectId)
      .eq('integration_type', 'analytics')
      .single();

    if (intError || !integration) {
      throw new Error('Analytics integration not found');
    }

    // Check if token needs refresh (similar to GSC)
    const now = new Date();
    const expiresAt = new Date(integration.token_expires_at);
    
    if (now >= expiresAt) {
      console.log('Token expired, refreshing...');
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/google-oauth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('Authorization')!,
        },
        body: JSON.stringify({ integrationId: integration.id }),
      });

      const { data: updated } = await supabase
        .from('project_integrations')
        .select('*')
        .eq('id', integration.id)
        .single();
      
      if (updated) {
        integration.access_token = updated.access_token;
      }
    }

    // Fetch Analytics data for the last 7 days
    const analyticsResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${integration.view_id}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${integration.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [
            {
              startDate: '7daysAgo',
              endDate: 'today',
            },
          ],
          dimensions: [
            { name: 'pagePath' },
            { name: 'date' },
          ],
          metrics: [
            { name: 'sessions' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' },
          ],
          dimensionFilter: {
            filter: {
              fieldName: 'sessionDefaultChannelGroup',
              stringFilter: {
                value: 'Organic Search',
              },
            },
          },
        }),
      }
    );

    if (!analyticsResponse.ok) {
      console.error('Analytics API error:', await analyticsResponse.text());
      throw new Error('Failed to fetch Analytics data');
    }

    const analyticsData = await analyticsResponse.json();

    console.log(`Fetched ${analyticsData.rows?.length || 0} rows from Analytics`);

    // Store or process analytics data
    // For now, we'll just store it in project metadata
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (project) {
      await supabase
        .from('projects')
        .update({
          metadata: {
            ...(project.metadata || {}),
            analytics_data: analyticsData,
            analytics_last_sync: new Date().toISOString(),
          },
        })
        .eq('id', projectId);
    }

    // Update last_sync_at
    await supabase
      .from('project_integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', integration.id);

    console.log('Analytics sync completed.');

    return new Response(
      JSON.stringify({ 
        success: true,
        rows: analyticsData.rows?.length || 0,
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in sync-analytics:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
