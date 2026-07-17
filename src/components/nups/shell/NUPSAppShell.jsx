import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, DoorOpen, ShoppingCart, Moon, Calculator, FileText,
  ShieldCheck, Banknote, ScrollText, Settings, Building2,
  Menu, ChevronRight, ReceiptText, Truck, ArrowLeft,
  Coins, Crown, ShieldAlert, ClipboardCheck, Search as SearchIcon,
  TrendingUp, BarChart3, Users, Package, Heart, DollarSign, Music,
  Star, Sparkles, KeyRound, ClipboardList, Megaphone,
  Mic2, Archive, BookOpen, Stamp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import GlobalSearchDrawer from "./GlobalSearchDrawer";
import WorkspaceSwitcher from "./WorkspaceSwitcher";
import VenueSwitcher from "./VenueSwitcher";
import ModeToggle from "./ModeToggle";
import { base44 } from "@/api/base44Client";
import { resolveRoleClass, homeForRoleClass, ROLE_CLASS } from "@/lib/nups/roleClass";
import { isSovereign } from "@/lib/nups/sovereign";


// DACO 003 §2 — which sections each role class may see.
// STAFF / ENTERTAINER never reach this shell for general nav (they use their
// own scoped shells) but if they do, they get an empty sidebar — no cross-role
// leakage.
const SECTIONS_BY_CLASS = {
  ADMIN:       ["Operations · Tonight's Flow", "Floor & Staff", "Accounting", "Admin"],
  MANAGER:     ["Operations · Tonight's Flow", "Floor & Staff", "Accounting"],
  STAFF:       [],
  ENTERTAINER: [],
};

/**
 * NUPSAppShell — unified chrome for every NUPS operator page.
 *
 * Sidebar groups every interior tab under one rail so the operator never
 * has to hunt through in-page tab bars. Sub-items use `?tab=` query params
 * which the host page reads to switch views (Register, Contracts, etc.).
 */
