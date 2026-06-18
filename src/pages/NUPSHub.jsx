/**
 * NUPS Hub — Unified Operator Landing
 * ────────────────────────────────────
 * One screen, every NUPS surface. Replaces the old "menu maze" of multiple
 * redundant tabs. Role-aware: staff see what they need, admins see everything.
 */
import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DoorOpen, ShoppingCart, FileSignature, Moon, Calculator,
  FileSearch, Truck, Lock, Search, Smartphone, Activity, ShieldCheck,
} from "lucide-react";

const TILES = [
  {
    id: "frontdoor", to: "/FrontDoor", icon: DoorOpen, color: "violet",
    title: "Front Door", desc: "Guest check-ins · entertainer onboarding · driver drops",
    roles: ["PLATFORM_ADMIN", "VENUE_OWNER", "VENUE_MANAGER", "FLOOR_HOST", "DOOR_GIRL", "DOORMAN", "SECURITY", "SOVEREIGN"],
  },
  {
    id: "register", to: "/Register", icon: ShoppingCart, color: "cyan",
    title: "Register Console", desc: "POS · receipts · driver payouts in one view",
    roles: ["PLATFORM_ADMIN", "VENUE_OWNER", "VENUE_MANAGER", "DOOR_GIRL", "BARTENDER", "SOVEREIGN"],
    primary: true,
  },
  {
    id: "tonight", to: "/Tonight", icon: Moon, color: "emerald",
    title: "Tonight", desc: "Live shift KPIs · outstanding payouts · recent activity",
    roles: ["PLATFORM_ADMIN", "VENUE_OWNER", "VENUE_MANAGER", "SOVEREIGN"],
  },
  {
    id: "contracts", to: "/Contracts", icon: FileSignature, color: "amber",
    title: "Contracts Hub", desc: "GlyphBucks · VIP · Big Spender · Entertainer · Lookup",
    roles: ["PLATFORM_ADMIN", "VENUE_OWNER", "VENUE_MANAGER", "FLOOR_HOST", "SOVEREIGN"],
  },
  {
    id: "accounting", to: "/Accounting", icon: Calculator, color: "emerald",
    title: "Accounting", desc: "Revenue · disbursements · liability · QuickBooks export",
    roles: ["PLATFORM_ADMIN", "VENUE_OWNER", "VENUE_MANAGER", "SOVEREIGN"],
  },
  {
    id: "audit", to: "/admin/audit-integrity", icon: FileSearch, color: "rose",
    title: "Audit Integrity", desc: "Gap detection · anomalies · differential logs",
    roles: ["PLATFORM_ADMIN", "VENUE_OWNER", "SOVEREIGN"],
  },
  {
    id: "settlement", to: "/admin/settlement", icon: Lock, color: "blue",
    title: "Daily Settlement", desc: "Reconcile · lock · pre/post snapshots",
    roles: ["PLATFORM_ADMIN", "VENUE_OWNER", "VENUE_MANAGER", "SOVEREIGN"],
  },
  {
    id: "payouts", to: "/admin/payout-history", icon: Truck, color: "pink",
    title: "Driver Payouts", desc: "Disbursement ledger · YTD totals · 1099 flags",
    roles: ["PLATFORM_ADMIN", "VENUE_OWNER", "VENUE_MANAGER", "SOVEREIGN"],
  },
  {
    id: "search", to: "/Search", icon: Search, color: "sky",
    title: "Unified Search", desc: "Across guests · drivers · entertainers · contracts",
    roles: ["PLATFORM_ADMIN", "VENUE_OWNER", "VENUE_MANAGER", "FLOOR_HOST", "SOVEREIGN"],
  },
  {
    id: "mobile", to: "/MobileScanner", icon: Smartphone, color: "indigo",
    title: "Mobile Scanner", desc: "ID + Driver QR scan from phone",
    roles: ["PLATFORM_ADMIN", "VENUE_OWNER", "VENUE_MANAGER", "DOORMAN", "SECURITY", "SOVEREIGN"],
  },
  {
    id: "activity", to: "/admin/activity-log", icon: Activity, color: "slate",
    title: "Activity Log", desc: "Immutable append-only event stream",
    roles: ["PLATFORM_ADMIN", "VENUE_OWNER", "SOVEREIGN"],
  },
  {
    id: "settings", to: "/admin/venue-settings", icon: ShieldCheck, color: "violet",
    title: "Venue Admin", desc: "Rates · checklists · chart of accounts · contracts",
    roles: ["PLATFORM_ADMIN", "VENUE_OWNER", "VENUE_MANAGER", "SOVEREIGN"],
  },
];

