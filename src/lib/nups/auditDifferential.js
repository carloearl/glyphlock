/**
 * Audit Differential Utilities
 * ─────────────────────────────
 * Compares pre-lock vs post-lock snapshots of DailySettlement records and
 * cross-checks POSTransaction totals against the generated ZReport.
 *
 * Vinnie Principle enforced everywhere:
 *   total_sales = cash_sales + card_sales
 *   GlyphBucks  = liability (never revenue)
 *   Driver payouts = disbursement (never reduces total_sales)
 *   Comp = gap (total - cash_sales - card_sales)
 */

import { base44 } from "@/api/base44Client";

/**
 * Build a comparison snapshot pair for a DailySettlement.
 * Used by the Accounting page to show before/after diffs.
 */
export function buildSettlementDiff(before = {}, after = {}) {
  const keys = [
    "cash_sales",
    "card_sales",
    "total_sales",
    "driver_payouts_total",
    "driver_payouts_outstanding",
    "variance",
    "status",
  ];
  const rows = keys.map((k) => {
    const b = Number(before?.[k] ?? 0);
    const a = Number(after?.[k] ?? 0);
    const isNumeric = typeof before?.[k] !== "string" && typeof after?.[k] !== "string";
    const delta = isNumeric ? a - b : null;
    return {
      field: k,
      before: before?.[k],
      after: after?.[k],
      delta,
      changed: JSON.stringify(before?.[k]) !== JSON.stringify(after?.[k]),
    };
  });
  return rows;
}

/**
 * Compare POSTransaction totals (for a given batch_id) against the ZReport snapshot.
 * Returns reconciliation rows: source, label, expected, actual, variance, ok.
 */
export function reconcileBatchVsZReport(transactions = [], zReport = {}) {
  const real = transactions.filter((t) => !t.validation_run && t.status === "completed");

  const cash = real
    .filter((t) => (t.payment_method || "").toLowerCase() === "cash")
    .reduce((s, t) => s + (Number(t.cash_sales) || Number(t.total) || 0), 0);

  const card = real
    .filter((t) =>
      ["credit card", "debit card", "digital wallet"].includes((t.payment_method || "").toLowerCase())
    )
    .reduce((s, t) => s + (Number(t.card_sales) || Number(t.total) || 0), 0);

  const compGap = real
    .filter((t) => (t.payment_method || "").toLowerCase() === "comp")
    .reduce((s, t) => s + (Number(t.comp_amount) || Number(t.total) || 0), 0);

  const computedTotalSales = cash + card;

  const z = {
    cash: Number(zReport?.cash_sales || zReport?.total_cash || 0),
    card: Number(zReport?.card_sales || zReport?.total_card || 0),
    total: Number(zReport?.total_sales || zReport?.grand_total || 0),
    comp: Number(zReport?.comp_total || 0),
  };

  const row = (label, expected, actual) => ({
    label,
    expected: Number(expected || 0),
    actual: Number(actual || 0),
    variance: Number(actual || 0) - Number(expected || 0),
    ok: Math.abs(Number(actual || 0) - Number(expected || 0)) < 0.01,
  });

  return [
    row("Cash Sales", cash, z.cash),
    row("Card Sales", card, z.card),
    row("Total Sales (cash + card)", computedTotalSales, z.total),
    row("Comp Gap", compGap, z.comp),
  ];
}

/**
 * Write a structured DIFF log to ActivityLog. Append-only — never edits.
 * scope: "SETTLEMENT_LOCK" | "ZREPORT_RECONCILE" | "BATCH_CLOSE"
 */
export async function writeDifferentialLog({ scope, entityRef, before, after, notes }) {
  const me = await base44.auth.me().catch(() => null);
  return base44.entities.ActivityLog.create({
    timestamp: new Date().toISOString(),
    user_email: me?.email || "system",
    user_role: me?.role || "SYSTEM",
    action_type: scope === "SETTLEMENT_LOCK" ? "SETTLEMENT_RUN" : "UPDATE",
    entity_affected: entityRef,
    before_value: before || {},
    after_value: after || {},
    mode: "REAL",
    notes: `DIFFERENTIAL [${scope}] ${notes || ""}`.trim(),
  });
}