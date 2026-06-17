/**
 * Register Console — Unified POS Operations
 * ─────────────────────────────────────────
 * Single page: Register · Receipts/History · Driver Payouts
 * - Register is the dominant view
 * - Transaction History + Receipts available without losing batch context
 * - Driver Payouts pinned to active POSBatch
 * - POSBatch status surfaced globally with color-coded badges
 */
import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart, ReceiptText, Truck, Lock, Unlock, Circle, Activity,
} from "lucide-react";
import POSCashRegister from "@/components/nups/POSCashRegister";
import TransactionHistory from "@/components/nups/TransactionHistory";
import DriverPayoutHistory from "@/pages/DriverPayoutHistory";
import NUPSRouteGuard from "@/components/nups/NUPSRouteGuard";

const TABS = [
  { id: "register", label: "Register", icon: ShoppingCart, color: "cyan" },
  { id: "receipts", label: "Receipts & History", icon: ReceiptText, color: "emerald" },
  { id: "drivers", label: "Driver Payouts", icon: Truck, color: "pink" },
];

function BatchStatusBadge({ batch }) {
  if (!batch) {
    return (
      <Badge variant="outline" className="border-slate-600 text-slate-400 gap-1">
        <Circle className="w-3 h-3" /> No Active Batch
      </Badge>
    );
  }
  const status = (batch.status || "open").toLowerCase();
  const map = {
    open: { label: "Active", icon: Activity, cls: "border-emerald-500/40 text-emerald-300 bg-emerald-500/10" },
    settling: { label: "Settling", icon: Activity, cls: "border-amber-500/40 text-amber-300 bg-amber-500/10" },
    closed: { label: "Locked", icon: Lock, cls: "border-rose-500/40 text-rose-300 bg-rose-500/10" },
    locked: { label: "Locked", icon: Lock, cls: "border-rose-500/40 text-rose-300 bg-rose-500/10" },
  };
  const config = map[status] || { label: status.toUpperCase(), icon: Unlock, cls: "border-slate-600 text-slate-300" };
  const Icon = config.icon;
  const ref = (batch.batch_id || batch.id || "").toString().slice(-6).toUpperCase();
  return (
    <Badge variant="outline" className={`gap-1 font-mono ${config.cls}`}>
      <Icon className="w-3 h-3" /> Batch {ref} · {config.label}
    </Badge>
  );
}

function RegisterConsoleInner() {
  const [tab, setTab] = useState("register");

  // Active POSBatch — surfaced across every sub-tab so the operator always
  // knows what batch their actions are tied to.
  const { data: batches = [] } = useQuery({
    queryKey: ["active-pos-batch"],
    queryFn: async () => {
      const all = await base44.entities.POSBatch.list("-created_date", 5);
      return all.filter((b) => (b.status || "open").toLowerCase() === "open");
    },
    refetchInterval: 30000,
  });
  const activeBatch = batches[0];

  // Today's transactions — drives Receipts/History sub-view.
  const { data: transactions = [] } = useQuery({
    queryKey: ["register-console-transactions"],
    queryFn: async () => {
      const all = await base44.entities.POSTransaction.list("-created_date", 200);
      return all.filter((t) => !t.validation_run);
    },
    refetchInterval: 60000,
    enabled: tab === "receipts",
  });

  const todayTransactions = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return transactions.filter((t) => (t.created_date || "").slice(0, 10) === today);
  }, [transactions]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Persistent header — operator context never disappears */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-cyan-400" />
            <div>
              <h1 className="text-lg font-bold">Register Console</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                One register · One receipt log · One payout ledger
              </p>
            </div>
          </div>
          <BatchStatusBadge batch={activeBatch} />
        </div>

        {/* Sub-tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-2 flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
                  active
                    ? `text-${t.color}-300 border-${t.color}-400 bg-${t.color}-500/10`
                    : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                {t.id === "receipts" && todayTransactions.length > 0 && (
                  <Badge variant="outline" className="ml-1 text-[10px] border-emerald-500/30 text-emerald-300">
                    {todayTransactions.length}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Sub-tab body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        {tab === "register" && (
          <div className="space-y-4">
            <POSCashRegister />
          </div>
        )}

        {tab === "receipts" && (
          <div className="space-y-3">
            <Card className="bg-slate-900/60 border-emerald-500/30">
              <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-base font-bold text-emerald-300">Today's Receipts & Transaction Log</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tap any transaction to reprint its receipt. Older nights remain searchable in Accounting.
                  </p>
                </div>
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 font-mono">
                  {todayTransactions.length} txn{todayTransactions.length !== 1 ? "s" : ""}
                </Badge>
              </CardContent>
            </Card>
            <TransactionHistory transactions={todayTransactions} showReceipt={true} />
          </div>
        )}

        {tab === "drivers" && (
          <div className="space-y-3">
            <Card className="bg-slate-900/60 border-pink-500/30">
              <CardContent className="p-4">
                <h2 className="text-base font-bold text-pink-300">Driver Payouts — Coupled to Active Batch</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Every payout listed below is a money-OUT disbursement and is reconciled against the POS Batch
                  it was issued under. Driver payouts are never deducted from <code>total_sales</code>.
                </p>
              </CardContent>
            </Card>
            <DriverPayoutHistory />
          </div>
        )}
      </main>
    </div>
  );
}

export default function RegisterConsole() {
  return (
    <NUPSRouteGuard requiredPermission="pos_access">
      <RegisterConsoleInner />
    </NUPSRouteGuard>
  );
}