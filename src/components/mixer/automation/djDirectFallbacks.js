import { base44 } from "@/api/base44Client";

const matches = (track, query) => `${track.title || ""} ${track.artist || ""} ${track.genre || ""}`.toLowerCase().includes(query.toLowerCase());

export async function searchLocalTracks(query, limit = 12, source) {
  const rows = await base44.entities.Track.list("-updated_date", 100);
  const sourceRows = source ? rows.filter((track) => track.source === source) : rows;
  const matched = sourceRows.filter((track) => matches(track, query));
  return (matched.length ? matched : sourceRows).slice(0, limit).map((track) => ({
    id: `local-${track.id}`,
    title: track.title || "Untitled track",
    artist: track.artist || "Unknown artist",
    source: track.source || "nups_library",
    source_id: track.source_id || track.id,
    thumbnail: track.thumbnail_url || "",
    audio_url: track.file_url || "",
    embed_url: track.embed_url || "",
    watch_url: track.source === "youtube" && track.source_id ? `https://www.youtube.com/watch?v=${track.source_id}` : track.file_url || "",
    genre: track.genre,
    duration: track.duration,
    playable: Boolean(track.file_url || (track.source === "youtube" && track.source_id)),
  }));
}

export async function probePlaylistWriteDirect() {
  const probe = await base44.entities.Playlist.create({
    name: "DJ permission probe",
    entertainer_id: "diagnostic-permission-probe",
    ordered_tracks: [],
    status: "archived",
  });
  await base44.entities.Playlist.delete(probe.id);
  return { success: true, detail: "authenticated create + immediate delete permitted · direct data path" };
}

export function isBackendUnavailable(error) {
  return [502, 503, 504].includes(Number(error?.response?.status || error?.status || 0));
}