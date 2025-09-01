import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MonitoringRequest {
  config_id: string;
  timestamp: string;
}

interface KeywordRanking {
  id: string;
  keyword: string;
  current_position: number | null;
  previous_position: number | null;
  url: string | null;
  search_engine: string;
  location: string;
  device: string;
  project_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Auto-monitoring function iniciada');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { config_id }: MonitoringRequest = await req.json();
    console.log('Processando config ID:', config_id);

    const startTime = Date.now();

    // Buscar configuração de monitoramento
    const { data: config, error: configError } = await supabase
      .from('monitoring_configs')
      .select('*')
      .eq('id', config_id)
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      console.error('Configuração não encontrada:', configError);
      return new Response(
        JSON.stringify({ error: 'Configuração de monitoramento não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Configuração encontrada:', config.monitoring_type);

    // Buscar keywords do projeto para monitorar
    const { data: keywords, error: keywordsError } = await supabase
      .from('keyword_rankings')
      .select('*')
      .eq('project_id', config.project_id)
      .order('created_at', { ascending: false });

    if (keywordsError) {
      console.error('Erro ao buscar keywords:', keywordsError);
      throw new Error('Erro ao buscar keywords do projeto');
    }

    console.log(`Encontradas ${keywords?.length || 0} keywords para monitorar`);

    const results: any[] = [];
    const notifications: any[] = [];
    
    // Simular verificação de posições (em produção, integraria com APIs reais)
    for (const keyword of keywords || []) {
      try {
        // Simular mudança de posição (para demonstração)
        const positionChange = Math.floor(Math.random() * 10) - 5; // -5 a +5
        const newPosition = keyword.current_position 
          ? Math.max(1, Math.min(100, keyword.current_position + positionChange))
          : Math.floor(Math.random() * 50) + 1;

        const previousPosition = keyword.current_position;
        
        // Atualizar posição se houver mudança significativa
        if (!previousPosition || Math.abs(newPosition - previousPosition) >= 2) {
          const { error: updateError } = await supabase
            .from('keyword_rankings')
            .update({
              previous_position: previousPosition,
              current_position: newPosition,
              updated_at: new Date().toISOString()
            })
            .eq('id', keyword.id);

          if (updateError) {
            console.error('Erro ao atualizar keyword:', updateError);
            continue;
          }

          // Criar notificação para mudanças significativas
          if (previousPosition && Math.abs(newPosition - previousPosition) >= 5) {
            const isImprovement = newPosition < previousPosition;
            
            notifications.push({
              user_id: config.user_id,
              project_id: config.project_id,
              title: isImprovement ? 'Melhoria no Ranking!' : 'Queda no Ranking',
              message: `Keyword "${keyword.keyword}" ${isImprovement ? 'subiu' : 'caiu'} da posição ${previousPosition} para ${newPosition}`,
              type: isImprovement ? 'success' : 'warning',
              priority: Math.abs(newPosition - previousPosition) >= 10 ? 'high' : 'medium',
              action_url: '/rankings',
              metadata: {
                keyword: keyword.keyword,
                previous_position: previousPosition,
                current_position: newPosition,
                change: newPosition - previousPosition,
                monitoring_type: 'automatic'
              }
            });
          }

          results.push({
            keyword_id: keyword.id,
            keyword: keyword.keyword,
            previous_position: previousPosition,
            current_position: newPosition,
            change: previousPosition ? newPosition - previousPosition : 0,
            status: 'updated'
          });
        } else {
          results.push({
            keyword_id: keyword.id,
            keyword: keyword.keyword,
            position: keyword.current_position,
            status: 'no_change'
          });
        }
      } catch (error) {
        console.error('Erro ao processar keyword:', keyword.keyword, error);
        results.push({
          keyword_id: keyword.id,
          keyword: keyword.keyword,
          status: 'error',
          error: error.message
        });
      }
    }

    // Criar notificações em batch
    if (notifications.length > 0) {
      console.log(`Criando ${notifications.length} notificações`);
      const { error: notificationsError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notificationsError) {
        console.error('Erro ao criar notificações:', notificationsError);
      }
    }

    const executionTime = Date.now() - startTime;

    // Registrar log de execução
    const { error: logError } = await supabase
      .from('monitoring_logs')
      .insert({
        config_id: config_id,
        execution_type: config.monitoring_type,
        status: 'completed',
        results: {
          total_keywords: keywords?.length || 0,
          updated_keywords: results.filter(r => r.status === 'updated').length,
          no_change_keywords: results.filter(r => r.status === 'no_change').length,
          error_keywords: results.filter(r => r.status === 'error').length,
          notifications_created: notifications.length,
          keywords: results
        },
        execution_time_ms: executionTime
      });

    if (logError) {
      console.error('Erro ao registrar log:', logError);
    }

    // Atualizar configuração com última execução
    const { error: configUpdateError } = await supabase
      .from('monitoring_configs')
      .update({
        last_run_at: new Date().toISOString(),
        next_run_at: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString() // +24h
      })
      .eq('id', config_id);

    if (configUpdateError) {
      console.error('Erro ao atualizar configuração:', configUpdateError);
    }

    console.log(`Monitoramento concluído: ${results.length} keywords processadas em ${executionTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        config_id,
        execution_time_ms: executionTime,
        results: {
          total_keywords: keywords?.length || 0,
          updated: results.filter(r => r.status === 'updated').length,
          no_change: results.filter(r => r.status === 'no_change').length,
          errors: results.filter(r => r.status === 'error').length,
          notifications_created: notifications.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Erro na função de monitoramento automático:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});