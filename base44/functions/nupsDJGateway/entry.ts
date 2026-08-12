import { createClientFromRequest } from "npm:@base44/sdk";

const OWNER_EMAIL = "carloearl@glyphlock.com";

function normalizeText(value = "") {
  return String(value || "").trim().toLowerCase();
}

function trackIdentity(track) {
  if (track?.source_id) return `source:${normalizeText(track.source)}:${normalizeText(track.source_id)}`;
  return [
    normalizeText(track?.title),
    normalizeText(track?.artist),
    Number(track?.duration || 0),
  ].join("|");
}

function dedupeTracks(rows = []) {
  const seen = new Set();
  const tracks = [];
  let duplicates = 0;
  for (const track of rows) {
    const key = trackIdentity(track);
    if (seen.has(key)) {
      duplicates += 1;
      continue;
    }
    seen.add(key);
    tracks.push(track);
  }
  return { tracks, duplicates };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const E = base44.asServiceRole.entities;
    const body = await req.json().catch(() => ({}));
    const action = body.action || "snapshot";
    const kioskSession = String(body.kiosk_session || "");

    let operator = null;
    let authorized = false;

    if (kioskSession) {
      try {
        const validation = await base44.functions.invoke("nupsClockIn", {
          action: "validateSession",
          kiosk_session: kioskSession,
          allowed_roles: ["DJ"],
        });
        if (validation?.data?.valid) {
          authorized = true;
          operator = validation.data.operator || null;
        }
      } catch (_) {
        // Fall through to authenticated owner/admin authorization.
      }
    }

    if (!authorized) {
      const me = await base44.auth.me().catch(() => null);
      const email = normalizeText(me?.email);
      if (email === OWNER_EMAIL || me?.role === "admin") {
        authorized = true;
        operator = {
          name: me?.full_name || me?.name || me?.email || "NUPS Admin",
          role: me?.role === "admin" ? "PLATFORM_ADMIN" : "VENUE_OWNER",
          venue_id: body.venue_id || null,
          shift_id: null,
        };
      }
    }

    if (!authorized) {
      return Response.json({ error: "DJ session or NUPS administrator authorization required." }, { status: 403 });
    }

    const venueId = operator?.venue_id || body.venue_id || null;

    if (action === "savePlaylist") {
      const playlist = body.playlist || {};
      if (!playlist.entertainer_id) {
        return Response.json({ error: "entertainer_id is required to save a playlist." }, { status: 400 });
      }
      const status = ["active", "completed", "archived"].includes(playlist.status) ? playlist.status : "active";
      const created = await E.Playlist.create({
        name: String(playlist.name || `Auto-DJ ${new Date().toISOString()}`).slice(0, 160),
        entertainer_id: String(playlist.entertainer_id).slice(0, 160),
        persona_id: playlist.persona_id ? String(playlist.persona_id).slice(0, 160) : undefined,
        session_id: playlist.session_id ? String(playlist.session_id).slice(0, 160) : (operator?.shift_id || undefined),
        ordered_tracks: Array.isArray(playlist.ordered_tracks) ? playlist.ordered_tracks.slice(0, 200) : [],
        crowd_energy_score: Number.isFinite(Number(playlist.crowd_energy_score)) ? Number(playlist.crowd_energy_score) : 5,
        generation_timestamp: playlist.generation_timestamp || new Date().toISOString(),
        status,
      });
      return Response.json({ success: true, playlist: created });
    }

    if (action === "setJukeboxStatus") {
      const requestId = String(body.request_id || "");
      const status = String(body.status || "");
      if (!requestId || !["pending", "played", "rejected"].includes(status)) {
        return Response.json({ error: "Valid request_id and Jukebox status are required." }, { status: 400 });
      }
      const updated = await E.JukeboxRequest.update(requestId, { status });
      return Response.json({ success: true, request: updated });
    }

    if (action !== "snapshot") {
      return Response.json({ error: `Unsupported DJ gateway action: ${action}` }, { status: 400 });
    }

    const [trackRows, pendingRequests, personas, crowdRows, analytics] = await Promise.all([
      E.Track.list("-created_date", 500).catch(() => []),
      E.JukeboxRequest.filter({ status: "pending" }, "-created_date", 100).catch(() => []),
      E.AIDJPersona.list("-created_date", 100).catch(() => []),
      E.CrowdMetrics.list("-created_date", 50).catch(() => []),
      E.PerformanceAnalytics.list("-last_played", 500).catch(() => []),
    ]);

    const { tracks, duplicates } = dedupeTracks(trackRows || []);

    return Response.json({
      success: true,
      snapshot_at: new Date().toISOString(),
      operator,
      venue_id: venueId,
      data_scope: venueId ? "session-venue-with-legacy-global-music-records" : "legacy-global-music-records",
      tracks,
      jukebox_requests: pendingRequests || [],
      personas: personas || [],
      crowd_metrics: crowdRows || [],
      performance_analytics: analytics || [],
      quality: {
        raw_track_count: (trackRows || []).length,
        unique_track_count: tracks.length,
        duplicate_track_count: duplicates,
      },
    });
  } catch (error) {
    console.error("[nupsDJGateway]", error);
    return Response.json({ error: error?.message || "DJ gateway failed." }, { status: 500 });
  }
});
