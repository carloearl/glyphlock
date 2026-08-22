import { createClientFromRequest } from "npm:@base44/sdk@0.8.38";

const OWNER_EMAIL = "carloearl@glyphlock.com";
const PLAYLIST_ROLES = new Set(["DJ", "VENUE_MANAGER", "VENUE_OWNER", "PLATFORM_ADMIN", "SOVEREIGN"]);
const GLOBAL_ROLES = new Set(["PLATFORM_ADMIN", "SOVEREIGN"]);
const VENUE_REQUIRED_ACTIONS = new Set([
  "probePlaylistPermission",
  "listCheckedInEntertainers",
  "getEntertainerPlaylist",
  "savePlaylist",
]);

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
        // Fall through to authenticated back-office authorization.
      }
    }

    if (!authorized) {
      const me = await base44.auth.me().catch(() => null);
      const email = normalizeText(me?.email);
      let nupsUser = null;
      if (email) {
        nupsUser = (await E.NUPSUser.filter({ platform_email: email, status: "active" }, null, 1).catch(() => []))?.[0]
          || (await E.NUPSUser.filter({ username: email.split("@")[0], status: "active" }, null, 1).catch(() => []))?.[0]
          || null;
      }
      const ownerFallback = email === OWNER_EMAIL;
      const platformAdminFallback = me?.role === "admin";
      const resolvedRole = nupsUser?.role || (ownerFallback ? "SOVEREIGN" : platformAdminFallback ? "PLATFORM_ADMIN" : null);
      if (me && resolvedRole && PLAYLIST_ROLES.has(resolvedRole)) {
        authorized = true;
        operator = {
          name: nupsUser?.full_name || me?.full_name || me?.name || me?.email || "NUPS Admin",
          email: me?.email || null,
          role: resolvedRole,
          venue_id: nupsUser?.venue_id || null,
          shift_id: null,
        };
      }
    }

    if (!authorized || !PLAYLIST_ROLES.has(operator?.role)) {
      return Response.json({ error: "Authorized DJ or NUPS manager identity required." }, { status: 403 });
    }

    const requestedVenueId = String(body.venue_id || "").trim();
    const globalRole = GLOBAL_ROLES.has(operator.role);
    let venueId = String(operator?.venue_id || "").trim() || null;
    if (globalRole && requestedVenueId) venueId = requestedVenueId;
    if (!globalRole && requestedVenueId && venueId !== requestedVenueId) {
      return Response.json({ error: "DJ operation is bound to another venue." }, { status: 403 });
    }
    if (VENUE_REQUIRED_ACTIONS.has(action) && !venueId) {
      return Response.json({ error: "Active venue is required for playlist operations." }, { status: 400 });
    }

    let venueRecord = null;
    let canonicalVenueId = venueId;
    if (venueId) {
      venueRecord = (await E.Venue.filter({ venue_id: venueId, status: "active" }, null, 1).catch(() => []))?.[0]
        || await E.Venue.get(venueId).catch(() => null);
      if ((!venueRecord || venueRecord.status === "inactive") && VENUE_REQUIRED_ACTIONS.has(action)) {
        return Response.json({ error: "Playlist venue is not active." }, { status: 403 });
      }
      canonicalVenueId = venueRecord?.venue_id || venueId;
    }
    const venueAliases = new Set([venueId, canonicalVenueId, venueRecord?.id].filter(Boolean));

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
      let fulfilledRequests = 0;
      if (event === "play") {
        const matchingRequests = await E.JukeboxRequest.filter({ track_id: trackId, status: "pending" }, "-created_date", 100).catch(() => []);
        const relevantRequests = (matchingRequests || []).filter((request) =>
          !request.entertainer_id || request.entertainer_id === "venue_floor" || request.entertainer_id === entertainerId
        );
        await Promise.all(relevantRequests.map((request) => E.JukeboxRequest.update(request.id, { status: "played" }).catch(() => null)));
        fulfilledRequests = relevantRequests.length;
      }

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
        return Response.json({ success: true, analytics: created, fulfilled_requests: fulfilledRequests });
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
      return Response.json({ success: true, analytics: updated, fulfilled_requests: fulfilledRequests });
    }

    if (action === "probePlaylistPermission") {
      // Non-mutating capability check. The old implementation created and
      // immediately deleted a Playlist record merely to ask whether writes
      // were possible, which polluted audit history and could fail halfway.
      const sample = await E.Playlist.filter({ venue_id: canonicalVenueId }, "-updated_date", 1).catch(() => []);
      return Response.json({
        success: true,
        detail: "playlist gateway reachable; authorization and venue boundary verified without mutation",
        capability: {
          read: true,
          write: PLAYLIST_ROLES.has(operator.role),
          venue_id: canonicalVenueId,
          role: operator.role,
          sample_count: sample.length,
        },
      });
    }

    if (action === "listCheckedInEntertainers") {
      const shiftRows = [];
      const entertainerRows = [];
      for (const alias of venueAliases) {
        shiftRows.push(...await E.EntertainerShift.filter({ venue_id: alias }, "-check_in_time", 200).catch(() => []));
        entertainerRows.push(...await E.Entertainer.filter({ venue_id: alias, status: "active" }, "-created_date", 500).catch(() => []));
      }
      const shiftById = new Map(shiftRows.map((row) => [row.id, row]));
      const entertainerById = new Map(entertainerRows.map((row) => [row.id, row]));
      const activeStatuses = new Set(["checked_in", "on_floor", "in_vip", "on_break"]);
      const seen = new Set();
      const roster = [];
      for (const shift of [...shiftById.values()]) {
        const active = activeStatuses.has(shift.status) || (!shift.check_out_time && shift.status !== "checked_out");
        if (!active || !shift.entertainer_id || seen.has(shift.entertainer_id)) continue;
        const entertainer = entertainerById.get(shift.entertainer_id);
        if (!entertainer || !venueAliases.has(entertainer.venue_id)) continue;
        seen.add(shift.entertainer_id);
        roster.push({
          shiftId: shift.id,
          entertainerId: entertainer.id,
          name: entertainer.stage_name || entertainer.legal_name || "Unknown entertainer",
          checkInTime: shift.check_in_time || null,
          location: shift.location || "",
          venue_id: canonicalVenueId,
        });
      }
      return Response.json({ success: true, venue_id: canonicalVenueId, entertainers: roster });
    }

    if (action === "getEntertainerPlaylist") {
      const entertainerId = String(body.entertainer_id || "").trim();
      if (!entertainerId) return Response.json({ error: "entertainer_id is required." }, { status: 400 });
      const entertainer = await E.Entertainer.get(entertainerId).catch(() => null);
      if (!entertainer || !venueAliases.has(entertainer.venue_id)) {
        return Response.json({ error: "Entertainer does not belong to this venue." }, { status: 403 });
      }
      const rows = await E.Playlist.filter({ entertainer_id: entertainerId, status: "active" }, "-updated_date", 20).catch(() => []);
      const playlist = rows.find((row) => !row.venue_id || venueAliases.has(row.venue_id)) || null;
      return Response.json({ success: true, venue_id: canonicalVenueId, playlist });
    }

    if (action === "savePlaylist") {
      const playlist = body.playlist || {};
      const entertainerId = String(playlist.entertainer_id || "").trim();
      if (!entertainerId) {
        return Response.json({ error: "entertainer_id is required to save a playlist." }, { status: 400 });
      }
      const entertainer = await E.Entertainer.get(entertainerId).catch(() => null);
      if (!entertainer || !venueAliases.has(entertainer.venue_id)) {
        return Response.json({ error: "Entertainer does not belong to this venue." }, { status: 403 });
      }

      const now = new Date().toISOString();
      const orderedTracks = (Array.isArray(playlist.ordered_tracks) ? playlist.ordered_tracks : [])
        .slice(0, 200)
        .map((track, index) => ({
          position: index,
          track_id: String(track?.track_id || "").slice(0, 200),
          title: String(track?.title || "").slice(0, 250),
          artist: String(track?.artist || "").slice(0, 250),
          youtubeUrl: String(track?.youtubeUrl || "").slice(0, 1000),
          uploadUrl: String(track?.uploadUrl || "").slice(0, 1000),
          vibeTag: String(track?.vibeTag || "").slice(0, 100),
          energyLevel: Math.max(0, Math.min(10, Number(track?.energyLevel) || 5)),
        }));
      const payload = {
        venue_id: canonicalVenueId,
        name: String(playlist.name || `${entertainer.stage_name || "Entertainer"} playlist`).slice(0, 160),
        entertainer_id: entertainerId,
        persona_id: playlist.persona_id ? String(playlist.persona_id).slice(0, 160) : undefined,
        session_id: playlist.session_id ? String(playlist.session_id).slice(0, 160) : (operator?.shift_id || undefined),
        ordered_tracks: orderedTracks,
        crowd_energy_score: Number.isFinite(Number(playlist.crowd_energy_score)) ? Number(playlist.crowd_energy_score) : 5,
        generation_timestamp: playlist.generation_timestamp || now,
        updated_by: operator?.email || operator?.name || operator?.role || "nups-dj",
        updated_at: now,
        status: "active",
      };

      const candidates = await E.Playlist.filter({ entertainer_id: entertainerId, status: "active" }, "-updated_date", 20).catch(() => []);
      const matching = candidates.filter((row) => !row.venue_id || venueAliases.has(row.venue_id));
      const existing = matching[0] || null;
      const saved = existing
        ? await E.Playlist.update(existing.id, payload)
        : await E.Playlist.create(payload);
      for (const duplicate of matching.slice(1)) {
        await E.Playlist.update(duplicate.id, {
          status: "archived",
          venue_id: canonicalVenueId,
          updated_by: payload.updated_by,
          updated_at: now,
        }).catch(() => null);
      }

      await E.SystemAuditLog.create({
        event_type: existing ? "ENTERTAINER_PLAYLIST_UPDATED" : "ENTERTAINER_PLAYLIST_CREATED",
        description: `${existing ? "Updated" : "Created"} playlist for entertainer ${entertainerId}`,
        actor_email: operator?.email || operator?.name || "nups-dj",
        resource_id: saved.id,
        status: "success",
        severity: "low",
        metadata: {
          venue_id: canonicalVenueId,
          entertainer_id: entertainerId,
          playlist_id: saved.id,
          track_count: orderedTracks.length,
          actor_role: operator.role,
        },
      }).catch(() => null);

      return Response.json({ success: true, venue_id: canonicalVenueId, playlist: saved, created: !existing });
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