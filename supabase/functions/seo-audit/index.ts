import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const { url, userId } = await req.json();
    
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
    EdgeRuntime.waitUntil(performSEOAudit(url, auditReport.id, supabase));

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

async function performSEOAudit(url: string, auditId: string, supabase: any) {
  try {
    console.log(`Performing SEO audit for: ${url}`);

    // Fetch the webpage content
    const htmlContent = await fetchWebpageContent(url);
    
    // Analyze HTML content
    const htmlAnalysis = analyzeHTML(htmlContent, url);
    
    // Get PageSpeed Insights data
    const pageSpeedData = await getPageSpeedInsights(url);
    
    // Combine all analyses
    const categories = combineAnalyses(htmlAnalysis, pageSpeedData);
    
    // Calculate overall score
    const overallScore = Math.round(
      categories.reduce((sum, category) => sum + category.score, 0) / categories.length
    );

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

    console.log(`SEO audit completed for ${url} with overall score: ${overallScore}`);

  } catch (error) {
    console.error('Error performing SEO audit:', error);
    
    // Update audit report with failed status
    await supabase
      .from('audit_reports')
      .update({
        status: 'failed',
        metadata: { error: error.message }
      })
      .eq('id', auditId);
  }
}

async function fetchWebpageContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEO-Audit-Bot/1.0)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error('Error fetching webpage:', error);
    throw new Error(`Failed to fetch webpage: ${error.message}`);
  }
}

function analyzeHTML(html: string, url: string): AuditCategory[] {
  const categories: AuditCategory[] = [];

  // Parse HTML
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const h1Matches = html.match(/<h1[^>]*>([^<]*)<\/h1>/gi) || [];
  const imgMatches = html.match(/<img[^>]*>/gi) || [];
  const linkMatches = html.match(/<a[^>]*href=["']([^"']*)["'][^>]*>/gi) || [];
  
  // Extract text content for AI analysis
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