const NAV_SECTIONS = [
  // Operations — ordered front-to-back so the sidebar mirrors the
  // Hub's Operator Flow strip. Dashboard is the landing page; the
  // numbered steps below run a shift end-to-end.
  {
    label: "Operations · Tonight's Flow",
    items: [
      { id: "dashboard",    label: "Dashboard",             icon: LayoutDashboard, to: "/NUPSHub" },
      { id: "frontdoor",    label: "1 · Open Night",        icon: DoorOpen,        to: "/FrontDoor" },
      { id: "entertainers", label: "2 · Check In Talent",   icon: Mic2,            to: "/EntertainerCheckIn" },
      { id: "register",     label: "3 · Register",          icon: ShoppingCart,    to: "/Register" },
      { id: "drivers",      label: "4 · Driver Payouts",    icon: Truck,           to: "/DriverPayouts" },
      { id: "receipts",     label: "5 · Receipts",          icon: ReceiptText,     to: "/Receipts" },
      { id: "tonight",      label: "6 · Tonight Snapshot",  icon: Moon,            to: "/Tonight" },
    ],
  },
  {
    label: "Floor & Staff",
    items: [
      // VIP Rooms merged with the Contracts VIP surface — the live room board
      // lives at /Contracts?tab=vip; the legacy NUPSOwner?tab=vip duplicate is retired.
      // VIP Command Center — the authoritative VIP contract workflow
      // (rooms, guests, contracts, signatures, sessions) per DACO-VIP-FIRST-BUILD.
      { id: "vipcommand",  label: "VIP Command",     icon: Star,      to: "/VIPCommand" },
      { id: "viprooms",    label: "VIP Rooms",       icon: Crown,     to: "/Contracts?tab=vip" },
      { id: "glyphbucks",  label: "GlyphBucks Hub",  icon: Coins,     to: "/GlyphBucksHub" },
      // Legacy NUPSOwner tabs — ADMIN-only route (RoleClassGuard). Never
      // shown to MANAGER: they'd be dead links (guard denies the route).
      { id: "staff",       label: "Staff",           icon: Users,     to: "/NUPSOwner?tab=staff",     adminOnly: true },
      { id: "dj",          label: "DJ Console",      icon: Music,     to: "/NUPSOwner?tab=dj",        adminOnly: true },
      { id: "customers",   label: "Customers",       icon: Heart,     to: "/NUPSOwner?tab=customers", adminOnly: true },
      { id: "marketing",   label: "Marketing",       icon: Megaphone, to: "/NUPSOwner?tab=marketing", adminOnly: true },
      { id: "people",      label: "People Archive",  icon: Archive,   to: "/PeopleArchive" },
      { id: "manager",     label: "Manager Console", icon: ShieldCheck, to: "/ManagerConsole" },
    ],
  },
  // Accounting is ONE entry with internal children. Each child is a
  // distinct screen that reads the same ledger — never duplicate top-level
  // items for things that share data. (Audit-fix 2026-06-23.)
  {
    label: "Accounting",
    items: [
      {
        id: "accounting",  label: "Accounting",  icon: Calculator, to: "/Accounting",
        children: [
          // All four children resolve to ADMIN-only routes (App.jsx guards).
          { id: "gl-reports", label: "GL Reports",   icon: BarChart3,  to: "/AccountingHub",          adminOnly: true },
          { id: "trial-bal",  label: "Trial Balance",icon: BookOpen,   to: "/admin/ledger",           adminOnly: true },
          { id: "settlement", label: "Settlements",  icon: Banknote,   to: "/admin/settlement",       adminOnly: true },
          { id: "payouts",    label: "Payout Log",   icon: ScrollText, to: "/admin/payout-history",   adminOnly: true },
        ],
      },
      // Legacy NUPSOwner tabs — ADMIN-only (see Floor & Staff note above).
      { id: "analytics",  label: "Analytics",   icon: TrendingUp, to: "/NUPSOwner?tab=analytics", adminOnly: true },
      { id: "reports",    label: "Reports",     icon: BarChart3,  to: "/NUPSOwner?tab=reports",   adminOnly: true },
      { id: "payroll",    label: "Payroll",     icon: DollarSign, to: "/NUPSOwner?tab=payroll",   adminOnly: true },
      { id: "inventory",  label: "Inventory",   icon: Package,    to: "/NUPSOwner?tab=inventory", adminOnly: true },
      {
        id: "contracts",  label: "Contracts",   icon: FileText,   to: "/Contracts",
        children: [
          // Active contract surfaces only — legacy Venue Terms + Lookup
          // merged into the single Archive entry (sidebar cleanup 2026-07-16).
          { id: "c-vip",    label: "VIP Contracts",    icon: Stamp,          to: "/Contracts?tab=vip" },
          { id: "c-glyph",  label: "GlyphBucks",       icon: Coins,          to: "/Contracts?tab=glyphbucks" },
          { id: "c-big",    label: "Big Spender",      icon: ShieldAlert,    to: "/Contracts?tab=big_spender" },
          { id: "c-ent",    label: "Entertainer",      icon: ClipboardCheck, to: "/Contracts?tab=entertainer" },
          { id: "c-archive",label: "Archive",          icon: Archive,        to: "/Contracts?tab=archive" },
        ],
      },
    ],
  },
  // Audit consolidated under one parent — was three flat entries.
  {
    label: "Admin",
    items: [
      // Admin/Owner role-view switcher — open any role's live workspace.
      { id: "roleviews", label: "Role Views",      icon: Users,         to: "/RoleViews" },
      {
        id: "audit",       label: "Audit",            icon: ShieldCheck, to: "/admin/audit-integrity",
        children: [
          { id: "audit-integrity", label: "Integrity",   icon: ShieldCheck,   to: "/admin/audit-integrity" },
          { id: "audit-log",       label: "Audit Log",   icon: ClipboardList, to: "/NUPSOwner?tab=audit" },
          { id: "activity",        label: "Activity",    icon: ScrollText,    to: "/admin/activity-log" },
        ],
      },
      { id: "rbac",      label: "Admin Console",   icon: KeyRound,      to: "/NUPSOwner?tab=admin" },
      // Owner/Administrator access request approvals — DACO-NUPS-FINAL-LAUNCH-GATE.
      { id: "access",    label: "Access Requests", icon: ShieldAlert,   to: "/AccessRequests" },
      { id: "recon",     label: "Reconciliation",  icon: Banknote,      to: "/admin/payment-reconciliation" },
      { id: "resolution",label: "Resolutions",     icon: ClipboardCheck,to: "/admin/financial-resolution" },
      { id: "registry",  label: "Feature Registry",icon: BookOpen,      to: "/admin/registry" },
      { id: "adr",       label: "Decision Register", icon: FileText,    to: "/admin/adr" },
      { id: "demo",      label: "Demo Keys",       icon: Sparkles,      to: "/NUPSOwner?tab=demo" },
      { id: "venue",     label: "Venue Settings",  icon: Settings,      to: "/admin/venue-settings" },
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
        className={`group w-full flex items-center gap-3 min-h-[44px] py-2.5 lg:min-h-0 lg:py-2 rounded-lg text-[14px] lg:text-[13px] text-left transition-all border-l-2 active:scale-[0.98] ${
          depth > 0 ? "pl-9 pr-3" : "pl-3 pr-3"
        } ${
          exactActive || headerActive
            ? "bg-gradient-to-r from-emerald-500/15 via-violet-500/10 to-transparent text-white border-emerald-400"
            : "text-slate-300 hover:text-white hover:bg-white/[0.03] border-transparent"
        }`}
      >
        <Icon className={`w-[18px] h-[18px] lg:w-4 lg:h-4 shrink-0 ${(exactActive || headerActive) ? "text-emerald-300" : "text-slate-400 group-hover:text-slate-300"}`} />
        <span className={`flex-1 truncate ${depth === 0 ? "font-semibold" : "font-normal"}`}>{item.label}</span>
        {(exactActive || headerActive) && <ChevronRight className="w-3.5 h-3.5 text-emerald-300/70" />}
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [roleClass, setRoleClass] = useState(ROLE_CLASS.ADMIN);

  // Resolve role class once — drives which sidebar sections render (DACO 003 §2).
  // If STAFF or ENTERTAINER lands on an app-shell page, kick them back to their
  // class home. §2 says lower classes never see the operator shell — an empty
  // sidebar is a UX dead-end, not a valid state.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const u = await base44.auth.me();
        let nu = null, sov = false;
        try {
          const matches = await base44.entities.NUPSUser.filter({ created_by: u.email });
          nu = (matches || [])[0] || null;
          sov = (matches || []).some(isSovereign);
        } catch { /* fall through */ }
        if (cancelled) return;
        const cls = resolveRoleClass({ user: u, nupsUser: nu, sovereign: sov });
        setRoleClass(cls);
        // Bounce STAFF / ENTERTAINER off the operator shell — they never
        // belong here. FrontDoor / EntertainerCheckIn opt out explicitly by
        // rendering their own chrome (see StaffHome, EntertainerHome).
        if ((cls === ROLE_CLASS.STAFF || cls === ROLE_CLASS.ENTERTAINER)
            && !location.pathname.toLowerCase().startsWith("/frontdoor")
            && !location.pathname.toLowerCase().startsWith("/entertainercheckin")) {
          navigate(homeForRoleClass(cls), { replace: true });
        }
      } catch { /* leave default */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleSectionLabels = SECTIONS_BY_CLASS[roleClass] || [];

  // FULL MENU RESTORED (operator feedback 2026-07-09): workspace filtering
  // hid half the sidebar (Accounting, Contracts, VIP, etc.) depending on the
  // current page. The sidebar now always shows every role-scoped item — the
  // only filter left is the DACO 003 §2 role-class scope.
  const isAdmin = roleClass === ROLE_CLASS.ADMIN;
  const visibleSections = NAV_SECTIONS
    .filter(s => visibleSectionLabels.includes(s.label))
    .map(section => ({
      ...section,
      items: section.items
        .filter(i => !i.adminOnly || isAdmin)
        .map(i => (i.children
          ? { ...i, children: i.children.filter(c => !c.adminOnly || isAdmin) }
          : i)),
    }))
    .filter(section => section.items.length > 0);

  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  // ⌘K / Ctrl+K opens global search (BPAA-NUPS-MASTER-001 §4)
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const SideRail = (
    <aside className="w-72 lg:w-64 shrink-0 border-r border-white/5 bg-gradient-to-b from-slate-950 via-slate-950 to-black flex flex-col">
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

      {/* Nav sections — role-scoped per DACO 003 §2 */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {visibleSections.map((section) => (
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
              className="lg:hidden min-w-[44px] min-h-[44px] -ml-2 rounded-lg hover:bg-white/5 active:bg-white/10 text-slate-200 flex items-center justify-center"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
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

            {/* Global search trigger — always visible (§4 discoverability). */}
            <button
              onClick={() => setSearchOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.07] text-slate-400 hover:text-white text-[12px] transition-colors"
              title="Search features (⌘K)"
              aria-label="Search"
            >
              <SearchIcon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Search…</span>
              <kbd className="hidden lg:inline text-[9px] font-mono px-1 py-0.5 rounded bg-white/[0.05] border border-white/10 ml-1">⌘K</kbd>
            </button>

            <div className="hidden md:flex items-center gap-2">
              {/* W3-012A — Workspace Switcher: lets users switch between
                  Staff, Register, Manager, Back Office, Owner, System Admin
                  workspaces without logging out. */}
              <WorkspaceSwitcher roleClass={roleClass} />
              {/* MODE TOGGLE — F-7: always visible, color-distinct, before venue.
                  Click to switch LIVE/DEMO/SANDBOX, seed or clear demo data. */}
              <ModeToggle />
              {/* Multi-venue separation — tap to switch the active venue */}
              <VenueSwitcher activeVenue={activeVenue} />
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

      {/* Global Search Drawer — reads from Feature Registry (§3 keystone) */}
      <GlobalSearchDrawer open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}