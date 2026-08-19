/**
 * Entertainer playlist persistence — server-side source of truth.
 *
 * A dancer's playlist is stored on the Playlist entity keyed by entertainer_id
 * so it survives browsers/devices and is available to the DJ booth the moment
 * that entertainer checks in for a shift.
 */
import { base44 } from "@/api/base44Client";

/** Entertainers with an open shift (checked in, not checked out). */
export async function loadCheckedInEntertainers() {
  const shifts = await base44.entities.EntertainerShift.list("-check_in_time", 100);
  const open = shifts.filter((shift) => shift.status !== "checked_out" && !shift.check_out_time);
  if (!open.length) return [];

  const entertainers = await base44.entities.Entertainer.list("-created_date", 300);
  const byId = new Map(entertainers.map((entertainer) => [entertainer.id, entertainer]));

  const seen = new Set();
  const result = [];
  for (const shift of open) {
    if (!shift.entertainer_id || seen.has(shift.entertainer_id)) continue;
    seen.add(shift.entertainer_id);
    result.push({
      shiftId: shift.id,
      entertainerId: shift.entertainer_id,
      name: byId.get(shift.entertainer_id)?.stage_name || "Unknown entertainer",
      checkInTime: shift.check_in_time,
      location: shift.location || "",
    });
  }
  return result;
}

/** The entertainer's saved (active) playlist, or null. */
export async function loadEntertainerPlaylist(entertainerId) {
  if (!entertainerId) return null;
  const rows = await base44.entities.Playlist.filter(
    { entertainer_id: entertainerId, status: "active" },
    "-updated_date",
    1,
  );
  return rows[0] || null;
}

/** Create or overwrite the entertainer's active playlist from mixer songs. */
export async function saveEntertainerPlaylist({ entertainerId, name, songs }) {
  if (!entertainerId) throw new Error("entertainerId is required");
  const ordered_tracks = (songs || []).map((song, index) => ({
    position: index,
    track_id: song._entityTrackId || song.id,
    title: song.title || "",
    artist: song.artist || "",
    youtubeUrl: song.youtubeUrl || "",
    uploadUrl: song.uploadUrl || "",
    vibeTag: song.vibeTag || "",
    energyLevel: song.energyLevel || 5,
  }));

  const payload = {
    entertainer_id: entertainerId,
    name: name || "Shift playlist",
    ordered_tracks,
    status: "active",
    generation_timestamp: new Date().toISOString(),
  };

  const existing = await loadEntertainerPlaylist(entertainerId);
  return existing
    ? base44.entities.Playlist.update(existing.id, payload)
    : base44.entities.Playlist.create(payload);
}

/** Playlist record → plain song descriptors the mixer can hydrate. */
export function playlistToSongData(playlist) {
  return (playlist?.ordered_tracks || [])
    .slice()
    .sort((a, b) => (a.position || 0) - (b.position || 0))
    .map((track) => ({
      title: track.title || "Untitled",
      artist: track.artist || "",
      youtubeUrl: track.youtubeUrl || "",
      uploadUrl: track.uploadUrl || "",
      vibeTag: track.vibeTag || undefined,
      energyLevel: track.energyLevel || 5,
    }))
    .filter((song) => song.youtubeUrl || song.uploadUrl);
}