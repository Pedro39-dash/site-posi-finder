import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PageSpeedRequest {
  url: string;
  strategy?: 'mobile' | 'desktop';
  project_id?: string;
  user_id?: string;
}

interface PageSpeedResults {
  performance_score: number;
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  cls: number; // Cumulative Layout Shift
  fid: number; // First Input Delay
  ttfb: number; // Time to First Byte
  opportunities: Array<{
    id: string;
    title: string;
    description: string;
    savings_ms?: number;
    savings_bytes?: number;
  }>;
  diagnostics: Array<{
    id: string;
    title: string;
    description: string;
    score?: number;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('PageSpeed Insights analysis iniciada');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleApiKey = Deno.env.get('GOOGLE_PAGESPEED_API_KEY')!;
    
    if (!googleApiKey) {
      throw new Error('Google PageSpeed API key não configurada');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { url, strategy = 'desktop', project_id, user_id }: PageSpeedRequest = await req.json();

    console.log('Analisando URL:', url, 'Strategy:', strategy);

    const startTime = Date.now();

    // Chamada para Google PageSpeed Insights API
    const pageSpeedUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
    pageSpeedUrl.searchParams.append('url', url);
    pageSpeedUrl.searchParams.append('strategy', strategy);
    pageSpeedUrl.searchParams.append('key', googleApiKey);
    pageSpeedUrl.searchParams.append('category', 'performance');
    pageSpeedUrl.searchParams.append('category', 'seo');
    pageSpeedUrl.searchParams.append('category', 'accessibility');
    pageSpeedUrl.searchParams.append('category', 'best-practices');

    console.log('Fazendo requisição para PageSpeed API...');
    
    const response = await fetch(pageSpeedUrl.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API PageSpeed:', response.status, errorText);
      throw new Error(`Erro na API PageSpeed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Resposta da API PageSpeed recebida');

    // Extrair métricas principais
    const lighthouse = data.lighthouseResult;
    const categories = lighthouse.categories;
    const audits = lighthouse.audits;

    // Core Web Vitals
    const metrics = {
      performance_score: Math.round((categories.performance?.score || 0) * 100),
      seo_score: Math.round((categories.seo?.score || 0) * 100),
      accessibility_score: Math.round((categories.accessibility?.score || 0) * 100),
      best_practices_score: Math.round((categories['best-practices']?.score || 0) * 100),
      fcp: audits['first-contentful-paint']?.numericValue || 0,
      lcp: audits['largest-contentful-paint']?.numericValue || 0,
      cls: audits['cumulative-layout-shift']?.numericValue || 0,
      fid: audits['max-potential-fid']?.numericValue || 0,
      ttfb: audits['server-response-time']?.numericValue || 0
    };

    // Oportunidades de melhoria
    const opportunities = Object.values(audits)
      .filter((audit: any) => audit.scoreDisplayMode === 'numeric' && audit.score < 0.9)
      .map((audit: any) => ({
        id: audit.id,
        title: audit.title,
        description: audit.description,
        savings_ms: audit.details?.overallSavingsMs || 0,
        savings_bytes: audit.details?.overallSavingsBytes || 0,
        score: Math.round((audit.score || 0) * 100)
      }))
      .sort((a, b) => (b.savings_ms || 0) - (a.savings_ms || 0))
      .slice(0, 10); // Top 10 oportunidades

    // Diagnósticos
    const diagnostics = Object.values(audits)
      .filter((audit: any) => audit.scoreDisplayMode === 'informative' && audit.details)
      .map((audit: any) => ({
        id: audit.id,
        title: audit.title,
        description: audit.description,
        score: audit.score ? Math.round(audit.score * 100) : null
      }))
      .slice(0, 15); // Top 15 diagnósticos

    const results: PageSpeedResults = {
      performance_score: metrics.performance_score,
      fcp: metrics.fcp,
      lcp: metrics.lcp,
      cls: metrics.cls,
      fid: metrics.fid,
      ttfb: metrics.ttfb,
      opportunities,
      diagnostics
    };

    // Salvar resultados no banco se project_id for fornecido
    if (project_id && user_id) {
      console.log('Salvando resultados da análise no banco...');
      
      const { error: auditError } = await supabase
        .from('audit_reports')
        .insert({
          user_id,
          project_id,
          url,
          status: 'completed',
          overall_score: metrics.performance_score,
          metadata: {
            type: 'pagespeed_analysis',
            strategy,
            metrics,
            opportunities: opportunities.length,
            diagnostics: diagnostics.length,
            analysis_date: new Date().toISOString(),
            core_web_vitals: {
              fcp: metrics.fcp,
              lcp: metrics.lcp,
              cls: metrics.cls,
              fid: metrics.fid,
              ttfb: metrics.ttfb
            },
            scores: {
              performance: metrics.performance_score,
              seo: metrics.seo_score,
              accessibility: metrics.accessibility_score,
              best_practices: metrics.best_practices_score
            }
          },
          completed_at: new Date().toISOString()
        });

      if (auditError) {
        console.error('Erro ao salvar auditoria:', auditError);
      }

      // Criar notificação sobre a análise
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id,
          project_id,
          title: 'Análise PageSpeed Concluída',
          message: `Análise de performance concluída para ${url}. Score: ${metrics.performance_score}/100`,
          type: metrics.performance_score >= 90 ? 'success' : metrics.performance_score >= 50 ? 'warning' : 'error',
          priority: 'medium',
          action_url: '/audit',
          metadata: {
            type: 'pagespeed_analysis',
            url,
            performance_score: metrics.performance_score,
            strategy
          }
        });

      if (notificationError) {
        console.error('Erro ao criar notificação:', notificationError);
      }
    }

    const executionTime = Date.now() - startTime;
    console.log(`Análise PageSpeed concluída em ${executionTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        url,
        strategy,
        execution_time_ms: executionTime,
        metrics,
        results,
        summary: {
          performance_grade: getPerformanceGrade(metrics.performance_score),
          total_opportunities: opportunities.length,
          potential_savings_ms: opportunities.reduce((sum, op) => sum + (op.savings_ms || 0), 0),
          core_web_vitals_status: getCoreWebVitalsStatus(metrics)
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Erro na análise PageSpeed:', error);
    
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

function getPerformanceGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function getCoreWebVitalsStatus(metrics: any): 'good' | 'needs_improvement' | 'poor' {
  const lcpGood = metrics.lcp <= 2500;
  const fidGood = metrics.fid <= 100;
  const clsGood = metrics.cls <= 0.1;
  
  const goodMetrics = [lcpGood, fidGood, clsGood].filter(Boolean).length;
  
  if (goodMetrics === 3) return 'good';
  if (goodMetrics >= 2) return 'needs_improvement';
  return 'poor';
}