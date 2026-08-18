import { base44 } from "@/api/base44Client";
import { loadAuthenticatedDJFallback } from "@/components/mixer/automation/djSnapshotFallback";
import { probePlaylistWriteDirect } from "@/components/mixer/automation/djDirectFallbacks";

export async function invokeDJGateway(action, payload = {}) {
  const kioskSession = typeof window !== "undefined" ? sessionStorage.getItem("nups_kiosk_session") : null;
  const request = {
    action,
    kiosk_session: kioskSession || undefined,
    ...payload,
  };

  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await base44.functions.invoke("nupsDJGateway", request);
      const data = response?.data || {};
      if (!data.success) throw new Error(data.error || `DJ gateway ${action} failed.`);
      return data;
    } catch (error) {
      lastError = error;
      const status = Number(error?.response?.status || error?.status || 0);
      if (action === "snapshot" && [502, 503, 504].includes(status)) {
        const fallback = await loadAuthenticatedDJFallback();
        if (fallback) return fallback;
      }
      if (action === "probePlaylistPermission" && [502, 503, 504].includes(status)) {
        return probePlaylistWriteDirect();
      }
      const retryable = [502, 503, 504].includes(status);
      if (!retryable || attempt === 3) break;
      await new Promise((resolve) => setTimeout(resolve, 350 * attempt));
    }
  }

  const status = Number(lastError?.response?.status || lastError?.status || 0);
  const detail = lastError?.response?.data?.error || lastError?.response?.data?.message || lastError?.message || "Unknown gateway error";
  throw new Error(status ? `DJ gateway ${action} failed (${status}): ${detail}` : `DJ gateway ${action} failed: ${detail}`);
}