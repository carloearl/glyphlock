const ENERGY_BY_MOOD = {
  "high-energy": 9,
  aggressive: 9,
  sensual: 5,
  chill: 3,
  neutral: 5,
};

const VIBE_BY_MOOD = {
  "high-energy": "highEnergy",
  aggressive: "highEnergy",
  sensual: "seductive",
  chill: "cooldown",
  neutral: "crowdControl",
};

function youtubeIdFromTrack(track) {
  if (track?.source === "youtube" && track?.source_id) return track.source_id;
  const text = `${track?.embed_url || ""} ${track?.file_url || ""}`;
  const match = text.match(/(?:embed\/|v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] || null;
}

export function isEntityTrackPlayable(track) {
  return Boolean(youtubeIdFromTrack(track) || track?.file_url);
}

export function trackEntityToMixerSong(track) {
  if (!track?.id) return null;
  const videoId = youtubeIdFromTrack(track);
  return {
    id: `nups:${track.id}`,
    _entityTrackId: track.id,
    title: track.title || "Untitled track",
    artist: track.artist || "Unknown artist",
    youtubeUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : "",
    uploadUrl: track.file_url || "",
    imageUrl: track.thumbnail_url || "",
    vibeTag: VIBE_BY_MOOD[track.mood] || "crowdControl",
    energyLevel: ENERGY_BY_MOOD[track.mood] || Math.max(1, Math.min(10, Math.round(((Number(track.bpm) || 110) - 70) / 8))),
    notes: `NUPS Track Library${track.genre ? ` · ${track.genre}` : ""}${track.bpm ? ` · ${track.bpm} BPM` : ""}`,
    lastPlayed: null,
    favoriteFlag: false,
    archivedFlag: false,
  };
}
