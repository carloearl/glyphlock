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
  Lock, Unlock, Circle, Activity, Truck,
  ShoppingCart, Receipt, Beer, Music,
  UserPlus, UserCheck, Clock, Shield, Sparkles,
} from "lucide-react";

import POSCashRegister from "@/components/nups/POSCashRegister";
import POSBarRegister from "@/components/nups/POSBarRegister";
import TransactionHistory from "@/components/nups/TransactionHistory";
import DriverDropOffTracker from "@/components/nups/DriverDropOffTracker";
import DriverQuickAdd from "@/components/nups/frontdoor/DriverQuickAdd";
import UnifiedMusicConsole from "@/components/mixer/UnifiedMusicConsole";
import EntertainerCheckIn from "@/components/nups/EntertainerCheckIn";
import StaffOnboardingPanel from "@/components/nups/StaffOnboardingPanel";
import TimeClock from "@/components/nups/TimeClock";
import AuditLogDashboard from "@/components/nups/AuditLogDashboard";
import OneClickSeedSwitch from "@/components/nups/OneClickSeedSwitch";
import NoBatchBanner from "@/components/nups/register/NoBatchBanner";
import RegisterStatusHeader from "@/components/nups/register/RegisterStatusHeader";
import RecentTransactionsStrip from "@/components/nups/register/RecentTransactionsStrip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import NUPSRouteGuard from "@/components/nups/NUPSRouteGuard";
import NUPSAppShell from "@/components/nups/shell/NUPSAppShell";

// Driver Drop-offs intentionally REMOVED from tabs — it now lives on the
// Register tab itself so the operator never has to switch context while
// running cover charges and paying out drivers in the same shift.
const TABS = [
  { key: "register",   label: "Register · Door",    icon: ShoppingCart },
  { key: "drivers",    label: "Drivers",            icon: Truck },
  { key: "receipts",   label: "Receipts",           icon: Receipt },
  { key: "bar",        label: "Bar",                icon: Beer },
  { key: "dj",         label: "DJ",                 icon: Music },
  { key: "onboarding", label: "Entertainer Onboard",icon: UserPlus },
  { key: "checkin",    label: "Talent Check-In",    icon: UserCheck },
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
  const [showSeedDialog, setShowSeedDialog] = useState(false);

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
      actions={
        <div className="flex items-center gap-2">
          <BatchStatusBadge batch={activeBatch} />
          <Button
            onClick={() => setShowSeedDialog(true)}
            size="sm"
            variant="outline"
            className="border-violet-500/40 text-violet-300 hover:bg-violet-500/10 gap-1.5"
            title="Seed or wipe the demo dataset for a quick walkthrough"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Demo Data</span>
          </Button>
        </div>
      }
      role="CASHIER"
    >
      <div className="max-w-[1600px] mx-auto">
        {/* W3-012B Cycle 2B — BPAAA Register Standard §1.1 status header.
            Display-only: venue, register type, cashier, shift, batch, mode,
            clock, connection. Register type follows the active tab. */}
        {(activeTab === "register" || activeTab === "bar") && (
          <RegisterStatusHeader
            user={user}
            batch={activeBatch}
            registerType={activeTab === "bar" ? "Bar" : "Door"}
          />
        )}

        {/* Tab strip — tablet-first: horizontal scroll on narrow screens,
            wraps cleanly on wider ones, every chip stays ≥44px tall so
            fingers never miss. No overlap with the Demo Data button in
            the shell header. */}
        <div className="-mx-2 px-2 mb-4 pb-3 border-b border-slate-800 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 min-w-max md:flex-wrap md:min-w-0">
            {TABS.map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                onClick={() => setActiveTab(key)}
                variant={activeTab === key ? "default" : "outline"}
                className={`min-h-[44px] px-3 sm:px-4 text-xs sm:text-sm gap-1.5 sm:gap-2 flex-shrink-0 transition-all ${
                  activeTab === key
                    ? "bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-500 shadow-[0_0_18px_rgba(6,182,212,0.35)]"
                    : "border-slate-700 text-slate-300 hover:border-cyan-500/50 hover:text-white bg-transparent"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">{label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="space-y-4">
          {/* Register tab — the till ONLY. Drivers and Talent Check-In have
              their own tabs so the register never becomes a stacked wall.
              (Operator feedback 2026-07-09.) */}
          {activeTab === "register" && (
            <div className="flex flex-col gap-3 sm:gap-4">
              <NoBatchBanner batch={activeBatch} />
              <POSCashRegister showDriverPanel={false} user={user} station="door" />
              <RecentTransactionsStrip onViewAll={() => setActiveTab("receipts")} />
            </div>
          )}
          {activeTab === "drivers" && (
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="rounded-xl border border-yellow-500/20 bg-slate-950/60 p-3 sm:p-4">
                <DriverQuickAdd user={user} />
              </div>
              <DriverDropOffTracker user={user} />
            </div>
          )}
          {activeTab === "receipts" && (
            <TransactionHistory transactions={transactions} showReceipt={true} />
          )}
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

      {/* Demo Data dialog — single ON/OFF switch wipes + reseeds DEMO_VENUE_001
          so the operator can walk through a full night in seconds. */}
      <Dialog open={showSeedDialog} onOpenChange={setShowSeedDialog}>
        <DialogContent className="max-w-2xl bg-slate-950 border-violet-500/40 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-violet-300">
              <Sparkles className="w-5 h-5" />
              Demo Data Control
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-slate-400 -mt-2">
            One-click seed for live walkthroughs. Flip <strong className="text-emerald-300">ON</strong> to
            populate every field with realistic demo rows; flip <strong className="text-rose-300">OFF</strong> to
            wipe everything in DEMO_VENUE_001 clean.
          </p>
          <OneClickSeedSwitch />
        </DialogContent>
      </Dialog>
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