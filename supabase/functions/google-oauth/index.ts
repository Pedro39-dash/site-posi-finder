import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
const GOOGLE_REDIRECT_URI = Deno.env.get('GOOGLE_REDIRECT_URI') || 'https://yfvfklgjzmmobwfhdrqp.supabase.co/functions/v1/google-oauth/callback';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    }
  );

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // Step 1: Generate authorization URL
    if (path === 'authorize') {
      const { projectId, integrationType, returnUrl } = await req.json();
      
      // Get user ID from JWT
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const scopes = integrationType === 'search_console'
        ? ['https://www.googleapis.com/auth/webmasters.readonly']
        : ['https://www.googleapis.com/auth/analytics.readonly'];

      const state = btoa(JSON.stringify({ projectId, integrationType, userId: user.id, returnUrl }));
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scopes.join(' '))}&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${state}`;

      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Handle OAuth callback
    if (path === 'callback') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      
      if (!code || !state) {
        throw new Error('Missing code or state parameter');
      }

      const { projectId, integrationType, userId, returnUrl } = JSON.parse(atob(state));
      
      // Validate that the project belongs to the user using service role
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      const { data: project, error: projectError } = await supabaseAdmin
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single();
      
      if (projectError || !project) {
        throw new Error('Project not found or unauthorized');
      }

      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID!,
          client_secret: GOOGLE_CLIENT_SECRET!,
          redirect_uri: GOOGLE_REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      });

      const tokens = await tokenResponse.json();
      
      if (!tokens.access_token) {
        throw new Error('Failed to obtain access token');
      }

      // Get user info
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const userInfo = await userInfoResponse.json();

      // Store integration (userId already validated from state)
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
      
      const { error } = await supabaseAdmin
        .from('project_integrations')
        .upsert({
          project_id: projectId,
          integration_type: integrationType,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: expiresAt,
          account_email: userInfo.email,
          sync_status: 'active',
          is_active: true,
        }, {
          onConflict: 'project_id,integration_type'
        });

      if (error) throw error;

      // Redirect back to app
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: `${returnUrl}/?integration=success&type=${integrationType}`,
        },
      });
    }

    // Step 3: Refresh token
    if (path === 'refresh') {
      const { integrationId } = await req.json();

      const { data: integration, error: fetchError } = await supabase
        .from('project_integrations')
        .select('*')
        .eq('id', integrationId)
        .single();

      if (fetchError || !integration) throw new Error('Integration not found');

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID!,
          client_secret: GOOGLE_CLIENT_SECRET!,
          refresh_token: integration.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      const tokens = await tokenResponse.json();
      
      if (!tokens.access_token) {
        throw new Error('Failed to refresh token');
      }

      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

      const { error: updateError } = await supabase
        .from('project_integrations')
        .update({
          access_token: tokens.access_token,
          token_expires_at: expiresAt,
          sync_status: 'active',
        })
        .eq('id', integrationId);

      if (updateError) throw updateError;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid endpoint');

  } catch (error) {
    console.error('Error in google-oauth:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
