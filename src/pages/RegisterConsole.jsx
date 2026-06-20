/**
 * Register Console — Unified POS Operations
 * ─────────────────────────────────────────
 * Single page: Register · Receipts/History · Driver Payouts
 * - Register is the dominant view
 * - Transaction History + Receipts available without losing batch context
 * - Driver Payouts pinned to active POSBatch
 * - POSBatch status surfaced globally with color-coded badges
 */
import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  Lock, Unlock, Circle, Activity,
} from "lucide-react";
import POSCashRegister from "@/components/nups/POSCashRegister";
import NUPSRouteGuard from "@/components/nups/NUPSRouteGuard";
import NUPSAppShell from "@/components/nups/shell/NUPSAppShell";

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
  // Register is now its own page — no sub-tabs. Receipts → /Receipts.
  // Driver Payouts → /DriverPayouts. Back button in NUPSAppShell header.
  const { data: batches = [] } = useQuery({
    queryKey: ["active-pos-batch"],
    queryFn: async () => {
      const all = await base44.entities.POSBatch.list("-created_date", 5);
      return all.filter((b) => (b.status || "open").toLowerCase() === "open");
    },
    refetchInterval: 30000,
  });
  const activeBatch = batches[0];

  return (
    <NUPSAppShell
      title="Register · POS"
      subtitle="POS Terminal · Active batch · Live ring-up"
      actions={<BatchStatusBadge batch={activeBatch} />}
      role="CASHIER"
    >
      <div className="max-w-[1600px] mx-auto">
        {/* showDriverPanel=false — Driver Payouts has its own page now. */}
        <POSCashRegister showDriverPanel={false} />
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