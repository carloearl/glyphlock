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
import { useNavigate } from "react-router-dom";
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
import UnifiedMusicConsole from "@/components/mixer/UnifiedMusicConsole";
import StaffOnboardingPanel from "@/components/nups/StaffOnboardingPanel";
import AuditLogDashboard from "@/components/nups/AuditLogDashboard";
import OneClickSeedSwitch from "@/components/nups/OneClickSeedSwitch";
import NoBatchBanner from "@/components/nups/register/NoBatchBanner";
import BatchConfirmControl from "@/components/nups/register/BatchConfirmControl";
import RegisterStatusHeader from "@/components/nups/register/RegisterStatusHeader";
import RecentTransactionsStrip from "@/components/nups/register/RecentTransactionsStrip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { useAdminOverride } from "@/lib/nups/adminView";
import NUPSRouteGuard from "@/components/nups/NUPSRouteGuard";
import NUPSAppShell from "@/components/nups/shell/NUPSAppShell";

// One home per feature (Section 1 audit, 2026-07-21): the Register console
// is the TILL only. Drivers, Receipts, Talent Check-In and Staff Clock each
// have their own canonical page — the strip below LINKS there instead of
// embedding duplicate copies of those surfaces.
const TABS = [
  { key: "register",   label: "Register · Door",    icon: ShoppingCart },
  { key: "bar",        label: "Bar",                icon: Beer },
  { key: "dj",         label: "DJ",                 icon: Music },
  { key: "onboarding", label: "Entertainer Onboard",icon: UserPlus },
  { key: "audit",      label: "Audit Trail",        icon: Shield },
];

