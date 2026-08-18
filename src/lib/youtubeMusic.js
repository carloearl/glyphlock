// Shared NUPS YouTube Music search client.
// The browser never receives the Google API key. Search is proxied through the
// Base44 backend, which reads YOUTUBE_API_KEY from server-side app secrets.
import { base44 } from "@/api/base44Client";
import { isBackendUnavailable, searchLocalTracks } from "@/components/mixer/automation/djDirectFallbacks";

export async function searchYouTubeMusic(query, { maxResults = 12 } = {}) {
  const kioskSession = typeof window !== "undefined"
    ? sessionStorage.getItem("nups_kiosk_session")
    : null;

  let response;
  try {
    response = await base44.functions.invoke("youtubeMusicSearch", {
      query: String(query || ""),
      maxResults,
      kiosk_session: kioskSession || undefined,
    });
  } catch (error) {
    if (isBackendUnavailable(error)) return searchLocalTracks(String(query || ""), maxResults, "youtube");
    throw error;
  }
  const data = response?.data || {};
  if (data.error) {
    const err = new Error(data.error);
    err.code = data.code;
    err.status = data.status;
    err.reason = data.reason;
    throw err;
  }
  return Array.isArray(data.items) ? data.items : [];
}