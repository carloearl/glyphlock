/**
 * fableMedia — resolves what the Fable stage should show behind the graphics.
 *
 * Pure helpers, no side effects. Video is ALWAYS rendered muted: the stage is a
 * visual surface only and must never emit audio into the room.
 */

export const MEDIA_MODES = [
  { key: "graphics", label: "Graphics Only (no video)" },
  { key: "player", label: "Watch The Live Player Track" },
  { key: "url", label: "Watch A Custom URL / MP4" },
];

export function youtubeId(url = "") {
  const m = String(url).match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/
  );
  return m ? m[1] : null;
}

/** Best playable media URL for a mixer track. */
export function trackMediaUrl(track) {
  if (!track) return "";
  if (track.source === "youtube" && track.source_id) return `https://www.youtube.com/watch?v=${track.source_id}`;
  return track.embed_url || track.file_url || "";
}

/**
 * @returns {{ kind: 'youtube'|'video'|null, src: string }}
 */
export function resolveFableMedia(settings = {}, track = null) {
  const mode = settings.mediaMode || "graphics";
  if (mode === "graphics") return { kind: null, src: "" };

  const raw = (mode === "url" ? settings.mediaUrl : trackMediaUrl(track)) || "";
  if (!raw) return { kind: null, src: "" };

  const yt = youtubeId(raw);
  if (yt) {
    const params = new URLSearchParams({
      autoplay: "1", mute: "1", controls: "0", loop: "1", playlist: yt,
      modestbranding: "1", rel: "0", playsinline: "1",
    });
    return { kind: "youtube", src: `https://www.youtube.com/embed/${yt}?${params}` };
  }
  return { kind: "video", src: raw };
}