/**
 * Register Console — Unified POS Operations (Restored Full Tab Set)
 * ─────────────────────────────────────────────────────────────────
 * Single page hosting every operator surface the original NUPS register had:
 *   • Register (Door POS)
 *   • Receipts (Transaction History)
 *   • Driver Drop-offs / Payouts
 *   • Bar Register
 *   • DJ Console
 *   • Entertainer Onboarding
 *   • Daily Check-In (Entertainer)
 *   • Staff Check-In (Time Clock)
 *   • Audit Trail
 *
 * Look & shell preserved (NUPSAppShell + BatchStatusBadge). Tabs added
 * inside the page so operators don't lose batch context when switching.
 */
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Lock, Unlock, Circle, Activity,
  ShoppingCart, Receipt, Users, Beer, Music,
  UserPlus, UserCheck, Clock, Shield,
} from "lucide-react";

import POSCashRegister from "@/components/nups/POSCashRegister";
import POSBarRegister from "@/components/nups/POSBarRegister";
import TransactionHistory from "@/components/nups/TransactionHistory";
import DriverDropOffTracker from "@/components/nups/DriverDropOffTracker";
import UnifiedMusicConsole from "@/components/mixer/UnifiedMusicConsole";
import EntertainerCheckIn from "@/components/nups/EntertainerCheckIn";
import StaffOnboardingPanel from "@/components/nups/StaffOnboardingPanel";
import TimeClock from "@/components/nups/TimeClock";
import AuditLogDashboard from "@/components/nups/AuditLogDashboard";

import NUPSRouteGuard from "@/components/nups/NUPSRouteGuard";
import NUPSAppShell from "@/components/nups/shell/NUPSAppShell";

const TABS = [
  { key: "register",   label: "Register",           icon: ShoppingCart },
  { key: "receipts",   label: "Receipts",           icon: Receipt },
  { key: "drivers",    label: "Driver Drop-offs",   icon: Users },
  { key: "bar",        label: "Bar",                icon: Beer },
  { key: "dj",         label: "DJ",                 icon: Music },
  { key: "onboarding", label: "Entertainer Onboard",icon: UserPlus },
  { key: "checkin",    label: "Daily Check-In",     icon: UserCheck },
  { key: "staff",      label: "Staff Check-In",     icon: Clock },
  { key: "audit",      label: "Audit Trail",        icon: Shield },
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
    open:     { label: "Active",  icon: Activity, cls: "border-emerald-500/40 text-emerald-300 bg-emerald-500/10" },
    settling: { label: "Settling",icon: Activity, cls: "border-amber-500/40 text-amber-300 bg-amber-500/10" },
    closed:   { label: "Locked",  icon: Lock,     cls: "border-rose-500/40 text-rose-300 bg-rose-500/10" },
    locked:   { label: "Locked",  icon: Lock,     cls: "border-rose-500/40 text-rose-300 bg-rose-500/10" },
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
  const [activeTab, setActiveTab] = useState("register");
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: batches = [] } = useQuery({
    queryKey: ["active-pos-batch"],
    queryFn: async () => {
      const all = await base44.entities.POSBatch.list("-created_date", 5);
      return all.filter((b) => (b.status || "open").toLowerCase() === "open");
    },
    refetchInterval: 30000,
  });
  const activeBatch = batches[0];

  // Receipts feed — only fetched when Receipts tab is active.
  const { data: transactions = [] } = useQuery({
    queryKey: ["pos-transactions-receipts"],
    queryFn: () => base44.entities.POSTransaction.list("-created_date", 100),
    enabled: activeTab === "receipts" || activeTab === "audit",
    staleTime: 30000,
  });

  return (
    <NUPSAppShell
      title="Register · POS"
      subtitle="POS Terminal · Active batch · Live ring-up"
      actions={<BatchStatusBadge batch={activeBatch} />}
      role="CASHIER"
    >
      <div className="max-w-[1600px] mx-auto">
        {/* Tab strip */}
        <div className="flex flex-wrap gap-2 mb-5 pb-4 border-b border-slate-800 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              onClick={() => setActiveTab(key)}
              variant={activeTab === key ? "default" : "outline"}
              className={`min-h-[40px] text-sm gap-2 flex-shrink-0 transition-all ${
                activeTab === key
                  ? "bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-500"
                  : "border-slate-700 text-slate-300 hover:border-cyan-500/50 hover:text-white bg-transparent"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Button>
          ))}
        </div>

        {/* Tab content */}
        <div className="space-y-4">
          {activeTab === "register" && (
            <POSCashRegister showDriverPanel={false} user={user} station="door" />
          )}
          {activeTab === "receipts" && (
            <TransactionHistory transactions={transactions} showReceipt={true} />
          )}
          {activeTab === "drivers" && <DriverDropOffTracker user={user} />}
          {activeTab === "bar" && <POSBarRegister user={user} />}
          {activeTab === "dj" && <UnifiedMusicConsole />}
          {activeTab === "onboarding" && <StaffOnboardingPanel />}
          {activeTab === "checkin" && <EntertainerCheckIn user={user} />}
          {activeTab === "staff" && (
            <TimeClock user={user} role={user?._highestRole || user?.role || "STAFF"} />
          )}
          {activeTab === "audit" && (
            <div className="space-y-4">
              <AuditLogDashboard user={user} />
              <TransactionHistory transactions={transactions} showReceipt={true} />
            </div>
          )}
        </div>
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