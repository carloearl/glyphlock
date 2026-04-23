import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * resolveYouTubeVideo — Takes a search query and returns the top YouTube video ID.
 */

const YOUTUBE_API_KEY = 'AIzaSyDKesmHJytX_1MjfbVdcysMsTOa-GVcFjs';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const query = body?.query;
    if (!query || typeof query !== 'string') {
      return Response.json({ error: 'Query is required' }, { status: 400 });
    }

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=1&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });

    if (!res.ok) {
      return Response.json({ error: `YouTube API ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const item = data.items?.[0];
    if (!item) {
      return Response.json({ videoId: null, notFound: true });
    }

    return Response.json({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.medium?.url || '',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});