// Station links — canonical pages, opened instead of embedded duplicates.
const STATION_LINKS = [
  { label: "Drivers",          icon: Truck,     path: "/DriverPayouts" },
  { label: "Receipts",         icon: Receipt,   path: "/Receipts" },
  { label: "Talent Check-In",  icon: UserCheck, path: "/EntertainerCheckIn" },
  { label: "Staff Clock",      icon: Clock,     path: "/NUPSKiosk?panel=clockIn" },
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

// Role-scoped tab access — each staff role sees ONLY its own workstation.
// Managers/admins see everything (onboarding, PINs, audit stay exclusive
// to them because no staff role lists those keys).
const STAFF_TAB_ACCESS = {
  DOOR_GIRL:  ["register"],
  DOORMAN:    ["register"],
  FLOOR_HOST: ["register"],
  HOSTESS:    ["register"],
  BARTENDER:  ["bar"],
  DJ:         ["dj"],
  SECURITY:   ["register"],
};

function RegisterConsoleInner() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("register");
  const [user, setUser] = useState(null);
  const [operator, setOperator] = useState(null);
  const [showSeedDialog, setShowSeedDialog] = useState(false);
  const adminOverride = useAdminOverride();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    // Kiosk operator session — the PIN-clocked-in staff member actually
    // working this station. When present, THEIR role scopes the console,
    // not the tablet's platform login (which is often the owner account).
    try {
      const op = sessionStorage.getItem("nups_kiosk_operator") || localStorage.getItem("nups_session") || sessionStorage.getItem("nups_session");
      if (op) setOperator(JSON.parse(op));
    } catch { /* no operator context */ }
  }, []);

  // Resolve role → allowed tabs. The clocked-in kiosk operator's role wins;
  // platform role only applies when nobody is clocked in on this device.
  // Onboarding, PINs, and Audit stay manager/admin-exclusive: no staff role
  // lists those keys, and a staff operator session overrides an admin login.
  const opRole = String(operator?.role || "").toUpperCase();
  const rawRole = opRole || String(user?._highestRole || user?.role || "").toUpperCase();
  const isManagerOrAdmin = STAFF_TAB_ACCESS[rawRole]
    ? false
    : (user?.role === "admin" ||
       ["ADMIN", "OWNER", "VENUE_OWNER", "PLATFORM_ADMIN", "SOVEREIGN", "BOOKKEEPER", "MANAGER", "VENUE_MANAGER"].includes(rawRole));
  // Operational parity rule (owner directive 2026-07-17): on the Register
  // console the owner/admin sees EXACTLY what the station's staff sees.
  // The expanded management view lives only in the Admin Portal / Manager
  // Console. A clocked-in operator's role scopes tabs; an admin login with
  // no operator gets the default door-staff set — never the full tab list.
  // Tiers: staff → their station only · manager → all operational tabs
  // (no audit) · admin → staff-parity door set unless Admin Override is ON.
  const isManagerRole = ["MANAGER", "VENUE_MANAGER"].includes(rawRole);
  const allowedKeys =
    STAFF_TAB_ACCESS[rawRole] ||
    (isManagerOrAdmin
      ? (isManagerRole
          ? ["register", "bar", "dj", "onboarding"]
          : adminOverride
            ? TABS.map((t) => t.key)
            : ["register"])
      : ["register"]);
  const visibleTabs = TABS.filter((t) => allowedKeys.includes(t.key));

  // If the current tab isn't permitted for this role, snap to the first allowed.
  useEffect(() => {
    if ((user || operator) && !allowedKeys.includes(activeTab)) {
      setActiveTab(allowedKeys[0]);
    }
  }, [user, operator, adminOverride]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: batches = [] } = useQuery({
    queryKey: ["active-pos-batch"],
    queryFn: async () => {
      const all = await base44.entities.POSBatch.list("-created_date", 5);
      return all.filter((b) => (b.status || "open").toLowerCase() === "open");
    },
    refetchInterval: 30000,
  });
  const activeBatch = batches[0];

  // Transactions feed — only fetched for the Audit tab.
  const { data: transactions = [] } = useQuery({
    queryKey: ["pos-transactions-receipts"],
    queryFn: () => base44.entities.POSTransaction.list("-created_date", 100),
    enabled: activeTab === "audit",
    staleTime: 30000,
  });

  return (
    <NUPSAppShell
      title="Register · POS"
      subtitle="POS Terminal · Active batch · Live ring-up"
      actions={
        <div className="flex items-center gap-2">
          <BatchStatusBadge batch={activeBatch} />
          {(isManagerOrAdmin || ["MANAGER", "VENUE_MANAGER"].includes(opRole)) && (
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
          )}
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
            {visibleTabs.map(({ key, label, icon: Icon }) => (
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
            {/* Station links — jump to the canonical page, no duplicate embeds */}
            <div className="w-px bg-slate-800 mx-1 hidden md:block" />
            {STATION_LINKS.map(({ label, icon: Icon, path }) => (
              <Button
                key={path}
                onClick={() => navigate(path)}
                variant="outline"
                className="min-h-[44px] px-3 sm:px-4 text-xs sm:text-sm gap-1.5 sm:gap-2 flex-shrink-0 border-dashed border-slate-700 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-300 bg-transparent"
                title={`Open ${label} page`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">{label} ↗</span>
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
              {/* Two-step batch open: the MANAGER opens tonight's batch on the
                  Manager Console; the door operator confirms it here before
                  the first transaction. No register-side batch opening. */}
              <BatchConfirmControl
                operatorName={operator?.full_name || user?.full_name || user?.email}
                operatorRole={operator?.role || user?._highestRole || user?.role}
                operatorEmail={operator?.email || user?.email}
                operatorId={operator?.id || user?.id}
              />
              {/* Till ONLY — guest ID intake lives on 1 · Open Night (no duplicate screens). */}
              <POSCashRegister showDriverPanel={false} showGuestIntake={false} user={user} station="door" />
              <RecentTransactionsStrip onViewAll={() => setActiveTab("receipts")} />
            </div>
          )}
          {activeTab === "bar" && <POSBarRegister user={user} />}
          {activeTab === "dj" && <UnifiedMusicConsole />}
          {/* Manager/Admin ONLY — permission-gated render, never reachable by
              door/bar/DJ staff even if tab state is forced. */}
          {activeTab === "onboarding" && isManagerOrAdmin && <StaffOnboardingPanel />}
          {activeTab === "audit" && isManagerOrAdmin && (
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