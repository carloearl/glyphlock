import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * GlyphBot Real-Time Web Search Tool
 * Provides fresh information from the internet for GlyphBot queries.
 *
 * Modes:
 * - standard: single query across the provider chain.
 * - deep (deep=true): expands the query into many angled sub-queries
 *   (site-turn / intel gathering), runs each across the provider chain,
 *   aggregates + dedupes across ALL sources. No small result cap.
 *
 * Optional env vars: SERP_API_KEY, GOOGLE_SEARCH_API_KEY, GOOGLE_SEARCH_CX.
 * Falls back to DuckDuckGo (free) and Base44 LLM internet context.
 */

// Run one query across the full provider chain. Returns {results, provider}.
async function runProviderChain(base44, query, num) {
  let results = null;
  let provider = 'none';

  const serpApiKey = Deno.env.get('SERP_API_KEY');
  if (serpApiKey) {
    try {
      const r = await fetch(`https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${serpApiKey}&num=${num}`);
      if (r.ok) {
        const data = await r.json();
        results = (data.organic_results || []).map((x) => ({ title: x.title, snippet: x.snippet, url: x.link }));
        provider = 'serpapi';
      }
    } catch (e) { console.error('SerpAPI failed:', e); }
  }

  const googleApiKey = Deno.env.get('GOOGLE_SEARCH_API_KEY');
  const googleCx = Deno.env.get('GOOGLE_SEARCH_CX');
  if (googleApiKey && googleCx && !results) {
    try {
      // Google CSE returns max 10/page — paginate to reach num.
      const collected = [];
      for (let start = 1; start <= num && start <= 91; start += 10) {
        const r = await fetch(`https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCx}&q=${encodeURIComponent(query)}&num=10&start=${start}`);
        if (!r.ok) break;
        const data = await r.json();
        (data.items || []).forEach((x) => collected.push({ title: x.title, snippet: x.snippet, url: x.link }));
        if (!data.items || data.items.length < 10) break;
      }
      if (collected.length) { results = collected; provider = 'google'; }
    } catch (e) { console.error('Google Search failed:', e); }
  }

  if (!results) {
    try {
      const r = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`);
      if (r.ok) {
        const data = await r.json();
        const out = [];
        if (data.AbstractText) out.push({ title: data.Heading || 'Summary', snippet: data.AbstractText, url: data.AbstractURL || 'https://duckduckgo.com' });
        (data.RelatedTopics || []).forEach((t) => {
          if (t.Text) out.push({ title: t.Text.split(' - ')[0] || 'Related', snippet: t.Text, url: t.FirstURL || 'https://duckduckgo.com' });
        });
        if (out.length) { results = out; provider = 'duckduckgo'; }
      }
    } catch (e) { console.error('DuckDuckGo failed:', e); }
  }

  return { results: results || [], provider };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, maxResults = 5, deep = false } = await req.json();

    if (!query || typeof query !== 'string') {
      return Response.json({ error: 'Query is required' }, { status: 400 });
    }

    // Per-query result depth — uncapped for deep intel gathering.
    const perQuery = deep ? Math.max(30, Number(maxResults) || 0) : (Number(maxResults) || 5);

    // Build the list of sub-queries. Deep mode expands into many angles
    // (site-turn searches, intel sources) so we canvas every corner.
    let subQueries = [query];
    if (deep) {
      try {
        const expansion = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an OSINT research planner. For the target/topic: "${query}", produce a diverse set of web search queries that canvas EVERY available public source — official sites, news, social media, reviews, court/legal records, government/regulatory databases, professional profiles, forums, archives (Wayback), data-breach mentions, and site-specific "site:" dorks. Return 12-16 distinct, high-signal queries.`,
          response_json_schema: {
            type: 'object',
            properties: { queries: { type: 'array', items: { type: 'string' } } },
            required: ['queries'],
          },
        });
        const extra = Array.isArray(expansion?.queries) ? expansion.queries : [];
        subQueries = [query, ...extra].filter(Boolean);
      } catch (e) {
        console.error('Query expansion failed, using base query only:', e);
      }

      // DETERMINISTIC site-specific dorks — always run these regardless of
      // LLM expansion, so deep intel is never limited to internal data or a
      // flaky expansion pass. Canvas the highest-signal public sources.
      const SITE_DORKS = [
        'linkedin.com', 'bbb.org', 'yelp.com', 'trustpilot.com', 'glassdoor.com',
        'reddit.com', 'news.google.com', 'courtlistener.com', 'sec.gov',
        'facebook.com', 'twitter.com', 'web.archive.org',
      ];
      const dorkQueries = SITE_DORKS.map((site) => `site:${site} "${query}"`);
      const seenQ = new Set(subQueries.map((q) => q.toLowerCase()));
      for (const dq of dorkQueries) {
        if (!seenQ.has(dq.toLowerCase())) { seenQ.add(dq.toLowerCase()); subQueries.push(dq); }
      }
    }

    // Run every sub-query across the provider chain and aggregate.
    const seen = new Set();
    const aggregated = [];
    const providersUsed = new Set();

    for (const q of subQueries) {
      const { results, provider } = await runProviderChain(base44, q, perQuery);
      if (provider !== 'none') providersUsed.add(provider);
      for (const r of results) {
        const key = (r.url || r.title || '').toLowerCase();
        if (key && !seen.has(key)) {
          seen.add(key);
          aggregated.push({ ...r, query: q });
        }
      }
    }

    // Always add a Base44 LLM internet-context pass for a synthesized
    // intel summary (and as a fallback when provider results are thin).
    let aiSummary = '';
    try {
      const llmResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Deep research the following and synthesize a factual intelligence summary from current public web sources. Target/topic: "${query}". Cover key facts, entities, reputation/reviews, risks, legal/regulatory mentions, and recent news. Cite sources with URLs where possible.`,
        add_context_from_internet: true,
      });
      aiSummary = typeof llmResult === 'string' ? llmResult : JSON.stringify(llmResult);
      if (aiSummary) {
        aggregated.push({ title: 'AI Intel Synthesis (live internet)', snippet: aiSummary, url: 'https://glyphlock.io', query });
        providersUsed.add('base44-llm');
      }
    } catch (e) {
      console.error('LLM internet synthesis failed:', e);
    }

    const summary = aggregated.length > 0
      ? aggregated.map((r, i) => `[${i + 1}] ${r.title}: ${r.snippet}${r.url ? ` (${r.url})` : ''}`).join('\n\n')
      : 'No search results found.';

    await base44.entities.SystemAuditLog.create({
      event_type: 'GLYPHBOT_WEB_SEARCH',
      description: `${deep ? 'DEEP ' : ''}Web search: ${query.slice(0, 100)}`,
      actor_email: user.email,
      resource_id: 'glyphbot-search',
      metadata: {
        query,
        deep,
        subQueryCount: subQueries.length,
        providers: Array.from(providersUsed),
        resultCount: aggregated.length,
      },
      status: 'success',
    }).catch(console.error);

    return Response.json({
      success: true,
      query,
      deep,
      provider: Array.from(providersUsed).join(',') || 'none',
      subQueries,
      results: aggregated,
      summary,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Web search error:', error);
    return Response.json({
      error: error.message,
      success: false,
    }, { status: 500 });
  }
});