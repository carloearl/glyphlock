import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, DoorOpen, ShoppingCart, Moon, Calculator, FileText,
  ShieldCheck, Banknote, ScrollText, Settings, Building2,
  Menu, ChevronRight, ReceiptText, Truck, Home,
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
import { useAdminOverride, setAdminOverride } from "@/lib/nups/adminView";
import { readNUPSSession } from "@/lib/nups/persistentSession";
import { useNUPSOperatingMode } from "@/hooks/useNUPSOperatingMode";
import { OPERATING_MODE } from "@/lib/nups/operatingMode";
import TrainingCoach from "@/components/nups/training/TrainingCoach";


import NUPSEnvironmentBar from '@/components/nups/shell/NUPSEnvironmentBar';
import ReceiptPrintHub from '@/components/nups/receipts/ReceiptPrintHub';
import NUPSOperatorAssistant from '@/components/nups/shell/NUPSOperatorAssistant';
// DACO 003 §2 — which sections each role class may see.
// STAFF / ENTERTAINER never reach this shell for general nav (they use their
// own scoped shells) but if they do, they get an empty sidebar — no cross-role
// leakage.
const SECTIONS_BY_CLASS = {
  ADMIN:       ["Operations · Tonight's Flow", "Floor & Staff", "Accounting", "Admin", "Legacy"],
  MANAGER:     ["Operations · Tonight's Flow", "Floor & Staff", "Accounting"],
  // Owner directive 2026-07-17 (rev 3): a PIN-clocked-in staff member sees
  // ONLY their own station — NO sidebar, no cross-role surface. The door
  // girl sees the Front Door, the bartender sees the Bar Register, period.
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
      // VIP Command + VIP Rooms MERGED — one surface for rooms, people,
      // desk, and contracts (owner directive 2026-07-17).
      // VIP Command = LIVE OPS ONLY (rooms/floor board, active sessions, people,
      // search). All contract & GlyphBucks CREATION lives on /Contracts — the
      // standalone "GlyphBucks Hub" entry is retired to kill the 3-door
      // duplication (owner directive 2026-07-21).
      // ONE VIP link — Floor · Sessions · People (staff) · Contracts all bind
      // to this single page (owner directive 2026-07-21).
      { id: "vipcommand",  label: "VIP Center", icon: Crown, to: "/VIPCommand" },
      // GlyphBucks Console — the ONE directly-reachable home for the full
      // GlyphBucks system (Sales · Redeem · Press 5-sheet designer · Ledger ·
      // Inventory · Contract · Search · Fraud).
      { id: "glyphbucks",  label: "GlyphBucks Console", icon: Coins,  to: "/GlyphBucks" },
      // Legacy NUPSOwner tabs moved to the dedicated Legacy section below —
      // one way in, no duplicates (owner directive 2026-07-17).
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
      // Legacy NUPSOwner tabs moved to the Legacy section (2026-07-17).
      {
        id: "contracts",  label: "Contracts",   icon: FileText,   to: "/Contracts",
        children: [
          // ONE VIP contract for all shows — VIP, GlyphBucks, legacy, and
          // Archive collapsed into a single editable surface (owner directive
          // 2026-07-21). Only two other distinct contract types remain.
          { id: "c-vip",    label: "VIP Contract",     icon: Stamp,          to: "/VIPCommand?tab=Contracts" },
          { id: "c-big",    label: "Big Spender",      icon: ShieldAlert,    to: "/Contracts?tab=big_spender" },
          { id: "c-ent",    label: "Entertainer",      icon: ClipboardCheck, to: "/Contracts?tab=entertainer" },
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
      // §6 daily back-office checklist — same back office, guided order.
      { id: "backoffice",label: "Back Office Workflow", icon: ClipboardList, to: "/NUPSAdminPortal" },
      {
        id: "audit",       label: "Audit",            icon: ShieldCheck, to: "/admin/audit-integrity",
        children: [
          { id: "audit-integrity", label: "Integrity",   icon: ShieldCheck,   to: "/admin/audit-integrity" },
          { id: "activity",        label: "Activity",    icon: ScrollText,    to: "/admin/activity-log" },
        ],
      },
      // Owner/Administrator access request approvals — DACO-NUPS-FINAL-LAUNCH-GATE.
      { id: "access",    label: "Access Requests", icon: ShieldAlert,   to: "/AccessRequests" },
      { id: "recon",     label: "Reconciliation",  icon: Banknote,      to: "/admin/payment-reconciliation" },
      { id: "resolution",label: "Resolutions",     icon: ClipboardCheck,to: "/admin/financial-resolution" },
      { id: "registry",  label: "Feature Registry",icon: BookOpen,      to: "/admin/registry" },
      { id: "adr",       label: "Decision Register", icon: FileText,    to: "/admin/adr" },
      { id: "venue",     label: "Venue Settings",  icon: Settings,      to: "/admin/venue-settings" },
    ],
  },
  // Legacy — the SINGLE home for every retired NUPSOwner tab. Visible only
  // to admins with Admin Override ON. Nothing here has a second entry
  // anywhere else in the sidebar (owner directive 2026-07-17).
  {
    label: "Legacy",
    items: [
      { id: "lg-staff",     label: "Staff",         icon: Users,         to: "/NUPSOwner?tab=staff" },
      // DJ Console → the real DJ station; NUPSOwner never had a "dj" tab
      // (the old link landed on a blank pane — audit 2026-07-20).
      { id: "lg-dj",        label: "DJ Console",    icon: Music,         to: "/DJHome" },
      { id: "lg-customers", label: "Customers",     icon: Heart,         to: "/NUPSOwner?tab=customers" },
      { id: "lg-marketing", label: "Marketing",     icon: Megaphone,     to: "/NUPSOwner?tab=marketing" },
      // Analytics & Reports = ONE tab. Reports opens with OwnerAnalytics —
      // the "analytics" link pointed at a tab that doesn't exist (blank pane).
      { id: "lg-reports",   label: "Reports & Analytics", icon: BarChart3, to: "/NUPSOwner?tab=reports" },
      { id: "lg-payroll",   label: "Payroll",       icon: DollarSign,    to: "/NUPSOwner?tab=payroll" },
      { id: "lg-inventory", label: "Inventory",     icon: Package,       to: "/NUPSOwner?tab=inventory" },
      { id: "lg-audit",     label: "Audit Log",     icon: ClipboardList, to: "/NUPSOwner?tab=audit" },
      { id: "lg-admin",     label: "Admin Console", icon: KeyRound,      to: "/NUPSOwner?tab=admin" },
      { id: "lg-demo",      label: "Demo Keys",     icon: Sparkles,      to: "/NUPSOwner?tab=demo" },
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

    <>

      <NUPSEnvironmentBar />
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
  const modeState = useNUPSOperatingMode(activeVenue?.id || activeVenue?.venue_id);
  const now = useClock();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [roleClass, setRoleClass] = useState(ROLE_CLASS.ADMIN);
  // True while a PIN-clocked-in operator session scopes the shell.
  const [operatorMode, setOperatorMode] = useState(false);
  // True when the underlying PLATFORM login is an admin (Carlo). Controls
  // whether the Workspace Switcher offers the admin-tier workspaces even
  // while clocked in as staff — the only way back to admin besides clock-out.
  const [platformAdmin, setPlatformAdmin] = useState(false);

  // Resolve role class once — drives which sidebar sections render (DACO 003 §2).
  // If STAFF or ENTERTAINER lands on an app-shell page, kick them back to their
  // class home. §2 says lower classes never see the operator shell — an empty
  // sidebar is a UX dead-end, not a valid state.
  useEffect(() => {
    let cancelled = false;
    // Kiosk operator session wins — the PIN-clocked-in staff member's role
    // scopes the shell, NOT the tablet's platform login (often the owner).
    // A staff/entertainer operator gets no sidebar; no bounce because
    // KioskSessionGuard already authorized this station for them.
    // Re-checked live on "nups:operator-changed" so clocking in/out from an
    // in-page time clock rescopes the chrome without a reload.
    const applyOperator = () => {
      try {
        const kioskRaw = sessionStorage.getItem("nups_kiosk_operator");
        const op = kioskRaw ? JSON.parse(kioskRaw) : readNUPSSession();
        if (op?.role) {
          const opCls = resolveRoleClass({ nupsUser: op });
          if (opCls !== ROLE_CLASS.ADMIN) {
            setRoleClass(opCls);
            setOperatorMode(true);
            return true;
          }
        }
      } catch { /* no operator context */ }
      setOperatorMode(false);
      return false;
    };
    // Always resolves the PLATFORM login (for the platformAdmin flag).
    // Only scopes roleClass when no operator session is active.
    const resolvePlatform = async (scopeRole) => {
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
        setPlatformAdmin(cls === ROLE_CLASS.ADMIN);
        if (!scopeRole) return;
        setRoleClass(cls);
      } catch { /* leave default */ }
    };
    const opActive = applyOperator();
    resolvePlatform(!opActive);
    const onOperatorChanged = () => {
      const active = applyOperator();
      resolvePlatform(!active);
    };
    window.addEventListener("nups:operator-changed", onOperatorChanged);
    return () => {
      cancelled = true;
      window.removeEventListener("nups:operator-changed", onOperatorChanged);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Owner directive 2026-07-17: admins default to STAFF-PARITY (manager-tier)
  // view everywhere. The Admin Override header pill unlocks the Admin +
  // Legacy sections and adminOnly items. State is session-scoped and shared
  // across every NUPS surface via useAdminOverride().
  const adminOverride = useAdminOverride();
  // Operator mode strips ALL admin benefits — the clocked-in role is the
  // whole identity until clock-out or a workspace switch back to admin.
  const isAdmin = roleClass === ROLE_CLASS.ADMIN && !operatorMode;
  const effectiveAdmin = isAdmin && adminOverride;
  // Staff/entertainer operator sessions get a bare station — no workspace
  // switcher, mode toggle, venue switcher, or global search (§2 rev 3).
  const kioskOperator = operatorMode &&
    (roleClass === ROLE_CLASS.STAFF || roleClass === ROLE_CLASS.ENTERTAINER);
  // STAFF/ENTERTAINER intentionally get NO sidebar (scoped station only).
  // Any other role that somehow resolves to an empty set falls back to the
  // MANAGER rail so admins/managers are never stranded without navigation
  // (nav audit 2026-07-21 — Driver Payouts showed no tabs, no back button).
  const scopedLabels = SECTIONS_BY_CLASS[roleClass] || [];
  const isScopedStation = roleClass === ROLE_CLASS.STAFF || roleClass === ROLE_CLASS.ENTERTAINER;
  const visibleSectionLabels = effectiveAdmin
    ? SECTIONS_BY_CLASS.ADMIN
    : isAdmin
      ? SECTIONS_BY_CLASS.MANAGER
      : (scopedLabels.length > 0 || isScopedStation ? scopedLabels : SECTIONS_BY_CLASS.MANAGER);
  // Owner directive rev 2: adminOnly items stay VISIBLE — the route guards
  // show "you do not have permission" instead of the card disappearing.
  const visibleSections = NAV_SECTIONS
    .filter(s => visibleSectionLabels.includes(s.label))
    .filter(section => section.items.length > 0);

  // Role-aware home target for the header Home button. Owner directive
  // 2026-07-17: ONLY back office homes to the Dashboard — and an admin in
  // default staff-parity view is NOT back office until Admin Override is ON.
  // Parity admins and managers home to the Manager Console (§2).
  const homeTo = effectiveAdmin
    ? "/NUPSHub"
    : (roleClass === ROLE_CLASS.ADMIN || roleClass === ROLE_CLASS.MANAGER)
      ? "/ManagerConsole"
      : homeForRoleClass(roleClass);
  const homeLabel = effectiveAdmin ? "Dashboard" : roleClass === ROLE_CLASS.MANAGER || roleClass === ROLE_CLASS.ADMIN ? "Console" : "My Home";
  const atHome = location.pathname.toLowerCase().startsWith(homeTo.split("?")[0].toLowerCase());

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
      {visibleSections.length > 0 && <div className="hidden lg:flex">{SideRail}</div>}

      {open && visibleSections.length > 0 && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur" onClick={() => setOpen(false)} />
          <div className="relative h-full flex">{SideRail}</div>
        </div>
      )}

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-40 bg-[#05070d]/85 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center flex-wrap gap-x-2 sm:gap-x-3 gap-y-2 px-3 sm:px-4 lg:px-8 min-h-16 py-2">
            {visibleSections.length > 0 && (
            <button
              onClick={() => setOpen(true)}
              className="lg:hidden min-w-[44px] min-h-[44px] -ml-2 rounded-lg hover:bg-white/5 active:bg-white/10 text-slate-200 flex items-center justify-center"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            )}

            {/* HOME — role-aware, honest label. Staff/entertainers go to
                THEIR home (never the admin dashboard); everyone else goes
                to the Dashboard. When already at home we still render a plain
                Back button so NO page can ever strand the user without any
                navigation — critical on pages where the sidebar is hidden
                (e.g. Driver Payouts with no visible sections). */}
            {!atHome ? (
              <button
                onClick={() => navigate(homeTo)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.07] text-slate-300 hover:text-white text-[12px] font-semibold transition-colors"
                aria-label="Go to home screen"
                title={homeLabel}
              >
                <Home className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{homeLabel}</span>
              </button>
            ) : (
              <button
                onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(homeTo))}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.07] text-slate-300 hover:text-white text-[12px] font-semibold transition-colors"
                aria-label="Go back"
                title="Back"
              >
                <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}

            <div className="flex-1 min-w-0">
              <h1 className="text-lg lg:text-xl font-black tracking-tight text-white truncate">{title}</h1>
              {subtitle && (
                <p className="text-[11px] text-slate-500 truncate hidden sm:block">{subtitle}</p>
              )}
            </div>

            {/* Global search trigger — hidden for kiosk staff stations (§2 rev 3). */}
            {!kioskOperator && (
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
            )}

            <div className="hidden md:flex items-center gap-2">
              {/* W3-012A — Workspace Switcher: lets users switch between
                  Staff, Register, Manager, Back Office, Owner, System Admin
                  workspaces without logging out. */}
              {isAdmin && (
                <button
                  onClick={() => setAdminOverride(!adminOverride)}
                  className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors ${
                    adminOverride
                      ? "border-amber-400/50 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20"
                      : "border-white/10 text-slate-400 bg-white/[0.03] hover:bg-white/[0.07]"
                  }`}
                  title="Admins default to the staff view. Toggle to unlock admin and legacy tools."
                >
                  {adminOverride ? "Admin Override" : "Staff View"}
                </button>
              )}
              {/* Cross-role controls suppressed on staff/entertainer stations (§2 rev 3) */}
              {!kioskOperator && <WorkspaceSwitcher roleClass={roleClass} platformAdmin={platformAdmin} />}
              {!kioskOperator && <ModeToggle />}
              {!kioskOperator && <VenueSwitcher activeVenue={activeVenue} />}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 font-mono">
                <span className="text-[11px] font-bold text-emerald-300">{timeStr}</span>
                <span className="text-[10px] text-slate-500">·</span>
                <span className="text-[10px] text-slate-400">{dateStr}</span>
              </div>
              <Badge variant="outline" className="border-violet-500/40 text-violet-300 font-mono text-[10px]">
                {role}
              </Badge>
            </div>

            {actions && <div className="order-last flex w-full items-center gap-2 overflow-x-auto pb-1 sm:order-none sm:w-auto sm:flex-wrap sm:justify-end sm:overflow-visible sm:pb-0">{actions}</div>}
          </div>
        </header>

        {modeState.isNonLive && (
          <div className={`border-b px-3 py-2 sm:px-4 lg:px-8 ${
            modeState.operatingMode === OPERATING_MODE.TRAINING
              ? "border-sky-400/25 bg-sky-500/[.08] text-sky-100"
              : modeState.operatingMode === OPERATING_MODE.DEMO
                ? "border-amber-400/25 bg-amber-500/[.08] text-amber-100"
                : "border-violet-400/25 bg-violet-500/[.08] text-violet-100"
          }`} role="status" aria-live="polite">
            <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="font-black tracking-wide">
                {modeState.operatingMode} MODE · FUNDS OFF
              </div>
              <div className="text-[10px] opacity-75">
                Non-live records are isolated from live sales, batches, payouts, receipts, and settlement totals.
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0 px-3 sm:px-4 lg:px-8 py-4 sm:py-5 lg:py-6 overflow-x-hidden">
          {children}
        </div>
      </main>

      {/* Global Search Drawer — reads from Feature Registry (§3 keystone) */}
      <GlobalSearchDrawer open={searchOpen} onClose={() => setSearchOpen(false)} />
      <TrainingCoach />
    </div>

      <NUPSOperatorAssistant />
      <ReceiptPrintHub />

    </>
  );
}