import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts"

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

    // Get PageSpeed Insights data (desktop and mobile)
    const pageSpeedData = await getPageSpeedInsights(validation.normalizedUrl);
    
    if (pageSpeedData.desktop || pageSpeedData.mobile) {
      console.log(`✅ PageSpeed Insights data received successfully`);
    } else {
      console.log(`⚠️  PageSpeed Insights data not available, continuing with HTML analysis only`);
    }
    
    // Combine all analyses
    console.log(`🔄 Combining analyses...`);
    const categories = combineAnalyses(htmlAnalysis, pageSpeedData, url);
    
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

  // Use DOMParser for better HTML parsing
  const doc = new DOMParser().parseFromString(html, 'text/html');
  
  // Extract basic information
  const title = doc.querySelector('title')?.textContent?.trim() || '';
  const metaDescription = doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '';
  const h1Tags = Array.from(doc.querySelectorAll('h1'));
  const h2Tags = Array.from(doc.querySelectorAll('h2'));
  const h3Tags = Array.from(doc.querySelectorAll('h3'));
  const h4Tags = Array.from(doc.querySelectorAll('h4'));
  const h5Tags = Array.from(doc.querySelectorAll('h5'));
  const h6Tags = Array.from(doc.querySelectorAll('h6'));
  const images = Array.from(doc.querySelectorAll('img'));
  const links = Array.from(doc.querySelectorAll('a'));
  
  const textContent = extractTextContent(html);
  const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;

  // Calculate link statistics
  const hostname = new URL(url).hostname;
  const internalLinks = links.filter(link => {
    const href = link.getAttribute('href') || '';
    return href.includes(hostname) || href.startsWith('/') || href.startsWith('#');
  }).length;
  const externalLinks = links.length - internalLinks;

  // Meta Tags Analysis - 4 validation points
  const metaIssues = [];
  let metaScore = 100;
  
  if (!title) {
    metaIssues.push({
      type: 'error' as const,
      message: 'Título da página ausente',
      priority: 'high' as const,
      recommendation: 'Adicione uma tag de título descritiva à sua página'
    });
    metaScore -= 30;
  } else if (title.length > 60) {
    metaIssues.push({
      type: 'warning' as const,
      message: `Título muito longo (${title.length} caracteres, recomendado: até 60)`,
      priority: 'medium' as const,
      recommendation: 'Mantenha o título abaixo de 60 caracteres para melhor exibição nos buscadores'
    });
    metaScore -= 15;
  } else if (title.length < 30) {
    metaIssues.push({
      type: 'warning' as const,
      message: `Título muito curto (${title.length} caracteres, recomendado: 30-60)`,
      priority: 'medium' as const,
      recommendation: 'Títulos entre 30-60 caracteres são mais efetivos'
    });
    metaScore -= 10;
  } else {
    metaIssues.push({
      type: 'success' as const,
      message: `Título adequado (${title.length} caracteres)`,
      priority: 'low' as const
    });
  }

  if (!metaDescription) {
    metaIssues.push({
      type: 'error' as const,
      message: 'Meta description ausente',
      priority: 'high' as const,
      recommendation: 'Adicione uma meta description entre 120-160 caracteres'
    });
    metaScore -= 30;
  } else if (metaDescription.length > 160) {
    metaIssues.push({
      type: 'warning' as const,
      message: `Meta description muito longa (${metaDescription.length} caracteres, recomendado: até 160)`,
      priority: 'medium' as const,
      recommendation: 'Mantenha a meta description abaixo de 160 caracteres'
    });
    metaScore -= 15;
  } else if (metaDescription.length < 120) {
    metaIssues.push({
      type: 'warning' as const,
      message: `Meta description muito curta (${metaDescription.length} caracteres, recomendado: 120-160)`,
      priority: 'medium' as const,
      recommendation: 'Meta descriptions entre 120-160 caracteres são mais efetivas'
    });
    metaScore -= 10;
  } else {
    metaIssues.push({
      type: 'success' as const,
      message: `Meta description adequada (${metaDescription.length} caracteres)`,
      priority: 'low' as const
    });
  }

  // Check for focus keyword in title and meta description if provided
  if (focusKeyword) {
    const keywordLower = focusKeyword.toLowerCase();
    if (title.toLowerCase().includes(keywordLower)) {
      metaIssues.push({
        type: 'success' as const,
        message: `Palavra-chave "${focusKeyword}" encontrada no título`,
        priority: 'low' as const
      });
    } else {
      metaIssues.push({
        type: 'warning' as const,
        message: `Palavra-chave "${focusKeyword}" não encontrada no título`,
        priority: 'medium' as const,
        recommendation: `Inclua "${focusKeyword}" no título para melhor otimização`
      });
      metaScore -= 20;
    }

    if (metaDescription.toLowerCase().includes(keywordLower)) {
      metaIssues.push({
        type: 'success' as const,
        message: `Palavra-chave "${focusKeyword}" encontrada na meta description`,
        priority: 'low' as const
      });
    } else {
      metaIssues.push({
        type: 'warning' as const,
        message: `Palavra-chave "${focusKeyword}" não encontrada na meta description`,
        priority: 'medium' as const,
        recommendation: `Inclua "${focusKeyword}" na meta description`
      });
      metaScore -= 20;
    }
  }

  categories.push({
    category: 'meta_tags',
    score: Math.max(0, metaScore),
    status: metaScore >= 90 ? 'excellent' : metaScore >= 70 ? 'good' : metaScore >= 50 ? 'needs_improvement' : 'critical',
    issues: metaIssues
  });

  // HTML Structure Analysis - Complete heading hierarchy with 5+ validation points
  const htmlStructureIssues = [];
  let htmlStructureScore = 100;
  let headingHierarchy = [];
  
  // Check DOCTYPE
  if (!html.toLowerCase().includes('<!doctype html>')) {
    htmlStructureIssues.push({
      type: 'warning' as const,
      message: 'DOCTYPE HTML5 não declarado',
      priority: 'medium' as const,
      recommendation: 'Adicione <!DOCTYPE html> no início do documento'
    });
    htmlStructureScore -= 15;
  }
  
  // Check lang attribute
  const htmlTag = doc.querySelector('html');
  if (!htmlTag?.getAttribute('lang')) {
    htmlStructureIssues.push({
      type: 'warning' as const,
      message: 'Atributo lang não definido na tag HTML',
      priority: 'medium' as const,
      recommendation: 'Adicione lang="pt-BR" na tag HTML'
    });
    htmlStructureScore -= 15;
  }
  
  // H1 validation
  if (h1Tags.length === 0) {
    htmlStructureIssues.push({
      type: 'error' as const,
      message: 'Nenhuma tag H1 encontrada',
      priority: 'high' as const,
      recommendation: 'Adicione exatamente uma tag H1 à sua página'
    });
    htmlStructureScore -= 30;
  } else if (h1Tags.length > 1) {
    htmlStructureIssues.push({
      type: 'warning' as const,
      message: `Múltiplas tags H1 encontradas (${h1Tags.length})`,
      priority: 'medium' as const,
      recommendation: 'Use apenas uma tag H1 por página'
    });
    htmlStructureScore -= 20;
  } else {
    const h1Text = h1Tags[0].textContent?.trim() || 'Vazio';
    headingHierarchy.push(`H1: "${h1Text}"`);
    htmlStructureIssues.push({
      type: 'success' as const,
      message: `H1 único encontrado: "${h1Text}"`,
      priority: 'low' as const
    });
  }
  
  // Display heading structure
  if (h2Tags.length > 0) {
    h2Tags.slice(0, 5).forEach((h2, index) => {
      if (index < 3) {
        headingHierarchy.push(`H2: "${h2.textContent?.trim() || 'Vazio'}"`);
      }
    });
    htmlStructureIssues.push({
      type: 'success' as const,
      message: `${h2Tags.length} subtítulos H2 encontrados`,
      priority: 'low' as const
    });
  } else if (wordCount > 300) {
    htmlStructureIssues.push({
      type: 'warning' as const,
      message: 'Nenhuma tag H2 encontrada para estruturar o conteúdo',
      priority: 'medium' as const,
      recommendation: 'Adicione subtítulos H2 para melhor estrutura'
    });
    htmlStructureScore -= 20;
  }
  
  if (h3Tags.length > 0) {
    htmlStructureIssues.push({
      type: 'success' as const,
      message: `${h3Tags.length} subtítulos H3 encontrados`,
      priority: 'low' as const
    });
  }
  
  // Display other headings summary
  const otherHeadings = h4Tags.length + h5Tags.length + h6Tags.length;
  if (otherHeadings > 0) {
    htmlStructureIssues.push({
      type: 'success' as const,
      message: `Outros headings: H4(${h4Tags.length}), H5(${h5Tags.length}), H6(${h6Tags.length})`,
      priority: 'low' as const
    });
  }
  
  // Check semantic HTML
  const semanticTags = ['main', 'article', 'section', 'header', 'footer', 'nav', 'aside'];
  const foundSemanticTags = semanticTags.filter(tag => doc.querySelector(tag));
  if (foundSemanticTags.length < 3) {
    htmlStructureIssues.push({
      type: 'warning' as const,
      message: `Poucas tags semânticas (${foundSemanticTags.length}/7): ${foundSemanticTags.join(', ')}`,
      priority: 'medium' as const,
      recommendation: 'Use mais tags semânticas como main, article, section, header, footer'
    });
    htmlStructureScore -= 10;
  } else {
    htmlStructureIssues.push({
      type: 'success' as const,
      message: `Tags semânticas encontradas: ${foundSemanticTags.join(', ')}`,
      priority: 'low' as const
    });
  }
  
  // Add heading hierarchy to first issue if structure is good
  if (headingHierarchy.length > 0 && htmlStructureScore >= 80) {
    htmlStructureIssues.unshift({
      type: 'success' as const,
      message: `Hierarquia: ${headingHierarchy.slice(0, 4).join('; ')}${headingHierarchy.length > 4 ? '...' : ''}`,
      priority: 'low' as const
    });
  }

  categories.push({
    category: 'html_structure',
    score: Math.max(0, htmlStructureScore),
    status: htmlStructureScore >= 90 ? 'excellent' : htmlStructureScore >= 70 ? 'good' : htmlStructureScore >= 50 ? 'needs_improvement' : 'critical',
    issues: htmlStructureIssues
  });

  // Images Analysis - 3+ validation points
  const imageIssues = [];
  let imageScore = 100;
  
  if (images.length === 0) {
    imageIssues.push({
      type: 'warning' as const,
      message: 'Nenhuma imagem encontrada na página',
      priority: 'medium' as const,
      recommendation: 'Considere adicionar imagens relevantes para melhorar o engajamento'
    });
    imageScore = 70; // Not completely bad, just missing opportunity
  } else {
    const imagesWithoutAlt = images.filter(img => !img.getAttribute('alt') || img.getAttribute('alt').trim() === '');
    
    if (imagesWithoutAlt.length > 0) {
      const fileNames = imagesWithoutAlt
        .map(img => {
          const src = img.getAttribute('src') || '';
          const fileName = src.split('/').pop() || src;
          return fileName;
        })
        .slice(0, 5) // Limit to 5 files
        .join(', ');
      
      imageIssues.push({
        type: 'error' as const,
        message: `${imagesWithoutAlt.length} imagens sem atributo alt: ${fileNames}${imagesWithoutAlt.length > 5 ? '...' : ''}`,
        priority: 'high' as const,
        recommendation: 'Adicione atributos alt descritivos a todas as imagens para acessibilidade e SEO'
      });
      imageScore -= Math.min(60, imagesWithoutAlt.length * 15);
    }
    
    // Check for images with good alt attributes
    const imagesWithGoodAlt = images.filter(img => {
      const alt = img.getAttribute('alt') || '';
      return alt.trim().length > 5 && alt.trim().length < 125;
    });
    
    if (imagesWithGoodAlt.length > 0) {
      imageIssues.push({
        type: 'success' as const,
        message: `${imagesWithGoodAlt.length} imagens com bons atributos alt`,
        priority: 'low' as const
      });
    }
    
    // Check for large images that might need optimization
    const largeImages = images.filter(img => {
      const src = img.getAttribute('src') || '';
      return src.includes('.jpg') || src.includes('.jpeg') || src.includes('.png');
    });
    
    if (largeImages.length > 0) {
      imageIssues.push({
        type: 'success' as const,
        message: `${largeImages.length} imagens bitmap encontradas - verifique otimização`,
        priority: 'low' as const,
        recommendation: 'Certifique-se de que imagens estão otimizadas para web'
      });
    }
    
    if (imagesWithoutAlt.length === 0) {
      imageIssues.push({
        type: 'success' as const,
        message: `Todas as ${images.length} imagens possuem atributos alt adequados`,
        priority: 'low' as const
      });
    }
  }

  categories.push({
    category: 'images',
    score: Math.max(0, imageScore),
    status: imageScore >= 90 ? 'excellent' : imageScore >= 70 ? 'good' : imageScore >= 50 ? 'needs_improvement' : 'critical',
    issues: imageIssues
  });

  // Keyword Analysis (if focus keyword provided)
  if (focusKeyword) {
    const keywordAnalysis = analyzeKeywordOptimization(textContent, title, metaDescription, url, focusKeyword);
    categories.push(keywordAnalysis);
  }

  // Content Structure Analysis - focusing only on content organization
  const contentStructure = analyzeContentStructure(textContent, wordCount);
  categories.push(contentStructure);

  // Links Analysis 
  const linksAnalysis = analyzeLinks(internalLinks, externalLinks, links, url);
  categories.push(linksAnalysis);

  // Technical SEO Analysis
  const technicalAnalysis = analyzeTechnicalSEO(html, url);
  categories.push(technicalAnalysis);

  // Readability Analysis
  const readabilityAnalysis = analyzeReadability(textContent);
  categories.push(readabilityAnalysis);

  // AI Search Optimization Analysis
  const aiSearchAnalysis = analyzeAISearchOptimization(textContent, title, metaDescription, url);
  categories.push(aiSearchAnalysis);

  return categories;
}

