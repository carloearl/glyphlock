import { base44 } from "@/api/base44Client";

export async function searchMusicSources(query, { limit = 12 } = {}) {
  const kioskSession = typeof window !== "undefined"
    ? sessionStorage.getItem("nups_kiosk_session")
    : null;
  const response = await base44.functions.invoke("nupsMusicDiscovery", {
    query: String(query || ""),
    limit,
    kiosk_session: kioskSession || undefined,
  });
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
  if (source === "nups_library") return "NUPS Library";
  return String(source || "Source");
}
