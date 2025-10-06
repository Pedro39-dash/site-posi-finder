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

async function analyzeWithPageSpeed(url: string): Promise<any> {
  const apiKey = Deno.env.get('GOOGLE_PAGESPEED_API_KEY');
  if (!apiKey) {
    throw new Error('GOOGLE_PAGESPEED_API_KEY not configured');
  }

  const pageSpeedUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=mobile&category=performance&category=seo`;
  
  const response = await fetch(pageSpeedUrl);
  if (!response.ok) {
    throw new Error(`PageSpeed API error: ${response.statusText}`);
  }
  
  return await response.json();
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

async function analyzeDomain(url: string, isTarget: boolean = false): Promise<DomainAnalysisResult> {
  console.log(`🔍 Analyzing domain: ${url}`);
  
  try {
    // Run PageSpeed and scraping in parallel
    const [pageSpeedData, onPageData] = await Promise.all([
      analyzeWithPageSpeed(url),
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
    throw error;
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { analysis_id, target_domain, competitor_domains } = await req.json();

    if (!analysis_id || !target_domain) {
      throw new Error('Missing required parameters: analysis_id and target_domain');
    }

    console.log(`🚀 Starting deep SEO analysis for ${target_domain}`);
    console.log(`📊 Analyzing ${competitor_domains?.length || 0} competitors`);

    // Analyze target domain
    const targetUrl = target_domain.startsWith('http') ? target_domain : `https://${target_domain}`;
    const targetAnalysis = await analyzeDomain(targetUrl, true);

    // Analyze competitor domains (max 3)
    const competitorUrls = (competitor_domains || []).slice(0, 3).map((d: string) => 
      d.startsWith('http') ? d : `https://${d}`
    );
    
    const competitorAnalyses = await Promise.all(
      competitorUrls.map((url: string) => analyzeDomain(url, false))
    );

    // Calculate competitor averages
    const competitorAvgs = {
      performanceScore: competitorAnalyses.reduce((sum, c) => sum + c.performanceScore, 0) / competitorAnalyses.length || 0,
      seoScore: competitorAnalyses.reduce((sum, c) => sum + c.seoScore, 0) / competitorAnalyses.length || 0,
      wordCount: competitorAnalyses.reduce((sum, c) => sum + c.onPage.wordCount, 0) / competitorAnalyses.length || 0,
      pageSize: competitorAnalyses.reduce((sum, c) => sum + c.pageSize, 0) / competitorAnalyses.length || 0,
      hasSchema: competitorAnalyses.filter(c => c.onPage.hasSchema).length / competitorAnalyses.length || 0,
      estimatedDA: competitorAnalyses.reduce((sum, c) => sum + c.estimatedDA, 0) / competitorAnalyses.length || 0
    };

    // Generate prioritized recommendations
    const recommendations = generateRecommendations(targetAnalysis, competitorAvgs);

    const result = {
      analysis_id,
      target: targetAnalysis,
      competitors: competitorAnalyses,
      competitorAverages: competitorAvgs,
      recommendations,
      analyzedAt: new Date().toISOString()
    };

    console.log(`✅ Deep analysis completed successfully`);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Deep analysis error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});