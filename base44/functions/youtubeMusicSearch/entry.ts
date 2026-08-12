import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

/**
 * youtubeMusicSearch — server-side proxy for YouTube Data API v3 search.
 *
 * The public API key is HTTP-referrer restricted, so direct browser calls from
 * preview/custom domains are rejected with HTTP 403 ("Requests from referer …
 * are blocked"). Proxying server-side lets us send an allowed Referer header,
 * keeps the key out of new client surfaces, and gives every DJ feature one
 * consistent search path.
 *
 * POST { query: string, maxResults?: number }
 * → { items: [...], count: number }
 */

const FALLBACK_KEY = 'AIzaSyDKesmHJytX_1MjfbVdcysMsTOa-GVcFjs';
const ALLOWED_REFERER = 'https://glyphlock.base44.app/';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const query = String(body?.query || '').trim();
    if (!query) return Response.json({ error: 'Query is required' }, { status: 400 });

    const maxResults = Math.min(Math.max(parseInt(body?.maxResults) || 12, 1), 25);
    const key = FALLBACK_KEY;

    const params = new URLSearchParams({
      part: 'snippet',
      type: 'video',
      videoCategoryId: '10',
      maxResults: String(maxResults),
      q: query,
      key,
    });

    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`, {
      headers: {
        Referer: ALLOWED_REFERER,
        Origin: ALLOWED_REFERER.replace(/\/$/, ''),
      },
      signal: AbortSignal.timeout(10000),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || data?.error) {
      const message = data?.error?.message || `YouTube API HTTP ${res.status}`;
      return Response.json({ error: message, status: res.status }, { status: 502 });
    }

    const items = (data?.items || [])
      .filter((item) => item?.id?.videoId)
      .map((item) => ({
        id: item.id.videoId,
        title: item.snippet?.title || 'Unknown Title',
        artist: item.snippet?.channelTitle || 'Unknown Channel',
        thumbnail: item.snippet?.thumbnails?.medium?.url || '',
        embed_url: `https://www.youtube.com/embed/${item.id.videoId}`,
        watch_url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      }));

    return Response.json({ items, count: items.length });
  } catch (error) {
    return Response.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
});