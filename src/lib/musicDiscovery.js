import { base44 } from "@/api/base44Client";
import { isBackendUnavailable, searchLocalTracks } from "@/components/mixer/automation/djDirectFallbacks";

export async function searchMusicSources(query, { limit = 12 } = {}) {
  const kioskSession = typeof window !== "undefined"
    ? sessionStorage.getItem("nups_kiosk_session")
    : null;
  let response;
  try {
    response = await base44.functions.invoke("nupsMusicDiscovery", {
      query: String(query || ""),
      limit,
      kiosk_session: kioskSession || undefined,
    });
  } catch (error) {
    if (isBackendUnavailable(error)) {
      const results = await searchLocalTracks(String(query || ""), limit);
      return { results, providers: [{ provider: "nups_library", status: "ok", detail: "authenticated direct fallback" }] };
    }
    throw error;
  }
  const data = response?.data || {};
  if (!data.success) throw new Error(data.error || "Music discovery failed");
  return {
    results: Array.isArray(data.results) ? data.results : [],
    providers: Array.isArray(data.providers) ? data.providers : [],
  };
}

export function providerLabel(source) {
  if (source === "youtube") return "YouTube";
  if (source === "jamendo") return "Jamendo";
  if (source === "internet_archive") return "Internet Archive";
  if (source === "nups_library") return "NUPS Library";
  return String(source || "Source");
}