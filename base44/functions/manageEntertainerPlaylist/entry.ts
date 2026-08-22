import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

const GLOBAL_ROLES = new Set(['PLATFORM_ADMIN', 'SOVEREIGN']);
const PLAYLIST_ROLES = new Set(['DJ', 'VENUE_MANAGER', 'VENUE_OWNER', 'PLATFORM_ADMIN', 'SOVEREIGN']);

async function resolveNupsUser(base44, email: string) {
  const E = base44.asServiceRole.entities;
  const normalized = String(email || '').toLowerCase();
  const byEmail = await E.NUPSUser.filter({ platform_email: normalized, status: 'active' }, null, 1).catch(() => []);
  if (byEmail?.[0]) return byEmail[0];
  const username = normalized.split('@')[0];
  return (await E.NUPSUser.filter({ username, status: 'active' }, null, 1).catch(() => []))?.[0] || null;
}

function sanitizeTrack(track: any, index: number) {
  return {
    position: index,
    track_id: String(track?.track_id || track?._entityTrackId || track?.id || '').slice(0, 200),
    title: String(track?.title || '').slice(0, 300),
    artist: String(track?.artist || '').slice(0, 300),
    youtubeUrl: String(track?.youtubeUrl || '').slice(0, 2000),
    uploadUrl: String(track?.uploadUrl || '').slice(0, 2000),
    vibeTag: String(track?.vibeTag || '').slice(0, 120),
    energyLevel: Math.max(1, Math.min(10, Number(track?.energyLevel || 5))),
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) return Response.json({ error: 'Authentication required' }, { status: 401 });

    const E = base44.asServiceRole.entities;
    const nups = await resolveNupsUser(base44, user.email);
    if (!nups || !PLAYLIST_ROLES.has(nups.role)) {
      return Response.json({ error: 'DJ or manager-class NUPS role required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'capability');
    const requestedVenue = String(body.venue_id || '').trim();
    const global = GLOBAL_ROLES.has(nups.role);
    const venueId = global && requestedVenue ? requestedVenue : String(nups.venue_id || '').trim();
    if (!venueId) return Response.json({ error: 'Authorized venue could not be resolved' }, { status: 403 });
    if (!global && requestedVenue && requestedVenue !== venueId) {
      return Response.json({ error: 'Cross-venue playlist access denied' }, { status: 403 });
    }

    const venue = (await E.Venue.filter({ venue_id: venueId, status: 'active' }, null, 1).catch(() => []))?.[0]
      || await E.Venue.get(venueId).catch(() => null);
    if (!venue || venue.status === 'inactive') return Response.json({ error: 'Active venue is not registered' }, { status: 403 });
    const resolvedVenueId = String(venue.venue_id || venue.id);

    if (action === 'capability') {
      return Response.json({
        success: true,
        writable: true,
        venue_id: resolvedVenueId,
        role: nups.role,
        detail: 'Authenticated venue-scoped playlist service available',
      });
    }

    if (action === 'listCheckedIn') {
      const shifts = await E.EntertainerShift.filter({ venue_id: resolvedVenueId }, '-check_in_time', 200).catch(() => []);
      const open = (shifts || []).filter((shift: any) => shift.status !== 'checked_out' && !shift.check_out_time);
      const entertainers = await E.Entertainer.filter({ venue_id: resolvedVenueId }, '-created_date', 500).catch(() => []);
      const byId = new Map((entertainers || []).map((entertainer: any) => [entertainer.id, entertainer]));
      const seen = new Set<string>();
      const rows = [];
      for (const shift of open) {
        if (!shift.entertainer_id || seen.has(shift.entertainer_id)) continue;
        seen.add(shift.entertainer_id);
        const entertainer: any = byId.get(shift.entertainer_id);
        if (!entertainer) continue;
        rows.push({
          shiftId: shift.id,
          entertainerId: entertainer.id,
          name: entertainer.stage_name || 'Unknown entertainer',
          checkInTime: shift.check_in_time,
          location: shift.location || '',
          venue_id: resolvedVenueId,
        });
      }
      return Response.json({ success: true, venue_id: resolvedVenueId, entertainers: rows });
    }

    const entertainerId = String(body.entertainer_id || '').trim();
    if (!entertainerId) return Response.json({ error: 'entertainer_id required' }, { status: 400 });
    const entertainer = await E.Entertainer.get(entertainerId).catch(() => null);
    if (!entertainer || entertainer.venue_id !== resolvedVenueId) {
      return Response.json({ error: 'Entertainer is not assigned to this venue' }, { status: 403 });
    }

    if (action === 'get') {
      const scoped = await E.Playlist.filter({ entertainer_id: entertainerId, venue_id: resolvedVenueId, status: 'active' }, '-updated_date', 3).catch(() => []);
      const legacy = scoped.length
        ? []
        : (await E.Playlist.filter({ entertainer_id: entertainerId, status: 'active' }, '-updated_date', 10).catch(() => []))
            .filter((row: any) => !row.venue_id);
      const rows = [...scoped, ...legacy];
      if (rows.length > 1) {
        return Response.json({ error: 'Multiple active playlists require manager cleanup' }, { status: 409 });
      }
      return Response.json({ success: true, venue_id: resolvedVenueId, playlist: rows?.[0] || null, legacy_unscoped: !!rows?.[0] && !rows[0].venue_id });
    }

    if (action !== 'save') return Response.json({ error: 'Unsupported playlist action' }, { status: 400 });

    const sourceTracks = Array.isArray(body.ordered_tracks) ? body.ordered_tracks : [];
    if (sourceTracks.length > 500) return Response.json({ error: 'Playlist exceeds 500 tracks' }, { status: 400 });
    const orderedTracks = sourceTracks.map(sanitizeTrack);
    const scopedExisting = await E.Playlist.filter({ entertainer_id: entertainerId, venue_id: resolvedVenueId, status: 'active' }, '-updated_date', 3).catch(() => []);
    const legacyExisting = scopedExisting.length
      ? []
      : (await E.Playlist.filter({ entertainer_id: entertainerId, status: 'active' }, '-updated_date', 10).catch(() => []))
          .filter((row: any) => !row.venue_id);
    const existing = [...scopedExisting, ...legacyExisting];
    if (existing.length > 1) {
      return Response.json({ error: 'Multiple active playlists require manager cleanup' }, { status: 409 });
    }

    const payload = {
      entertainer_id: entertainerId,
      venue_id: resolvedVenueId,
      name: String(body.name || 'Shift playlist').slice(0, 200),
      ordered_tracks: orderedTracks,
      status: 'active',
      generation_timestamp: new Date().toISOString(),
    };
    const playlist = existing?.[0]
      ? await E.Playlist.update(existing[0].id, payload)
      : await E.Playlist.create(payload);

    await E.SystemAuditLog.create({
      event_type: 'ENTERTAINER_PLAYLIST_SAVED',
      description: `Playlist saved for entertainer ${entertainerId}`,
      actor_email: user.email,
      resource_id: playlist.id,
      status: 'success',
      severity: 'low',
      metadata: {
        venue_id: resolvedVenueId,
        entertainer_id: entertainerId,
        playlist_id: playlist.id,
        track_count: orderedTracks.length,
        action: existing?.[0] ? 'update' : 'create',
        actor_role: nups.role,
      },
    }).catch(() => null);

    return Response.json({ success: true, venue_id: resolvedVenueId, playlist });
  } catch (error) {
    return Response.json({ error: error?.message || 'Playlist operation failed' }, { status: 500 });
  }
});
