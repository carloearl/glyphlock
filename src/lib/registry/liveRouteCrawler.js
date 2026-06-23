/**
 * BPAA-NUPS-MASTER-001 §3 — Live router crawler.
 *
 * Extracts the set of concrete client-side routes the app actually renders.
 * Single source of truth for "what is reachable today" — fed into
 * reconcileRegistry() so F-2 (no orphan routes) is provable, not assumed.
 *
 * Source list is the App.jsx route table. We deliberately list canonical
 * lowercase routes here (one entry per concept). Aliases (e.g. /NUPSOwner
 * vs /nupsowner) are not separate features — they collapse to one.
 */

export const LIVE_APP_ROUTES = [
  "/",
  "/door",            // /FrontDoor canonical alias
  "/bar",             // bar register surface
  "/inventory",
  "/vip",
  "/floor",
  "/vending",
  "/scanner",
  "/currency",
  "/currency/atm",
  "/currency/print",
  "/accounting/ledger",
  "/accounting/trial-balance",
  "/accounting/pnl",
  "/accounting/balance-sheet",
  "/accounting/cash-flow",
  "/accounting/reconciliation",
  "/accounting/settlement",
  "/accounting/tips",
  "/staff/time-clock",
  "/staff/directory",
  "/staff/entertainers",
  "/staff/drivers",
  "/staff/roles",
  "/admin/venues",
  "/admin/rates",
  "/admin/mode",
  "/admin/payments",
  "/admin/hardware",
  "/admin/printing",
  "/search",
  "/help",
  "/assistant",
];