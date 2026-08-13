import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Building2, DoorOpen, ShoppingCart, Crown, Package,
  Truck, Wallet, Banknote, BarChart3, ShieldCheck, Settings, ServerCog,
} from "lucide-react";

const NAV = [
  { id: "dash",        label: "Dashboard",   icon: LayoutDashboard, to: "/NUPSHub" },
  { id: "venues",      label: "Venues",      icon: Building2,        to: "/admin/venue-settings" },
  { id: "frontdoor",   label: "Front Door",  icon: DoorOpen,         to: "/FrontDoor" },
  { id: "pos",         label: "POS",         icon: ShoppingCart,     to: "/Register" },
  { id: "vip",         label: "VIP & Tables",icon: Crown,            to: "/Contracts" },
  { id: "inventory",   label: "Inventory",   icon: Package,          to: "/Accounting" },
  { id: "drivers",     label: "Drivers",     icon: Truck,            to: "/admin/payout-history" },
  { id: "payouts",     label: "Payouts",     icon: Wallet,           to: "/admin/payout-history" },
  { id: "settlements", label: "Settlements", icon: Banknote,         to: "/admin/settlement" },
  { id: "reports",     label: "Reports",     icon: BarChart3,        to: "/Accounting" },
  { id: "compliance",  label: "Compliance",  icon: ShieldCheck,      to: "/admin/audit-integrity" },
  { id: "oracle-ohip", label: "Oracle OHIP", icon: ServerCog,        to: "/OHIPReadiness" },
  { id: "settings",    label: "Settings",    icon: Settings,         to: "/admin/venue-settings" },
];

export default function HubSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="w-56 shrink-0 bg-slate-950/80 border border-slate-800 rounded-2xl p-3 h-fit sticky top-4">
      <div className="flex items-center gap-2 px-2 py-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-black text-sm">N</div>
        <div className="font-black text-white text-lg tracking-wide">NUPS</div>
      </div>
      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = location.pathname.toLowerCase() === item.to.toLowerCase();
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.to)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                active
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}