async function getPageSpeedInsights(url: string): Promise<{ desktop: PageSpeedInsightsResponse | null; mobile: PageSpeedInsightsResponse | null }> {
  try {
    const apiKey = Deno.env.get('GOOGLE_PAGESPEED_API_KEY');
    if (!apiKey) {
      console.log('PageSpeed API key not found, skipping PageSpeed analysis');
      return { desktop: null, mobile: null };
    }

    // Desktop analysis
    const desktopUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=desktop&category=performance&category=accessibility&category=best-practices&category=seo`;
    
    // Mobile analysis
    const mobileUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=mobile&category=performance&category=accessibility&category=best-practices&category=seo`;
    
    console.log('Calling PageSpeed Insights API for desktop and mobile...');
    
    const [desktopResponse, mobileResponse] = await Promise.all([
      fetch(desktopUrl),
      fetch(mobileUrl)
    ]);
    
    let desktopData = null;
    let mobileData = null;
    
    if (desktopResponse.ok) {
      desktopData = await desktopResponse.json();
      console.log('Desktop PageSpeed data received successfully');
    } else {
      console.error(`Desktop PageSpeed API error: ${desktopResponse.status}`);
    }
    
    if (mobileResponse.ok) {
      mobileData = await mobileResponse.json();
      console.log('Mobile PageSpeed data received successfully');
    } else {
      console.error(`Mobile PageSpeed API error: ${mobileResponse.status}`);
    }
    
    return { desktop: desktopData, mobile: mobileData };
  } catch (error) {
    console.error('Error calling PageSpeed Insights:', error);
    return { desktop: null, mobile: null };
  }
}

