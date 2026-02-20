import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const CACHE = new Map();
const CACHE_TTL_NEWS = 5 * 60 * 1000;      // 5 min
const CACHE_TTL_INTEL = 15 * 60 * 1000;    // 15 min
const MAX_INTEL_CALLS_PER_DAY = 20;
const userCallCounts = new Map();

function getCached(key, ttl) {
  const entry = CACHE.get(key);
  if (entry && Date.now() - entry.ts < ttl) return entry.data;
  return null;
}
function setCache(key, data) {
  CACHE.set(key, { data, ts: Date.now() });
}

function checkRateLimit(userEmail) {
  const key = `${userEmail}_${new Date().toDateString()}`;
  const count = userCallCounts.get(key) || 0;
  if (count >= MAX_INTEL_CALLS_PER_DAY) return false;
  userCallCounts.set(key, count + 1);
  return true;
}

// 1. NIST NVD — Latest CVEs
async function fetchThreatIntel() {
  const cached = getCached('threat_intel', CACHE_TTL_NEWS);
  if (cached) return cached;

  try {
    const now = new Date();
    const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fmt = d => d.toISOString().replace(/\.\d{3}Z/, '.000');
    const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?pubStartDate=${fmt(past)}&pubEndDate=${fmt(now)}&resultsPerPage=5`;
    
    const res = await fetch(url, {
      headers: { 'User-Agent': 'GlyphLock-Security/1.0' }
    });
    
    if (!res.ok) throw new Error(`NVD API ${res.status}`);
    const json = await res.json();

    const items = (json.vulnerabilities || []).slice(0, 5).map(v => {
      const cve = v.cve;
      const metrics = cve.metrics?.cvssMetricV31?.[0]?.cvssData 
        || cve.metrics?.cvssMetricV30?.[0]?.cvssData
        || cve.metrics?.cvssMetricV2?.[0]?.cvssData;
      const score = metrics?.baseScore || 0;
      const severity = score >= 9 ? 'CRITICAL' : score >= 7 ? 'HIGH' : score >= 4 ? 'MEDIUM' : 'LOW';
      const desc = cve.descriptions?.find(d => d.lang === 'en')?.value || 'No description';

      return {
        id: cve.id,
        severity,
        score,
        description: desc.length > 200 ? desc.slice(0, 200) + '…' : desc,
        link: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
        published: cve.published
      };
    });

    const result = { items, updatedAt: Date.now(), source: 'NIST NVD' };
    setCache('threat_intel', result);
    return result;
  } catch (e) {
    console.error('[LiveFeed] Threat intel error:', e.message);
    return { items: [], updatedAt: Date.now(), source: 'NIST NVD', error: e.message };
  }
}

// 2. CYBERSECURITY NEWS — RSS via rss2json
async function fetchSecurityNews() {
  const cached = getCached('security_news', CACHE_TTL_NEWS);
  if (cached) return cached;

  const feeds = [
    'https://feeds.feedburner.com/TheHackersNews',
    'https://www.bleepingcomputer.com/feed/'
  ];

  for (const rssUrl of feeds) {
    try {
      const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();
      if (json.status !== 'ok') continue;

      const items = (json.items || []).slice(0, 5).map(item => ({
        title: item.title,
        link: item.link,
        published: item.pubDate,
        source: json.feed?.title || 'Security News'
      }));

      const result = { items, updatedAt: Date.now(), source: json.feed?.title || 'Security News' };
      setCache('security_news', result);
      return result;
    } catch (e) {
      console.error('[LiveFeed] Security news feed failed:', e.message);
      continue;
    }
  }

  return { items: [], updatedAt: Date.now(), source: 'Security News', error: 'All feeds unavailable' };
}

// 3. MARKET / FINTECH NEWS — rss2json with fintech RSS
async function fetchMarketIntel() {
  const cached = getCached('market_intel', CACHE_TTL_NEWS);
  if (cached) return cached;

  const feeds = [
    'https://www.finextra.com/rss/headlines.aspx',
    'https://feeds.feedburner.com/TechCrunch/fundings-exits',
    'https://cointelegraph.com/rss'
  ];

  for (const rssUrl of feeds) {
    try {
      const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();
      if (json.status !== 'ok') continue;

      const items = (json.items || []).slice(0, 5).map(item => ({
        title: item.title,
        link: item.link,
        published: item.pubDate,
        source: json.feed?.title || 'Market Intel'
      }));

      const result = { items, updatedAt: Date.now(), source: json.feed?.title || 'Market Intel' };
      setCache('market_intel', result);
      return result;
    } catch (e) {
      console.error('[LiveFeed] Market feed failed:', e.message);
      continue;
    }
  }

  return { items: [], updatedAt: Date.now(), source: 'Market Intel', error: 'All feeds unavailable' };
}

// 4. LIVE INTELLIGENCE — Perplexity API (real-time web search with citations)
async function fetchLiveIntelligence(query) {
  const cacheKey = `intel_${(query || 'briefing').slice(0, 50)}`;
  const cached = getCached(cacheKey, CACHE_TTL_INTEL);
  if (cached) return cached;

  const rawKey = Deno.env.get('PERPLEXITY_API_KEY');
  if (!rawKey) {
    return { 
      content: 'Live intelligence unavailable — Perplexity API key not configured.', 
      citations: [],
      updatedAt: Date.now(), 
      source: 'Live Intelligence', 
      isAI: true 
    };
  }

  // Trim whitespace/newlines that can corrupt headers
  const apiKey = rawKey.trim();

  try {
    const prompt = query || 'Provide a brief daily intelligence briefing covering: top 3 cybersecurity developments today, any significant regulatory or compliance changes, and 2 key fintech/market moves. Be concise and factual. Cite your sources.';

    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Authorization', 'Bearer ' + apiKey);

    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a security and fintech intelligence analyst. Provide concise, factual, CURRENT analysis grounded in live web sources. Always cite specific sources with URLs. Use bullet points for clarity. Keep under 400 words.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 600,
        temperature: 0.2,
        return_citations: true
      })
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Perplexity ${res.status}: ${errBody.slice(0, 200)}`);
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content || 'No analysis generated.';
    const citations = json.citations || [];

    const result = { 
      content, 
      citations,
      updatedAt: Date.now(), 
      source: 'Perplexity Live Search', 
      isAI: true 
    };
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error('[LiveFeed] Perplexity intelligence error:', e.message);
    return { 
      content: `Live intelligence unavailable: ${e.message}`, 
      citations: [],
      updatedAt: Date.now(), 
      source: 'Live Intelligence', 
      isAI: true, 
      error: e.message 
    };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { action = 'feeds', query } = body;

    if (action === 'feeds') {
      const [threatIntel, securityNews, marketIntel] = await Promise.all([
        fetchThreatIntel(),
        fetchSecurityNews(),
        fetchMarketIntel()
      ]);

      return Response.json({
        threatIntel,
        securityNews,
        marketIntel,
        fetchedAt: Date.now()
      });
    }

    if (action === 'intelligence') {
      if (!checkRateLimit(user.email)) {
        return Response.json({ 
          intelligence: { 
            content: 'Daily intelligence limit reached (20/day). Try again tomorrow.', 
            citations: [],
            updatedAt: Date.now(), 
            source: 'Rate Limited', 
            isAI: true 
          },
          fetchedAt: Date.now() 
        }, { status: 429 });
      }

      const intel = await fetchLiveIntelligence(query);
      return Response.json({ intelligence: intel, fetchedAt: Date.now() });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[LiveFeed] Server error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});