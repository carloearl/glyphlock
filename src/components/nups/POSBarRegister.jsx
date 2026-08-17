import React from "react";
import { Link } from "react-router-dom";
import { Wine, Coins, ArrowRight, ShieldCheck } from "lucide-react";
import { createPageUrl } from "@/utils";
import POSCashRegister from "@/components/nups/POSCashRegister";
import { useNUPSOperatingMode } from "@/hooks/useNUPSOperatingMode";
import { useActiveVenue } from "@/hooks/useActiveVenue";

/**
 * Bar register uses the same transaction, batch, receipt, tender, audit, and
 * mode-isolation engine as the door register. Keeping one POS engine prevents
 * bar sales from bypassing the ledger gateway or inventing card approvals.
 */
export default function POSBarRegister({ user }) {
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.id || activeVenue?.venue_id || null;
  const modeState = useNUPSOperatingMode(venueId);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/[.06] p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10">
              <Wine className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-black text-white">Bar Register</h2>
                <span className={`rounded-full border px-2 py-0.5 font-mono text-[9px] ${
                  modeState.isLive
                    ? "border-emerald-500/35 text-emerald-300"
                    : "border-amber-500/35 text-amber-300"
                }`}>
                  {modeState.operatingMode}{modeState.isNonLive ? " · FUNDS OFF" : ""}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                One POS engine handles bar products, tender confirmation, batch totals, receipts, audit events, and live/non-live separation.
              </p>
            </div>
          </div>
          <Link
            to={createPageUrl("GlyphBucksHub")}
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/[.06] px-3 text-xs font-bold text-amber-200 hover:bg-amber-500/10"
          >
            <Coins className="h-4 w-4" /> GlyphBucks Hub <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-white/[.06] bg-black/20 px-3 py-2 text-[10px] text-slate-500">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
          Exchanges and GlyphBucks issuance use their dedicated ledgers. They are not recorded as fake $0 bar sales.
        </div>
      </div>

      <POSCashRegister
        user={user}
        station="bar"
        showDriverPanel={false}
        showGuestIntake={false}
      />
    </div>
  );
}
