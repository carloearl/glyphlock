const CRAWLER_USER_AGENT = /(?:Googlebot|Google-InspectionTool|bingbot|BingPreview|DuckDuckBot|Baiduspider|YandexBot|Applebot|Twitterbot|facebookexternalhit|Facebot|LinkedInBot|Slackbot|Discordbot|WhatsApp|TelegramBot|Pinterestbot)/i;

const PROTECTED_EXACT_PATHS = new Set([
  '/integrationtests',
  '/sitebuildertest',
  '/emergencybackup',
  '/fullexport',
  '/notfound',
  '/unauthorized',
  '/nupsadminportal',
  '/providerconsole',
]);

const PROTECTED_PREFIXES = ['/admin', '/demo'];

function decodePathname(pathname) {
  let decoded = pathname || '/';

  // Decode at most twice so common encoded and double-encoded path variants
  // are classified without allowing an unbounded decode loop.
  for (let pass = 0; pass < 2; pass += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }

  return decoded;
}

export function normalizePathname(pathname) {
  const collapsed = decodePathname(pathname).replace(/\/{2,}/g, '/');
  if (collapsed === '/') return '/';
  return collapsed.replace(/\/+$/, '') || '/';
}

export function isCrawler(userAgent) {
  return CRAWLER_USER_AGENT.test(userAgent || '');
}

export function isProtectedPath(pathname) {
  const path = normalizePathname(pathname).toLowerCase();
  if (PROTECTED_EXACT_PATHS.has(path)) return true;
  return PROTECTED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function protectedHeaders(existingHeaders = new Headers()) {
  const headers = new Headers(existingHeaders);
  headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  headers.set('Cache-Control', 'private, no-store, max-age=0');
  headers.set('Referrer-Policy', 'no-referrer');
  return headers;
}

function crawlerNotFound(method) {
  return new Response(method === 'HEAD' ? null : 'Not Found', {
    status: 404,
    headers: protectedHeaders(new Headers({
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    })),
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const protectedPath = isProtectedPath(url.pathname);

    // Known search and social crawlers never receive private/internal route HTML.
    if (protectedPath && isCrawler(request.headers.get('user-agent'))) {
      console.log(JSON.stringify({
        event: 'crawler_protected_route_blocked',
        path: normalizePathname(url.pathname),
      }));
      return crawlerNotFound(request.method);
    }

    // Human traffic and application authentication remain owned by Base44.
    // This avoids locking legitimate operators out while adding an HTTP-level
    // noindex policy to every protected-route response.
    let originResponse;
    try {
      originResponse = await fetch(request);
    } catch (error) {
      console.error(JSON.stringify({
        event: 'origin_fetch_failed',
        path: normalizePathname(url.pathname),
        message: error instanceof Error ? error.message : 'unknown error',
      }));
      return new Response('Bad Gateway', { status: 502 });
    }

    if (!protectedPath || originResponse.status === 101) return originResponse;

    return new Response(originResponse.body, {
      status: originResponse.status,
      statusText: originResponse.statusText,
      headers: protectedHeaders(originResponse.headers),
    });
  },
};
