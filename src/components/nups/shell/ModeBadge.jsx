import React, { useEffect, useState } from "react";
import { Beaker, ShieldCheck, FlaskConical, GraduationCap } from "lucide-react";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { loadVenueRates } from "@/lib/nups/venueRateConfig";
import { OPERATING_MODE, getOperatingMode, MODE_CHANGE_EVENT } from "@/lib/nups/operatingMode";

/**
 * BPAA-NUPS-MASTER-001 §2 / F-7 — Mode badge.
 *
 * Always visible. Color-distinct per mode. Source of truth is
 * VenueRateConfig.mode for the active venue (the same field the ledger
 * write gateway uses), so the UI cannot disagree with what the books
 * are recording.
 */
const STYLES = {
  LIVE: {
    label: "LIVE",
    icon: ShieldCheck,
    color: "#10b981",
    bg: "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.45)",
    tip: "Live books — every write hits the real ledger.",
  },
  TRAINING: {
    label: "TRAINING",
    icon: GraduationCap,
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.12)",
    border: "rgba(56,189,248,0.5)",
    tip: "Guided training — funds off and records isolated to this session.",
  },
  DEMO: {
    label: "DEMO",
    icon: Beaker,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.5)",
    tip: "Demo mode — clearly-flagged fake data. Safe for training & client demos. Reset-demo only touches DEMO records.",
  },
  SANDBOX: {
    label: "SANDBOX",
    icon: FlaskConical,
    color: "#a855f7",
    bg: "rgba(168,85,247,0.12)",
    border: "rgba(168,85,247,0.5)",
    tip: "Sandbox / dev mode — never writes to live books.",
  },
};

export default function ModeBadge() {
  const venue = useActiveVenue();
  const venueId = venue?.id;
  const [mode, setMode] = useState(OPERATING_MODE.LIVE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!venueId) { setLoading(false); return; }
    let cancelled = false;
    const refresh = async () => {
      const rates = await loadVenueRates(venueId);
      if (!cancelled) {
        setMode(getOperatingMode(String(rates?.mode || "REAL").toUpperCase(), venueId));
        setLoading(false);
      }
    };
    refresh();
    const onModeChanged = (event) => {
      if (!event?.detail?.venue_id || event.detail.venue_id === venueId) refresh();
    };
    window.addEventListener(MODE_CHANGE_EVENT, onModeChanged);
    return () => {
      cancelled = true;
      window.removeEventListener(MODE_CHANGE_EVENT, onModeChanged);
    };
  }, [venueId]);

  if (loading) return null;
  const cfg = STYLES[mode] || STYLES.LIVE;
  const Icon = cfg.icon;

  return (
    <div
      title={cfg.tip}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
      }}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="text-[10px] font-black tracking-wider">{cfg.label}</span>
      {mode !== OPERATING_MODE.LIVE && (
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: cfg.color }} />
      )}
    </div>
  );
}