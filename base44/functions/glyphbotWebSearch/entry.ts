import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * GlyphBot Real-Time Web Search Tool
 * Provides fresh information from the internet for GlyphBot queries
 * 
 * Environment Variables Required:
 * - SEARCH_API_KEY: API key for search provider (SerpAPI, Google Custom Search, etc.)
 * - SEARCH_API_URL: Optional custom endpoint (defaults to SerpAPI)
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, maxResults = 5 } = await req.json();
    
    if (!query || typeof query !== 'string') {
      return Response.json({ error: 'Query is required' }, { status: 400 });
    }

    // Try multiple search providers with fallback
    let searchResults = null;
    let providerUsed = 'none';

    // Provider 1: SerpAPI (if configured)
    const serpApiKey = Deno.env.get('SERP_API_KEY');
    if (serpApiKey && !searchResults) {
      try {
        const serpResponse = await fetch(
          `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${serpApiKey}&num=${maxResults}`
        );
        if (serpResponse.ok) {
          const data = await serpResponse.json();
          searchResults = data.organic_results?.map(r => ({
            title: r.title,
            snippet: r.snippet,
            url: r.link
          })) || [];
          providerUsed = 'serpapi';
        }
      } catch (e) {
        console.error('SerpAPI failed:', e);
      }
    }

    // Provider 2: Google Custom Search (if configured)
    const googleApiKey = Deno.env.get('GOOGLE_SEARCH_API_KEY');
    const googleCx = Deno.env.get('GOOGLE_SEARCH_CX');
    if (googleApiKey && googleCx && !searchResults) {
      try {
        const googleResponse = await fetch(
          `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCx}&q=${encodeURIComponent(query)}&num=${maxResults}`
        );
        if (googleResponse.ok) {
          const data = await googleResponse.json();
          searchResults = data.items?.map(r => ({
            title: r.title,
            snippet: r.snippet,
            url: r.link
          })) || [];
          providerUsed = 'google';
        }
      } catch (e) {
        console.error('Google Search failed:', e);
      }
    }

    // Provider 3: DuckDuckGo Instant Answer (free, no API key)
    if (!searchResults) {
      try {
        const ddgResponse = await fetch(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`
        );
        if (ddgResponse.ok) {
          const data = await ddgResponse.json();
          searchResults = [];
          
          if (data.AbstractText) {
            searchResults.push({
              title: data.Heading || 'Summary',
              snippet: data.AbstractText,
              url: data.AbstractURL || 'https://duckduckgo.com'
            });
          }
          
          if (data.RelatedTopics) {
            data.RelatedTopics.slice(0, maxResults - 1).forEach(topic => {
              if (topic.Text) {
                searchResults.push({
                  title: topic.Text.split(' - ')[0] || 'Related',
                  snippet: topic.Text,
                  url: topic.FirstURL || 'https://duckduckgo.com'
                });
              }
            });
          }
          
          if (searchResults.length > 0) {
            providerUsed = 'duckduckgo';
          }
        }
      } catch (e) {
        console.error('DuckDuckGo failed:', e);
      }
    }

    // Fallback: Use Base44 LLM with internet context
    if (!searchResults || searchResults.length === 0) {
      try {
        const llmResult = await base44.integrations.Core.InvokeLLM({
          prompt: `Search query: "${query}". Provide a brief, factual summary of what you know about this topic. Include any relevant recent information.`,
          add_context_from_internet: true
        });
        
        searchResults = [{
          title: 'AI Summary',
          snippet: llmResult,
          url: 'https://glyphlock.io'
        }];
        providerUsed = 'base44-llm';
      } catch (e) {
        console.error('LLM fallback failed:', e);
      }
    }

    // Format results for GlyphBot consumption
    const summary = searchResults?.length > 0
      ? searchResults.map((r, i) => `[${i + 1}] ${r.title}: ${r.snippet}`).join('\n\n')
      : 'No search results found.';

    // Log search for analytics
    await base44.entities.SystemAuditLog.create({
      event_type: 'GLYPHBOT_WEB_SEARCH',
      description: `Web search: ${query.slice(0, 100)}`,
      actor_email: user.email,
      resource_id: 'glyphbot-search',
      metadata: {
        query,
        provider: providerUsed,
        resultCount: searchResults?.length || 0
      },
      status: 'success'
    }).catch(console.error);

    return Response.json({
      success: true,
      query,
      provider: providerUsed,
      results: searchResults || [],
      summary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Web search error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});