function combineAnalyses(htmlAnalysis: AuditCategory[], pageSpeedData: { desktop: PageSpeedInsightsResponse | null; mobile: PageSpeedInsightsResponse | null }, originalUrl: string): AuditCategory[] {
  let categories = [...htmlAnalysis];

  // Add Performance category (prioritizing desktop data, fallback to mobile)
  const performanceData = pageSpeedData.desktop || pageSpeedData.mobile;
  if (performanceData?.lighthouseResult?.categories?.performance) {
    const lighthouse = performanceData.lighthouseResult;
    const performanceScore = Math.round(lighthouse.categories.performance.score * 100);
    
    // Extract Core Web Vitals metrics
    const audits = lighthouse.audits || {};
    const metrics = [];
    
    if (audits['largest-contentful-paint']) {
      const lcp = audits['largest-contentful-paint'].displayValue;
      metrics.push(`LCP: ${lcp}`);
    }
    
    if (audits['first-input-delay']) {
      const fid = audits['first-input-delay'].displayValue;
      metrics.push(`FID: ${fid}`);
    }
    
    if (audits['cumulative-layout-shift']) {
      const cls = audits['cumulative-layout-shift'].displayValue;
      metrics.push(`CLS: ${cls}`);
    }
    
    const pageSpeedUrl = `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(originalUrl)}`;
    
    const performanceIssues = [{
      type: performanceScore >= 80 ? 'success' : performanceScore >= 50 ? 'warning' : 'error',
      message: `Performance score: ${performanceScore}/100` + (metrics.length > 0 ? ` (${metrics.join(', ')})` : ''),
      priority: performanceScore >= 90 ? 'medium' : 'high', // Performance always medium/high priority
      recommendation: performanceScore < 80 ? `Performance is critical for SEO and user experience. Optimize images, reduce JavaScript, improve server response times, and address Core Web Vitals. 📊 <a href="${pageSpeedUrl}" target="_blank" rel="noopener">Ver detalhes no PageSpeed Insights</a>` : 'Good performance! Monitor Core Web Vitals regularly.'
    }];
    
    categories.push({
      category: 'performance',
      score: performanceScore,
      status: performanceScore >= 80 ? 'excellent' : performanceScore >= 60 ? 'good' : performanceScore >= 40 ? 'needs_improvement' : 'critical',
      issues: performanceIssues
    });
  }

  // Add Mobile-Friendly category (using mobile data)
  if (pageSpeedData.mobile?.lighthouseResult) {
    const mobileLighthouse = pageSpeedData.mobile.lighthouseResult;
    let mobileScore = 0;
    let mobileIssues = [];
    
    // Calculate mobile score based on multiple factors
    const factors = [];
    
    if (mobileLighthouse.categories.performance) {
      const mobilePerf = Math.round(mobileLighthouse.categories.performance.score * 100);
      factors.push(mobilePerf);
    }
    
    if (mobileLighthouse.categories.accessibility) {
      const mobileAccess = Math.round(mobileLighthouse.categories.accessibility.score * 100);
      factors.push(mobileAccess);
    }
    
    if (mobileLighthouse.categories['best-practices']) {
      const mobileBP = Math.round(mobileLighthouse.categories['best-practices'].score * 100);
      factors.push(mobileBP);
    }
    
    // Average of available factors
    if (factors.length > 0) {
      mobileScore = Math.round(factors.reduce((a, b) => a + b, 0) / factors.length);
    }
    
    // Check for mobile-specific issues
    const audits = mobileLighthouse.audits || {};
    if (audits['viewport']) {
      const viewportPassed = audits['viewport'].score === 1;
      if (!viewportPassed) {
        mobileIssues.push({
          type: 'error',
          message: 'Missing or incorrect viewport meta tag',
          priority: 'high',
          recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to your HTML head'
        });
      }
    }
    
    if (audits['tap-targets']) {
      const tapTargetsPassed = audits['tap-targets'].score === 1;
      if (!tapTargetsPassed) {
        mobileIssues.push({
          type: 'warning',
          message: 'Touch targets are too small or too close together',
          priority: 'high',
          recommendation: 'Ensure tap targets are at least 48px and have sufficient spacing'
        });
      }
    }
    
    if (mobileIssues.length === 0) {
      mobileIssues.push({
        type: mobileScore >= 95 ? 'success' : mobileScore >= 80 ? 'warning' : 'error',
        message: `Mobile experience score: ${mobileScore}/100`,
        priority: mobileScore >= 95 ? 'medium' : 'high', // Mobile always medium/high priority
        recommendation: mobileScore < 95 ? 'Mobile-first indexing makes mobile optimization critical for SEO. Improve mobile performance, touch targets, and viewport configuration.' : 'Excellent mobile experience!'
      });
    }
    
    categories.push({
      category: 'mobile_friendly',
      score: mobileScore,
      status: mobileScore >= 95 ? 'excellent' : mobileScore >= 80 ? 'good' : mobileScore >= 60 ? 'needs_improvement' : 'critical',
      issues: mobileIssues
    });
  } else {
    // Fallback when no mobile data is available
    categories.push({
      category: 'mobile_friendly',
      score: 0,
      status: 'critical',
      issues: [{
        type: 'error',
        message: 'Unable to analyze mobile-friendliness',
        priority: 'high',
        recommendation: 'Mobile optimization is critical for SEO due to mobile-first indexing. Check if the URL is accessible and try again'
      }]
    });
  }

  // Add placeholder performance category if no data available
  if (!pageSpeedData.desktop && !pageSpeedData.mobile) {
    categories.push({
      category: 'performance',
      score: 0,
      status: 'critical',
      issues: [{
        type: 'error',
        message: 'Unable to analyze performance',
        priority: 'high',
        recommendation: 'Performance is critical for SEO rankings and user experience. Check if the URL is accessible and try again'
      }]
    });
  }

  return categories;
}

