/**
 * W3-012B Cycle 1 (Staff) — StaffQuickActions
 * ────────────────────────────────────────────
 * Large, descriptive navigation tiles for first-shift employees.
 * Pure navigation: react-router links only. Every destination keeps its
 * own route guard (NUPSRouteGuard / RoleClassGuard) — this component
 * grants no access, it only improves discoverability.
 *
 * MDL ID-01: no identity reads, no writes, no session access.
 */
import React from "react";
import { Link } from "react-router-dom";
import { DoorOpen, Mic2, ShoppingCart, Truck, ReceiptText } from "lucide-react";

const ACTIONS = [
  { to: "/FrontDoor",          label: "Front Door",           hint: "Guests, drivers & cover",     icon: DoorOpen,    tone: "border-emerald-500/30 hover:border-emerald-400/60 text-emerald-300" },
  { to: "/EntertainerCheckIn", label: "Entertainer Check-In", hint: "PIN station for talent",      icon: Mic2,        tone: "border-pink-500/30 hover:border-pink-400/60 text-pink-300" },
  { to: "/Register",           label: "Register",             hint: "Ring up cover & sales",       icon: ShoppingCart,tone: "border-cyan-500/30 hover:border-cyan-400/60 text-cyan-300" },
  { to: "/DriverPayouts",      label: "Driver Payouts",       hint: "Log drop-offs & payouts",     icon: Truck,       tone: "border-amber-500/30 hover:border-amber-400/60 text-amber-300" },
  { to: "/Receipts",           label: "Receipts",             hint: "Tonight's transaction log",   icon: ReceiptText, tone: "border-violet-500/30 hover:border-violet-400/60 text-violet-300" },
];

export default function StaffQuickActions() {
  return (
    <section aria-label="Your stations">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Your Stations</span>
        <div className="flex-1 h-px bg-white/5" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ACTIONS.map(({ to, label, hint, icon: Icon, tone }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-4 rounded-2xl border bg-white/[0.02] p-4 min-h-[72px] transition-all active:scale-[0.98] hover:bg-white/[0.04] ${tone}`}
          >
            <Icon className="w-7 h-7 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <div className="font-bold text-white text-base leading-tight">{label}</div>
              <div className="text-[11px] text-slate-400 truncate">{hint}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}