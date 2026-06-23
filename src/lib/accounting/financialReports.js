/**
 * BPAA-NUPS-ACCT-001 §9 — Financial reports.
 *
 * All reports derive from the LEDGER (JournalEntry), never re-tally raw
 * source rows. One number, one source. Excludes REVERSED entries.
 *
 *   • profitAndLoss      — Revenue − COGS − Expense
 *   • balanceSheet       — Assets = Liabilities + Equity (+retained earnings)
 *   • cashFlow           — Movement through Cash, Card Clearing, Bank
 *   • totalSalesBridge   — Proves I-5: cash + card revenue (excl GB, excl tips)
 */
import { base44 } from "@/api/base44Client";
import { loadCoaMap } from "./coaSeed";
import { sumCents } from "./money";

async function loadPostedEntries({ venue_id, mode, from, to }) {
  const all = await base44.entities.JournalEntry.filter(
    { venue_id, mode, status: "POSTED" }, "-posted_at", 5000,
  );
  return all.filter((e) => {
    const t = new Date(e.posted_at).getTime();
    if (from && t < new Date(from).getTime()) return false;
    if (to && t > new Date(to).getTime()) return false;
    return true;
  });
}

/* ───── Profit & Loss ───────────────────────────────────────────── */
export async function profitAndLoss({ venue_id, mode = "REAL", from = null, to = null } = {}) {
  const coa = await loadCoaMap({ venue_id, mode });
  const entries = await loadPostedEntries({ venue_id, mode, from, to });

  const rows = {};
  for (const code of Object.keys(coa)) {
    rows[code] = { code, name: coa[code].name, type: coa[code].type, dr: 0, cr: 0 };
  }
  for (const e of entries) {
    for (const l of e.lines || []) {
      const r = rows[l.account_code];
      if (!r) continue;
      r.dr += Number(l.debit_cents) || 0;
      r.cr += Number(l.credit_cents) || 0;
    }
  }

  // For revenue: balance is credit-positive (cr - dr)
  // For COGS/expense: balance is debit-positive (dr - cr)
  const revenue = [];
  const cogs = [];
  const expense = [];
  for (const r of Object.values(rows)) {
    if (r.type === "REVENUE") revenue.push({ ...r, balance_cents: r.cr - r.dr });
    if (r.type === "COGS")    cogs.push({ ...r, balance_cents: r.dr - r.cr });
    if (r.type === "EXPENSE") expense.push({ ...r, balance_cents: r.dr - r.cr });
  }
  revenue.sort((a, b) => a.code.localeCompare(b.code));
  cogs.sort((a, b) => a.code.localeCompare(b.code));
  expense.sort((a, b) => a.code.localeCompare(b.code));

  const total_revenue_cents = sumCents(revenue.map((r) => r.balance_cents));
  const total_cogs_cents    = sumCents(cogs.map((r) => r.balance_cents));
  const total_expense_cents = sumCents(expense.map((r) => r.balance_cents));
  const gross_profit_cents  = total_revenue_cents - total_cogs_cents;
  const net_income_cents    = gross_profit_cents - total_expense_cents;

  return {
    venue_id, mode, from, to,
    revenue, cogs, expense,
    total_revenue_cents, total_cogs_cents, total_expense_cents,
    gross_profit_cents, net_income_cents,
    entry_count: entries.length,
  };
}

/* ───── Balance Sheet ───────────────────────────────────────────── */
export async function balanceSheet({ venue_id, mode = "REAL", asOf = null } = {}) {
  const coa = await loadCoaMap({ venue_id, mode });
  const entries = await loadPostedEntries({ venue_id, mode, from: null, to: asOf });

  const rows = {};
  for (const code of Object.keys(coa)) {
    rows[code] = { code, name: coa[code].name, type: coa[code].type, dr: 0, cr: 0 };
  }
  for (const e of entries) {
    for (const l of e.lines || []) {
      const r = rows[l.account_code];
      if (!r) continue;
      r.dr += Number(l.debit_cents) || 0;
      r.cr += Number(l.credit_cents) || 0;
    }
  }

  const assets = [];
  const liabilities = [];
  const equity = [];
  for (const r of Object.values(rows)) {
    if (r.type === "ASSET")     assets.push({ ...r, balance_cents: r.dr - r.cr });
    if (r.type === "LIABILITY") liabilities.push({ ...r, balance_cents: r.cr - r.dr });
    if (r.type === "EQUITY")    equity.push({ ...r, balance_cents: r.cr - r.dr });
  }
  assets.sort((a, b) => a.code.localeCompare(b.code));
  liabilities.sort((a, b) => a.code.localeCompare(b.code));
  equity.sort((a, b) => a.code.localeCompare(b.code));

  const total_assets_cents = sumCents(assets.map((r) => r.balance_cents));
  const total_liabilities_cents = sumCents(liabilities.map((r) => r.balance_cents));
  const total_explicit_equity_cents = sumCents(equity.map((r) => r.balance_cents));

  // Retained earnings (period net income, simple — full version would split
  // current period vs prior). Net income = revenue − COGS − expense.
  let retained_earnings_cents = 0;
  for (const r of Object.values(rows)) {
    if (r.type === "REVENUE")  retained_earnings_cents += (r.cr - r.dr);
    if (r.type === "COGS")     retained_earnings_cents -= (r.dr - r.cr);
    if (r.type === "EXPENSE")  retained_earnings_cents -= (r.dr - r.cr);
  }

  const total_equity_cents = total_explicit_equity_cents + retained_earnings_cents;
  const balanced = total_assets_cents === (total_liabilities_cents + total_equity_cents);

  return {
    venue_id, mode, as_of: asOf || new Date().toISOString(),
    assets, liabilities, equity,
    total_assets_cents, total_liabilities_cents,
    total_explicit_equity_cents, retained_earnings_cents, total_equity_cents,
    balanced,
    entry_count: entries.length,
  };
}

