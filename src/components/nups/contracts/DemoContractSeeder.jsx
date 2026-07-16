import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { FlaskConical, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

/**
 * One-click DEMO seeder for the NEW sealed contract systems.
 * Creates mode:DEMO GlyphBucks sealed sales + VIP Show contracts through the
 * real seal paths — every demo record gets a valid signature, chain seal, and
 * a scannable QR. Wipes previous DEMO rows first; REAL records are never touched.
 */
export default function DemoContractSeeder({ venueId = "DP-TEMPE-001" }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const seed = async () => {
    setBusy(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke("seedDemoSealedContracts", {
        venue_id: venueId,
        clear_existing: true,
      });
      setResult(res.data);
    } catch (e) {
      setResult({ ok: false, error: e?.response?.data?.error || e.message });
    }
    setBusy(false);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <button
        onClick={seed}
        disabled={busy}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold min-h-[44px] bg-amber-500/15 text-amber-300 border-2 border-amber-500/40 hover:bg-amber-500/25 disabled:opacity-60 transition-all"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
        {busy ? "Sealing demo contracts…" : "Seed Demo Contracts"}
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
            ? `Sealed ${result.glyphbucks?.length || 0} GlyphBucks + ${result.vip_show?.length || 0} VIP Show demo contracts — search below or scan their QR to demonstrate.`
            : `Seed issue: ${result.error || (result.errors || []).join("; ")}`}
        </div>
      )}
    </div>
  );
}