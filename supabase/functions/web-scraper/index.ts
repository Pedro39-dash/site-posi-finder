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
    console.log(`🔍 Parsing HTML content for "${keyword}" (${html.length} chars)`);
    
    // 2024/2025 Google patterns - more robust, less dependent on CSS classes
    const patterns = [
      // Modern Google result structure with data attributes
      /<div[^>]*data-ved[^>]*>.*?<a[^>]*href="([^"]*)"[^>]*>.*?<h3[^>]*>([^<]*)<\/h3>/gs,
      // Generic h3 with link pattern (most reliable)
      /<h3[^>]*><a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a><\/h3>/gs,
      // Div with h3 and link inside
      /<div[^>]*>.*?<h3[^>]*>.*?<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>.*?<\/h3>/gs,
      // Alternative link-first pattern
      /<a[^>]*href="([^"]*)"[^>]*>.*?<h3[^>]*>([^<]*)<\/h3>/gs,
      // Legacy classes (still might work)
      /<div class="g"[^>]*>.*?<h3[^>]*>.*?<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>.*?<\/h3>/gs,
      /<div class="yuRUbf"[^>]*>.*?<a[^>]*href="([^"]*)"[^>]*>.*?<h3[^>]*>([^<]*)<\/h3>/gs,
      /<div class="MjjYud"[^>]*>.*?<a[^>]*href="([^"]*)"[^>]*>.*?<h3[^>]*>([^<]*)<\/h3>/gs
    ];

    let position = 1;
    const foundUrls = new Set<string>();
    let totalMatches = 0;

    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const matches = [...html.matchAll(pattern)];
      console.log(`🔍 Pattern ${i + 1}: Found ${matches.length} matches`);
      totalMatches += matches.length;
      
      for (const match of matches) {
        if (position > 20) break; // Limit to top 20 results
        
        const url = match[1];
        const title = match[2];
        
        if (!url || !title) continue;
        
        // Skip if we already found this URL
        if (foundUrls.has(url)) continue;
        
        // Skip Google's own URLs, ads, and invalid URLs
        if (url.includes('google.com') || 
            url.includes('googleadservices.com') ||
            url.includes('googlesyndication.com') ||
            url.includes('accounts.google.com') ||
            url.includes('support.google.com') ||
            url.startsWith('/search') ||
            url.startsWith('/url?') ||
            url.startsWith('#') ||
            url.startsWith('javascript:')) continue;

        // Clean and validate URL
        let cleanUrl = url;
        if (url.startsWith('/url?q=')) {
          // Extract actual URL from Google redirect
          const urlMatch = url.match(/\/url\?q=([^&]*)/);
          if (urlMatch) {
            cleanUrl = decodeURIComponent(urlMatch[1]);
          }
        }
        
        if (!cleanUrl.startsWith('http')) {
          cleanUrl = `https://${cleanUrl}`;
        }
        
        const domain = extractDomain(cleanUrl);
        if (!domain || domain.includes('google')) continue;

        // Clean title - remove HTML tags and decode entities
        const cleanTitle = title
          .replace(/<[^>]*>/g, '')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim();
          
        if (!cleanTitle || cleanTitle.length < 3) continue;

        foundUrls.add(url);
        
        results.push({
          title: cleanTitle,
          url: cleanUrl,
          position,
          domain,
          snippet: '' // Could extract snippet later if needed
        });

        console.log(`✅ Result ${position}: ${domain} - ${cleanTitle.substring(0, 50)}...`);
        position++;
      }
      
      // If we found results with this pattern, break early
      if (results.length > 0) {
        console.log(`✅ Found ${results.length} results with pattern ${i + 1}, stopping search`);
        break;
      }
    }

    // Enhanced fallback: try to find any <a> tags with hrefs in organic content
    if (results.length === 0) {
      console.log(`⚠️ No results with standard patterns (${totalMatches} total matches), trying enhanced fallback`);
      
      // Look for common organic result indicators
      const fallbackPattern = /<a[^>]*href="([^"]*)"[^>]*[^>]*>([^<]*)</gs;
      const fallbackMatches = [...html.matchAll(fallbackPattern)];
      
      console.log(`🔍 Fallback found ${fallbackMatches.length} potential links`);
      
      let fallbackPosition = 1;
      const processedDomains = new Set<string>();
      
      for (const match of fallbackMatches) {
        if (fallbackPosition > 15) break;
        
        const url = match[1];
        const text = match[2];
        
        if (!url || !text || text.length < 10) continue;
        
        // More strict filtering for fallback
        if (url.includes('google.com') || 
            url.includes('youtube.com/googleads') ||
            url.includes('support.google') ||
            url.startsWith('/') ||
            url.startsWith('javascript:') ||
            url.startsWith('mailto:') ||
            url.startsWith('#')) continue;
        
        let cleanUrl = url;
        if (url.startsWith('/url?q=')) {
          const urlMatch = url.match(/\/url\?q=([^&]*)/);
          if (urlMatch) {
            cleanUrl = decodeURIComponent(urlMatch[1]);
          }
        }
        
        if (!cleanUrl.startsWith('http')) continue;
        
        const domain = extractDomain(cleanUrl);
        if (!domain || domain.includes('google') || processedDomains.has(domain)) continue;
        
        // Check if the text looks like a title (not just "click here", etc.)
        const cleanText = text.replace(/<[^>]*>/g, '').trim();
        if (cleanText.length < 10 || 
            cleanText.toLowerCase().includes('click here') ||
            cleanText.toLowerCase().includes('more info') ||
            cleanText.toLowerCase().includes('learn more')) continue;
        
        processedDomains.add(domain);
        
        results.push({
          title: cleanText,
          url: cleanUrl,
          position: fallbackPosition,
          domain,
          snippet: ''
        });
        
        console.log(`🔄 Fallback ${fallbackPosition}: ${domain} - ${cleanText.substring(0, 50)}...`);
        fallbackPosition++;
      }
    }

    if (results.length === 0) {
      console.error(`❌ CRITICAL: No search results found for "${keyword}"`);
      console.log(`🔍 HTML preview (first 1000 chars): ${html.substring(0, 1000)}`);
      
      // Check for potential blocks
      if (html.includes('detected unusual traffic') || 
          html.includes('blocked') || 
          html.includes('captcha') ||
          html.includes('robot')) {
        console.error(`🚫 Possible bot detection/CAPTCHA for "${keyword}"`);
      }
    } else {
      console.log(`✅ Successfully parsed ${results.length} results for "${keyword}"`);
    }
    
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