/* ───── Cash Flow ───────────────────────────────────────────────── */
export async function cashFlow({ venue_id, mode = "REAL", from = null, to = null } = {}) {
  const entries = await loadPostedEntries({ venue_id, mode, from, to });
  const cashCodes = new Set(["1000", "1010", "1020"]);

  const byAccount = { "1000": { in: 0, out: 0 }, "1010": { in: 0, out: 0 }, "1020": { in: 0, out: 0 } };

  for (const e of entries) {
    for (const l of e.lines || []) {
      if (!cashCodes.has(l.account_code)) continue;
      byAccount[l.account_code].in  += Number(l.debit_cents) || 0;
      byAccount[l.account_code].out += Number(l.credit_cents) || 0;
    }
  }

  const rows = [
    { code: "1000", name: "Cash on Hand (drawer)",     ...byAccount["1000"], net: byAccount["1000"].in - byAccount["1000"].out },
    { code: "1010", name: "Card Clearing (in-transit)", ...byAccount["1010"], net: byAccount["1010"].in - byAccount["1010"].out },
    { code: "1020", name: "Bank",                       ...byAccount["1020"], net: byAccount["1020"].in - byAccount["1020"].out },
  ];

  return {
    venue_id, mode, from, to,
    rows,
    total_inflow_cents:  sumCents(rows.map((r) => r.in)),
    total_outflow_cents: sumCents(rows.map((r) => r.out)),
    net_change_cents:    sumCents(rows.map((r) => r.net)),
    entry_count: entries.length,
  };
}

/* ───── total_sales bridge — proves I-5 ────────────────────────── */
/**
 * Ledger-side definition of total_sales (per spec §9):
 *   cash + card credits to revenue accounts (4000..4500)
 *   EXCLUDING GlyphBucks sales (those credit 2000, a liability)
 *   EXCLUDING tips (those credit 2100, a liability)
 *
 * Returns the figure plus a comparison against the rolled-up
 * POSTransaction.total for the period — defect surfaces visibly.
 */
export async function totalSalesBridge({ venue_id, mode = "REAL", from = null, to = null } = {}) {
  const entries = await loadPostedEntries({ venue_id, mode, from, to });
  const revenueCodes = new Set(["4000", "4100", "4200", "4300", "4400", "4500"]);

  let ledger_revenue_cents = 0;
  for (const e of entries) {
    if (e.source_type === "GLYPHBUCKS_SALE") continue;
    if (e.source_type === "TIP_IN") continue;
    if (e.source_type === "TIP_PAYOUT") continue;
    for (const l of e.lines || []) {
      if (revenueCodes.has(l.account_code)) {
        ledger_revenue_cents += Number(l.credit_cents) || 0;
        ledger_revenue_cents -= Number(l.debit_cents) || 0;   // GUEST_DISCOUNT subtracts
      }
    }
  }

  // Compare against POSTransaction.total roll-up (the legacy figure)
  const txs = await base44.entities.POSTransaction.filter({ venue_id, mode }, "-created_date", 2000);
  const usableTx = txs.filter((t) => {
    if (t.validation_run === true) return false;
    if (t.status === "void" || t.status === "refunded" || t.status === "held") return false;
    if (t.payment_method === "Comp") return false;
    const ct = new Date(t.created_date).getTime();
    if (from && ct < new Date(from).getTime()) return false;
    if (to && ct > new Date(to).getTime()) return false;
    return true;
  });

  const pos_cash_cents = Math.round(sumCents(usableTx.map((t) => (Number(t.cash_sales) || 0) * 100)));
  const pos_card_cents = Math.round(sumCents(usableTx.map((t) => (Number(t.card_sales) || 0) * 100)));
  const pos_total_sales_cents = pos_cash_cents + pos_card_cents;

  const variance_cents = ledger_revenue_cents - pos_total_sales_cents;

  return {
    venue_id, mode, from, to,
    ledger_revenue_cents,
    pos_total_sales_cents,
    pos_cash_cents, pos_card_cents,
    variance_cents,
    matches: variance_cents === 0,
    entry_count: entries.length,
    transaction_count: usableTx.length,
  };
}