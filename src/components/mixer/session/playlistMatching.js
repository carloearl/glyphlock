function normalizeText(value) {
  return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeIsrc(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function matchImportedTrack(candidate, approvedTracks = []) {
  const isrc = normalizeIsrc(candidate?.isrc);
  if (isrc) {
    const byIsrc = approvedTracks.find((track) => normalizeIsrc(track.isrc) === isrc && track.playable !== false);
    if (byIsrc) return { status: "matched", method: "isrc", track: byIsrc, provenance: candidate.provider || null };
  }

  const title = normalizeText(candidate?.title);
  const artist = normalizeText(candidate?.artist);
  const byName = approvedTracks.find((track) =>
    track.playable !== false &&
    normalizeText(track.title) === title &&
    normalizeText(track.artist) === artist
  );
  if (byName) return { status: "matched", method: "title_artist", track: byName, provenance: candidate.provider || null };
  return { status: "unmatched", method: null, track: null, provenance: candidate?.provider || null };
}
