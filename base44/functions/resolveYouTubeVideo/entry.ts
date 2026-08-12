import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

/**
 * resolveYouTubeVideo — legacy single-result resolver.
 * Uses the same server-side YOUTUBE_API_KEY Base44 secret as youtubeMusicSearch.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const query = String(body?.query || '').trim();
    if (!query) return Response.json({ error: 'Query is required' }, { status: 400 });

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
      maxResults: '1',
      q: query,
      key,
    });

    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`, {
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok || data?.error) {
      return Response.json({
        error: data?.error?.message || `YouTube API ${res.status}`,
        reason: data?.error?.errors?.[0]?.reason || null,
      }, { status: 502 });
    }

    const item = data?.items?.[0];
    if (!item) return Response.json({ videoId: null, notFound: true });

    return Response.json({
      videoId: item.id.videoId,
      title: item.snippet?.title || '',
      channel: item.snippet?.channelTitle || '',
      thumbnail: item.snippet?.thumbnails?.medium?.url || '',
    });
  } catch (error) {
    return Response.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
});
