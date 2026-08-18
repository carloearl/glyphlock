import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

function normalize(value = "") {
  return String(value || "").trim().toLowerCase();
}

function localMatches(track, query) {
  const haystack = `${track?.title || ""} ${track?.artist || ""} ${track?.genre || ""}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const JAMENDO_CLIENT_ID = "";
    const body = await req.json().catch(() => ({}));
    const query = String(body?.query || "").trim();
    const limit = Math.min(Math.max(parseInt(body?.limit) || 12, 1), 25);
    if (!query) return Response.json({ error: "Query is required" }, { status: 400 });

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
        const validation = validationResponse?.data || validationResponse || {};
        authorized = validation.valid === true;
      } catch (_) {}
    }
    if (!authorized) return Response.json({ error: "NUPS DJ session or Base44 login required." }, { status: 401 });

    const E = base44.asServiceRole.entities;
    const providers = [];
    const results = [];
    const seen = new Set();

    const add = (item) => {
      const key = item?.source_id ? `${item.source}:${item.source_id}` : `${normalize(item?.title)}|${normalize(item?.artist)}|${item?.audio_url || item?.watch_url || ""}`;
      if (!item?.title || seen.has(key)) return;
      seen.add(key);
      results.push(item);
    };

    // 1) YouTube search requires a server-side API key. Do not reuse the
    // Google Drive OAuth connector: Base44 does not allow Drive + YouTube scopes
    // on that connection and doing so produces an invalid/insufficient-scope token.
    try {
      const apiKey = String(Deno.env.get("YOUTUBE_API_KEY") || "").trim();
      if (apiKey) {
        const params = new URLSearchParams({
          part: "snippet",
          type: "video",
          videoCategoryId: "10",
          videoEmbeddable: "true",
          videoSyndicated: "true",
          maxResults: String(limit),
          q: query,
        });
        if (apiKey) params.set("key", apiKey);
        const ytRes = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`, {
          headers: undefined,
          signal: AbortSignal.timeout(8000),
        });
        const ytData = await ytRes.json().catch(() => null);
        if (ytRes.ok && !ytData?.error) {
          providers.push({ provider: "youtube", status: "ok", credential: "server_api_key" });
          for (const item of ytData?.items || []) {
            const videoId = item?.id?.videoId;
            if (!videoId) continue;
            add({
              id: `yt-${videoId}`,
              source: "youtube",
              source_id: videoId,
              title: item.snippet?.title || "Unknown Title",
              artist: item.snippet?.channelTitle || "Unknown Channel",
              thumbnail: item.snippet?.thumbnails?.medium?.url || "",
              embed_url: `https://www.youtube.com/embed/${videoId}`,
              watch_url: `https://www.youtube.com/watch?v=${videoId}`,
              playable: true,
            });
          }
        } else {
          providers.push({ provider: "youtube", status: "unavailable", detail: ytData?.error?.message || `HTTP ${ytRes.status}` });
        }
      } else {
        providers.push({ provider: "youtube", status: "not_configured", detail: "Set YOUTUBE_API_KEY with YouTube Data API v3 enabled" });
      }
    } catch (error) {
      providers.push({ provider: "youtube", status: "error", detail: error?.message || String(error) });
    }

    // 2) Jamendo: optional royalty-free provider. No dead hardcoded client ID.
    if (JAMENDO_CLIENT_ID) try {
      const params = new URLSearchParams({
        client_id: JAMENDO_CLIENT_ID,
        format: "json",
        limit: String(limit),
        search: query,
        include: "musicinfo",
        audioformat: "mp32",
      });
      const jamRes = await fetch(`https://api.jamendo.com/v3.0/tracks/?${params.toString()}`, { signal: AbortSignal.timeout(8000) });
      const jamData = await jamRes.json().catch(() => null);
      if (jamRes.ok && Array.isArray(jamData?.results)) {
        providers.push({ provider: "jamendo", status: "ok" });
        for (const track of jamData.results) {
          if (!track?.audio) continue;
          add({
            id: `jam-${track.id}`,
            source: "jamendo",
            source_id: String(track.id),
            title: track.name || "Unknown Title",
            artist: track.artist_name || "Unknown Artist",
            album: track.album_name || "",
            duration: Number(track.duration) || 0,
            audio_url: track.audio || track.audiodownload || "",
            thumbnail: track.album_image || track.image || "",
            genre: track.musicinfo?.tags?.genres?.[0] || "",
            license: track.license_ccurl || "Jamendo",
            playable: true,
          });
        }
      } else {
        providers.push({ provider: "jamendo", status: "unavailable", detail: `HTTP ${jamRes.status}` });
      }
    } catch (error) {
      providers.push({ provider: "jamendo", status: "error", detail: error?.message || String(error) });
    } else {
      providers.push({ provider: "jamendo", status: "not_configured" });
    }

    // 3) Internet Archive: keyless public-domain / Creative Commons audio.
    try {
      const searchParams = new URLSearchParams({
        q: `${query} AND mediatype:(audio)`,
        rows: String(Math.min(limit, 8)),
        page: "1",
        output: "json",
      });
      searchParams.append("fl[]", "identifier");
      searchParams.append("fl[]", "title");
      searchParams.append("fl[]", "creator");
      const archiveRes = await fetch(`https://archive.org/advancedsearch.php?${searchParams.toString()}`, { signal: AbortSignal.timeout(10000) });
      const archiveData = await archiveRes.json().catch(() => null);
      if (archiveRes.ok) {
        const docs = archiveData?.response?.docs || [];
        const resolved = await Promise.all(docs.map(async (doc) => {
          const identifier = doc?.identifier;
          if (!identifier) return null;
          try {
            const metaRes = await fetch(`https://archive.org/metadata/${identifier}`, { signal: AbortSignal.timeout(7000) });
            if (!metaRes.ok) return null;
            const meta = await metaRes.json();
            const audio = (meta?.files || []).find((file) => /\.(mp3|ogg|m4a)$/i.test(String(file?.name || "")));
            if (!audio) return null;
            return {
              id: `archive-${identifier}-${audio.name}`,
              source: "internet_archive",
              source_id: `${identifier}/${audio.name}`,
              title: String(doc.title || identifier).slice(0, 160),
              artist: Array.isArray(doc.creator) ? String(doc.creator[0] || "Internet Archive") : String(doc.creator || "Internet Archive"),
              audio_url: `https://archive.org/download/${identifier}/${encodeURIComponent(audio.name)}`,
              watch_url: `https://archive.org/details/${identifier}`,
              license: "Internet Archive",
              playable: true,
            };
          } catch (_) {
            return null;
          }
        }));
        const playableArchive = resolved.filter(Boolean);
        providers.push({ provider: "internet_archive", status: "ok", count: playableArchive.length });
        playableArchive.forEach(add);
      } else {
        providers.push({ provider: "internet_archive", status: "unavailable", detail: `HTTP ${archiveRes.status}` });
      }
    } catch (error) {
      providers.push({ provider: "internet_archive", status: "error", detail: error?.message || String(error) });
    }

    // 4) NUPS local Track Library: always available when the app database is healthy.
    try {
      const localRows = await E.Track.list("-created_date", 500).catch(() => []);
      const activePlayable = (localRows || []).filter((track) => track?.active !== false && (track?.file_url || track?.embed_url || (track?.source === "youtube" && track?.source_id)));
      const matching = activePlayable.filter((track) => localMatches(track, query)).slice(0, limit);
      // If external discovery is unavailable and the query has no local text match,
      // return a small playable house-library fallback instead of a dead 0-result UI.
      const chosen = matching.length ? matching : (results.length ? [] : activePlayable.slice(0, limit));
      providers.push({ provider: "nups_library", status: "ok", count: chosen.length, fallback: !matching.length && chosen.length > 0 });
      for (const track of chosen) {
        const videoId = track.source === "youtube" ? track.source_id : null;
        add({
          id: `nups-${track.id}`,
          source: "nups_library",
          source_id: track.id,
          library_track_id: track.id,
          title: track.title || "Unknown Title",
          artist: track.artist || "Unknown Artist",
          genre: track.genre || "",
          duration: Number(track.duration) || 0,
          audio_url: track.file_url || "",
          thumbnail: track.thumbnail_url || "",
          embed_url: track.embed_url || (videoId ? `https://www.youtube.com/embed/${videoId}` : ""),
          watch_url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : "",
          youtube_video_id: videoId || "",
          playable: Boolean(track.file_url || track.embed_url || videoId),
        });
      }
    } catch (error) {
      providers.push({ provider: "nups_library", status: "error", detail: error?.message || String(error) });
    }

    return Response.json({
      success: true,
      query,
      providers,
      results: results.slice(0, limit * 3),
      count: results.length,
    });
  } catch (error) {
    return Response.json({ error: error?.message || "Music discovery failed" }, { status: 500 });
  }
});