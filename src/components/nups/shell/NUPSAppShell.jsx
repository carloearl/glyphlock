import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, DoorOpen, ShoppingCart, Moon, Calculator, FileText,
  ShieldCheck, Banknote, ScrollText, Settings, Building2,
  Menu, ChevronRight, ReceiptText, Truck, ArrowLeft,
  Coins, Crown, ShieldAlert, ClipboardCheck, Search as SearchIcon,
  TrendingUp, BarChart3, Users, Package, Heart, DollarSign, Music,
  Star, Sparkles, ShieldAlert as ShieldAlertIcon, KeyRound, ClipboardList,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useActiveVenue } from "@/hooks/useActiveVenue";

/**
 * NUPSAppShell — unified chrome for every NUPS operator page.
 *
 * Sidebar groups every interior tab under one rail so the operator never
 * has to hunt through in-page tab bars. Sub-items use `?tab=` query params
 * which the host page reads to switch views (Register, Contracts, etc.).
 */
const NAV_SECTIONS = [
  {
    label: "Operations",
    items: [
      { id: "dashboard", label: "Dashboard",   icon: LayoutDashboard, to: "/NUPSHub" },
      { id: "frontdoor", label: "Front Door",  icon: DoorOpen,        to: "/FrontDoor" },
      { id: "register",  label: "Register",       icon: ShoppingCart, to: "/Register" },
      { id: "receipts",  label: "Receipts",       icon: ReceiptText,  to: "/Receipts" },
      { id: "drivers",   label: "Driver Payouts", icon: Truck,        to: "/DriverPayouts" },
      { id: "tonight",   label: "Tonight",     icon: Moon,            to: "/Tonight" },
    ],
  },
  {
    label: "Floor & Staff",
    items: [
      { id: "vip",         label: "VIP Rooms",          icon: Star,         to: "/NUPSOwner?tab=vip" },
      { id: "staff",       label: "Staff",              icon: Users,        to: "/NUPSOwner?tab=staff" },
      { id: "customers",   label: "Customers",          icon: Heart,        to: "/NUPSOwner?tab=customers" },
      { id: "dj",          label: "DJ Console",         icon: Music,        to: "/NUPSOwner?tab=dj" },
      { id: "glyphbucks",  label: "GlyphBucks",         icon: Coins,        to: "/NUPSOwner?tab=glyphbucks" },
    ],
  },
  {
    label: "Financials",
    items: [
      { id: "accounting", label: "Accounting",  icon: Calculator, to: "/Accounting" },
      { id: "analytics",  label: "Analytics",   icon: TrendingUp, to: "/NUPSOwner?tab=analytics" },
      { id: "reports",    label: "Reports",     icon: BarChart3,  to: "/NUPSOwner?tab=reports" },
      { id: "payroll",    label: "Payroll",     icon: DollarSign, to: "/NUPSOwner?tab=payroll" },
      { id: "inventory",  label: "Inventory",   icon: Package,    to: "/NUPSOwner?tab=inventory" },
      { id: "settlement", label: "Settlements", icon: Banknote,   to: "/admin/settlement" },
      { id: "payouts",    label: "Payout Log",  icon: ScrollText, to: "/admin/payout-history" },
      {
        id: "contracts",  label: "Contracts",   icon: FileText,   to: "/Contracts",
        children: [
          { id: "c-glyph",  label: "GlyphBucks",   icon: Coins,           to: "/Contracts?tab=glyphbucks" },
          { id: "c-vip",    label: "VIP Extended", icon: Crown,           to: "/Contracts?tab=vip" },
          { id: "c-big",    label: "Big Spender",  icon: ShieldAlert,     to: "/Contracts?tab=big_spender" },
          { id: "c-ent",    label: "Entertainer",  icon: ClipboardCheck,  to: "/Contracts?tab=entertainer" },
          { id: "c-venue",  label: "Venue Terms",  icon: Building2,       to: "/Contracts?tab=venue" },
          { id: "c-lookup", label: "Lookup",       icon: SearchIcon,      to: "/Contracts?tab=lookup" },
        ],
      },
    ],
  },
  {
    label: "Admin",
    items: [
      { id: "audit-log",      label: "Audit Log",       icon: ClipboardList, to: "/NUPSOwner?tab=audit" },
      { id: "audit",          label: "Audit Integrity", icon: ShieldCheck,   to: "/admin/audit-integrity" },
      { id: "activity",       label: "Activity Log",    icon: ScrollText,    to: "/admin/activity-log" },
      { id: "rbac",           label: "Admin Console",   icon: KeyRound,      to: "/NUPSOwner?tab=admin" },
      { id: "demo",           label: "Demo Keys",       icon: Sparkles,      to: "/NUPSOwner?tab=demo" },
      { id: "venue",          label: "Venue Settings",  icon: Settings,      to: "/admin/venue-settings" },
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

function basePathOf(to) {
  return to.split("?")[0].toLowerCase();
}

function isItemActive(pathname, search, item) {
  const path = pathname.toLowerCase();
  const base = basePathOf(item.to);
  if (!path.startsWith(base)) return false;
  if (item.to.includes("?")) {
    const q = new URLSearchParams(item.to.split("?")[1]).get("tab");
    const cur = new URLSearchParams(search).get("tab");
    return (cur || "") === q;
  }
  return true;
}

function isParentActive(pathname, item) {
  return pathname.toLowerCase().startsWith(basePathOf(item.to));
}

function NavItem({ item, depth = 0, pathname, search, navigate, onNavigate }) {
  const Icon = item.icon;
  const hasChildren = Array.isArray(item.children) && item.children.length > 0;
  const parentActive = hasChildren && isParentActive(pathname, item);
  const exactActive = !hasChildren && isItemActive(pathname, search, item);
  // Highlight a parent header when its base is active but no child-tab matches.
  const headerActive = hasChildren && parentActive && !item.children.some(c => isItemActive(pathname, search, c));

  return (
    <div>
      <button
        onClick={() => { navigate(item.to); onNavigate?.(); }}
        className={`group w-full flex items-center gap-2.5 py-2 rounded-lg text-[13px] text-left transition-all border-l-2 ${
          depth > 0 ? "pl-8 pr-3" : "pl-3 pr-3"
        } ${
          exactActive || headerActive
            ? "bg-gradient-to-r from-emerald-500/15 via-violet-500/10 to-transparent text-white border-emerald-400"
            : "text-slate-400 hover:text-white hover:bg-white/[0.03] border-transparent"
        }`}
      >
        <Icon className={`w-4 h-4 ${(exactActive || headerActive) ? "text-emerald-300" : "text-slate-500 group-hover:text-slate-300"}`} />
        <span className={`flex-1 truncate ${depth === 0 ? "font-medium" : "font-normal"}`}>{item.label}</span>
        {(exactActive || headerActive) && <ChevronRight className="w-3 h-3 text-emerald-300/70" />}
      </button>

      {hasChildren && parentActive && (
        <div className="mt-0.5 space-y-0.5">
          {item.children.map((child) => (
            <NavItem
              key={child.id}
              item={child}
              depth={depth + 1}
              pathname={pathname}
              search={search}
              navigate={navigate}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function NUPSAppShell({ title, subtitle, actions, children, role = "OPERATOR" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const activeVenue = useActiveVenue();
  const now = useClock();
  const [open, setOpen] = useState(false);

  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  const SideRail = (
    <aside className="w-64 shrink-0 border-r border-white/5 bg-gradient-to-b from-slate-950 via-slate-950 to-black flex flex-col">
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
              {section.items.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  pathname={location.pathname}
                  search={location.search}
                  navigate={navigate}
                  onNavigate={() => setOpen(false)}
                />
              ))}
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
      <div className="hidden lg:flex">{SideRail}</div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur" onClick={() => setOpen(false)} />
          <div className="relative h-full flex">{SideRail}</div>
        </div>
      )}

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-40 bg-[#05070d]/85 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-3 px-4 lg:px-8 h-16">
            <button
              onClick={() => setOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-white/5 text-slate-300"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Back inside NUPS = go to the NUPS Hub (always a valid
                surface). Browser history can land on unmounted routes
                and produce a white screen, so we route to a known page. */}
            <button
              onClick={() => navigate("/NUPSHub")}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.07] text-slate-300 hover:text-white text-[12px] font-semibold transition-colors"
              aria-label="Go back"
              title="Back"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="flex-1 min-w-0">
              <h1 className="text-lg lg:text-xl font-black tracking-tight text-white truncate">{title}</h1>
              {subtitle && (
                <p className="text-[11px] text-slate-500 truncate hidden sm:block">{subtitle}</p>
              )}
            </div>

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

            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </header>

        <div className="flex-1 px-4 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}