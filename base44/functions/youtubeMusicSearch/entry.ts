import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// youtubeMusicSearch — server-side YouTube Data API v3 search for the NUPS DJ Booth.
// Requires the YOUTUBE_API_KEY app secret (no HTTP-referrer restriction).

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    let authorized = false;
    const user = await base44.auth.me().catch(() => null);
    if (user) authorized = true;

    if (!authorized && body?.kiosk_session) {
      try {
        const validationResponse = await base44.functions.invoke("nupsClockIn", {
          action: "validateSession",
          kiosk_session: body.kiosk_session,
          allowed_roles: ["DJ"],
        });
        const validation = validationResponse?.data || {};
        authorized = validation.valid === true;
      } catch (_) {
        authorized = false;
      }
    }

    if (!authorized) {
      return Response.json({ error: "NUPS DJ session or Base44 login required." }, { status: 401 });
    }

    const query = String(body?.query || "").trim();
    if (!query) return Response.json({ error: "Query is required" }, { status: 400 });

    const maxResults = Math.min(Math.max(parseInt(body?.maxResults) || 12, 1), 25);
    const key = String(Deno.env.get("YOUTUBE_API_KEY") || "").trim();
    if (!key) {
      return Response.json({
        error: "YouTube search is not configured. Add a server-side YOUTUBE_API_KEY with YouTube Data API v3 enabled.",
        code: "YOUTUBE_API_KEY_MISSING",
      }, { status: 200 });
    }

    const params = new URLSearchParams({
      part: "snippet",
      type: "video",
      videoCategoryId: "10",
      videoEmbeddable: "true",
      videoSyndicated: "true",
      maxResults: String(maxResults),
      q: query,
      key,
    });

    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`, {
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok || data?.error) {
      return Response.json({
        error: data?.error?.message || `YouTube API HTTP ${res.status}`,
        status: res.status,
        reason: data?.error?.errors?.[0]?.reason || null,
        code: "YOUTUBE_API_ERROR",
      }, { status: 200 });
    }

    const items = (data?.items || [])
      .filter((item) => item?.id?.videoId)
      .map((item) => ({
        id: item.id.videoId,
        title: item.snippet?.title || "Unknown Title",
        artist: item.snippet?.channelTitle || "Unknown Channel",
        thumbnail: item.snippet?.thumbnails?.medium?.url || "",
        embed_url: `https://www.youtube.com/embed/${item.id.videoId}`,
        watch_url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      }));

    return Response.json({ items, count: items.length });
  } catch (error) {
    return Response.json({ error: error?.message || "Unknown error" }, { status: 500 });
  }
});