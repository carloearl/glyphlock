import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

/**
 * youtubeMusicSearch — server-side YouTube Data API v3 search for NUPS DJ Booth.
 *
 * Credential requirements:
 *   • Base44 secret: YOUTUBE_API_KEY
 *   • Google Cloud project has YouTube Data API v3 enabled
 *   • key must NOT use HTTP-referrer restrictions (server-side request)
 *   • recommended: restrict the key to the YouTube Data API v3 API only
 *
 * POST { query: string, maxResults?: number, kiosk_session?: string }
 * → { items: [...], count: number }
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Accept either a normal authenticated Base44 operator or the signed NUPS
    // kiosk DJ session used by /DJHome. No anonymous search proxy.
    let authorized = false;
    const user = await base44.auth.me().catch(() => null);
    if (user) authorized = true;

    if (!authorized && body?.kiosk_session) {
      try {
        const validationResponse = await base44.functions.invoke('nupsClockIn', {
          action: 'validateSession',
          kiosk_session: body.kiosk_session,
          allowed_roles: ['DJ'],
        });
        const validation = validationResponse?.data || validationResponse || {};
        authorized = validation.valid === true;
      } catch (_) {
        authorized = false;
      }
    }

    if (!authorized) {
      return Response.json({ error: 'NUPS DJ session or Base44 login required.' }, { status: 401 });
    }

    const query = String(body?.query || '').trim();
    if (!query) return Response.json({ error: 'Query is required' }, { status: 400 });

    const maxResults = Math.min(Math.max(parseInt(body?.maxResults) || 12, 1), 25);
    const key = String(Deno.env.get('YOUTUBE_API_KEY') || '').trim();

    if (!key) {
      return Response.json({
        error: 'YOUTUBE_API_KEY is not configured in Base44 secrets.',
        code: 'YOUTUBE_SECRET_MISSING',
      }, { status: 503 });
    }

    const params = new URLSearchParams({
      part: 'snippet',
      type: 'video',
      videoCategoryId: '10',
      maxResults: String(maxResults),
      q: query,
      key,
    });

    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`, {
      signal: AbortSignal.timeout(10000),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || data?.error) {
      const message = data?.error?.message || `YouTube API HTTP ${res.status}`;
      const reason = data?.error?.errors?.[0]?.reason || null;
      return Response.json({
        error: message,
        status: res.status,
        reason,
        code: 'YOUTUBE_API_ERROR',
      }, { status: 502 });
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