const COLORS = {
  violet:  { border: "border-violet-500/30",  bg: "bg-violet-950/20",  icon: "text-violet-300",  hover: "hover:border-violet-400/60" },
  cyan:    { border: "border-cyan-500/30",    bg: "bg-cyan-950/20",    icon: "text-cyan-300",    hover: "hover:border-cyan-400/60" },
  emerald: { border: "border-emerald-500/30", bg: "bg-emerald-950/20", icon: "text-emerald-300", hover: "hover:border-emerald-400/60" },
  amber:   { border: "border-amber-500/30",   bg: "bg-amber-950/20",   icon: "text-amber-300",   hover: "hover:border-amber-400/60" },
  rose:    { border: "border-rose-500/30",    bg: "bg-rose-950/20",    icon: "text-rose-300",    hover: "hover:border-rose-400/60" },
  blue:    { border: "border-blue-500/30",    bg: "bg-blue-950/20",    icon: "text-blue-300",    hover: "hover:border-blue-400/60" },
  pink:    { border: "border-pink-500/30",    bg: "bg-pink-950/20",    icon: "text-pink-300",    hover: "hover:border-pink-400/60" },
  sky:     { border: "border-sky-500/30",     bg: "bg-sky-950/20",     icon: "text-sky-300",     hover: "hover:border-sky-400/60" },
  indigo:  { border: "border-indigo-500/30",  bg: "bg-indigo-950/20",  icon: "text-indigo-300",  hover: "hover:border-indigo-400/60" },
  slate:   { border: "border-slate-700",      bg: "bg-slate-900/40",   icon: "text-slate-300",   hover: "hover:border-slate-500" },
};

export default function NUPSHub() {
  const navigate = useNavigate();

  const { data: user } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });
  const { data: nupsUsers = [] } = useQuery({
    queryKey: ["nupsuser", user?.email],
    queryFn: () => base44.entities.NUPSUser.filter({ email: user?.email }),
    enabled: !!user?.email,
  });
  const nupsUser = nupsUsers[0];

  const role = nupsUser?.role || (user?.role === "admin" ? "PLATFORM_ADMIN" : "DOOR_GIRL");
  const visibleTiles = TILES.filter((t) => !t.roles || t.roles.includes(role));

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight">NUPS Hub</h1>
          <p className="text-sm text-slate-400 mt-1">
            One operator console — every surface, role-aware.
          </p>
          {user && (
            <div className="mt-3 flex items-center gap-2 text-xs">
              <Badge variant="outline" className="border-slate-700 text-slate-300">
                {user.full_name || user.email}
              </Badge>
              <Badge variant="outline" className="border-violet-500/40 text-violet-300 font-mono">
                {role}
              </Badge>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visibleTiles.map((tile) => {
            const c = COLORS[tile.color] || COLORS.slate;
            const Icon = tile.icon;
            return (
              <Card
                key={tile.id}
                onClick={() => navigate(tile.to)}
                className={`cursor-pointer transition-all p-5 ${c.border} ${c.bg} ${c.hover} ${
                  tile.primary ? "ring-2 ring-cyan-500/30" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-slate-900/60 ${c.icon}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{tile.title}</h3>
                      {tile.primary && (
                        <Badge variant="outline" className="border-cyan-500/40 text-cyan-300 text-[9px]">
                          PRIMARY
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-snug">{tile.desc}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 text-[10px] text-slate-600 bg-slate-900/40 border border-slate-800 rounded-lg p-3 flex flex-wrap gap-x-4 gap-y-1">
          <span className="text-emerald-400 font-bold">BPAAA v3.0 LOCKED:</span>
          <span>total_sales = cash + card</span>
          <span>GB = liability</span>
          <span>Payouts = disbursements</span>
          <span>ActivityLog = append-only</span>
        </div>
      </div>
    </div>
  );
}