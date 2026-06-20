/**
 * Register Console — Unified POS Operations
 * ─────────────────────────────────────────
 * Single page: Register · Receipts/History · Driver Payouts
 * - Register is the dominant view
 * - Transaction History + Receipts available without losing batch context
 * - Driver Payouts pinned to active POSBatch
 * - POSBatch status surfaced globally with color-coded badges
 */
import React, { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Lock, Unlock, Circle, Activity,
} from "lucide-react";
import POSCashRegister from "@/components/nups/POSCashRegister";
import TransactionHistory from "@/components/nups/TransactionHistory";
import DriverPayoutHistory from "@/pages/DriverPayoutHistory";
import NUPSRouteGuard from "@/components/nups/NUPSRouteGuard";
import NUPSAppShell from "@/components/nups/shell/NUPSAppShell";

const VALID_TABS = ["register", "receipts", "drivers"];
const SUBTITLE = {
  register: "POS Terminal · Active batch · Live ring-up",
  receipts: "Today's receipts & transaction log",
  drivers:  "Driver payouts — coupled to active batch",
};

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
  const location = useLocation();
  const queryTab = new URLSearchParams(location.search).get("tab");
  const initialTab = VALID_TABS.includes(queryTab) ? queryTab : "register";
  const [tab, setTab] = useState(initialTab);

  // Keep sub-view in sync with sidebar deep-links (?tab=…)
  useEffect(() => {
    if (VALID_TABS.includes(queryTab) && queryTab !== tab) setTab(queryTab);
  }, [queryTab]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const titleMap = {
    register: "Register · POS",
    receipts: "Register · Receipts",
    drivers:  "Register · Driver Payouts",
  };

  return (
    <NUPSAppShell
      title={titleMap[tab]}
      subtitle={SUBTITLE[tab]}
      actions={<BatchStatusBadge batch={activeBatch} />}
      role="CASHIER"
    >
      <div className="max-w-[1600px] mx-auto">
        {tab === "register" && (
          <div className="space-y-4">
            <POSCashRegister />
          </div>
        )}

        {tab === "receipts" && (
          <div className="space-y-3">
            <Card className="bg-white/[0.02] border-emerald-500/20">
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
            <Card className="bg-white/[0.02] border-pink-500/20">
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
      </div>
    </NUPSAppShell>
  );
}

export default function RegisterConsole() {
  return (
    <NUPSRouteGuard requiredPermission="pos_access">
      <RegisterConsoleInner />
    </NUPSRouteGuard>
  );
}