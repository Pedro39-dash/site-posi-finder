import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// Configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0'
];

interface SearchResult {
  title: string;
  url: string;
  position: number;
  domain: string;
  snippet?: string;
}

interface ScrapeResponse {
  success: boolean;
  results?: SearchResult[];
  error?: string;
  totalResults?: number;
  keyword: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keyword, maxResults = 20 } = await req.json();
    
    if (!keyword) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Keyword is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🔍 Starting web scrape for keyword: "${keyword}"`);
    
    // Create search URL for Google
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&num=${maxResults}&hl=pt-BR&gl=BR`;
    console.log(`🌐 Search URL: ${searchUrl}`);

    // Random user agent for this request
    const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    console.log(`🤖 Using User-Agent: ${userAgent.substring(0, 50)}...`);

    // Add random delay to simulate human behavior
    const delay = Math.floor(Math.random() * 2000) + 1000; // 1-3 seconds
    console.log(`⏳ Adding ${delay}ms delay to simulate human behavior`);
    await new Promise(resolve => setTimeout(resolve, delay));

    // Make the request with headers to simulate real browser
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    });

    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `HTTP ${response.status}: ${response.statusText}`,
        keyword 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const html = await response.text();
    console.log(`📄 Retrieved HTML content: ${html.length} characters`);

    // Parse search results from HTML
    const results = parseGoogleResults(html, keyword);
    console.log(`🎯 Extracted ${results.length} search results`);

    // Log first few results for debugging
    if (results.length > 0) {
      console.log(`📋 Sample results:`, results.slice(0, 3).map(r => ({
        position: r.position,
        domain: r.domain,
        title: r.title.substring(0, 50) + '...'
      })));
    }

    const response_data: ScrapeResponse = {
      success: true,
      results,
      totalResults: results.length,
      keyword
    };

    return new Response(JSON.stringify(response_data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Web scraper error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      keyword: req.body?.keyword || 'unknown'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function parseGoogleResults(html: string, keyword: string): SearchResult[] {
  const results: SearchResult[] = [];
  
  try {
    // Multiple patterns to catch different Google result formats
    const patterns = [
      // Standard organic results
      /<div class="g"[^>]*>.*?<h3[^>]*>.*?<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>.*?<\/h3>/gs,
      // Alternative format
      /<div class="yuRUbf"[^>]*>.*?<a[^>]*href="([^"]*)"[^>]*>.*?<h3[^>]*>([^<]*)<\/h3>/gs,
      // Another common format  
      /<div class="MjjYud"[^>]*>.*?<a[^>]*href="([^"]*)"[^>]*>.*?<h3[^>]*>([^<]*)<\/h3>/gs
    ];

    let position = 1;
    const foundUrls = new Set<string>();

    for (const pattern of patterns) {
      const matches = [...html.matchAll(pattern)];
      
      for (const match of matches) {
        if (position > 20) break; // Limit to top 20 results
        
        const url = match[1];
        const title = match[2];
        
        // Skip if we already found this URL
        if (foundUrls.has(url)) continue;
        
        // Skip Google's own URLs and ads
        if (url.includes('google.com') || 
            url.includes('googleadservices.com') ||
            url.includes('googlesyndication.com') ||
            url.startsWith('/search') ||
            url.startsWith('#')) continue;

        // Clean and validate URL
        const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
        const domain = extractDomain(cleanUrl);
        
        if (!domain || domain.includes('google')) continue;

        // Clean title
        const cleanTitle = title.replace(/<[^>]*>/g, '').trim();
        if (!cleanTitle) continue;

        foundUrls.add(url);
        
        results.push({
          title: cleanTitle,
          url: cleanUrl,
          position,
          domain,
          snippet: '' // Could extract snippet later if needed
        });

        position++;
      }
    }

    // Fallback: try simpler pattern if no results found
    if (results.length === 0) {
      console.log(`⚠️ No results with standard patterns, trying fallback for "${keyword}"`);
      const fallbackPattern = /href="(https?:\/\/[^"]*)"[^>]*>.*?<h3[^>]*>([^<]*)<\/h3>/gs;
      const fallbackMatches = [...html.matchAll(fallbackPattern)];
      
      let fallbackPosition = 1;
      for (const match of fallbackMatches.slice(0, 10)) {
        const url = match[1];
        const title = match[2];
        const domain = extractDomain(url);
        
        if (!domain || domain.includes('google')) continue;
        
        results.push({
          title: title.replace(/<[^>]*>/g, '').trim(),
          url,
          position: fallbackPosition,
          domain
        });
        
        fallbackPosition++;
      }
    }

    console.log(`✅ Successfully parsed ${results.length} results for "${keyword}"`);
    return results;

  } catch (error) {
    console.error(`❌ Error parsing Google results for "${keyword}":`, error);
    return [];
  }
}

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '').toLowerCase();
  } catch (error) {
    console.warn(`⚠️ Failed to extract domain from: ${url}`, error);
    return '';
  }
}