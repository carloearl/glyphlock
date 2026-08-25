import { base44 } from "@/api/base44Client";
import { loadAuthenticatedDJFallback } from "@/components/mixer/automation/djSnapshotFallback";

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
      const retryable = [502, 503, 504].includes(status);
      if (!retryable || attempt === 3) break;
      await new Promise((resolve) => setTimeout(resolve, 350 * attempt));
    }
  }

  const status = Number(lastError?.response?.status || lastError?.status || 0);
  const detail = lastError?.response?.data?.error || lastError?.response?.data?.message || lastError?.message || "Unknown gateway error";
  // The snapshot action is also consumed by the public mixer surface. A 403
  // means the caller has no authorized DJ / NUPS-manager identity — expected
  // for public visitors. Return an empty snapshot so suite tabs render their
  // natural empty states instead of throwing an unhandled authorization error.
  if (action === "snapshot" && (status === 403 || /authorized|identity required|nups manager/i.test(detail))) {
    return {
      success: true,
      snapshot_at: new Date().toISOString(),
      data_scope: "unauthorized-local-only",
      tracks: [],
      jukebox_requests: [],
      personas: [],
      crowd_metrics: [],
      performance_analytics: [],
      entertainers: [],
      active_entertainer_shifts: [],
      quality: { raw_track_count: 0, unique_track_count: 0, duplicate_track_count: 0 },
    };
  }
  throw new Error(status ? `DJ gateway ${action} failed (${status}): ${detail}` : `DJ gateway ${action} failed: ${detail}`);
}