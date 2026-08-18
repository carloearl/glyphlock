/**
 * Receipts — mode/venue-isolated transaction log and reprint station.
 */
import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, Receipt, DollarSign } from "lucide-react";
import NUPSRouteGuard from "@/components/nups/NUPSRouteGuard";
import NUPSAppShell from "@/components/nups/shell/NUPSAppShell";
import TransactionHistory from "@/components/nups/TransactionHistory";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { useNUPSOperatingMode } from "@/hooks/useNUPSOperatingMode";
import { scopeRowsToOperatingMode } from "@/lib/nups/operatingMode";

function localDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function ReceiptsInner() {
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.id || activeVenue?.venue_id || null;
  const modeState = useNUPSOperatingMode(venueId);
  const [query, setQuery] = useState("");
  const [station, setStation] = useState("all");

  const {
    data: transactions = [],
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [
      "receipts-page-transactions",
      venueId,
      modeState.ledgerMode,
      modeState.operatingMode,
      modeState.trainingSession?.id || null,
    ],
    queryFn: async () => {
      const rows = await base44.entities.POSTransaction.list("-created_date", 1000);
      return scopeRowsToOperatingMode(rows, {
        ledgerMode: modeState.ledgerMode,
        operatingMode: modeState.operatingMode,
        venueId,
        kind: "transactional",
      }).filter((row) => row.status !== "void");
    },
    refetchInterval: 60000,
  });

  const today = localDateKey();
  const todayTransactions = useMemo(
    () => transactions.filter((transaction) => localDateKey(transaction.created_date) === today),
    [transactions, today],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return todayTransactions.filter((transaction) => {
      if (station !== "all" && String(transaction.station || "unknown").toLowerCase() !== station) return false;
      if (!needle) return true;
      const itemNames = (transaction.items || []).map((item) => item.product_name).join(" ");
      return [
        transaction.transaction_id,
        transaction.cashier_name,
        transaction.cashier_email,
        transaction.payment_method,
        transaction.batch_id,
        transaction.customer_id,
        itemNames,
      ].some((value) => String(value || "").toLowerCase().includes(needle));
    });
  }, [todayTransactions, query, station]);

  const totals = useMemo(() => filtered.reduce((acc, transaction) => {
    acc.gross += Number(transaction.total || 0);
    acc.cash += Number(transaction.cash_sales || 0);
    acc.card += Number(transaction.card_sales || 0);
    return acc;
  }, { gross: 0, cash: 0, card: 0 }), [filtered]);

  const stations = useMemo(() => Array.from(new Set(
    todayTransactions.map((transaction) => String(transaction.station || "unknown").toLowerCase()),
  )).sort(), [todayTransactions]);

  return (
    <NUPSAppShell
      title="Receipts"
      subtitle={`${modeState.operatingMode} receipt journal · ${activeVenue?.name || activeVenue?.venue_name || "Selected venue"}`}
      role="CASHIER"
    >
      <div className="max-w-[1600px] mx-auto space-y-3">
        <Card className={`bg-white/[0.02] ${modeState.isLive ? "border-emerald-500/20" : "border-amber-500/30"}`}>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-emerald-300" />
                  <h2 className="text-base font-bold text-emerald-300">Today's {modeState.operatingMode} Receipts</h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Search, inspect, and reprint transactions from this venue and operating mode only.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 font-mono">
                  {filtered.length} txn{filtered.length !== 1 ? "s" : ""}
                </Badge>
                <Button type="button" size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching} className="h-9 border-slate-700 text-slate-300">
                  <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
                </Button>
              </div>
            </div>

            {!modeState.isLive && (
              <div className="rounded-lg border border-amber-400/35 bg-amber-400/[.08] px-3 py-2 text-xs text-amber-100">
                <b>{modeState.operatingMode} · FUNDS OFF.</b> These receipts are samples and are excluded from live books.
              </div>
            )}

            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search receipt, cashier, payment, batch, or item…"
                  className="h-11 border-slate-700 bg-black/30 pl-9 text-white"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
                {["all", ...stations].map((value) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => setStation(value)}
                    className={`min-h-[44px] shrink-0 rounded-lg border px-3 text-xs font-bold uppercase transition-colors ${
                      station === value
                        ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-200"
                        : "border-slate-700 bg-black/20 text-slate-400 hover:text-white"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                ["Gross", totals.gross],
                ["Cash", totals.cash],
                ["Card / Digital", totals.card],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/[.07] bg-black/20 px-3 py-2">
                  <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-slate-500"><DollarSign className="h-3 w-3" /> {label}</div>
                  <div className="mt-1 font-mono text-sm font-black text-white">${Number(value).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <TransactionHistory transactions={filtered} showReceipt />
      </div>
    </NUPSAppShell>
  );
}

export default function Receipts() {
  return (
    <NUPSRouteGuard requiredPermission="pos_access">
      <ReceiptsInner />
    </NUPSRouteGuard>
  );
}
