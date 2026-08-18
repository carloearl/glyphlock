import { base44 } from "@/api/base44Client";

function uniqueTracks(rows) {
  const seen = new Set();
  return rows.filter((track) => {
    const key = track?.source_id
      ? `${track.source || ""}:${track.source_id}`
      : `${track?.title || ""}|${track?.artist || ""}|${track?.duration || 0}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function loadAuthenticatedDJFallback() {
  if (!(await base44.auth.isAuthenticated())) return null;
  const user = await base44.auth.me();
  const [trackRows, requests, personas, crowd, analytics, entertainers, shifts] = await Promise.all([
    base44.entities.Track.list("-created_date", 500).catch(() => []),
    base44.entities.JukeboxRequest.filter({ status: "pending" }, "-created_date", 100).catch(() => []),
    base44.entities.AIDJPersona.list("-created_date", 100).catch(() => []),
    base44.entities.CrowdMetrics.list("-created_date", 50).catch(() => []),
    base44.entities.PerformanceAnalytics.list("-last_played", 500).catch(() => []),
    base44.entities.Entertainer.list("-created_date", 500).catch(() => []),
    base44.entities.EntertainerShift.list("-check_in_time", 200).catch(() => []),
  ]);
  const tracks = uniqueTracks(trackRows);
  const active = new Set(["checked_in", "on_floor", "in_vip", "on_break"]);
  return {
    success: true,
    snapshot_at: new Date().toISOString(),
    operator: { name: user.full_name || user.email, role: user.role },
    data_scope: "authenticated-rls-fallback",
    tracks,
    jukebox_requests: requests,
    personas,
    crowd_metrics: crowd,
    performance_analytics: analytics,
    entertainers,
    active_entertainer_shifts: shifts.filter((shift) => active.has(shift.status)),
    quality: {
      raw_track_count: trackRows.length,
      unique_track_count: tracks.length,
      duplicate_track_count: trackRows.length - tracks.length,
    },
  };
}