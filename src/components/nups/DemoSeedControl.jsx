import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, Trash2, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

/**
 * DemoSeedControl
 * ───────────────
 * Universal admin widget for any section that wants a "seed demo data /
 * clear demo data" pair of buttons. Visible ONLY to admins / sovereign.
 *
 * Props:
 *   sectionName   — short label shown in the pill (e.g. "Venue Performance")
 *   onSeed        — async () => void   — caller's seeder
 *   onClear       — async () => void   — caller's wiper (deletes the rows
 *                                         this section seeded)
 *   onAfter       — optional () => void invoked after a successful op (so
 *                   parent can invalidate queries / refetch)
 *
 * Sections own their own seed shape & wipe filter so seeding stays
 * scoped — Venue Performance seeds POSTransactions tagged `demo:true`,
 * Drivers seeds DriverProfiles tagged `notes: DEMO_SEED`, etc.
 *
 * Renders nothing for non-admin users.
 */
export default function DemoSeedControl({ sectionName, onSeed, onClear, onAfter }) {
  const [me, setMe] = useState(null);
  const [busy, setBusy] = useState(null); // 'seed' | 'clear' | null

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const u = await base44.auth.me();
        if (alive) setMe(u);
      } catch {
        if (alive) setMe(null);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Admin / sovereign gate
  const isAdmin = me && (me.role === "admin" || /carlo|vinnie/i.test(me?.email || ""));
  if (!isAdmin) return null;

  const run = async (kind, fn) => {
    if (busy) return;
    setBusy(kind);
    try {
      await fn();
      toast.success(`${sectionName}: ${kind === "seed" ? "demo data seeded" : "demo data cleared"}`);
      onAfter?.();
    } catch (e) {
      toast.error(`${sectionName} ${kind} failed: ${e?.message || e}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/70 border border-amber-500/30">
      <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-amber-300">
        <ShieldCheck className="w-3 h-3" /> Admin · {sectionName}
      </span>
      <Button
        size="sm"
        variant="ghost"
        disabled={busy !== null}
        onClick={() => run("seed", onSeed)}
        className="h-7 px-2 text-xs text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10"
      >
        {busy === "seed"
          ? <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          : <Sparkles className="w-3 h-3 mr-1" />}
        Seed Demo
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={busy !== null}
        onClick={() => run("clear", onClear)}
        className="h-7 px-2 text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-500/10"
      >
        {busy === "clear"
          ? <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          : <Trash2 className="w-3 h-3 mr-1" />}
        Clear Demo
      </Button>
    </div>
  );
}