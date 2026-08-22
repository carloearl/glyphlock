/**
 * Entertainer playlist persistence — authenticated, venue-scoped gateway.
 *
 * Guest identity and money are not involved here, but the playlist still
 * belongs to one venue and one entertainer. The DJ gateway resolves the live
 * actor/session server-side, validates the entertainer's venue, and preserves
 * one active playlist per entertainer.
 */
import { invokeDJGateway } from "@/components/mixer/automation/djGatewayClient";

function requireVenueId(venueId) {
  const value = String(venueId || "").trim();
  if (!value) throw new Error("Active venue is required for entertainer playlists.");
  return value;
}

/** Entertainers with an open shift in the active venue. */
export async function loadCheckedInEntertainers(venueId) {
  const resolvedVenueId = requireVenueId(venueId);
  const data = await invokeDJGateway("listCheckedInEntertainers", { venue_id: resolvedVenueId });
  return Array.isArray(data?.entertainers) ? data.entertainers : [];
}

/** The entertainer's saved active playlist for the active venue, or null. */
export async function loadEntertainerPlaylist(entertainerId, venueId) {
  if (!entertainerId) return null;
  const resolvedVenueId = requireVenueId(venueId);
  const data = await invokeDJGateway("getEntertainerPlaylist", {
    venue_id: resolvedVenueId,
    entertainer_id: entertainerId,
  });
  return data?.playlist || null;
}

/** Create or overwrite the entertainer's active playlist from mixer songs. */
export async function saveEntertainerPlaylist({ entertainerId, name, songs, venueId }) {
  if (!entertainerId) throw new Error("entertainerId is required");
  const resolvedVenueId = requireVenueId(venueId);
  const ordered_tracks = (songs || []).map((song, index) => ({
    position: index,
    track_id: song._entityTrackId || song.id || "",
    title: song.title || "",
    artist: song.artist || "",
    youtubeUrl: song.youtubeUrl || "",
    uploadUrl: song.uploadUrl || "",
    vibeTag: song.vibeTag || "",
    energyLevel: song.energyLevel || 5,
  }));

  const data = await invokeDJGateway("savePlaylist", {
    venue_id: resolvedVenueId,
    playlist: {
      entertainer_id: entertainerId,
      name: name || "Shift playlist",
      ordered_tracks,
      status: "active",
      generation_timestamp: new Date().toISOString(),
    },
  });
  return data?.playlist || null;
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
