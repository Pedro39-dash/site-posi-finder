import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DomainAnalysisResult {
  domain: string;
  performanceScore: number;
  seoScore: number;
  coreWebVitals: {
    lcp: { value: number; status: 'good' | 'needs-improvement' | 'poor' };
    fid: { value: number; status: 'good' | 'needs-improvement' | 'poor' };
    cls: { value: number; status: 'good' | 'needs-improvement' | 'poor' };
  };
  onPage: {
    title: string | null;
    titleLength: number;
    metaDescription: string | null;
    metaLength: number;
    h1Count: number;
    h2Count: number;
    h3Count: number;
    wordCount: number;
    imagesWithoutAlt: number;
    totalImages: number;
    internalLinks: number;
    externalLinks: number;
    hasSchema: boolean;
    hasOpenGraph: boolean;
    isMobileFriendly: boolean;
  };
  estimatedDA: number;
  pageSize: number;
}

// Normalize and validate URL
function normalizeUrl(domain: string): string {
  let url = domain.trim();
  
  // Add https:// if no protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  
  // Validate URL
  try {
    new URL(url);
    return url;
  } catch {
    throw new Error(`Invalid URL format: ${domain}`);
  }
}

async function analyzeWithPageSpeed(url: string): Promise<any> {
  const apiKey = Deno.env.get('GOOGLE_PAGESPEED_API_KEY');
  if (!apiKey) {
    throw new Error('GOOGLE_PAGESPEED_API_KEY not configured');
  }

  const pageSpeedUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=mobile&category=performance&category=seo`;
  
  const response = await fetch(pageSpeedUrl);
  if (!response.ok) {
    const errorBody = await response.text();
    console.error('❌ PageSpeed API Error Details:', {
      url,
      status: response.status,
      statusText: response.statusText,
      errorBody: errorBody.substring(0, 500) // First 500 chars
    });
    throw new Error(`PageSpeed API error: ${response.statusText} (${response.status})`);
  }
  
  return await response.json();
}

// Retry PageSpeed with exponential backoff
async function analyzeWithPageSpeedRetry(url: string, retries = 2): Promise<any> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await analyzeWithPageSpeed(url);
    } catch (error) {
      if (i === retries) throw error;
      
      const delay = 2000 * (i + 1);
      console.log(`⏳ Retry ${i + 1}/${retries} for ${url} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function scrapeAndAnalyze(url: string): Promise<any> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; SEO-Analysis-Bot/1.0)'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  
  const html = await response.text();
  const pageSize = new TextEncoder().encode(html).length;
  
  // Extract title
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
  const title = titleMatch ? titleMatch[1].trim() : null;
  
  // Extract meta description
  const metaMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  const metaDescription = metaMatch ? metaMatch[1] : null;
  
  // Count headings
  const h1Count = (html.match(/<h1[^>]*>/gi) || []).length;
  const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
  const h3Count = (html.match(/<h3[^>]*>/gi) || []).length;
  
  // Count words in body
  const bodyMatch = html.match(/<body[^>]*>(.*?)<\/body>/is);
  const bodyText = bodyMatch ? bodyMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') : '';
  const wordCount = bodyText.trim().split(/\s+/).length;
  
  // Count images and alt attributes
  const imgMatches = html.match(/<img[^>]*>/gi) || [];
  const totalImages = imgMatches.length;
  const imagesWithAlt = imgMatches.filter(img => /alt=["'][^"']*["']/i.test(img)).length;
  const imagesWithoutAlt = totalImages - imagesWithAlt;
  
  // Count links
  const linkMatches = html.match(/<a\s+[^>]*href=["']([^"']+)["']/gi) || [];
  let internalLinks = 0;
  let externalLinks = 0;
  
  const domain = new URL(url).hostname;
  linkMatches.forEach(link => {
    const hrefMatch = link.match(/href=["']([^"']+)["']/i);
    if (hrefMatch) {
      const href = hrefMatch[1];
      if (href.startsWith('http') && !href.includes(domain)) {
        externalLinks++;
      } else if (href.startsWith('/') || href.startsWith('#') || href.includes(domain)) {
        internalLinks++;
      }
    }
  });
  
  // Check for Schema.org
  const hasSchema = /<script[^>]*type=["']application\/ld\+json["']/i.test(html);
  
  // Check for Open Graph
  const hasOpenGraph = /<meta[^>]*property=["']og:/i.test(html);
  
  // Check mobile viewport
  const isMobileFriendly = /<meta[^>]*name=["']viewport["']/i.test(html);
  
  return {
    title,
    titleLength: title?.length || 0,
    metaDescription,
    metaLength: metaDescription?.length || 0,
    h1Count,
    h2Count,
    h3Count,
    wordCount,
    imagesWithoutAlt,
    totalImages,
    internalLinks,
    externalLinks,
    hasSchema,
    hasOpenGraph,
    isMobileFriendly,
    pageSize
  };
}

function calculateEstimatedDA(
  performanceScore: number,
  seoScore: number,
  onPage: any,
  hasTopRankings: boolean
): number {
  let da = 0;
  
  // Performance contribution (30%)
  da += (performanceScore / 100) * 30;
  
  // SEO score contribution (25%)
  da += (seoScore / 100) * 25;
  
  // Technical SEO (20%)
  let technicalScore = 0;
  if (onPage.hasSchema) technicalScore += 5;
  if (onPage.hasOpenGraph) technicalScore += 5;
  if (onPage.isMobileFriendly) technicalScore += 5;
  if (onPage.h1Count >= 1 && onPage.h1Count <= 2) technicalScore += 5;
  da += technicalScore;
  
  // Content quality (15%)
  let contentScore = 0;
  if (onPage.wordCount >= 300) contentScore += 5;
  if (onPage.wordCount >= 800) contentScore += 5;
  if (onPage.titleLength >= 30 && onPage.titleLength <= 60) contentScore += 2.5;
  if (onPage.metaLength >= 120 && onPage.metaLength <= 160) contentScore += 2.5;
  da += contentScore;
  
  // Top rankings bonus (10%)
  if (hasTopRankings) da += 10;
  
  return Math.min(Math.round(da), 100);
}

function getCoreWebVitalStatus(value: number, metric: 'lcp' | 'fid' | 'cls'): 'good' | 'needs-improvement' | 'poor' {
  if (metric === 'lcp') {
    if (value <= 2500) return 'good';
    if (value <= 4000) return 'needs-improvement';
    return 'poor';
  } else if (metric === 'fid') {
    if (value <= 100) return 'good';
    if (value <= 300) return 'needs-improvement';
    return 'poor';
  } else { // cls
    if (value <= 0.1) return 'good';
    if (value <= 0.25) return 'needs-improvement';
    return 'poor';
  }
}

async function analyzeDomain(url: string, isTarget: boolean = false): Promise<DomainAnalysisResult | null> {
  console.log(`🔍 Analyzing domain: ${url}`);
  
  try {
    // Run PageSpeed and scraping in parallel (with retry)
    const [pageSpeedData, onPageData] = await Promise.all([
      analyzeWithPageSpeedRetry(url),
      scrapeAndAnalyze(url)
    ]);
    
    const performanceScore = Math.round((pageSpeedData.lighthouseResult?.categories?.performance?.score || 0) * 100);
    const seoScore = Math.round((pageSpeedData.lighthouseResult?.categories?.seo?.score || 0) * 100);
    
    const metrics = pageSpeedData.lighthouseResult?.audits;
    const lcp = metrics?.['largest-contentful-paint']?.numericValue || 0;
    const fid = metrics?.['max-potential-fid']?.numericValue || 0;
    const cls = metrics?.['cumulative-layout-shift']?.numericValue || 0;
    
    const estimatedDA = calculateEstimatedDA(performanceScore, seoScore, onPageData, isTarget);
    
    return {
      domain: new URL(url).hostname,
      performanceScore,
      seoScore,
      coreWebVitals: {
        lcp: { value: Math.round(lcp), status: getCoreWebVitalStatus(lcp, 'lcp') },
        fid: { value: Math.round(fid), status: getCoreWebVitalStatus(fid, 'fid') },
        cls: { value: Math.round(cls * 1000) / 1000, status: getCoreWebVitalStatus(cls, 'cls') }
      },
      onPage: onPageData,
      estimatedDA,
      pageSize: onPageData.pageSize
    };
  } catch (error) {
    console.error(`❌ Error analyzing ${url}:`, error);
    
    // If target fails, throw error (cannot continue)
    if (isTarget) {
      throw error;
    }
    
    // If competitor fails, return null (analysis can continue)
    console.log(`⚠️ Skipping competitor ${url} due to error`);
    return null;
  }
}

function generateRecommendations(
  targetData: DomainAnalysisResult,
  competitorAvgs: any
): Array<{ priority: 'high' | 'medium' | 'low'; title: string; impact: string; gap: string }> {
  const recommendations = [];
  
  // Performance gaps
  if (targetData.performanceScore < competitorAvgs.performanceScore - 10) {
    recommendations.push({
      priority: 'high',
      title: 'Melhorar Performance Geral',
      impact: `+${Math.round(competitorAvgs.performanceScore - targetData.performanceScore)} pontos de performance`,
      gap: `Você: ${targetData.performanceScore}, Concorrentes: ${Math.round(competitorAvgs.performanceScore)}`
    });
  }
  
  // Page size optimization
  const avgPageSize = competitorAvgs.pageSize;
  if (targetData.pageSize > avgPageSize * 1.2) {
    const savings = Math.round((targetData.pageSize - avgPageSize) / 1024);
    recommendations.push({
      priority: 'high',
      title: `Comprimir recursos (-${savings}KB)`,
      impact: '+5-10 pontos de performance',
      gap: `Você: ${Math.round(targetData.pageSize / 1024)}KB, Concorrentes: ${Math.round(avgPageSize / 1024)}KB`
    });
  }
  
  // Core Web Vitals
  if (targetData.coreWebVitals.lcp.status !== 'good') {
    recommendations.push({
      priority: 'high',
      title: 'Otimizar Largest Contentful Paint (LCP)',
      impact: 'Melhora experiência do usuário e rankings',
      gap: `Você: ${targetData.coreWebVitals.lcp.value}ms (${targetData.coreWebVitals.lcp.status})`
    });
  }
  
  // Content gaps
  if (targetData.onPage.wordCount < competitorAvgs.wordCount * 0.7) {
    recommendations.push({
      priority: 'medium',
      title: 'Expandir conteúdo da página',
      impact: 'Melhora relevância e tempo de permanência',
      gap: `Você: ${targetData.onPage.wordCount} palavras, Concorrentes: ${Math.round(competitorAvgs.wordCount)}`
    });
  }
  
  // Title optimization
  if (targetData.onPage.titleLength < 30 || targetData.onPage.titleLength > 60) {
    recommendations.push({
      priority: 'medium',
      title: 'Otimizar título (30-60 caracteres)',
      impact: 'Melhora CTR nos resultados de busca',
      gap: `Você: ${targetData.onPage.titleLength} caracteres`
    });
  }
  
  // Meta description
  if (!targetData.onPage.metaDescription || targetData.onPage.metaLength < 120) {
    recommendations.push({
      priority: 'medium',
      title: 'Criar/melhorar meta description (120-160 chars)',
      impact: 'Aumenta CTR em 5-10%',
      gap: targetData.onPage.metaDescription ? `${targetData.onPage.metaLength} caracteres` : 'Ausente'
    });
  }
  
  // Images without alt
  if (targetData.onPage.imagesWithoutAlt > 0) {
    recommendations.push({
      priority: 'low',
      title: `Adicionar alt text em ${targetData.onPage.imagesWithoutAlt} imagens`,
      impact: 'Melhora acessibilidade e SEO de imagens',
      gap: `${targetData.onPage.imagesWithoutAlt}/${targetData.onPage.totalImages} imagens sem alt`
    });
  }
  
  // Schema.org
  if (!targetData.onPage.hasSchema && competitorAvgs.hasSchema > 0.5) {
    recommendations.push({
      priority: 'medium',
      title: 'Implementar Schema.org (dados estruturados)',
      impact: 'Habilita rich snippets nos resultados',
      gap: 'Ausente (concorrentes usam)'
    });
  }
  
  // H1 structure
  if (targetData.onPage.h1Count === 0) {
    recommendations.push({
      priority: 'high',
      title: 'Adicionar tag H1 na página',
      impact: 'Essencial para estrutura SEO',
      gap: 'H1 ausente'
    });
  } else if (targetData.onPage.h1Count > 1) {
    recommendations.push({
      priority: 'medium',
      title: 'Usar apenas um H1 por página',
      impact: 'Melhora estrutura semântica',
      gap: `${targetData.onPage.h1Count} H1s encontrados`
    });
  }
  
  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  return recommendations.slice(0, 8); // Top 8 recommendations
}

serve(async (req) => {
  console.log('🎯 Deep SEO Analysis Edge Function called');
  console.log('📥 Request method:', req.method);
  
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('📦 Request body received:', JSON.stringify(body, null, 2));
    
    const { analysis_id, target_domain, competitor_domains } = body;

    if (!analysis_id || !target_domain) {
      console.error('❌ Missing parameters:', { analysis_id, target_domain });
      throw new Error('Missing required parameters: analysis_id and target_domain');
    }

    console.log(`🚀 Starting deep SEO analysis`);
    console.log(`   - Analysis ID: ${analysis_id}`);
    console.log(`   - Target domain: ${target_domain}`);
    console.log(`   - Competitors: ${competitor_domains?.length || 0} domains`);
    console.log(`   - Competitor list: ${competitor_domains?.join(', ') || 'none'}`);

    // Analyze target domain
    const targetUrl = normalizeUrl(target_domain);
    const targetAnalysis = await analyzeDomain(targetUrl, true);

    // Analyze competitor domains (max 3)
    const competitorDomains = (competitor_domains || []).slice(0, 3);
    const competitorUrls = competitorDomains.map((d: string) => normalizeUrl(d));
    
    const competitorResults = await Promise.all(
      competitorUrls.map((url: string) => analyzeDomain(url, false))
    );
    
    // Filter out failed competitors (null values)
    const competitorAnalyses = competitorResults.filter((c): c is DomainAnalysisResult => c !== null);
    const failedDomains = competitorDomains.filter((_, i) => competitorResults[i] === null);
    
    console.log(`✅ Successfully analyzed ${competitorAnalyses.length}/${competitorDomains.length} competitors`);
    if (failedDomains.length > 0) {
      console.log(`⚠️ Failed domains:`, failedDomains);
    }

    // Calculate competitor averages (only from successful analyses)
    const competitorAvgs = competitorAnalyses.length > 0 ? {
      performanceScore: competitorAnalyses.reduce((sum, c) => sum + c.performanceScore, 0) / competitorAnalyses.length,
      seoScore: competitorAnalyses.reduce((sum, c) => sum + c.seoScore, 0) / competitorAnalyses.length,
      wordCount: competitorAnalyses.reduce((sum, c) => sum + c.onPage.wordCount, 0) / competitorAnalyses.length,
      pageSize: competitorAnalyses.reduce((sum, c) => sum + c.pageSize, 0) / competitorAnalyses.length,
      hasSchema: competitorAnalyses.filter(c => c.onPage.hasSchema).length / competitorAnalyses.length,
      estimatedDA: competitorAnalyses.reduce((sum, c) => sum + c.estimatedDA, 0) / competitorAnalyses.length
    } : {
      performanceScore: 0,
      seoScore: 0,
      wordCount: 0,
      pageSize: 0,
      hasSchema: 0,
      estimatedDA: 0
    };

    // Generate prioritized recommendations
    const recommendations = generateRecommendations(targetAnalysis, competitorAvgs);

    const result = {
      analysis_id,
      target: targetAnalysis,
      competitors: competitorAnalyses,
      competitorAverages: competitorAvgs,
      recommendations,
      analyzedAt: new Date().toISOString(),
      ...(failedDomains.length > 0 && { failedDomains })
    };

    const analysisStatus = failedDomains.length > 0 ? 'partial' : 'complete';
    console.log(`✅ Deep analysis completed with status: ${analysisStatus}`);
    console.log(`📊 Result summary:`, {
      status: analysisStatus,
      target_domain: targetAnalysis.domain,
      target_performance: targetAnalysis.performanceScore,
      target_seo: targetAnalysis.seoScore,
      target_DA: targetAnalysis.estimatedDA,
      competitors_analyzed: competitorAnalyses.length,
      competitors_failed: failedDomains.length,
      recommendations_count: recommendations.length
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        status: analysisStatus,
        data: result 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Deep analysis error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error during deep analysis'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});