function extractTextContent(html: string): string {
  // Remove script and style elements
  let cleanHtml = html.replace(/<script[^>]*>.*?<\/script>/gis, '');
  cleanHtml = cleanHtml.replace(/<style[^>]*>.*?<\/style>/gis, '');
  
  // Convert block elements to paragraph breaks
  cleanHtml = cleanHtml.replace(/<\/(p|div|section|article|h[1-6]|li)>/gi, '\n\n');
  cleanHtml = cleanHtml.replace(/<br\s*\/?>/gi, '\n');
  
  // Remove remaining HTML tags
  cleanHtml = cleanHtml.replace(/<[^>]+>/g, ' ');
  
  // Clean up whitespace but preserve paragraph breaks
  cleanHtml = cleanHtml.replace(/[ \t]+/g, ' '); // Convert multiple spaces/tabs to single space
  cleanHtml = cleanHtml.replace(/\n\s*\n/g, '\n\n'); // Normalize paragraph breaks
  cleanHtml = cleanHtml.trim();
  
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

function analyzeContentStructure(textContent: string, wordCount: number): AuditCategory {
  const issues = [];
  let score = 0;

  // Check content length
  if (wordCount >= 600) {
    score += 40;
    issues.push({
      type: 'success' as const,
      message: `Conteúdo com ${wordCount} palavras (excelente para SEO)`,
      priority: 'low' as const
    });
  } else if (wordCount >= 300) {
    score += 25;
    issues.push({
      type: 'success' as const,
      message: `Conteúdo com ${wordCount} palavras (adequado)`,
      priority: 'low' as const
    });
  } else if (wordCount >= 150) {
    issues.push({
      type: 'warning' as const,
      message: `Conteúdo curto (${wordCount} palavras)`,
      priority: 'medium' as const,
      recommendation: 'Adicione mais conteúdo relevante (recomendado: mínimo 300 palavras)'
    });
  } else {
    issues.push({
      type: 'error' as const,
      message: `Conteúdo muito curto (${wordCount} palavras)`,
      priority: 'high' as const,
      recommendation: 'Adicione significativamente mais conteúdo relevante (mínimo 300 palavras)'
    });
  }

  // Check for lists and structured content
  const lists = textContent.match(/<ul|<ol|•|\d+\./g);
  if (lists && lists.length > 0) {
    score += 20;
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
      recommendation: 'Adicione listas numeradas ou com marcadores para organizar melhor o conteúdo'
    });
  }

  // Check paragraph structure - fixed implementation
  const paragraphs = textContent.split(/\n\n+/).filter(p => p.trim().length > 0);
  const paragraphWordCounts = paragraphs.map(p => p.split(/\s+/).filter(w => w.length > 0).length);
  const longParagraphs = paragraphWordCounts.filter(count => count > 100);
  
  if (longParagraphs.length === 0 && paragraphs.length > 0) {
    score += 30;
    const avgWords = Math.round(paragraphWordCounts.reduce((sum, count) => sum + count, 0) / paragraphWordCounts.length);
    issues.push({
      type: 'success' as const,
      message: `Parágrafos bem organizados (média: ${avgWords} palavras por parágrafo)`,
      priority: 'low' as const
    });
  } else if (longParagraphs.length > 0) {
    issues.push({
      type: 'warning' as const,
      message: `${longParagraphs.length} parágrafos muito longos encontrados`,
      priority: 'medium' as const,
      recommendation: `Divida parágrafos longos em parágrafos menores (recomendado: até 100 palavras por parágrafo)`
    });
  } else {
    score += 10;
    issues.push({
      type: 'warning' as const,
      message: 'Estrutura de parágrafos pode ser melhorada',
      priority: 'medium' as const,
      recommendation: 'Organize o conteúdo em parágrafos bem definidos e balanceados'
    });
  }

  // Check for call-to-action elements
  const hasCallToAction = textContent.toLowerCase().includes('entre em contato') || 
                         textContent.toLowerCase().includes('solicite') ||
                         textContent.toLowerCase().includes('contrate') ||
                         textContent.toLowerCase().includes('saiba mais');
  
  if (hasCallToAction) {
    score += 10;
    issues.push({
      type: 'success' as const,
      message: 'Call-to-action identificado no conteúdo',
      priority: 'low' as const
    });
  } else {
    issues.push({
      type: 'warning' as const,
      message: 'Nenhum call-to-action claro identificado',
      priority: 'medium' as const,
      recommendation: 'Adicione chamadas para ação para guiar os visitantes'
    });
  }

  return {
    category: 'content_structure',
    score: Math.max(0, score),
    status: score >= 90 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'needs_improvement' : 'critical',
    issues
  };
}

