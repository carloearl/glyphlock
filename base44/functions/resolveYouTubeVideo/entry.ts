import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

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
    const videoId = String(body?.videoId || '').trim();
    if (!query && !/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
      return Response.json({ error: 'Query or valid videoId is required' }, { status: 400 });
    }

    const key = String(Deno.env.get('YOUTUBE_API_KEY') || '').trim();
    if (!key) {
      return Response.json({
        error: 'YOUTUBE_API_KEY is not configured in Base44 secrets.',
        code: 'YOUTUBE_SECRET_MISSING',
      }, { status: 503 });
    }

    const directLookup = /^[A-Za-z0-9_-]{11}$/.test(videoId);
    const params = directLookup
      ? new URLSearchParams({ part: 'snippet,status,contentDetails', id: videoId, key })
      : new URLSearchParams({
          part: 'snippet',
          type: 'video',
          videoCategoryId: '10',
          videoEmbeddable: 'true',
          videoSyndicated: 'true',
          maxResults: '1',
          q: query,
          key,
        });

    const endpoint = directLookup ? 'videos' : 'search';
    const res = await fetch(`https://www.googleapis.com/youtube/v3/${endpoint}?${params.toString()}`, {
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

    const resolvedVideoId = directLookup ? item.id : item.id?.videoId;
    if (!resolvedVideoId) return Response.json({ videoId: null, notFound: true });
    if (directLookup && item.status?.embeddable === false) {
      return Response.json({
        error: 'This YouTube video does not allow embedded playback.',
        code: 'YOUTUBE_NOT_EMBEDDABLE',
        videoId: resolvedVideoId,
        watchUrl: `https://www.youtube.com/watch?v=${resolvedVideoId}`,
      }, { status: 409 });
    }

    return Response.json({
      videoId: resolvedVideoId,
      title: item.snippet?.title || '',
      channel: item.snippet?.channelTitle || '',
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.high?.url || '',
      watchUrl: `https://www.youtube.com/watch?v=${resolvedVideoId}`,
      embedUrl: `https://www.youtube.com/embed/${resolvedVideoId}`,
      embeddable: directLookup ? item.status?.embeddable !== false : true,
      duration: directLookup ? item.contentDetails?.duration || '' : '',
    });
  } catch (error) {
    return Response.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
});