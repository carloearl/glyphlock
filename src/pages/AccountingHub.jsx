/**
 * BPAA-NUPS-ACCT-001 P7 — Accounting Reports Hub.
 *
 * Single landing page for the full ledger-derived report stack:
 *   • Trial Balance (the books' self-proof — links to /admin/ledger)
 *   • Profit & Loss
 *   • Balance Sheet
 *   • Cash Flow
 *   • total_sales Bridge (I-5 proof)
 *
 * Period selector + venue/mode awareness. Every figure here is derived
 * from JournalEntry rows — never re-tally raw sources (§9).
 */
import React, { useState, useEffect } from "react";
import NUPSAppShell from "@/components/nups/shell/NUPSAppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, BarChart3, ExternalLink, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PnLPanel from "@/components/accounting/PnLPanel";
import BalanceSheetPanel from "@/components/accounting/BalanceSheetPanel";
import CashFlowPanel from "@/components/accounting/CashFlowPanel";
import TotalSalesBridge from "@/components/accounting/TotalSalesBridge";

const PERIODS = [
  { id: "today",   label: "Today" },
  { id: "7d",      label: "Last 7 days" },
  { id: "30d",     label: "Last 30 days" },
  { id: "ytd",     label: "Year to date" },
  { id: "all",     label: "All time" },
];

function rangeFor(periodId) {
  const now = new Date();
  if (periodId === "all") return { from: null, to: null };
  if (periodId === "today") {
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    return { from: start.toISOString(), to: now.toISOString() };
  }
  if (periodId === "7d") {
    const start = new Date(now); start.setDate(start.getDate() - 7);
    return { from: start.toISOString(), to: now.toISOString() };
  }
  if (periodId === "30d") {
    const start = new Date(now); start.setDate(start.getDate() - 30);
    return { from: start.toISOString(), to: now.toISOString() };
  }
  if (periodId === "ytd") {
    return { from: new Date(now.getFullYear(), 0, 1).toISOString(), to: now.toISOString() };
  }
  return { from: null, to: null };
}

export default function AccountingHub() {
  const [venueId, setVenueId] = useState(null);
  const [period, setPeriod] = useState("30d");
  const [driverTreatment, setDriverTreatment] = useState("UNSET");

  useEffect(() => {
    (async () => {
      const venues = await base44.entities.Venue.list("-created_date", 1);
      const vid = venues?.[0]?.id || "default";
      setVenueId(vid);
      const cfgs = await base44.entities.VenueRateConfig.filter({ venue_id: vid }, null, 1);
      setDriverTreatment(cfgs?.[0]?.driver_payout_treatment || "UNSET");
    })();
  }, []);

  const { from, to } = rangeFor(period);

  return (
    <NUPSAppShell title="Accounting · General Ledger Reports" subtitle="BPAA-NUPS-ACCT-001 · derived from the journal">
      <div className="max-w-[1400px] mx-auto p-4 space-y-4">
        {/* Header / period selector */}
        <Card className="bg-gradient-to-r from-slate-900 to-cyan-950/30 border-cyan-500/30">
          <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-7 h-7 text-cyan-300" />
              <div>
                <h1 className="text-white font-bold text-lg">Accounting Reports</h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  Every figure derived from the journal · venue {venueId || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link to="/admin/ledger">
                <Button variant="outline" className="border-gray-700 text-gray-300">
                  <BookOpen className="w-4 h-4 mr-1" /> Trial Balance
                </Button>
              </Link>
              <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1">
                {PERIODS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPeriod(p.id)}
                    className={`text-[11px] px-3 py-1.5 rounded-md font-semibold transition-colors ${
                      period === p.id ? "bg-cyan-600/30 text-cyan-200" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* P4 driver-payout open-flag banner */}
        {driverTreatment === "UNSET" && (
          <Card className="bg-amber-950/30 border-amber-500/40">
            <CardContent className="p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-200 leading-relaxed">
                <strong>⚠ DACO ruling pending:</strong> <code className="bg-amber-950/50 px-1 rounded">driver_payout_treatment</code> is{" "}
                <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 mx-1">UNSET</Badge>
                — driver payouts are NOT posting to the ledger. Set to <code>HOUSE_ABSORBED</code> or <code>GUEST_DISCOUNT</code> on VenueRateConfig to unblock P4.
                <Link to="/admin/venue-settings" className="text-cyan-300 underline ml-1 inline-flex items-center gap-1">
                  Open venue settings <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reports grid */}
        {venueId && (
          <div className="space-y-4">
            <PnLPanel venue_id={venueId} from={from} to={to} />
            <BalanceSheetPanel venue_id={venueId} asOf={to} />
            <CashFlowPanel venue_id={venueId} from={from} to={to} />
            <TotalSalesBridge venue_id={venueId} from={from} to={to} />
          </div>
        )}

        {/* Methodology note */}
        <Card className="bg-slate-950/60 border-slate-800">
          <CardContent className="p-3 text-[11px] text-gray-500 leading-relaxed flex items-start gap-2">
            <Calendar className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>
              All reports read from posted journal entries (status=POSTED) and exclude REVERSED entries.
              GlyphBucks sales credit liability 2000, never revenue (I-6). Tips post 1000→2100 as pass-through (§5).
              Entertainer payouts go to 6200 Contractor Expense, never wages or tip pool (I-7).
              Driver payouts are gated on <code>driver_payout_treatment</code> (§7).
              total_sales bridge proves I-5: it must reconcile to the cent against POSTransaction.total roll-ups.
            </span>
          </CardContent>
        </Card>
      </div>
    </NUPSAppShell>
  );
}