import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Validate and normalize URL
function validateAndNormalizeUrl(inputUrl: string): { isValid: boolean; normalizedUrl: string; error: string } {
  if (!inputUrl?.trim()) {
    return { isValid: false, normalizedUrl: '', error: 'URL is required' };
  }

  let normalizedUrl = inputUrl.trim();
  
  // Add protocol if missing
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = 'https://' + normalizedUrl;
  }
  
  try {
    const urlObj = new URL(normalizedUrl);
    
    // Basic validation
    if (!urlObj.hostname || urlObj.hostname.length < 3) {
      return { isValid: false, normalizedUrl, error: 'Invalid hostname' };
    }
    
    // Check for valid domain pattern - allow multiple dots for domains like .com.br
    console.log(`🔍 Validating hostname: ${urlObj.hostname}`);
    if (!/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(urlObj.hostname)) {
      console.log(`❌ Domain validation failed for: ${urlObj.hostname}`);
      return { isValid: false, normalizedUrl, error: 'Invalid domain format' };
    }
    console.log(`✅ Domain validation passed for: ${urlObj.hostname}`);
    
    return { isValid: true, normalizedUrl, error: '' };
  } catch (error) {
    return { isValid: false, normalizedUrl, error: `Invalid URL format: ${error.message}` };
  }
}

interface AuditCategory {
  category: string;
  score: number;
  status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
  issues: Array<{
    type: 'success' | 'warning' | 'error';
    message: string;
    priority: 'high' | 'medium' | 'low';
    recommendation?: string;
  }>;
}

interface PageSpeedInsightsResponse {
  lighthouseResult: {
    categories: {
      performance: { score: number };
      accessibility: { score: number };
      'best-practices': { score: number };
      seo: { score: number };
    };
    audits: any;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, userId, focusKeyword } = await req.json();
    
