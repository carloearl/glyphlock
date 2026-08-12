import { scoreTrack } from "@/lib/playlistEngine";
import { isEntityTrackPlayable } from "@/lib/djTrackAdapter";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function computeJukeboxPriority(request = {}) {
  return (request.is_vip ? 50 : 0) + (Number(request.tip_amount) || 0) * 2 + (Number(request.votes) || 0);
}

function requestMatchesTrack(request, track) {
  if (!request || !track) return false;
  if (request.track_id && request.track_id === track.id) return true;
  const rt = String(request.track_title || "").trim().toLowerCase();
  const ra = String(request.track_artist || "").trim().toLowerCase();
  return Boolean(rt && rt === String(track.title || "").trim().toLowerCase() && (!ra || ra === String(track.artist || "").trim().toLowerCase()));
}

function recentPenalty(track, history = []) {
  const ids = history.slice(-8).reverse();
  const index = ids.findIndex((item) => (item?.track_id || item?.entityTrackId || item) === track.id);
  if (index < 0) return 0;
  return [55, 40, 30, 22, 16, 10, 7, 4][index] || 0;
}

function artistPenalty(track, history = []) {
  const artist = String(track.artist || "").trim().toLowerCase();
  if (!artist) return 0;
  const recentArtists = history.slice(-3).map((item) => String(item?.artist || "").trim().toLowerCase()).filter(Boolean);
  return recentArtists.includes(artist) ? 14 : 0;
}

export function buildAutoDJPlan({
  tracks = [],
  persona = null,
  crowd = null,
  jukeboxRequests = [],
  performanceAnalytics = [],
  entertainerId = null,
  history = [],
  currentTrackId = null,
  limit = 5,
} = {}) {
  const crowdState = crowd || { energy_score: 5 };
  const analyticsByTrack = new Map();
  for (const row of performanceAnalytics || []) {
    if (!row?.track_id) continue;
    const current = analyticsByTrack.get(row.track_id);
    const isExact = entertainerId && row.entertainer_id === entertainerId;
    const isFloor = row.entertainer_id === "venue_floor";
    const currentExact = entertainerId && current?.entertainer_id === entertainerId;
    const currentFloor = current?.entertainer_id === "venue_floor";
    // Performer-specific history wins. Venue-floor history is the next-best
    // fallback, then the most recent generic row returned by the gateway.
    if (!current || (isExact && !currentExact) || (!currentExact && isFloor && !currentFloor)) {
      analyticsByTrack.set(row.track_id, row);
    }
  }

  const ranked = (tracks || [])
    .filter((track) => track && track.active !== false)
    .map((track) => {
      const base = scoreTrack(track, persona, crowdState);
      const matchingRequests = (jukeboxRequests || []).filter((request) => {
        if (entertainerId && request?.entertainer_id && request.entertainer_id !== "venue_floor" && request.entertainer_id !== entertainerId) return false;
        return requestMatchesTrack(request, track);
      });
      const requestPriority = matchingRequests.reduce((sum, request) => sum + computeJukeboxPriority(request), 0);
      const jukeboxBoost = clamp(requestPriority / 4, 0, 35);
      const analytics = analyticsByTrack.get(track.id);
      const performanceBoost = analytics
        ? clamp(
            ((Number(analytics.avg_crowd_energy) || 0) - 5) * 2
              + ((Number(analytics.playthrough_rate) || 0) - 0.5) * 12
              + clamp(Math.log1p(Math.max(0, Number(analytics.avg_tips) || 0)) * 1.5, 0, 8),
            -12,
            22,
          )
        : 0;
      const repeatPenalty = recentPenalty(track, history);
      const sameArtistPenalty = artistPenalty(track, history);
      const currentPenalty = currentTrackId === track.id ? 1000 : 0;
      const playable = isEntityTrackPlayable(track);
      const sourcePenalty = playable ? 0 : 45;
      const total = Math.round((base.total + jukeboxBoost + performanceBoost - repeatPenalty - sameArtistPenalty - sourcePenalty - currentPenalty) * 100) / 100;

      const reasons = [base.reason];
      if (jukeboxBoost > 0) reasons.push(`Jukebox +${jukeboxBoost.toFixed(1)}`);
      if (performanceBoost !== 0) reasons.push(`History ${performanceBoost > 0 ? "+" : ""}${performanceBoost.toFixed(1)}`);
      if (repeatPenalty > 0) reasons.push(`Repeat -${repeatPenalty}`);
      if (sameArtistPenalty > 0) reasons.push(`Artist cooldown -${sameArtistPenalty}`);
      if (!playable) reasons.push("No playable source");

      return {
        track,
        score: total,
        playable,
        base_score: base.total,
        jukebox_boost: jukeboxBoost,
        performance_boost: performanceBoost,
        repeat_penalty: repeatPenalty,
        request_count: matchingRequests.length,
        reason: reasons.filter(Boolean).join(" · "),
      };
    })
    .sort((a, b) => b.score - a.score);

  const playable = ranked.filter((candidate) => candidate.playable);
  const queue = playable.slice(0, limit);
  const next = queue[0] || ranked[0] || null;
  const confidence = next ? clamp(Math.round((next.score / 120) * 100), 0, 100) : 0;

  return {
    next,
    queue,
    ranked: ranked.slice(0, Math.max(limit, 10)),
    confidence,
    playable_count: playable.length,
    blocked_count: ranked.length - playable.length,
    status: !ranked.length ? "EMPTY_CATALOG" : playable.length ? "READY" : "NO_PLAYABLE_SOURCE",
  };
}