function analyzeLinks(internalLinks: number, externalLinks: number, linkElements: Element[], url: string): AuditCategory {
  const issues = [];
  let score = 0;
  const totalLinks = internalLinks + externalLinks;

  // Check internal links
  if (internalLinks >= 3) {
    score += 40;
    issues.push({
      type: 'success' as const,
      message: `${internalLinks} links internos encontrados (boa navegação interna)`,
      priority: 'low' as const
    });
  } else if (internalLinks > 0) {
    score += 25;
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
      message: `${externalLinks} links externos encontrados (quantidade adequada)`,
      priority: 'low' as const
    });
  } else if (externalLinks > 5) {
    score += 20;
    issues.push({
      type: 'warning' as const,
      message: `Muitos links externos (${externalLinks})`,
      priority: 'medium' as const,
      recommendation: 'Considere reduzir o número de links externos ou verifique sua relevância'
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
  const genericAnchors = ['clique aqui', 'saiba mais', 'leia mais', 'veja mais', 'aqui'];
  const hasDescriptiveAnchors = linkElements.some(link => {
    const anchorText = link.textContent?.toLowerCase() || '';
    return anchorText.length > 5 && !genericAnchors.some(generic => anchorText.includes(generic));
  });
  
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

  // Check for links with target="_blank" having rel="noopener"
  const externalLinksWithBlank = linkElements.filter(link => {
    const href = link.getAttribute('href') || '';
    const target = link.getAttribute('target');
    return target === '_blank' && (href.startsWith('http') && !href.includes(new URL(url).hostname));
  });

  if (externalLinksWithBlank.length > 0) {
    const hasNoopener = externalLinksWithBlank.some(link => {
      const rel = link.getAttribute('rel') || '';
      return rel.includes('noopener') || rel.includes('noreferrer');
    });
    
    if (hasNoopener) {
      issues.push({
        type: 'success' as const,
        message: 'Links externos com target="_blank" possuem rel="noopener"',
        priority: 'low' as const
      });
    } else {
      issues.push({
        type: 'warning' as const,
        message: 'Links externos com target="_blank" sem rel="noopener"', 
        priority: 'medium' as const,
        recommendation: 'Adicione rel="noopener noreferrer" aos links externos para segurança'
      });
      score -= 10;
    }
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

  // Check paragraph structure using proper paragraph breaks
  const paragraphs = textContent.split(/\n\n+/).filter(p => p.trim().length > 0);
  
  // Calculate words per paragraph more accurately
  const paragraphWordCounts = paragraphs.map(p => p.split(/\s+/).filter(w => w.length > 0).length);
  const avgWordsPerParagraph = paragraphWordCounts.length > 0 
    ? paragraphWordCounts.reduce((sum, count) => sum + count, 0) / paragraphWordCounts.length 
    : 0;
  
  if (avgWordsPerParagraph <= 100 && avgWordsPerParagraph > 0) {
    score += 40;
    issues.push({
      type: 'success' as const,
      message: `Parágrafos com tamanho adequado (média: ${avgWordsPerParagraph.toFixed(0)} palavras)`,
      priority: 'low' as const
    });
  } else if (avgWordsPerParagraph > 100) {
    issues.push({
      type: 'warning' as const,
      message: `Parágrafos muito longos (média: ${avgWordsPerParagraph.toFixed(0)} palavras)`,
      priority: 'medium' as const,
      recommendation: 'Divida parágrafos longos em parágrafos menores (recomendado: até 100 palavras por parágrafo)'
    });
  } else {
    issues.push({
      type: 'warning' as const,
      message: 'Estrutura de parágrafos não detectada adequadamente',
      priority: 'medium' as const,
      recommendation: 'Organize o conteúdo em parágrafos bem definidos'
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
  
  // Extract keywords and prompts
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
      message: `${keywords.length} termos-chave identificados para otimização de IA`,
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
      message: 'Conteúdo bem estruturado para busca por IA',
      priority: 'low' as const
    });
  } else {
    issues.push({
      type: 'warning' as const,
      message: 'Conteúdo pouco estruturado para IAs',
      priority: 'medium' as const,
      recommendation: 'Use listas, subtítulos e parágrafos bem organizados'
    });
  }
  
  if (hasFAQ) {
    score += 25;
    issues.push({
      type: 'success' as const,
      message: 'Seção FAQ identificada (ótimo para IAs)',
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
      message: 'Pouco conteúdo acionável encontrado',
      priority: 'medium' as const,
      recommendation: 'Adicione mais instruções, guias e soluções práticas'
    });
  }
  
  // Add summary of keywords and prompts
  issues.push({
    type: 'success' as const,
    message: `${prompts.length} prompts de IA gerados com base no conteúdo`,
    priority: 'low' as const,
    recommendation: `Revise os termos e prompts identificados nos cards separados`,
    metadata: { keywords: keywords.slice(0, 15), prompts: prompts }
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
  const domain = url.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
  const prompts = [];
  
  // Detect business type based on content
  const lowerContent = textContent.toLowerCase();
  const isEcommerce = lowerContent.includes('comprar') || lowerContent.includes('preço') || lowerContent.includes('produto') || lowerContent.includes('loja');
  const isService = lowerContent.includes('serviço') || lowerContent.includes('consultoria') || lowerContent.includes('atendimento');
  const isBlog = lowerContent.includes('artigo') || lowerContent.includes('post') || lowerContent.includes('blog') || lowerContent.includes('dicas');
  const isTech = lowerContent.includes('software') || lowerContent.includes('sistema') || lowerContent.includes('tecnologia') || lowerContent.includes('desenvolvimento');
  const isEducational = lowerContent.includes('curso') || lowerContent.includes('treinamento') || lowerContent.includes('educação') || lowerContent.includes('aprender');
  
  // Generate context-aware prompts
  if (keywords.length > 0) {
    const topKeywords = keywords.slice(0, 3);
    const mainKeyword = topKeywords[0];
    
    // E-commerce prompts
    if (isEcommerce) {
      prompts.push(`Onde comprar ${mainKeyword} barato?`);
      prompts.push(`${mainKeyword}: melhor preço online`);
      prompts.push(`Loja confiável para ${mainKeyword}`);
      prompts.push(`${mainKeyword} com desconto`);
      prompts.push(`Comparar preços de ${mainKeyword}`);
    }
    
    // Service-based prompts
    else if (isService) {
      prompts.push(`Melhor empresa de ${mainKeyword}`);
      prompts.push(`Serviços de ${mainKeyword} profissionais`);
      prompts.push(`Como contratar ${mainKeyword} confiável?`);
      prompts.push(`${mainKeyword}: orçamento gratuito`);
      prompts.push(`Consultoria especializada em ${mainKeyword}`);
    }
    
    // Tech/Software prompts
    else if (isTech) {
      prompts.push(`Como implementar ${mainKeyword}?`);
      prompts.push(`Melhor solução para ${mainKeyword}`);
      prompts.push(`${mainKeyword}: guia técnico completo`);
      prompts.push(`Desenvolvimento com ${mainKeyword}`);
      prompts.push(`${mainKeyword} vs alternativas`);
    }
    
    // Educational prompts
    else if (isEducational) {
      prompts.push(`Curso de ${mainKeyword} online`);
      prompts.push(`Como aprender ${mainKeyword}?`);
      prompts.push(`Certificação em ${mainKeyword}`);
      prompts.push(`${mainKeyword} para iniciantes`);
      prompts.push(`Melhor treinamento de ${mainKeyword}`);
    }
    
    // Blog/Content prompts
    else if (isBlog) {
      prompts.push(`${mainKeyword}: dicas práticas`);
      prompts.push(`Guia completo sobre ${mainKeyword}`);
      prompts.push(`Como usar ${mainKeyword} corretamente?`);
      prompts.push(`${mainKeyword}: melhores práticas`);
      prompts.push(`Tudo sobre ${mainKeyword}`);
    }
    
    // Generic business prompts
    else {
      prompts.push(`O que é ${mainKeyword}?`);
      prompts.push(`Como funciona ${mainKeyword}?`);
      prompts.push(`Vantagens do ${mainKeyword}`);
      prompts.push(`${mainKeyword} é confiável?`);
      prompts.push(`Melhor ${mainKeyword} do mercado`);
    }
    
    // Add location-based prompts if content suggests it
    const locationWords = ['brasil', 'são paulo', 'rio de janeiro', 'belo horizonte', 'brasília', 'porto alegre', 'salvador', 'recife', 'fortaleza'];
    const detectedLocation = locationWords.find(loc => lowerContent.includes(loc));
    if (detectedLocation) {
      const locationName = detectedLocation === 'são paulo' ? 'São Paulo' : 
                          detectedLocation === 'rio de janeiro' ? 'Rio de Janeiro' :
                          detectedLocation === 'belo horizonte' ? 'Belo Horizonte' :
                          detectedLocation.replace(/\b\w/g, l => l.toUpperCase());
      prompts.push(`${mainKeyword} em ${locationName}`);
    } else {
      prompts.push(`${mainKeyword} no Brasil`);
    }
    
    // Problem-solving prompts
    prompts.push(`Problema com ${mainKeyword}: como resolver?`);
    prompts.push(`${mainKeyword} não funciona: soluções`);
    
    // Comparison prompts
    if (topKeywords.length > 1) {
      prompts.push(`${mainKeyword} vs ${topKeywords[1]}`);
    }
  }
  
  // Domain-specific fallback prompts
  if (prompts.length < 5) {
    prompts.push(`${domain} é confiável?`);
    prompts.push(`Como usar ${domain}?`);
    prompts.push(`Avaliação do ${domain}`);
    prompts.push(`${domain} vale a pena?`);
    prompts.push(`Experiência com ${domain}`);
  }
  
  return prompts.slice(0, 10);
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