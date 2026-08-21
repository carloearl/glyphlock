/**
 * BPAA-NUPS-ACCT-001 §3 — Default Chart of Accounts.
 *
 * Seeded per (venue_id, mode). Codes are stable; posting code references
 * them via config lookup, never as inline literals (I-10).
 *
 * Codes here match §3 of the spec exactly — DO NOT renumber.
 */
import { base44 } from "@/api/base44Client";
import { writeEntity } from "@/lib/nups/writeEntity";

export const DEFAULT_COA = [
  // ── ASSETS ─────────────────────────────────────────────────────
  { code: "1000", name: "Cash on Hand (drawer)",         type: "ASSET",     parent_code: null },
  { code: "1010", name: "Card Clearing (Stripe in-transit)", type: "ASSET", parent_code: null },
  { code: "1020", name: "Bank",                          type: "ASSET",     parent_code: null },
  { code: "1200", name: "Inventory",                     type: "ASSET",     parent_code: null },
  { code: "1300", name: "Stored-Value Float",            type: "ASSET",     parent_code: null },

  // ── LIABILITIES ────────────────────────────────────────────────
  { code: "2000", name: "GlyphBucks Outstanding",        type: "LIABILITY", parent_code: null },
  { code: "2100", name: "Tips Payable",                  type: "LIABILITY", parent_code: null },
  { code: "2200", name: "Sales Tax Payable",             type: "LIABILITY", parent_code: null },
  { code: "2300", name: "Driver Payouts Payable",        type: "LIABILITY", parent_code: null },

  // ── EQUITY ─────────────────────────────────────────────────────
  { code: "3000", name: "Owner Equity",                  type: "EQUITY",    parent_code: null },

  // ── REVENUE ────────────────────────────────────────────────────
  { code: "4000", name: "Bar Revenue",                   type: "REVENUE",   parent_code: null },
  { code: "4100", name: "Door / Cover Revenue",          type: "REVENUE",   parent_code: null },
  { code: "4200", name: "VIP / Show Revenue",            type: "REVENUE",   parent_code: null },
  { code: "4300", name: "Vending Revenue",               type: "REVENUE",   parent_code: null },
  { code: "4400", name: "Service / Web Design Revenue",  type: "REVENUE",   parent_code: null },
  { code: "4500", name: "ATM / Currency Fee Revenue",    type: "REVENUE",   parent_code: null },

  // ── COGS ───────────────────────────────────────────────────────
  { code: "5000", name: "Cost of Goods Sold",            type: "COGS",      parent_code: null },

  // ── EXPENSE ────────────────────────────────────────────────────
  { code: "6000", name: "Driver Payout Expense",         type: "EXPENSE",   parent_code: null },
  { code: "6100", name: "Card Processing Fees",          type: "EXPENSE",   parent_code: null },
  { code: "6200", name: "Contractor Expense (entertainers)", type: "EXPENSE", parent_code: null },
];

/**
 * Derive normal_side from account type. Stored for fast validation —
 * trial-balance / posting code reads normal_side instead of re-deriving.
 *
 *   ASSET, COGS, EXPENSE  => DEBIT  (debits increase balance)
 *   LIABILITY, EQUITY, REVENUE => CREDIT
 */
export function normalSideFor(type) {
  if (type === "ASSET" || type === "COGS" || type === "EXPENSE") return "DEBIT";
  if (type === "LIABILITY" || type === "EQUITY" || type === "REVENUE") return "CREDIT";
  throw new Error(`coaSeed: unknown account type: ${type}`);
}

/**
 * Seed the default COA for a venue in a given mode. Idempotent — checks
 * for an existing row by (venue_id, mode, code) before creating.
 *
 * Returns { created, skipped, total } for UI feedback.
 */
export async function seedDefaultCoa({ venue_id, mode = "REAL" }) {
  if (!venue_id) throw new Error("seedDefaultCoa: venue_id_required");

  const existing = await base44.entities.LedgerAccount.filter({ venue_id, mode }, null, 500);
  const haveCodes = new Set(existing.map((r) => r.code));

  let created = 0;
  let skipped = 0;
  const me = await base44.auth.me();
  const actor = { email: me?.email, id: me?.id, role: me?._highestRole || me?.role || "External" };

  for (const row of DEFAULT_COA) {
    if (haveCodes.has(row.code)) {
      skipped += 1;
      continue;
    }
    const result = await writeEntity({
      entity: "LedgerAccount",
      operation: "create",
      data: {
        venue_id,
        mode,
        code: row.code,
        name: row.name,
        type: row.type,
        normal_side: normalSideFor(row.type),
        active: true,
        parent_code: row.parent_code || null,
        seeded_by_default: true,
      },
      actor,
      venue_id,
      intent: `LEDGER_ACCOUNT_SEED_${row.code}`,
      requestContext: { mode },
    });
    if (!result?.ok) throw new Error(result?.block_reason || `Ledger account ${row.code} seed was rejected.`);
    created += 1;
  }

  return { created, skipped, total: DEFAULT_COA.length };
}

/**
 * Load the (venue_id, mode) chart as a lookup map: { [code]: LedgerAccount }.
 * postToLedger() uses this to verify every line.account_code is real & active.
 */
export async function loadCoaMap({ venue_id, mode = "REAL" }) {
  const rows = await base44.entities.LedgerAccount.filter({ venue_id, mode }, null, 500);
  const map = {};
  for (const r of rows) map[r.code] = r;
  return map;
}