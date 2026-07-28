import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { seedDemoContracts } from "@/lib/nups/frontendDemoSeeder";
import { FlaskConical, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

/**
 * One-click DEMO seeder — FRONTEND-ONLY (no backend function).
 *
 * Uses base44.entities.X.bulkCreate() directly via frontendDemoSeeder.js,
 * bypassing the 402 "Payment Required" that blocks the
 * seedDemoSealedContracts backend function on non-Builder+ plans.
 *
 * All seeded records are stamped mode='DEMO' so they are isolated from
 * REAL-mode settlement and reporting.
 */
export default function DemoContractSeeder({ venueId = "DP-TEMPE-001" }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const seed = async () => {
    setBusy(true);
    setResult(null);
    try {
      const me = await base44.auth.me();
      const email = me?.email || "";
      const res = await seedDemoContracts(email);
      setResult({ ok: true, summary: res });
    } catch (e) {
      setResult({ ok: false, error: e?.message || "Unknown error" });
    }
    setBusy(false);
  };

  const summaryText = result?.summary
    ? Object.entries(result.summary)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · ")
    : "";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <button
        onClick={seed}
        disabled={busy}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold min-h-[44px] bg-amber-500/15 text-amber-300 border-2 border-amber-500/40 hover:bg-amber-500/25 disabled:opacity-60 transition-all"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
        {busy ? "Seeding demo contracts…" : "Seed Demo Contracts"}
      </button>
      {result && (
        <div
          className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border ${
            result.ok
              ? "text-emerald-300 bg-emerald-950/40 border-emerald-500/40"
              : "text-red-300 bg-red-950/40 border-red-500/40"
          }`}
        >
          {result.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          {result.ok
            ? `Seeded demo contracts — ${summaryText}. Open the VIP Contract tab to view them.`
            : `Seed issue: ${result.error}`}
        </div>
      )}
    </div>
  );
}