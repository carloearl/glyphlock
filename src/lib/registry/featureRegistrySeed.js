/**
 * BPAA-NUPS-MASTER-001 §3 — Canonical Feature Registry seed.
 *
 * REAL ROUTES ONLY — every entry below points at a route that actually
 * exists in App.jsx. Verified 2026-06-23 against the live router. Search,
 * help, and sidebar all read from this list; if it lies, every consumer
 * lies. Add new features here only after the page actually ships.
 */

export const FEATURE_REGISTRY_SEED = [
  // ── OPERATIONS ───────────────────────────────────────────────────
  { feature_id: "dashboard",          label: "Dashboard",        route: "/NUPSHub",            icon: "LayoutDashboard", group: "Operations", order: 10, roles: ["all"], keywords: ["home", "hub", "overview", "start", "today"] },
  { feature_id: "front_door",         label: "Front Door",       route: "/FrontDoor",          icon: "DoorOpen",        group: "Operations", order: 20, roles: ["Door Girl", "Doorman", "Security", "Manager"], keywords: ["door", "cover", "entry", "admission", "guests"] },
  { feature_id: "entertainer_checkin",label: "Entertainer Check-In", route: "/EntertainerCheckIn", icon: "Mic2",       group: "Operations", order: 30, roles: ["Manager", "Hostess", "Door Girl"], keywords: ["entertainer", "dancer", "contractor", "ic", "check in", "shift"] },
  { feature_id: "register",           label: "Register",         route: "/Register",           icon: "ShoppingCart",    group: "Operations", order: 40, roles: ["Bartender", "Manager"], keywords: ["register", "pos", "bar", "sale", "tab", "drinks"] },
  { feature_id: "receipts",           label: "Receipts",         route: "/Receipts",           icon: "ReceiptText",     group: "Operations", order: 50, roles: ["all"], keywords: ["receipts", "transactions", "history"] },
  { feature_id: "driver_payouts",     label: "Driver Payouts",   route: "/DriverPayouts",      icon: "Truck",           group: "Operations", order: 60, roles: ["Manager", "Door Girl"], keywords: ["driver", "payout", "rideshare", "drop off"] },
  { feature_id: "tonight",            label: "Tonight",          route: "/Tonight",            icon: "Moon",            group: "Operations", order: 70, roles: ["all"], keywords: ["tonight", "live floor", "active", "now"] },

  // ── FLOOR & STAFF ────────────────────────────────────────────────
  { feature_id: "vip_shows",          label: "VIP Shows",        route: "/Contracts?tab=vip",  icon: "Star",            group: "Operations", order: 80, roles: ["Hostess", "Manager"], keywords: ["vip", "private", "show", "room", "dance"] },
  { feature_id: "staff",              label: "Staff",            route: "/NUPSOwner?tab=staff", icon: "Users",          group: "Staff",      order: 10, roles: ["Manager"], keywords: ["staff", "employees", "team", "people", "directory", "onboarding"] },
  { feature_id: "dj_console",         label: "DJ Console",       route: "/NUPSOwner?tab=dj",   icon: "Music",           group: "Staff",      order: 20, roles: ["Manager", "DJ"], keywords: ["dj", "music", "mixer", "playlist", "tracks"] },
  { feature_id: "customers",          label: "Customers",        route: "/NUPSOwner?tab=customers", icon: "Heart",      group: "Staff",      order: 30, roles: ["Manager"], keywords: ["customers", "guests", "loyalty", "tracking"] },
  { feature_id: "marketing",          label: "Marketing",        route: "/NUPSOwner?tab=marketing", icon: "Megaphone",  group: "Staff",      order: 40, roles: ["Manager"], keywords: ["marketing", "campaigns", "ai insights"] },
  { feature_id: "people_archive",     label: "People Archive",   route: "/PeopleArchive",      icon: "Archive",         group: "Staff",      order: 50, roles: ["Manager"], keywords: ["archive", "history", "people record", "audit", "snapshots"] },

  // ── ACCOUNTING ───────────────────────────────────────────────────
  { feature_id: "accounting",         label: "Accounting",       route: "/Accounting",         icon: "Calculator",      group: "Accounting", order: 10, roles: ["Manager"], keywords: ["accounting", "books", "pnl", "balance sheet", "cash flow"] },
  { feature_id: "accounting_hub",     label: "GL Reports",       route: "/AccountingHub",      icon: "BarChart3",       group: "Accounting", order: 20, roles: ["Manager"], keywords: ["gl reports", "general ledger", "trial balance", "income statement"] },
  { feature_id: "trial_balance",      label: "Trial Balance",    route: "/admin/ledger",       icon: "BookOpen",        group: "Accounting", order: 30, roles: ["Manager"], keywords: ["trial balance", "debits credits", "proof", "ledger"] },
  { feature_id: "settlements",        label: "Settlements",      route: "/admin/settlement",   icon: "Banknote",        group: "Accounting", order: 40, roles: ["Manager"], keywords: ["settlement", "daily", "close out", "z report"] },
  { feature_id: "payout_log",         label: "Payout Log",       route: "/admin/payout-history", icon: "ScrollText",    group: "Accounting", order: 50, roles: ["Manager"], keywords: ["payout history", "driver log", "disbursements"] },
  { feature_id: "analytics",          label: "Analytics",        route: "/NUPSOwner?tab=analytics", icon: "TrendingUp", group: "Accounting", order: 60, roles: ["Manager"], keywords: ["analytics", "trends", "performance", "owner analytics"] },
  { feature_id: "reports",            label: "Reports",          route: "/NUPSOwner?tab=reports", icon: "FileText",     group: "Accounting", order: 70, roles: ["Manager"], keywords: ["reports", "sales report", "daily summary", "z report"] },
  { feature_id: "payroll",            label: "Payroll",          route: "/NUPSOwner?tab=payroll", icon: "DollarSign",   group: "Accounting", order: 80, roles: ["Manager"], keywords: ["payroll", "1099", "w-9", "tax forms", "entertainer payout", "tips"] },
  { feature_id: "inventory",          label: "Inventory",        route: "/NUPSOwner?tab=inventory", icon: "Package",    group: "Accounting", order: 90, roles: ["Manager", "Bartender"], keywords: ["inventory", "stock", "products", "cash drawer"] },

  // ── CONTRACTS (sub-routes share /Contracts) ──────────────────────
  { feature_id: "contracts",          label: "Contracts",        route: "/Contracts",          icon: "FileText",        group: "Accounting", order: 100, roles: ["Manager"], keywords: ["contracts", "agreements", "signed"] },
  { feature_id: "contracts_glyph",    label: "GlyphBucks Contracts", route: "/Contracts?tab=glyphbucks", icon: "Coins",  group: "Accounting", order: 101, roles: ["Manager"], keywords: ["glyphbucks", "currency", "stored value", "tokens"] },
  { feature_id: "contracts_big",      label: "Big Spender",      route: "/Contracts?tab=big_spender", icon: "ShieldAlert", group: "Accounting", order: 102, roles: ["Manager"], keywords: ["big spender", "whale", "high roller"] },
  { feature_id: "contracts_ent",      label: "Entertainer Contracts", route: "/Contracts?tab=entertainer", icon: "ClipboardCheck", group: "Accounting", order: 103, roles: ["Manager"], keywords: ["entertainer contract", "ic agreement"] },
  { feature_id: "contracts_venue",    label: "Venue Terms",      route: "/Contracts?tab=venue", icon: "Building2",      group: "Accounting", order: 104, roles: ["Manager"], keywords: ["venue terms", "house rules"] },
  { feature_id: "contracts_lookup",   label: "Contract Lookup",  route: "/Contracts?tab=lookup", icon: "Search",        group: "Accounting", order: 105, roles: ["Manager"], keywords: ["lookup", "search", "find contract"] },

  // ── ADMIN ────────────────────────────────────────────────────────
  { feature_id: "audit_log",          label: "Audit Log",        route: "/NUPSOwner?tab=audit", icon: "ClipboardList", group: "Admin",      order: 10, roles: ["Manager"], keywords: ["audit", "log", "transaction history"] },
  { feature_id: "audit_integrity",    label: "Audit Integrity",  route: "/admin/audit-integrity", icon: "ShieldCheck", group: "Admin",      order: 20, roles: ["Manager"], keywords: ["integrity", "findings", "anomaly", "coverage"] },
  { feature_id: "activity_log",       label: "Activity Log",     route: "/admin/activity-log", icon: "ScrollText",      group: "Admin",      order: 30, roles: ["Manager"], keywords: ["activity", "actor", "log viewer"] },
  { feature_id: "admin_console",      label: "Admin Console",    route: "/NUPSOwner?tab=admin", icon: "KeyRound",       group: "Admin",      order: 40, roles: ["Manager"], keywords: ["admin", "rbac", "permissions", "refunds", "hardware"] },
  { feature_id: "feature_registry",   label: "Feature Registry", route: "/admin/registry",     icon: "BookOpen",        group: "Admin",      order: 50, roles: ["Manager"], keywords: ["registry", "features", "reconcile"] },
  { feature_id: "demo_keys",          label: "Demo Keys",        route: "/NUPSOwner?tab=demo", icon: "Sparkles",        group: "Admin",      order: 60, roles: ["Manager"], keywords: ["demo", "seed", "credentials", "keys"] },
  { feature_id: "venue_settings",     label: "Venue Settings",   route: "/admin/venue-settings", icon: "Settings",      group: "Admin",      order: 70, roles: ["Manager"], keywords: ["venue", "settings", "rates", "fees", "tax", "config"] },

  // ── SYSTEM ───────────────────────────────────────────────────────
  { feature_id: "global_search",      label: "Search",           route: "/Search",             icon: "Search",          group: "System",     order: 10, roles: ["all"], keywords: ["search", "find", "lookup", "go to"] },
];

/** Defaults applied to every row before upsert. */
export function applyDefaults(row) {
  return {
    modes: ["REAL", "DEMO", "SANDBOX"],
    status: "ACTIVE",
    help_anchor: `help-${row.feature_id}`,
    discovered_by_crawl: false,
    ...row,
  };
}