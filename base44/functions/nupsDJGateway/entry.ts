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

    if (action === "createTrack") {
      const track = body.track || {};
      const title = String(track.title || "").trim().slice(0, 200);
      if (!title) return Response.json({ error: "Track title is required." }, { status: 400 });
      const artist = String(track.artist || "").trim().slice(0, 200);
      const source = ["upload", "youtube", "spotify", "manual"].includes(track.source) ? track.source : "manual";
      let existing = [];
      if (track.source_id) {
        existing = await E.Track.filter({ source, source_id: String(track.source_id) }, "-created_date", 1).catch(() => []);
      } else if (artist) {
        existing = await E.Track.filter({ title, artist }, "-created_date", 1).catch(() => []);
      }
      if (existing?.length) return Response.json({ success: true, created: false, track: existing[0] });
      const created = await E.Track.create({
        title,
        artist,
        genre: track.genre ? String(track.genre).slice(0, 100) : undefined,
        bpm: Number.isFinite(Number(track.bpm)) ? Number(track.bpm) : undefined,
        mood: ["high-energy", "sensual", "chill", "aggressive", "neutral"].includes(track.mood) ? track.mood : undefined,
        duration: Number.isFinite(Number(track.duration)) ? Number(track.duration) : undefined,
        file_url: track.file_url || undefined,
        source,
        source_id: track.source_id ? String(track.source_id).slice(0, 200) : undefined,
        thumbnail_url: track.thumbnail_url || undefined,
        embed_url: track.embed_url || undefined,
        uploader_id: operator?.name || operator?.role || "nups-dj",
        active: track.active !== false,
      });
      return Response.json({ success: true, created: true, track: created });
    }

    if (action === "deleteTrack") {
      const trackId = String(body.track_id || "");
      if (!trackId) return Response.json({ error: "track_id is required." }, { status: 400 });
      await E.Track.delete(trackId);
      return Response.json({ success: true, deleted: trackId });
    }

    if (action === "createPersona") {
      const persona = body.persona || {};
      const name = String(persona.name || "").trim().slice(0, 160);
      if (!name) return Response.json({ error: "Persona name is required." }, { status: 400 });
      const created = await E.AIDJPersona.create({
        name,
        entertainer_id: persona.entertainer_id ? String(persona.entertainer_id).slice(0, 160) : undefined,
        weighting_model: persona.weighting_model || { crowd_weight: 0.4, entertainer_weight: 0.4, revenue_weight: 0.2 },
        transition_style_rules: persona.transition_style_rules || { bpm_range: 10, mood_compatibility: [], energy_ramp: "linear" },
        genre_bias_logic: persona.genre_bias_logic || { primary_genres: [], secondary_genres: [], excluded_genres: [] },
        risk_tolerance: ["conservative", "balanced", "experimental"].includes(persona.risk_tolerance) ? persona.risk_tolerance : "balanced",
      });
      return Response.json({ success: true, persona: created });
    }

    if (action === "deletePersona") {
      const personaId = String(body.persona_id || "");
      if (!personaId) return Response.json({ error: "persona_id is required." }, { status: 400 });
      await E.AIDJPersona.delete(personaId);
      return Response.json({ success: true, deleted: personaId });
    }

    if (action === "recordCrowdMetrics") {
      const metrics = body.metrics || {};
      const created = await E.CrowdMetrics.create({
        entertainer_id: String(metrics.entertainer_id || "venue_floor").slice(0, 160),
        session_id: String(metrics.session_id || operator?.shift_id || "dj-session").slice(0, 160),
        energy_score: Math.max(0, Math.min(10, Number(metrics.energy_score) || 0)),
        tips_last_30min: Math.max(0, Number(metrics.tips_last_30min) || 0),
        votes_last_30min: Math.max(0, Number(metrics.votes_last_30min) || 0),
        playthrough_rate: Math.max(0, Math.min(1, Number(metrics.playthrough_rate) || 0)),
        manual_slider: metrics.manual_slider === null || metrics.manual_slider === undefined ? undefined : Math.max(0, Math.min(10, Number(metrics.manual_slider) || 0)),
        current_bpm: Number.isFinite(Number(metrics.current_bpm)) ? Number(metrics.current_bpm) : undefined,
        mood_votes: metrics.mood_votes || {},
      });
      return Response.json({ success: true, crowd_metrics: created });
    }

    if (action === "recordPlayback") {
      const playback = body.playback || {};
      const trackId = String(playback.track_id || "");
      const event = String(playback.event || "play");
      if (!trackId || !["play", "complete", "skip"].includes(event)) {
        return Response.json({ error: "track_id and a valid playback event are required." }, { status: 400 });
      }
      const entertainerId = String(playback.entertainer_id || "venue_floor").slice(0, 160);
      const existingRows = await E.PerformanceAnalytics.filter({ track_id: trackId, entertainer_id: entertainerId }, "-last_played", 1).catch(() => []);
      const existing = existingRows?.[0] || null;
      const crowdEnergy = Math.max(0, Math.min(10, Number(playback.crowd_energy) || 0));
      const tips = Math.max(0, Number(playback.tips) || 0);
      const now = new Date().toISOString();

      if (!existing) {
        const created = await E.PerformanceAnalytics.create({
          track_id: trackId,
          entertainer_id: entertainerId,
          play_count: event === "play" ? 1 : 0,
          avg_crowd_energy: event === "play" ? crowdEnergy : 0,
          avg_tips: event === "play" ? tips : 0,
          playthrough_rate: event === "complete" ? 1 : event === "skip" ? 0 : 0.5,
          last_played: now,
        });
        return Response.json({ success: true, analytics: created });
      }

      const currentCount = Math.max(0, Number(existing.play_count) || 0);
      const patch = { last_played: now };
      if (event === "play") {
        const nextCount = currentCount + 1;
        patch.play_count = nextCount;
        patch.avg_crowd_energy = Number((((Number(existing.avg_crowd_energy) || 0) * currentCount + crowdEnergy) / nextCount).toFixed(2));
        patch.avg_tips = Number((((Number(existing.avg_tips) || 0) * currentCount + tips) / nextCount).toFixed(2));
      } else {
        const observation = event === "complete" ? 1 : 0;
        const previousRate = Number.isFinite(Number(existing.playthrough_rate)) ? Number(existing.playthrough_rate) : 0.5;
        // EWMA reacts to new floor behavior without letting one skip erase history.
        patch.playthrough_rate = Number((previousRate * 0.8 + observation * 0.2).toFixed(3));
      }
      const updated = await E.PerformanceAnalytics.update(existing.id, patch);
      return Response.json({ success: true, analytics: updated });
    }

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

    const [trackRows, pendingRequests, personas, crowdRows, analytics, entertainers, entertainerShifts] = await Promise.all([
      E.Track.list("-created_date", 500).catch(() => []),
      E.JukeboxRequest.filter({ status: "pending" }, "-created_date", 100).catch(() => []),
      E.AIDJPersona.list("-created_date", 100).catch(() => []),
      E.CrowdMetrics.list("-created_date", 50).catch(() => []),
      E.PerformanceAnalytics.list("-last_played", 500).catch(() => []),
      E.Entertainer.list("-created_date", 500).catch(() => []),
      E.EntertainerShift.list("-check_in_time", 200).catch(() => []),
    ]);

    const activeStatuses = new Set(["checked_in", "on_floor", "in_vip", "on_break"]);
    const activeEntertainerShifts = (entertainerShifts || []).filter((shift) =>
      activeStatuses.has(shift.status) && (!venueId || !shift.venue_id || shift.venue_id === venueId)
    );
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
      entertainers: entertainers || [],
      active_entertainer_shifts: activeEntertainerShifts,
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
