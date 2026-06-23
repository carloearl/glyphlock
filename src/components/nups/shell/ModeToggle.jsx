import React, { useEffect, useState } from "react";
import { Beaker, ShieldCheck, FlaskConical, ChevronDown, Loader2, Sparkles, Trash2, AlertTriangle, Lock, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { loadVenueRates, invalidateRateCache } from "@/lib/nups/venueRateConfig";
import { seedDemoVenue, wipeDemoVenue } from "@/lib/nups/demoSeedRunner";
import { useToast } from "@/components/ui/use-toast";

/**
 * BPAA-NUPS-MASTER-001 §2 / F-7 — Mode badge + Demo/Live toggle + Seed/Wipe.
 *
 * Single header control that:
 *   • Shows the current mode (LIVE / DEMO / SANDBOX) from VenueRateConfig.
 *   • Lets the operator switch the active venue between LIVE and DEMO.
 *   • Lets the operator seed or wipe the demo dataset (only while in DEMO).
 *
 * Backend alignment: writes the new mode to VenueRateConfig (the same field
 * the ledger gateway, settlement, and reports already read), then invalidates
 * the rate cache so every subsequent posting honors the switch.
 */
const STYLES = {
  REAL: {
    label: "LIVE",
    icon: ShieldCheck,
    color: "#10b981",
    bg: "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.45)",
    tip: "Live books — every write hits the real ledger.",
  },
  DEMO: {
    label: "DEMO",
    icon: Beaker,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.5)",
    tip: "Demo mode — clearly-flagged fake data. Safe for training & client demos.",
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

export default function ModeToggle() {
  const venue = useActiveVenue();
  const venueId = venue?.id;
  const { toast } = useToast();

  const [mode, setMode] = useState("REAL");
  const [rateRowId, setRateRowId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState(null); // 'switch' | 'seed' | 'wipe' | null
  const [confirmWipe, setConfirmWipe] = useState(false);

  // Load current mode from VenueRateConfig (single source of truth)
  const refresh = async () => {
    if (!venueId) { setLoading(false); return; }
    invalidateRateCache(venueId);
    const rates = await loadVenueRates(venueId);
    setMode(String(rates?.mode || "REAL").toUpperCase());
    setRateRowId(rates?.id || null);
    setLoading(false);
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [venueId]);

  // Click-outside closes dropdown
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (!e.target.closest("[data-mode-toggle]")) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  const switchTo = async (next) => {
    if (!venueId) {
      toast({ title: "No venue selected", description: "Pick a venue first.", variant: "destructive" });
      return;
    }
    if (next === mode) { setOpen(false); return; }
    setWorking("switch");
    try {
      if (rateRowId) {
        await base44.entities.VenueRateConfig.update(rateRowId, {
          mode: next,
          last_edited_at: new Date().toISOString(),
        });
      } else {
        await base44.entities.VenueRateConfig.create({
          venue_id: venueId,
          venue_name: venue?.name || venue?.venue_name || "",
          mode: next,
          last_edited_at: new Date().toISOString(),
          notes: "Created by ModeToggle on first mode switch.",
        });
      }
      invalidateRateCache(venueId);
      setMode(next);
      toast({
        title: `Mode → ${STYLES[next].label}`,
        description: next === "REAL"
          ? "Writes now post to live books."
          : "Writes flagged as demo — safe for training.",
      });
      await refresh();
    } catch (e) {
      toast({ title: "Mode switch failed", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setWorking(null);
      setOpen(false);
    }
  };

  const runSeed = async () => {
    setWorking("seed");
    let added = 0;
    try {
      await seedDemoVenue(({ msg, type }) => { if (type === "success") added += 1; void msg; });
      toast({ title: "Demo data seeded", description: `${added} demo records added.` });
    } catch (e) {
      toast({ title: "Seed failed", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setWorking(null);
      setOpen(false);
    }
  };

  const runWipe = async () => {
    setWorking("wipe");
    let removed = 0;
    let protectedCount = 0;
    try {
      const res = await wipeDemoVenue(({ msg, type }) => { void msg; void type; });
      removed = res?.totalDeleted || 0;
      protectedCount = res?.totalProtected || 0;
      toast({
        title: "Demo data cleared",
        description: `${removed} demo records removed. ${protectedCount} real records protected.`,
      });
    } catch (e) {
      toast({ title: "Wipe failed", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setWorking(null);
      setConfirmWipe(false);
      setOpen(false);
    }
  };

  if (loading) return null;
  const cfg = STYLES[mode] || STYLES.REAL;
  const Icon = cfg.icon;
  const isDemo = mode === "DEMO";

  return (
    <div className="relative" data-mode-toggle>
      <button
        onClick={() => setOpen(o => !o)}
        title={cfg.tip}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono hover:brightness-125 transition-all"
        style={{
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          color: cfg.color,
        }}
      >
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[10px] font-black tracking-wider">{cfg.label}</span>
        {mode !== "REAL" && (
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: cfg.color }} />
        )}
        <ChevronDown className="w-3 h-3 opacity-70" />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-72 rounded-xl shadow-2xl z-[60] overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #0c1024 0%, #050818 100%)",
            border: "1px solid rgba(124,58,237,0.3)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
          }}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
            <div className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-bold">Ledger Mode</div>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mode picker */}
          <div className="p-2 space-y-1">
            {["REAL", "DEMO", "SANDBOX"].map(m => {
              const s = STYLES[m];
              const MIcon = s.icon;
              const active = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => switchTo(m)}
                  disabled={!!working}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all ${
                    active ? "bg-white/[0.05] border border-white/10" : "hover:bg-white/[0.03] border border-transparent"
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
                  >
                    <MIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-white">{s.label}</div>
                    <div className="text-[9px] text-slate-500 truncate">{s.tip}</div>
                  </div>
                  {working === "switch" && active && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
                  {active && working !== "switch" && (
                    <span className="text-[9px] font-mono text-emerald-400">ACTIVE</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Seed / Wipe — only meaningful in DEMO */}
          <div className="px-2 pb-2 pt-1 border-t border-white/5">
            <div className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-bold px-1 py-1.5">
              Demo Data
            </div>
            {!isDemo && (
              <div className="px-2 py-2 text-[10px] text-slate-500 flex items-start gap-2 leading-snug">
                <Lock className="w-3 h-3 mt-0.5 shrink-0" />
                Switch to DEMO to seed or clear demo records. Real records are always protected.
              </div>
            )}
            {isDemo && !confirmWipe && (
              <div className="space-y-1">
                <button
                  onClick={runSeed}
                  disabled={!!working}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-200 text-[11px] font-semibold disabled:opacity-50"
                >
                  {working === "seed"
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Seed demo data</span>
                  <span className="ml-auto text-[9px] text-amber-300/60 font-mono">SAFE</span>
                </button>
                <button
                  onClick={() => setConfirmWipe(true)}
                  disabled={!!working}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-200 text-[11px] font-semibold disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear demo data</span>
                  <span className="ml-auto text-[9px] text-red-300/60 font-mono">is_demo=true</span>
                </button>
              </div>
            )}
            {isDemo && confirmWipe && (
              <div className="space-y-2 p-2 rounded-lg bg-red-950/40 border border-red-500/30">
                <div className="flex items-start gap-2 text-[10px] text-red-200 leading-snug">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  Remove every record flagged <span className="font-mono">is_demo=true</span> in this venue?
                  Real records survive.
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setConfirmWipe(false)}
                    disabled={working === "wipe"}
                    className="flex-1 px-2 py-1.5 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-[10px] font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={runWipe}
                    disabled={working === "wipe"}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md bg-red-500/30 hover:bg-red-500/50 text-red-100 text-[10px] font-bold disabled:opacity-60"
                  >
                    {working === "wipe"
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <Trash2 className="w-3 h-3" />}
                    Confirm wipe
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}