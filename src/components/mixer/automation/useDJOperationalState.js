import { useCallback, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";

const EMPTY = {
  tracks: [],
  jukebox_requests: [],
  personas: [],
  crowd_metrics: [],
  performance_analytics: [],
  quality: { raw_track_count: 0, unique_track_count: 0, duplicate_track_count: 0 },
};

export default function useDJOperationalState({ pollMs = 10000, enabled = true } = {}) {
  const [snapshot, setSnapshot] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    if (!enabled) return null;
    try {
      const kioskSession = typeof window !== "undefined" ? sessionStorage.getItem("nups_kiosk_session") : null;
      const response = await base44.functions.invoke("nupsDJGateway", {
        action: "snapshot",
        kiosk_session: kioskSession || undefined,
      });
      const data = response?.data || {};
      if (!data.success) throw new Error(data.error || "DJ gateway returned an invalid snapshot.");
      if (mounted.current) {
        setSnapshot({ ...EMPTY, ...data });
        setLastUpdated(data.snapshot_at || new Date().toISOString());
        setError(null);
      }
      return data;
    } catch (err) {
      if (mounted.current) setError(err?.response?.data?.error || err?.message || "DJ operational snapshot failed.");
      return null;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    mounted.current = true;
    if (!enabled) {
      setLoading(false);
      return () => { mounted.current = false; };
    }
    refresh();
    const timer = setInterval(refresh, Math.max(5000, pollMs));
    return () => {
      mounted.current = false;
      clearInterval(timer);
    };
  }, [enabled, pollMs, refresh]);

  return { snapshot, loading, error, lastUpdated, refresh };
}
