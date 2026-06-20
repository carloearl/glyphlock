import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, DoorOpen, ShoppingCart, Moon, Calculator, FileText,
  ShieldCheck, Banknote, ScrollText, Settings, Building2,
  Menu, X, Search, Bell, ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useActiveVenue } from "@/hooks/useActiveVenue";

/**
 * NUPSAppShell — single, polished chrome for every NUPS operator page.
 *
 * Persistent left rail (sectioned: Operations / Financials / Admin), top
 * status strip with venue · clock · role, a single content area. Used to
 * stop every page from inventing its own header and nav so the system
 * feels like one continuous product (Oracle Hospitality / Opera PMS feel).
 *
 * Pages opt-in by wrapping their content:
 *   <NUPSAppShell title="Accounting" subtitle="Single source of truth" actions={<…/>}>
 *     {pageBody}
 *   </NUPSAppShell>
 */
const NAV_SECTIONS = [
  {
    label: "Operations",
    items: [
      { id: "dashboard", label: "Dashboard",    icon: LayoutDashboard, to: "/NUPSHub" },
      { id: "frontdoor", label: "Front Door",   icon: DoorOpen,        to: "/FrontDoor" },
      { id: "register",  label: "Register",     icon: ShoppingCart,    to: "/Register" },
      { id: "tonight",   label: "Tonight",      icon: Moon,            to: "/Tonight" },
    ],
  },
  {
    label: "Financials",
    items: [
      { id: "accounting",   label: "Accounting",   icon: Calculator, to: "/Accounting" },
      { id: "settlement",   label: "Settlements",  icon: Banknote,   to: "/admin/settlement" },
      { id: "payouts",      label: "Payout Log",   icon: ScrollText, to: "/admin/payout-history" },
      { id: "contracts",    label: "Contracts",    icon: FileText,   to: "/Contracts" },
    ],
  },
  {
    label: "Admin",
    items: [
      { id: "audit",    label: "Audit Integrity", icon: ShieldCheck, to: "/admin/audit-integrity" },
      { id: "activity", label: "Activity Log",    icon: ScrollText,  to: "/admin/activity-log" },
      { id: "venue",    label: "Venue Settings",  icon: Settings,    to: "/admin/venue-settings" },
    ],
  },
];

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function isActive(pathname, to) {
  return pathname.toLowerCase().startsWith(to.toLowerCase());
}

export default function NUPSAppShell({ title, subtitle, actions, children, role = "OPERATOR" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const activeVenue = useActiveVenue();
  const now = useClock();
  const [open, setOpen] = useState(false); // mobile drawer

  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  const SideRail = (
    <aside className="w-60 shrink-0 border-r border-white/5 bg-gradient-to-b from-slate-950 via-slate-950 to-black flex flex-col">
      {/* Brand block */}
      <div className="px-4 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 via-indigo-600 to-emerald-500 flex items-center justify-center font-black text-white text-base shadow-[0_0_24px_-4px_rgba(124,58,237,0.6)]">
            N
          </div>
          <div className="leading-tight">
            <div className="font-black text-white text-base tracking-wide">NUPS</div>
            <div className="text-[9px] uppercase tracking-[0.2em] text-slate-500">Nexus Unified</div>
          </div>
        </div>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-4">
            <div className="px-3 mb-1 text-[9px] font-mono uppercase tracking-[0.18em] text-slate-600">
              {section.label}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(location.pathname, item.to);
                return (
                  <button
                    key={item.id}
                    onClick={() => { navigate(item.to); setOpen(false); }}
                    className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-left transition-all ${
                      active
                        ? "bg-gradient-to-r from-emerald-500/15 via-violet-500/10 to-transparent text-white border-l-2 border-emerald-400"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.03] border-l-2 border-transparent"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? "text-emerald-300" : "text-slate-500 group-hover:text-slate-300"}`} />
                    <span className="font-medium flex-1 truncate">{item.label}</span>
                    {active && <ChevronRight className="w-3 h-3 text-emerald-300/70" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer — venue + integrity status */}
      <div className="border-t border-white/5 p-3 space-y-2">
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <Building2 className="w-3 h-3" />
          <span className="truncate">{activeVenue?.name || activeVenue?.venue_name || "No venue"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-emerald-400/80 font-mono uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          BPAAA v3.0 Locked
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#05070d] text-white flex">
      {/* Desktop rail */}
      <div className="hidden lg:flex">{SideRail}</div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur" onClick={() => setOpen(false)} />
          <div className="relative h-full flex">{SideRail}</div>
        </div>
      )}

      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top status strip */}
        <header className="sticky top-0 z-40 bg-[#05070d]/85 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-3 px-4 lg:px-8 h-16">
            <button
              onClick={() => setOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-white/5 text-slate-300"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Page title block */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg lg:text-xl font-black tracking-tight text-white truncate">{title}</h1>
              {subtitle && (
                <p className="text-[11px] text-slate-500 truncate hidden sm:block">{subtitle}</p>
              )}
            </div>

            {/* Status chips — venue · clock · role */}
            <div className="hidden md:flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-medium text-slate-200 truncate max-w-[140px]">
                  {activeVenue?.name || activeVenue?.venue_name || "—"}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 font-mono">
                <span className="text-[11px] font-bold text-emerald-300">{timeStr}</span>
                <span className="text-[10px] text-slate-500">·</span>
                <span className="text-[10px] text-slate-400">{dateStr}</span>
              </div>
              <Badge variant="outline" className="border-violet-500/40 text-violet-300 font-mono text-[10px]">
                {role}
              </Badge>
            </div>

            {/* Page actions slot */}
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </header>

        {/* Page body */}
        <div className="flex-1 px-4 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}