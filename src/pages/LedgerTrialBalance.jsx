/**
 * BPAA-NUPS-ACCT-001 §9 — Trial Balance dashboard.
 *
 * The books' self-proof. Displays per-account debit/credit totals and the
 * system-wide "books balance ✓/✗" indicator. Phase P0 hand-off surface —
 * once revenue sources start posting (P1+), this page is where you watch
 * them roll in live.
 */
import React, { useState, useEffect, useMemo } from "react";
import NUPSAppShell from "@/components/nups/shell/NUPSAppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle2, AlertTriangle, RefreshCw, Database, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { computeTrialBalance } from "@/lib/accounting/trialBalance";
import { seedDefaultCoa } from "@/lib/accounting/coaSeed";
import { formatCents } from "@/lib/accounting/money";
import { toast } from "sonner";

const TYPE_ORDER = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "COGS", "EXPENSE"];
const TYPE_COLOR = {
  ASSET:     "text-cyan-300",
  LIABILITY: "text-amber-300",
  EQUITY:    "text-purple-300",
  REVENUE:   "text-green-300",
  COGS:      "text-rose-300",
  EXPENSE:   "text-red-300",
};

export default function LedgerTrialBalance() {
  const [venueId, setVenueId] = useState(null);
  const [tb, setTb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  // Resolve active venue once
  useEffect(() => {
    (async () => {
      const venues = await base44.entities.Venue.list("-created_date", 1);
      setVenueId(venues?.[0]?.id || "default");
    })();
  }, []);

  const refresh = async () => {
    if (!venueId) return;
    setLoading(true);
    try {
      const data = await computeTrialBalance({ venue_id: venueId, mode: "REAL" });
      setTb(data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (venueId) refresh();
  }, [venueId]);

  const handleSeedCoa = async () => {
    if (!venueId) return;
    setSeeding(true);
    try {
      const res = await seedDefaultCoa({ venue_id: venueId, mode: "REAL" });
      toast.success(`COA: ${res.created} created, ${res.skipped} already existed`);
      await refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSeeding(false);
    }
  };

  const groupedRows = useMemo(() => {
    if (!tb) return {};
    const g = {};
    for (const r of tb.rows) {
      g[r.type] = g[r.type] || [];
      g[r.type].push(r);
    }
    return g;
  }, [tb]);

  const hasAccounts = (tb?.rows || []).length > 0;

  return (
    <NUPSAppShell title="General Ledger · Trial Balance" subtitle="BPAA-NUPS-ACCT-001 · P0 foundations">
      <div className="max-w-[1200px] mx-auto p-4 space-y-4">
        {/* Header */}
        <Card className="bg-gradient-to-r from-slate-900 to-blue-950/40 border-cyan-500/30">
          <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-cyan-300" />
              <div>
                <h1 className="text-white font-bold text-lg">Trial Balance</h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  Books' self-proof — total debits must equal total credits, to the cent.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!hasAccounts && (
                <Button
                  onClick={handleSeedCoa}
                  disabled={seeding}
                  className="bg-purple-600 hover:bg-purple-500 text-white"
                >
                  {seeding ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Database className="w-4 h-4 mr-1" />}
                  Seed Default Chart of Accounts
                </Button>
              )}
              <Button
                onClick={refresh}
                disabled={loading}
                variant="outline"
                className="border-gray-700 text-gray-300"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Balanced banner */}
        {tb && (
          <Card className={tb.balanced ? "bg-green-950/30 border-green-500/40" : "bg-red-950/30 border-red-500/40"}>
            <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {tb.balanced ? (
                  <CheckCircle2 className="w-7 h-7 text-green-300" />
                ) : (
                  <AlertTriangle className="w-7 h-7 text-red-300" />
                )}
                <div>
                  <p className={`font-bold ${tb.balanced ? "text-green-300" : "text-red-300"}`}>
                    {tb.balanced ? "Books balance ✓" : "Books DO NOT balance — defect"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {tb.entry_count} posted entries · venue {tb.venue_id} · mode {tb.mode}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Debits</p>
                  <p className="font-mono text-white font-bold">{formatCents(tb.total_debits_cents)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Credits</p>
                  <p className="font-mono text-white font-bold">{formatCents(tb.total_credits_cents)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Per-account table grouped by type */}
        {hasAccounts ? (
          TYPE_ORDER.map((t) => {
            const rows = groupedRows[t];
            if (!rows || rows.length === 0) return null;
            return (
              <Card key={t} className="bg-gray-950/50 border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className={`text-sm font-bold ${TYPE_COLOR[t]}`}>{t}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-12 px-4 py-2 text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-800">
                    <div className="col-span-2">Code</div>
                    <div className="col-span-5">Account</div>
                    <div className="col-span-2 text-right">Debits</div>
                    <div className="col-span-2 text-right">Credits</div>
                    <div className="col-span-1 text-right">Bal</div>
                  </div>
                  {rows.map((r) => (
                    <div
                      key={r.account_code}
                      className="grid grid-cols-12 px-4 py-2 text-xs border-b border-gray-900 hover:bg-gray-900/50"
                    >
                      <div className="col-span-2 font-mono text-gray-500">{r.account_code}</div>
                      <div className="col-span-5 text-white">{r.account_name}</div>
                      <div className="col-span-2 text-right font-mono text-cyan-300">
                        {r.debit_cents ? formatCents(r.debit_cents) : <span className="text-gray-700">—</span>}
                      </div>
                      <div className="col-span-2 text-right font-mono text-amber-300">
                        {r.credit_cents ? formatCents(r.credit_cents) : <span className="text-gray-700">—</span>}
                      </div>
                      <div className="col-span-1 text-right font-mono text-white font-bold">
                        {r.balance_cents !== 0 ? formatCents(r.balance_cents) : <span className="text-gray-700">—</span>}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })
        ) : (
          !loading && (
            <Card className="bg-gray-950/50 border-gray-800">
              <CardContent className="p-12 text-center space-y-3">
                <Database className="w-10 h-10 text-gray-700 mx-auto" />
                <p className="text-gray-400 font-bold">No Chart of Accounts yet for this venue</p>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  The trial balance is the books' self-proof. Seed the default chart of accounts to start
                  posting journal entries. Codes 1000–6200 will be created per BPAA-NUPS-ACCT-001 §3.
                </p>
              </CardContent>
            </Card>
          )
        )}

        {/* P0 status note */}
        <Card className="bg-amber-950/20 border-amber-500/30">
          <CardContent className="p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200 leading-relaxed">
              <strong>P0 — Foundations only.</strong> Schema, posting engine, COA seed, and this trial-balance
              read are live. No revenue sources are wired yet — bar / door / VIP / GlyphBucks will start
              posting in P1+. Until then, the entry count is expected to be 0 (or just hand-test entries).
              Driver payouts (P4) gated on the <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 mx-1">driver_payout_treatment</Badge>
              DACO ruling.
            </p>
          </CardContent>
        </Card>
      </div>
    </NUPSAppShell>
  );
}