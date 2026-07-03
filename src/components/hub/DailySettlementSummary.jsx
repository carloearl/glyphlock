/**
 * DailySettlementSummary
 *
 * Compact single-card view of today's settlement position: cash vs card
 * split, driver payouts, and net deposit. Reads today's completed
 * transactions and today's DriverPayout records for the active venue.
 * Purely observational — no writes.
 */
import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Banknote, CreditCard, Truck, Wallet, TrendingUp } from "lucide-react";

function fmt(n) {
  const v = Number(n || 0);
  return "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pct(part, whole) {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function DailySettlementSummary() {
  const day = todayIso();

  const { data: txns = [], isLoading: loadingTx } = useQuery({
    queryKey: ["settlement-today-txns"],
    queryFn: () => base44.entities.POSTransaction.list("-created_date", 1000),
    staleTime: 60_000,
  });

  const { data: payouts = [], isLoading: loadingPo } = useQuery({
    queryKey: ["settlement-today-driver-payouts"],
    queryFn: () => base44.entities.DriverPayout.list("-created_date", 500),
    staleTime: 60_000,
  });

  const totals = useMemo(() => {
    const todays = txns.filter((t) =>
      !t.validation_run &&
      t.status === "completed" &&
      (t.created_date || "").slice(0, 10) === day
    );

    const cash = todays.reduce((s, t) => s + (Number(t.cash_sales) || 0), 0);
    const card = todays.reduce((s, t) => s + (Number(t.card_sales) || 0), 0);
    const gross = todays.reduce((s, t) => s + (Number(t.total) || 0), 0);
    const comp = todays.reduce((s, t) => s + (Number(t.comp_amount) || 0), 0);
    const txCount = todays.length;

    const todaysPayouts = payouts.filter((p) =>
      (p.payout_date || (p.created_date || "").slice(0, 10)) === day
    );
    const driverPayout = todaysPayouts.reduce(
      (s, p) => s + (Number(p.total_payout) || 0), 0
    );

    const net = cash + card;
    const deposit = cash - driverPayout; // cash drawer after driver disbursement

    return { cash, card, gross, comp, txCount, driverPayout, net, deposit };
  }, [txns, payouts, day]);

  const isLoading = loadingTx || loadingPo;
  const cashPct = pct(totals.cash, totals.net);
  const cardPct = pct(totals.card, totals.net);

  return (
    <Card className="bg-gradient-to-br from-slate-950 via-slate-950 to-emerald-950/20 border-emerald-500/20 overflow-hidden">
      <CardHeader className="pb-3 flex flex-row items-start justify-between gap-2 flex-wrap">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-emerald-300/80 font-bold">
            Daily Settlement
          </div>
          <CardTitle className="text-white text-base sm:text-lg font-black mt-0.5">
            Cash & Card · Today
          </CardTitle>
        </div>
        <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 font-mono text-[10px]">
          {totals.txCount} tx
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Split ratio bar */}
        <div>
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="font-mono text-slate-400">
              Net revenue <span className="text-white font-bold">{fmt(totals.net)}</span>
            </span>
            <span className="font-mono text-slate-500">Gross {fmt(totals.gross)}</span>
          </div>
          <div className="h-3 w-full rounded-full bg-white/[0.04] border border-white/10 overflow-hidden flex">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full transition-all"
              style={{ width: `${cashPct}%` }}
              title={`Cash ${cashPct}%`}
            />
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-400 h-full transition-all"
              style={{ width: `${cardPct}%` }}
              title={`Card ${cardPct}%`}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono mt-1.5">
            <span className="text-emerald-300">● Cash {cashPct}%</span>
            <span className="text-cyan-300">● Card {cardPct}%</span>
          </div>
        </div>

        {/* Line items — 2 cols mobile, 4 cols desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <Stat
            icon={Banknote}
            label="Cash In"
            value={isLoading ? "…" : fmt(totals.cash)}
            tone="emerald"
          />
          <Stat
            icon={CreditCard}
            label="Card In"
            value={isLoading ? "…" : fmt(totals.card)}
            tone="cyan"
          />
          <Stat
            icon={Truck}
            label="Driver Payouts"
            value={isLoading ? "…" : `−${fmt(totals.driverPayout)}`}
            tone="amber"
          />
          <Stat
            icon={Wallet}
            label="Net Cash Deposit"
            value={isLoading ? "…" : fmt(totals.deposit)}
            tone="violet"
            highlight
          />
        </div>

        {totals.comp > 0 && (
          <div className="text-[11px] text-amber-300/80 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5" />
            Comps today: <span className="font-mono font-bold">{fmt(totals.comp)}</span>
            <span className="text-slate-500">— gross stays on the books; no cash/card collected.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const TONES = {
  emerald: "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-300",
  cyan:    "border-cyan-500/30 bg-cyan-500/[0.06] text-cyan-300",
  amber:   "border-amber-500/30 bg-amber-500/[0.06] text-amber-300",
  violet:  "border-violet-500/40 bg-violet-500/[0.10] text-violet-200",
};

function Stat({ icon: Icon, label, value, tone = "emerald", highlight = false }) {
  return (
    <div className={`rounded-xl border p-2.5 sm:p-3 ${TONES[tone]} ${highlight ? "shadow-[0_0_18px_-6px_rgba(139,92,246,0.5)]" : ""}`}>
      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider opacity-80">
        <Icon className="w-3 h-3" />
        <span className="truncate">{label}</span>
      </div>
      <div className="text-base sm:text-lg font-black font-mono text-white mt-1">
        {value}
      </div>
    </div>
  );
}