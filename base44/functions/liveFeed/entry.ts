// DACO-GB-20260716-02 §2 — Perplexity REMOVED from all live-feed legs.
// SECURITY NEWS + MARKET INTEL: rss2json first, then direct keyless RSS fetch
// with a lightweight XML parse as silent fallback (no warning banners).
// LIVE INTELLIGENCE: platform web-grounded LLM (keyless) replaces Perplexity.
// THREAT INTEL (NIST NVD) unchanged — do not regress.
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

// 1. NIST NVD — Latest CVEs (unchanged, §2c: do not regress)
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

// Lightweight keyless RSS XML parser (no external service required).
function parseRssXml(xml, sourceName) {
  const clean = (s) => s
    .replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#039;|&apos;/g, "'").replace(/&quot;/g, '"')
    .trim();
  const pick = (block, tag) => {
    const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
    return m ? clean(m[1]) : '';
  };
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  return blocks.slice(0, 5).map(b => ({
    title: pick(b, 'title'),
    link: pick(b, 'link'),
    published: pick(b, 'pubDate'),
    source: sourceName
  })).filter(i => i.title && i.link);
}

// Fetch an RSS feed: rss2json first, direct XML fetch as silent fallback.
async function fetchRssFeed(rssUrl, fallbackName) {
  // Leg A — rss2json (keyless JSON proxy)
  try {
    const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      if (json.status === 'ok' && (json.items || []).length > 0) {
        return {
          items: json.items.slice(0, 5).map(item => ({
            title: item.title,
            link: item.link,
            published: item.pubDate,
            source: json.feed?.title || fallbackName
          })),
          source: json.feed?.title || fallbackName
        };
      }
    }
  } catch (e) {
    console.error('[LiveFeed] rss2json failed:', e.message);
  }

  // Leg B — direct keyless RSS fetch + local XML parse
  try {
    const res = await fetch(rssUrl, { headers: { 'User-Agent': 'GlyphLock-Security/1.0' } });
    if (res.ok) {
      const xml = await res.text();
      const items = parseRssXml(xml, fallbackName);
      if (items.length > 0) return { items, source: fallbackName };
    }
  } catch (e) {
    console.error('[LiveFeed] Direct RSS failed:', e.message);
  }

  return null;
}

// 2. CYBERSECURITY NEWS
async function fetchSecurityNews() {
  const cached = getCached('security_news', CACHE_TTL_NEWS);
  if (cached) return cached;

  const feeds = [
    ['https://feeds.feedburner.com/TheHackersNews', 'The Hacker News'],
    ['https://www.bleepingcomputer.com/feed/', 'BleepingComputer'],
    ['https://krebsonsecurity.com/feed/', 'Krebs on Security']
  ];

  for (const [rssUrl, name] of feeds) {
    const feed = await fetchRssFeed(rssUrl, name);
    if (feed) {
      const result = { items: feed.items, updatedAt: Date.now(), source: feed.source };
      setCache('security_news', result);
      return result;
    }
  }

  return { items: [], updatedAt: Date.now(), source: 'Security News', error: 'All feeds unavailable' };
}

// 3. MARKET / FINTECH NEWS
async function fetchMarketIntel() {
  const cached = getCached('market_intel', CACHE_TTL_NEWS);
  if (cached) return cached;

  const feeds = [
    ['https://www.finextra.com/rss/headlines.aspx', 'Finextra'],
    ['https://cointelegraph.com/rss', 'Cointelegraph'],
    ['https://feeds.feedburner.com/TechCrunch/fundings-exits', 'TechCrunch']
  ];

  for (const [rssUrl, name] of feeds) {
    const feed = await fetchRssFeed(rssUrl, name);
    if (feed) {
      const result = { items: feed.items, updatedAt: Date.now(), source: feed.source };
      setCache('market_intel', result);
      return result;
    }
  }

  return { items: [], updatedAt: Date.now(), source: 'Market Intel', error: 'All feeds unavailable' };
}

// 4. LIVE INTELLIGENCE — keyless web-grounded LLM (Perplexity removed, §2a).
async function fetchLiveIntelligence(base44, query) {
  const cacheKey = `intel_${(query || 'briefing').slice(0, 50)}`;
  const cached = getCached(cacheKey, CACHE_TTL_INTEL);
  if (cached && !cached.error) return cached;

  try {
    const prompt = query
      ? `Answer the following with current, factual, web-grounded analysis. Use bullet points, keep under 400 words, and include a list of source URLs.\n\nQuestion: ${query}`
      : 'Provide a brief daily intelligence briefing covering: top 3 cybersecurity developments today, any significant regulatory or compliance changes, and 2 key fintech/market moves. Be concise and factual, use bullet points, keep under 400 words, and include a list of source URLs.';

    const llm = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: 'gemini_3_flash',
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'The briefing/analysis text with bullet points' },
          citations: { type: 'array', items: { type: 'string' }, description: 'Source URLs' }
        }
      }
    });

    const result = {
      content: llm?.content || 'No analysis generated.',
      citations: Array.isArray(llm?.citations) ? llm.citations : [],
      updatedAt: Date.now(),
      source: 'Live Web Search',
      isAI: true
    };
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error('[LiveFeed] Intelligence error:', e.message);
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

      const intel = await fetchLiveIntelligence(base44, query);
      return Response.json({ intelligence: intel, fetchedAt: Date.now() });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[LiveFeed] Server error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});