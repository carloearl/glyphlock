// Shared YouTube Music search path for the NUPS DJ Booth.
//
// The YouTube key is HTTP-referrer restricted, so direct browser calls from the
// preview/app domains are rejected with HTTP 403. Every DJ surface now searches
// through the `youtubeMusicSearch` backend proxy instead — one server-side path,
// no key in the browser, no referrer blocking.
import { base44 } from "@/api/base44Client";

export async function searchYouTubeMusic(query, { maxResults = 12 } = {}) {
  const response = await base44.functions.invoke("youtubeMusicSearch", {
    query: String(query || ""),
    maxResults,
  });
  const data = response?.data || {};
  if (data.error) throw new Error(data.error);
  return Array.isArray(data.items) ? data.items : [];
}