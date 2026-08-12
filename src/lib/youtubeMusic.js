// Shared YouTube Music search configuration for the NUPS DJ Booth.
// This is the existing browser/domain-restricted public key already used by
// MusicSearchTab and AIPlaylistGenerator. Keeping it in one module prevents
// the DJ features and diagnostics from drifting onto different credentials.
export const YOUTUBE_API_KEY = "AIzaSyDKesmHJytX_1MjfbVdcysMsTOa-GVcFjs";
export const YOUTUBE_SEARCH_ENDPOINT = "https://www.googleapis.com/youtube/v3/search";

export function buildYouTubeMusicSearchUrl(query, { maxResults = 12 } = {}) {
  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    videoCategoryId: "10",
    maxResults: String(maxResults),
    q: String(query || ""),
    key: YOUTUBE_API_KEY,
  });
  return `${YOUTUBE_SEARCH_ENDPOINT}?${params.toString()}`;
}
