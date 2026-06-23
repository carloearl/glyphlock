/**
 * BPAA-NUPS-MASTER-001 §3 — Canonical Feature Registry seed.
 *
 * This is the EXACT seed from the directive. Do not edit ad-hoc;
 * additions must come from DACO. The seed loader is idempotent: upserts
 * by feature_id, never deletes ROADMAP/DEPRECATED rows on re-seed.
 */

export const FEATURE_REGISTRY_SEED = [
  { feature_id: "dashboard", label: "Dashboard", route: "/", group: "Operations", order: 10, roles: ["all"], keywords: ["home", "overview", "start"] },
  { feature_id: "front_door_pos", label: "Front Door POS", route: "/door", group: "Operations", order: 20, roles: ["Door Girl", "Security", "Manager"], keywords: ["door", "cover", "entry", "admission"] },
  { feature_id: "bar_pos", label: "Bar POS", route: "/bar", group: "Operations", order: 30, roles: ["Bartender", "Manager"], keywords: ["bar", "drinks", "tab", "sale", "register"] },
  { feature_id: "inventory", label: "Inventory", route: "/inventory", group: "Operations", order: 40, roles: ["Bartender", "Manager"], keywords: ["stock", "liquor", "supplies", "count"] },
  { feature_id: "vip_shows", label: "VIP & Shows", route: "/vip", group: "Operations", order: 50, roles: ["Hostess", "Manager"], keywords: ["vip", "private", "show", "room", "dance"] },
  { feature_id: "floor_seating", label: "Floor / Seating", route: "/floor", group: "Operations", order: 60, roles: ["Hostess", "Manager"], keywords: ["floor", "seating", "table", "map"] },
  { feature_id: "vending", label: "Vending Sales", route: "/vending", group: "Operations", order: 70, roles: ["Manager", "Bartender"], keywords: ["vending", "machine", "snack"] },
  { feature_id: "scanner", label: "ID / QR Scanner", route: "/scanner", group: "Operations", order: 80, roles: ["Door Girl", "Security", "Manager"], keywords: ["scan", "id", "qr", "verify"] },

  { feature_id: "glyphbucks", label: "GlyphBucks Currency", route: "/currency", group: "Currency", order: 10, roles: ["Manager", "Door Girl"], keywords: ["glyphbucks", "currency", "club currency", "tokens", "stored value"] },
  { feature_id: "glyphbucks_atm", label: "Currency ATM / Load", route: "/currency/atm", group: "Currency", order: 20, roles: ["Manager", "Door Girl"], keywords: ["atm", "load", "buy currency", "reload"] },
  { feature_id: "glyphbucks_print", label: "Currency Bill Printing", route: "/currency/print", group: "Currency", order: 30, roles: ["Manager"], keywords: ["print", "bills", "notes", "voucher"] },

  { feature_id: "ledger", label: "General Ledger", route: "/accounting/ledger", group: "Accounting", order: 10, roles: ["Manager"], keywords: ["ledger", "journal", "books", "double entry"] },
  { feature_id: "trial_balance", label: "Trial Balance", route: "/accounting/trial-balance", group: "Accounting", order: 20, roles: ["Manager"], keywords: ["trial balance", "debits credits", "proof"] },
  { feature_id: "profit_loss", label: "Profit & Loss", route: "/accounting/pnl", group: "Accounting", order: 30, roles: ["Manager"], keywords: ["pnl", "profit", "loss", "income statement"] },
  { feature_id: "balance_sheet", label: "Balance Sheet", route: "/accounting/balance-sheet", group: "Accounting", order: 40, roles: ["Manager"], keywords: ["balance sheet", "assets", "liabilities", "equity"] },
  { feature_id: "cash_flow", label: "Cash Flow", route: "/accounting/cash-flow", group: "Accounting", order: 50, roles: ["Manager"], keywords: ["cash flow", "cash", "movement"] },
  { feature_id: "reconciliation", label: "Reconciliation", route: "/accounting/reconciliation", group: "Accounting", order: 60, roles: ["Manager"], keywords: ["reconcile", "drawer", "variance", "count"] },
  { feature_id: "daily_settlement", label: "Daily Settlement", route: "/accounting/settlement", group: "Accounting", order: 70, roles: ["Manager"], keywords: ["settlement", "daily", "close out", "z report"] },
  { feature_id: "tips_ledger", label: "Tips Ledger", route: "/accounting/tips", group: "Accounting", order: 80, roles: ["Manager", "Bartender"], keywords: ["tips", "gratuity", "payable", "payout"] },

  { feature_id: "time_clock", label: "Time Clock", route: "/staff/time-clock", group: "Staff", order: 10, roles: ["all"], keywords: ["clock", "time", "shift", "check in", "punch"] },
  { feature_id: "staff_directory", label: "Staff Directory", route: "/staff/directory", group: "Staff", order: 20, roles: ["Manager"], keywords: ["staff", "employees", "team", "people"] },
  { feature_id: "entertainer_checkin", label: "Entertainer Check-In (IC)", route: "/staff/entertainers", group: "Staff", order: 30, roles: ["Manager", "Hostess", "Door Girl"], keywords: ["entertainer", "dancer", "contractor", "ic", "check in"] },
  { feature_id: "driver_payouts", label: "Driver Payouts", route: "/staff/drivers", group: "Staff", order: 40, roles: ["Manager"], keywords: ["driver", "payout", "ride", "transport"] },
  { feature_id: "roles_rbac", label: "Roles & Permissions", route: "/staff/roles", group: "Staff", order: 50, roles: ["Manager"], keywords: ["roles", "permissions", "rbac", "access"] },

  { feature_id: "venues", label: "Venues", route: "/admin/venues", group: "Admin", order: 10, roles: ["Manager"], keywords: ["venue", "club", "location", "dream palace"] },
  { feature_id: "venue_rate_config", label: "Rate Configuration", route: "/admin/rates", group: "Admin", order: 20, roles: ["Manager"], keywords: ["rates", "config", "pricing", "tax", "fees"] },
  { feature_id: "mode_control", label: "Mode Control", route: "/admin/mode", group: "Admin", order: 30, roles: ["Manager"], keywords: ["mode", "demo", "real", "sandbox", "live", "test"] },
  { feature_id: "payments_config", label: "Payments & Terminals", route: "/admin/payments", group: "Admin", order: 40, roles: ["Manager"], keywords: ["payments", "terminal", "godaddy", "stripe", "card"] },
  { feature_id: "hardware", label: "Hardware / Peripherals", route: "/admin/hardware", group: "Admin", order: 50, roles: ["Manager"], keywords: ["hardware", "scanner", "printer", "reader", "tablet"] },
  { feature_id: "printing_config", label: "Printing Setup", route: "/admin/printing", group: "Admin", order: 60, roles: ["Manager"], keywords: ["print", "printer", "receipt", "thermal", "contract"] },

  { feature_id: "global_search", label: "Search", route: "/search", group: "System", order: 10, roles: ["all"], keywords: ["search", "find", "lookup", "go to"] },
  { feature_id: "help_guide", label: "Help Guide", route: "/help", group: "System", order: 20, roles: ["all"], keywords: ["help", "guide", "docs", "how to", "manual"] },
  { feature_id: "assistant", label: "Assistant", route: "/assistant", group: "System", order: 30, roles: ["all"], keywords: ["assistant", "chat", "ask", "bot", "support"] },
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