    if (!url || !userId) {
      return new Response(
        JSON.stringify({ error: 'URL and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting SEO audit for URL: ${url}, User: ${userId}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create audit report entry
    const { data: auditReport, error: reportError } = await supabase
      .from('audit_reports')
      .insert({
        user_id: userId,
        url: url,
        status: 'analyzing',
        overall_score: 0
      })
      .select()
      .single();

    if (reportError) {
      console.error('Error creating audit report:', reportError);
      return new Response(
        JSON.stringify({ error: 'Failed to create audit report' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Created audit report with ID: ${auditReport.id}`);

    // Start background analysis
    EdgeRuntime.waitUntil(performSEOAudit(url, auditReport.id, supabase, focusKeyword));

    return new Response(
      JSON.stringify({ 
        success: true, 
        auditId: auditReport.id,
        message: 'SEO audit started successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in seo-audit function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function performSEOAudit(url: string, auditId: string, supabase: any, focusKeyword?: string) {
  console.log(`🚀 Starting SEO audit for: ${url}, Audit ID: ${auditId}`);
  
  try {
    // Validate URL before proceeding
    const validation = validateAndNormalizeUrl(url);
    if (!validation.isValid) {
      throw new Error(`Invalid URL: ${validation.error}`);
    }
    
    // Update status to analyzing and store normalized URL
    await supabase
      .from('audit_reports')
      .update({ 
        status: 'analyzing',
        url: validation.normalizedUrl // Store normalized URL
      })
      .eq('id', auditId);

    // Fetch webpage content
    const html = await fetchWebpageContent(validation.normalizedUrl);

    // Analyze HTML content
    const htmlAnalysis = analyzeHTML(html, validation.normalizedUrl, focusKeyword);

    // Get PageSpeed Insights data
    const pageSpeedData = await getPageSpeedInsights(validation.normalizedUrl);
    
    if (pageSpeedData) {
      console.log(`✅ PageSpeed Insights data received successfully`);
    } else {
      console.log(`⚠️  PageSpeed Insights data not available, continuing with HTML analysis only`);
    }
    
    // Combine all analyses
    console.log(`🔄 Combining analyses...`);
    const categories = combineAnalyses(htmlAnalysis, pageSpeedData);
    
    // Calculate overall score
    const overallScore = Math.round(
      categories.reduce((sum, category) => sum + category.score, 0) / categories.length
    );

    console.log(`📊 Overall audit score calculated: ${overallScore}% from ${categories.length} categories`);
    console.log(`💾 Saving ${categories.length} categories and their issues to database...`);

    // Save categories and issues to database
    for (const category of categories) {
      const { data: categoryData, error: categoryError } = await supabase
        .from('audit_categories')
        .insert({
          audit_report_id: auditId,
          category: category.category,
          score: category.score,
          status: category.status
        })
        .select()
        .single();

      if (categoryError) {
        console.error('Error saving category:', categoryError);
        continue;
      }

      // Save issues for this category
      for (const issue of category.issues) {
        await supabase
          .from('audit_issues')
          .insert({
            audit_category_id: categoryData.id,
            type: issue.type,
            message: issue.message,
            priority: issue.priority,
            recommendation: issue.recommendation
          });
      }
    }

    // Update audit report with final status and score
    await supabase
      .from('audit_reports')
      .update({
        status: 'completed',
        overall_score: overallScore,
        completed_at: new Date().toISOString()
      })
      .eq('id', auditId);

    console.log(`✅ SEO audit completed successfully for ${url}`);
    console.log(`📊 Final Results: ${overallScore}% overall score from ${categories.length} categories`);
    console.log(`🎯 Categories analyzed: ${categories.map(c => c.category).join(', ')}`);

  } catch (error) {
    console.error(`❌ Error performing SEO audit for ${url}:`, error);
    console.log('🔍 Error details:', JSON.stringify({
      message: error.message,
      stack: error.stack,
      url,
      auditId
    }, null, 2));
    
    // Provide more specific error messages
    let userFriendlyError = error.message;
    
    if (error.message.includes('Invalid URL')) {
      userFriendlyError = 'URL inválida. Verifique o formato da URL.';
    } else if (error.message.includes('Failed to fetch')) {
      userFriendlyError = 'Não foi possível acessar o site. Verifique se o site está online e acessível.';
    } else if (error.message.includes('HTTP 403')) {
      userFriendlyError = 'Acesso negado pelo site. O site pode estar bloqueando auditorias automatizadas.';
    } else if (error.message.includes('HTTP 404')) {
      userFriendlyError = 'Página não encontrada. Verifique se a URL está correta.';
    } else if (error.message.includes('HTTP 500')) {
      userFriendlyError = 'Erro interno do servidor do site. Tente novamente mais tarde.';
    } else if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
      userFriendlyError = 'Tempo limite excedido. O site demorou muito para responder.';
    }
    
    // Update audit report with error status
    await supabase
      .from('audit_reports')
      .update({ 
        status: 'failed',
        metadata: { 
          error: userFriendlyError,
          technical_error: error.message
        }
      })
      .eq('id', auditId);
  }
}


async function fetchWebpageContent(url: string): Promise<string> {
  console.log(`🌐 Fetching webpage content from: ${url}`);
  
  // Validate and normalize URL first
  const validation = validateAndNormalizeUrl(url);
  if (!validation.isValid) {
    throw new Error(`Invalid URL: ${validation.error}`);
  }
  
  const normalizedUrl = validation.normalizedUrl;
  
  // Try HTTPS first, then HTTP as fallback
  const urlsToTry = [
    normalizedUrl,
    normalizedUrl.replace('https://', 'http://')
  ];
  
  for (const tryUrl of urlsToTry) {
    try {
      console.log(`🔄 Attempting to fetch: ${tryUrl}`);
      
      const response = await fetch(tryUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SEO-Audit-Bot/1.0; +https://seo-audit.com/bot)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive'
        },
        method: 'GET',
        redirect: 'follow'
      });
      
      if (!response.ok) {
        console.log(`❌ HTTP ${response.status} for ${tryUrl}: ${response.statusText}`);
        if (tryUrl === urlsToTry[urlsToTry.length - 1]) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        continue; // Try next URL
      }
      
      const html = await response.text();
      console.log(`✅ Successfully fetched content from: ${tryUrl} (${html.length} characters)`);
      
      if (html.length < 100) {
        throw new Error('Retrieved content is too short (likely an error page)');
      }
      
      return html;
      
    } catch (error) {
      console.error(`❌ Error fetching ${tryUrl}:`, error.message);
      
      if (tryUrl === urlsToTry[urlsToTry.length - 1]) {
        // Last attempt failed
        throw new Error(`Failed to fetch webpage: ${error.message}`);
      }
      // Continue to next URL
    }
  }
  
  throw new Error('All fetch attempts failed');
}

function analyzeHTML(html: string, url: string, focusKeyword?: string): AuditCategory[] {
  const categories: AuditCategory[] = [];

  // Parse HTML
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const h1Matches = html.match(/<h1[^>]*>([^<]*)<\/h1>/gi) || [];
  const h2Matches = html.match(/<h2[^>]*>([^<]*)<\/h2>/gi) || [];
  const h3Matches = html.match(/<h3[^>]*>([^<]*)<\/h3>/gi) || [];
  const imgMatches = html.match(/<img[^>]*>/gi) || [];
  const linkMatches = html.match(/<a[^>]*href=["']([^"']*)["'][^>]*>/gi) || [];
  const internalLinks = linkMatches.filter(link => link.includes(new URL(url).hostname) || link.includes('href="/')).length;
  const externalLinks = linkMatches.length - internalLinks;
  
  // Extract text content for analysis
  const textContent = extractTextContent(html);

  // Meta Tags Analysis
  const metaIssues = [];
  const title = titleMatch ? titleMatch[1].trim() : '';
  const metaDesc = metaDescMatch ? metaDescMatch[1].trim() : '';

  if (!title) {
    metaIssues.push({
      type: 'error' as const,
      message: 'Missing page title',
      priority: 'high' as const,
      recommendation: 'Add a descriptive title tag to your page'
    });
  } else if (title.length > 60) {
    metaIssues.push({
      type: 'warning' as const,
      message: 'Title too long (over 60 characters)',
      priority: 'medium' as const,
      recommendation: 'Keep title under 60 characters for better search engine display'
    });
  } else {
    metaIssues.push({
      type: 'success' as const,
      message: 'Title tag is present and properly sized',
      priority: 'low' as const
    });
  }

  if (!metaDesc) {
    metaIssues.push({
      type: 'error' as const,
      message: 'Missing meta description',
      priority: 'high' as const,
      recommendation: 'Add a meta description between 150-160 characters'
    });
  } else if (metaDesc.length > 160) {
    metaIssues.push({
      type: 'warning' as const,
      message: 'Meta description too long (over 160 characters)',
      priority: 'medium' as const,
      recommendation: 'Keep meta description under 160 characters'
    });
  } else {
    metaIssues.push({
      type: 'success' as const,
      message: 'Meta description is present and properly sized',
      priority: 'low' as const
    });
  }

  const metaScore = metaIssues.filter(issue => issue.type === 'success').length / 2 * 100;
  categories.push({
    category: 'meta_tags',
    score: Math.max(0, metaScore),
    status: metaScore >= 90 ? 'excellent' : metaScore >= 70 ? 'good' : metaScore >= 50 ? 'needs_improvement' : 'critical',
    issues: metaIssues
  });

  // HTML Structure Analysis
  const structureIssues = [];
  
  if (h1Matches.length === 0) {
    structureIssues.push({
      type: 'error' as const,
      message: 'No H1 tag found',
      priority: 'high' as const,
      recommendation: 'Add exactly one H1 tag to your page'
    });
  } else if (h1Matches.length > 1) {
    structureIssues.push({
      type: 'warning' as const,
      message: `Multiple H1 tags found (${h1Matches.length})`,
      priority: 'medium' as const,
      recommendation: 'Use only one H1 tag per page'
    });
  } else {
    structureIssues.push({
      type: 'success' as const,
      message: 'Single H1 tag found',
      priority: 'low' as const
    });
  }

  const structureScore = structureIssues.filter(issue => issue.type === 'success').length / 1 * 100;
  categories.push({
    category: 'html_structure',
    score: Math.max(0, structureScore),
    status: structureScore >= 90 ? 'excellent' : structureScore >= 70 ? 'good' : structureScore >= 50 ? 'needs_improvement' : 'critical',
    issues: structureIssues
  });

  // Images Analysis
  const imageIssues = [];
  const imagesWithoutAlt = imgMatches.filter(img => !img.includes('alt=') || img.includes('alt=""') || img.includes("alt=''")).length;
  
  if (imgMatches.length > 0) {
    if (imagesWithoutAlt === 0) {
      imageIssues.push({
        type: 'success' as const,
        message: 'All images have alt attributes',
        priority: 'low' as const
      });
    } else {
      imageIssues.push({
        type: 'warning' as const,
        message: `${imagesWithoutAlt} images missing alt attributes`,
        priority: 'medium' as const,
        recommendation: 'Add descriptive alt attributes to all images'
      });
    }
  } else {
    imageIssues.push({
      type: 'success' as const,
      message: 'No images to analyze',
      priority: 'low' as const
    });
  }

  const imageScore = imgMatches.length > 0 ? (imgMatches.length - imagesWithoutAlt) / imgMatches.length * 100 : 100;
  categories.push({
    category: 'images',
    score: Math.max(0, imageScore),
    status: imageScore >= 90 ? 'excellent' : imageScore >= 70 ? 'good' : imageScore >= 50 ? 'needs_improvement' : 'critical',
    issues: imageIssues
  });

  // Keyword Analysis
  if (focusKeyword) {
    const keywordAnalysis = analyzeKeywordOptimization(textContent, title, metaDesc, url, focusKeyword);
    categories.push(keywordAnalysis);
  }

  // Content Structure Analysis
  const contentStructure = analyzeContentStructure(textContent, h1Matches, h2Matches, h3Matches);
  categories.push(contentStructure);

  // Links Analysis
  const linksAnalysis = analyzeLinks(internalLinks, externalLinks, linkMatches, url);
  categories.push(linksAnalysis);

  // Technical SEO Analysis
  const technicalAnalysis = analyzeTechnicalSEO(html, url);
  categories.push(technicalAnalysis);

  // Readability Analysis
  const readabilityAnalysis = analyzeReadability(textContent);
  categories.push(readabilityAnalysis);

  // AI Search Optimization Analysis
  const aiSearchAnalysis = analyzeAISearchOptimization(textContent, title, metaDesc, url);
  categories.push(aiSearchAnalysis);

  return categories;
}

async function getPageSpeedInsights(url: string): Promise<PageSpeedInsightsResponse | null> {
  try {
    const apiKey = Deno.env.get('GOOGLE_PAGESPEED_API_KEY');
    if (!apiKey) {
      console.log('PageSpeed API key not found, skipping PageSpeed analysis');
      return null;
    }

    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=desktop&category=performance&category=accessibility&category=best-practices&category=seo`;
    
    console.log('Calling PageSpeed Insights API...');
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`PageSpeed API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('PageSpeed Insights data received successfully');
    return data;
  } catch (error) {
    console.error('Error calling PageSpeed Insights:', error);
    return null;
  }
}

function combineAnalyses(htmlAnalysis: AuditCategory[], pageSpeedData: PageSpeedInsightsResponse | null): AuditCategory[] {
  let categories = [...htmlAnalysis];

  if (pageSpeedData?.lighthouseResult) {
    const lighthouse = pageSpeedData.lighthouseResult;
    
    // Add Performance category
    if (lighthouse.categories.performance) {
      const performanceScore = Math.round(lighthouse.categories.performance.score * 100);
      categories.push({
        category: 'performance',
        score: performanceScore,
        status: performanceScore >= 90 ? 'excellent' : performanceScore >= 70 ? 'good' : performanceScore >= 50 ? 'needs_improvement' : 'critical',
        issues: [{
          type: performanceScore >= 70 ? 'success' : performanceScore >= 50 ? 'warning' : 'error',
          message: `Performance score: ${performanceScore}/100`,
          priority: performanceScore >= 70 ? 'low' : performanceScore >= 50 ? 'medium' : 'high',
          recommendation: performanceScore < 70 ? 'Optimize images, reduce JavaScript, and improve server response times' : undefined
        }]
      });
    }

    // Add Mobile-Friendly category (using accessibility as proxy)
    if (lighthouse.categories.accessibility) {
      const accessibilityScore = Math.round(lighthouse.categories.accessibility.score * 100);
      categories.push({
        category: 'mobile_friendly',
        score: accessibilityScore,
        status: accessibilityScore >= 90 ? 'excellent' : accessibilityScore >= 70 ? 'good' : accessibilityScore >= 50 ? 'needs_improvement' : 'critical',
        issues: [{
          type: accessibilityScore >= 70 ? 'success' : accessibilityScore >= 50 ? 'warning' : 'error',
          message: `Accessibility score: ${accessibilityScore}/100`,
          priority: accessibilityScore >= 70 ? 'low' : accessibilityScore >= 50 ? 'medium' : 'high',
          recommendation: accessibilityScore < 70 ? 'Improve color contrast, add ARIA labels, and ensure keyboard navigation' : undefined
        }]
      });
    }
  } else {
    // Add placeholder categories if PageSpeed data is not available
    categories.push({
      category: 'performance',
      score: 0,
      status: 'critical',
      issues: [{
        type: 'error',
        message: 'Unable to analyze performance',
        priority: 'high',
        recommendation: 'Check if the URL is accessible and try again'
      }]
    });

    categories.push({
      category: 'mobile_friendly',
      score: 0,
      status: 'critical',
      issues: [{
        type: 'error',
        message: 'Unable to analyze mobile-friendliness',
        priority: 'high',
        recommendation: 'Check if the URL is accessible and try again'
      }]
    });
  }

  return categories;
}

function extractTextContent(html: string): string {
  // Remove script and style elements
  let cleanHtml = html.replace(/<script[^>]*>.*?<\/script>/gis, '');
  cleanHtml = cleanHtml.replace(/<style[^>]*>.*?<\/style>/gis, '');
  
  // Remove HTML tags but keep the text
  cleanHtml = cleanHtml.replace(/<[^>]+>/g, ' ');
  
  // Clean up whitespace
  cleanHtml = cleanHtml.replace(/\s+/g, ' ').trim();
  
  return cleanHtml;
}

function analyzeKeywordOptimization(textContent: string, title: string, metaDesc: string, url: string, focusKeyword: string): AuditCategory {
  const issues = [];
  let score = 0;
  const keyword = focusKeyword.toLowerCase();
  const titleLower = title.toLowerCase();
  const metaDescLower = metaDesc.toLowerCase();
  const contentLower = textContent.toLowerCase();
  const urlLower = url.toLowerCase();

  // Check keyword in title
  if (titleLower.includes(keyword)) {
    score += 25;
    issues.push({
      type: 'success' as const,
      message: `Palavra-chave encontrada no título`,
      priority: 'low' as const
    });
  } else {
    issues.push({
      type: 'error' as const,
      message: `Palavra-chave não encontrada no título`,
      priority: 'high' as const,
      recommendation: `Inclua "${focusKeyword}" no título da página`
    });
  }

  // Check keyword in meta description
  if (metaDescLower.includes(keyword)) {
    score += 20;
    issues.push({
      type: 'success' as const,
      message: `Palavra-chave encontrada na meta description`,
      priority: 'low' as const
    });
  } else {
    issues.push({
      type: 'warning' as const,
      message: `Palavra-chave não encontrada na meta description`,
      priority: 'medium' as const,
      recommendation: `Inclua "${focusKeyword}" na meta description`
    });
  }

  // Check keyword in URL
  if (urlLower.includes(keyword.replace(/\s+/g, '-'))) {
    score += 15;
    issues.push({
      type: 'success' as const,
      message: `Palavra-chave encontrada na URL`,
      priority: 'low' as const
    });
  } else {
    issues.push({
      type: 'warning' as const,
      message: `Palavra-chave não encontrada na URL`,
      priority: 'medium' as const,
      recommendation: `Considere incluir "${focusKeyword}" na URL`
    });
  }

  // Check keyword density
  const words = contentLower.split(/\s+/);
  const keywordCount = words.filter(word => word.includes(keyword.split(' ')[0])).length;
  const density = (keywordCount / words.length) * 100;

  if (density >= 0.5 && density <= 2.5) {
    score += 40;
    issues.push({
      type: 'success' as const,
      message: `Densidade da palavra-chave adequada (${density.toFixed(1)}%)`,
      priority: 'low' as const
    });
  } else if (density > 2.5) {
    issues.push({
      type: 'warning' as const,
      message: `Densidade da palavra-chave muito alta (${density.toFixed(1)}%)`,
      priority: 'medium' as const,
      recommendation: `Reduza a repetição de "${focusKeyword}" no conteúdo`
    });
  } else {
    issues.push({
      type: 'warning' as const,
      message: `Densidade da palavra-chave muito baixa (${density.toFixed(1)}%)`,
      priority: 'medium' as const,
      recommendation: `Use "${focusKeyword}" mais naturalmente no conteúdo`
    });
  }

  return {
    category: 'keyword_optimization',
    score: Math.max(0, score),
    status: score >= 90 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'needs_improvement' : 'critical',
    issues
  };
}

function analyzeContentStructure(textContent: string, h1Matches: string[], h2Matches: string[], h3Matches: string[]): AuditCategory {
  const issues = [];
  let score = 0;
  const wordCount = textContent.split(/\s+/).length;

  // Check content length
  if (wordCount >= 300) {
    score += 30;
    if (wordCount >= 600) {
      score += 20;
      issues.push({
        type: 'success' as const,
        message: `Conteúdo com ${wordCount} palavras (excelente)`,
        priority: 'low' as const
      });
    } else {
      issues.push({
        type: 'success' as const,
        message: `Conteúdo com ${wordCount} palavras (bom)`,
        priority: 'low' as const
      });
    }
  } else {
    issues.push({
      type: 'error' as const,
      message: `Conteúdo muito curto (${wordCount} palavras)`,
      priority: 'high' as const,
      recommendation: 'Adicione mais conteúdo relevante (mínimo 300 palavras)'
    });
  }

  // Check heading hierarchy
  if (h2Matches.length > 0) {
    score += 25;
    issues.push({
      type: 'success' as const,
      message: `${h2Matches.length} subtítulos H2 encontrados`,
      priority: 'low' as const
    });
  } else {
    issues.push({
      type: 'warning' as const,
      message: 'Nenhum subtítulo H2 encontrado',
      priority: 'medium' as const,
      recommendation: 'Adicione subtítulos H2 para melhor estrutura'
    });
  }

  if (h3Matches.length > 0) {
    score += 15;
    issues.push({
      type: 'success' as const,
      message: `${h3Matches.length} subtítulos H3 encontrados`,
      priority: 'low' as const
    });
  }

  // Check for lists and structured content
  const hasLists = textContent.includes('•') || textContent.includes('1.') || textContent.includes('-');
  if (hasLists) {
    score += 10;
    issues.push({
      type: 'success' as const,
      message: 'Conteúdo estruturado com listas encontrado',
      priority: 'low' as const
    });
  } else {
    issues.push({
      type: 'warning' as const,
      message: 'Nenhuma lista ou conteúdo estruturado encontrado',
      priority: 'medium' as const,
      recommendation: 'Adicione listas e estruture melhor o conteúdo'
    });
  }

  return {
    category: 'content_structure',
    score: Math.max(0, score),
    status: score >= 90 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'needs_improvement' : 'critical',
    issues
  };
}

function analyzeLinks(internalLinks: number, externalLinks: number, linkMatches: string[], url: string): AuditCategory {
  const issues = [];
  let score = 0;
  const totalLinks = internalLinks + externalLinks;

  // Check internal links
  if (internalLinks >= 3) {
    score += 40;
    issues.push({
      type: 'success' as const,
      message: `${internalLinks} links internos encontrados`,
      priority: 'low' as const
    });
  } else if (internalLinks > 0) {
    score += 20;
    issues.push({
      type: 'warning' as const,
      message: `Apenas ${internalLinks} links internos encontrados`,
      priority: 'medium' as const,
      recommendation: 'Adicione mais links internos para outras páginas relevantes'
    });
  } else {
    issues.push({
      type: 'error' as const,
      message: 'Nenhum link interno encontrado',
      priority: 'high' as const,
      recommendation: 'Adicione links internos para outras páginas do seu site'
    });
  }

  // Check external links
  if (externalLinks >= 1 && externalLinks <= 5) {
    score += 30;
    issues.push({
      type: 'success' as const,
      message: `${externalLinks} links externos encontrados`,
      priority: 'low' as const
    });
  } else if (externalLinks > 5) {
    score += 15;
    issues.push({
      type: 'warning' as const,
      message: `Muitos links externos (${externalLinks})`,
      priority: 'medium' as const,
      recommendation: 'Considere reduzir o número de links externos'
    });
  } else {
    issues.push({
      type: 'warning' as const,
      message: 'Nenhum link externo encontrado',
      priority: 'medium' as const,
      recommendation: 'Adicione links para fontes confiáveis e relevantes'
    });
  }

  // Check for anchor text analysis
  const hasDescriptiveAnchors = linkMatches.some(link => 
    !link.includes('clique aqui') && !link.includes('saiba mais') && !link.includes('leia mais')
  );
  
  if (hasDescriptiveAnchors || totalLinks === 0) {
    score += 30;
    if (totalLinks > 0) {
      issues.push({
        type: 'success' as const,
        message: 'Anchor texts descritivos detectados',
        priority: 'low' as const
      });
    }
  } else {
    issues.push({
      type: 'warning' as const,
      message: 'Alguns anchor texts podem ser mais descritivos',
      priority: 'medium' as const,
      recommendation: 'Use textos descritivos em vez de "clique aqui" ou "saiba mais"'
    });
  }

  return {
    category: 'links_analysis',
    score: Math.max(0, score),
    status: score >= 90 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'needs_improvement' : 'critical',
    issues
  };
}

function analyzeTechnicalSEO(html: string, url: string): AuditCategory {
  const issues = [];
  let score = 0;

  // Check for Schema markup
  const hasSchema = html.includes('application/ld+json') || html.includes('schema.org');
  if (hasSchema) {
    score += 25;
    issues.push({
      type: 'success' as const,
      message: 'Schema markup detectado',
      priority: 'low' as const
    });
  } else {
    issues.push({
      type: 'warning' as const,
      message: 'Nenhum Schema markup encontrado',
      priority: 'medium' as const,
      recommendation: 'Adicione Schema markup para melhor compreensão pelos buscadores'
    });
  }

  // Check for canonical URL
  const hasCanonical = html.includes('rel="canonical"');
  if (hasCanonical) {
    score += 20;
    issues.push({
      type: 'success' as const,
      message: 'Tag canonical encontrada',
      priority: 'low' as const
    });
  } else {
    issues.push({
      type: 'warning' as const,
      message: 'Tag canonical não encontrada',
      priority: 'medium' as const,
      recommendation: 'Adicione uma tag canonical para evitar conteúdo duplicado'
    });
  }

  // Check for Open Graph tags
  const hasOG = html.includes('property="og:') || html.includes('property=\'og:');
  if (hasOG) {
    score += 20;
    issues.push({
      type: 'success' as const,
      message: 'Meta tags Open Graph encontradas',
      priority: 'low' as const
    });
  } else {
    issues.push({
      type: 'warning' as const,
      message: 'Meta tags Open Graph não encontradas',
      priority: 'medium' as const,
      recommendation: 'Adicione meta tags Open Graph para melhor compartilhamento em redes sociais'
    });
  }

  // Check for Twitter Cards
  const hasTwitter = html.includes('name="twitter:') || html.includes('name=\'twitter:');
  if (hasTwitter) {
    score += 15;
    issues.push({
      type: 'success' as const,
      message: 'Twitter Cards encontrados',
      priority: 'low' as const
    });
  } else {
    issues.push({
      type: 'warning' as const,
      message: 'Twitter Cards não encontrados',
      priority: 'low' as const,
      recommendation: 'Adicione Twitter Cards para melhor compartilhamento no Twitter'
    });
  }

  // Check for robots meta tag
  const hasRobots = html.includes('name="robots"') || html.includes('name=\'robots\'');
  if (hasRobots) {
    score += 10;
    issues.push({
      type: 'success' as const,
      message: 'Meta tag robots encontrada',
      priority: 'low' as const
    });
  } else {
    issues.push({
      type: 'warning' as const,
      message: 'Meta tag robots não especificada',
      priority: 'low' as const,
      recommendation: 'Considere adicionar meta tag robots para controlar indexação'
    });
  }

  // Check HTTPS
  if (url.startsWith('https://')) {
    score += 10;
    issues.push({
      type: 'success' as const,
      message: 'Site usa HTTPS',
      priority: 'low' as const
    });
  } else {
    issues.push({
      type: 'error' as const,
      message: 'Site não usa HTTPS',
      priority: 'high' as const,
      recommendation: 'Implemente HTTPS para segurança e melhor ranking'
    });
  }

  return {
    category: 'technical_seo',
    score: Math.max(0, score),
    status: score >= 90 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'needs_improvement' : 'critical',
    issues
  };
}

function analyzeReadability(textContent: string): AuditCategory {
  const issues = [];
  let score = 0;
  
  const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = textContent.split(/\s+/).filter(w => w.length > 0);
  const avgWordsPerSentence = words.length / sentences.length;
  
  // Check average sentence length
  if (avgWordsPerSentence <= 20) {
    score += 30;
    issues.push({
      type: 'success' as const,
      message: `Sentenças com tamanho adequado (média: ${avgWordsPerSentence.toFixed(1)} palavras)`,
      priority: 'low' as const
    });
  } else {
    issues.push({
      type: 'warning' as const,
      message: `Sentenças muito longas (média: ${avgWordsPerSentence.toFixed(1)} palavras)`,
      priority: 'medium' as const,
      recommendation: 'Use sentenças mais curtas para melhor legibilidade'
    });
  }

  // Check for transition words
  const transitionWords = ['além disso', 'por outro lado', 'portanto', 'assim', 'contudo', 'entretanto', 'finalmente', 'primeiro', 'segundo', 'terceiro'];
  const hasTransitions = transitionWords.some(word => textContent.toLowerCase().includes(word));
  
  if (hasTransitions) {
    score += 30;
    issues.push({
      type: 'success' as const,
      message: 'Palavras de transição encontradas',
      priority: 'low' as const
    });
  } else {
    issues.push({
      type: 'warning' as const,
      message: 'Poucas palavras de transição encontradas',
      priority: 'medium' as const,
      recommendation: 'Use palavras de transição para conectar ideias (além disso, portanto, contudo, etc.)'
    });
  }

  // Check paragraph structure
  const paragraphs = textContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const avgWordsPerParagraph = words.length / paragraphs.length;
  
  if (avgWordsPerParagraph <= 150) {
    score += 40;
    issues.push({
      type: 'success' as const,
      message: `Parágrafos com tamanho adequado (média: ${avgWordsPerParagraph.toFixed(0)} palavras)`,
      priority: 'low' as const
    });
  } else {
    issues.push({
      type: 'warning' as const,
      message: `Parágrafos muito longos (média: ${avgWordsPerParagraph.toFixed(0)} palavras)`,
      priority: 'medium' as const,
      recommendation: 'Divida parágrafos longos em parágrafos menores'
    });
  }

  return {
    category: 'readability',
    score: Math.max(0, score),
    status: score >= 90 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'needs_improvement' : 'critical',
    issues
  };
}

function analyzeAISearchOptimization(textContent: string, title: string, metaDesc: string, url: string): AuditCategory {
  const issues = [];
  let score = 0;
  
  // Extract keywords from content
  const keywords = extractKeywords(textContent, title, metaDesc);
  const prompts = generateAIPrompts(keywords, textContent, url);
  
  // Analyze content structure for AI optimization
  const hasStructuredContent = checkStructuredContent(textContent);
  const hasFAQ = textContent.toLowerCase().includes('pergunta') || textContent.toLowerCase().includes('faq') || textContent.toLowerCase().includes('dúvida');
  const hasActionableContent = checkActionableContent(textContent);
  
  // Scoring based on AI-friendliness
  if (keywords.length >= 10) {
    score += 25;
    issues.push({
      type: 'success' as const,
      message: `${keywords.length} termos-chave identificados`,
      priority: 'low' as const
    });
  } else {
    issues.push({
      type: 'warning' as const,
      message: `Apenas ${keywords.length} termos-chave identificados`,
      priority: 'medium' as const,
      recommendation: 'Adicione mais conteúdo relevante com termos-chave específicos'
    });
  }
  
  if (hasStructuredContent) {
    score += 25;
    issues.push({
      type: 'success' as const,
      message: 'Conteúdo bem estruturado para IAs',
      priority: 'low' as const
    });
  } else {
    issues.push({
      type: 'warning' as const,
      message: 'Conteúdo pouco estruturado',
      priority: 'medium' as const,
      recommendation: 'Use listas, subtítulos e parágrafos bem organizados'
    });
  }
  
  if (hasFAQ) {
    score += 25;
    issues.push({
      type: 'success' as const,
      message: 'Seção FAQ identificada',
      priority: 'low' as const
    });
  } else {
    issues.push({
      type: 'warning' as const,
      message: 'Sem seção FAQ identificada',
      priority: 'medium' as const,
      recommendation: 'Adicione uma seção FAQ para melhorar a descoberta por IAs'
    });
  }
  
  if (hasActionableContent) {
    score += 25;
    issues.push({
      type: 'success' as const,
      message: 'Conteúdo acionável identificado',
      priority: 'low' as const
    });
  } else {
    issues.push({
      type: 'warning' as const,
      message: 'Pouco conteúdo acionável',
      priority: 'medium' as const,
      recommendation: 'Adicione mais instruções, guias e soluções práticas'
    });
  }
  
  // Add AI prompts and keywords as metadata
  issues.push({
    type: 'success' as const,
    message: `Prompts sugeridos: ${prompts.slice(0, 3).join('; ')}`,
    priority: 'low' as const,
    recommendation: `Termos identificados: ${keywords.slice(0, 10).join(', ')}`
  });
  
  return {
    category: 'ai_search_optimization',
    score: Math.max(0, score),
    status: score >= 90 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'needs_improvement' : 'critical',
    issues
  };
}

function extractKeywords(textContent: string, title: string, metaDesc: string): string[] {
  const combinedText = `${title} ${metaDesc} ${textContent}`.toLowerCase();
  
  // Common Portuguese stop words
  const stopWords = new Set([
    'a', 'e', 'o', 'de', 'da', 'do', 'para', 'com', 'em', 'na', 'no', 'por', 'que', 'se', 'um', 'uma',
    'os', 'as', 'dos', 'das', 'nos', 'nas', 'pelo', 'pela', 'pelos', 'pelas', 'ao', 'aos', 'à', 'às',
    'este', 'esta', 'estes', 'estas', 'esse', 'essa', 'esses', 'essas', 'aquele', 'aquela', 'aqueles', 'aquelas',
    'seu', 'sua', 'seus', 'suas', 'nosso', 'nossa', 'nossos', 'nossas', 'meu', 'minha', 'meus', 'minhas',
    'ele', 'ela', 'eles', 'elas', 'você', 'vocês', 'nós', 'eu', 'tu', 'mas', 'mais', 'muito', 'bem', 'já',
    'ainda', 'onde', 'como', 'quando', 'porque', 'então', 'assim', 'também', 'só', 'até', 'depois', 'antes'
  ]);
  
  // Extract words and clean them
  const words = combinedText
    .replace(/[^a-záàâãéêíóôõúç\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 3 && !stopWords.has(word))
    .filter(word => !/^\d+$/.test(word)); // Remove pure numbers
  
  // Count frequency
  const wordCount = new Map<string, number>();
  words.forEach(word => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  });
  
  // Return top keywords sorted by frequency
  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
}

function generateAIPrompts(keywords: string[], textContent: string, url: string): string[] {
  const domain = url.replace(/https?:\/\//, '').split('/')[0];
  const prompts = [];
  
  // Generate different types of prompts
  if (keywords.length > 0) {
    const topKeywords = keywords.slice(0, 5);
    
    // Problem-solution prompts
    prompts.push(`Onde encontrar ${topKeywords[0]} profissional?`);
    prompts.push(`Como escolher ${topKeywords[0]} de qualidade?`);
    prompts.push(`Melhor empresa de ${topKeywords[0]}`);
    
    // Service-based prompts
    if (textContent.toLowerCase().includes('serviço') || textContent.toLowerCase().includes('consultoria')) {
      prompts.push(`Serviços de ${topKeywords[0]} confiáveis`);
      prompts.push(`Consultoria especializada em ${topKeywords[0]}`);
    }
    
    // Location-based prompts (if location detected)
    const locationWords = ['brasil', 'são paulo', 'rio', 'belo horizonte', 'brasília'];
    const hasLocation = locationWords.some(loc => textContent.toLowerCase().includes(loc));
    if (hasLocation) {
      prompts.push(`${topKeywords[0]} no Brasil`);
    }
    
    // Comparison prompts
    prompts.push(`Comparar empresas de ${topKeywords[0]}`);
    prompts.push(`${topKeywords[0]}: qual a melhor opção?`);
    
    // Educational prompts
    prompts.push(`Guia completo sobre ${topKeywords[0]}`);
    prompts.push(`Como funciona ${topKeywords[0]}?`);
  }
  
  return prompts.slice(0, 8);
}

function checkStructuredContent(textContent: string): boolean {
  const indicators = [
    /\d+\.\s/, // Numbered lists
    /•\s/, // Bullet points
    /\n\s*-\s/, // Dashed lists
    /:\s*\n/, // Colons followed by newlines
    /(como|passo|etapa|fase)/i // Step indicators
  ];
  
  return indicators.some(pattern => pattern.test(textContent));
}

function checkActionableContent(textContent: string): boolean {
  const actionWords = [
    'como', 'faça', 'siga', 'implemente', 'aplique', 'execute', 'realize', 'configure',
    'instale', 'baixe', 'acesse', 'clique', 'selecione', 'escolha', 'defina', 'ajuste',
    'passo', 'etapa', 'guia', 'tutorial', 'instruções', 'procedimento'
  ];
  
  const lowerText = textContent.toLowerCase();
  return actionWords.some(word => lowerText.includes(word));
}