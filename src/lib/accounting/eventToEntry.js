/**
 * BPAA-NUPS-ACCT-001 §4 — Source-event → balanced-entry translator.
 *
 * Pure functions. Each takes a normalized event object (already in integer
 * cents) plus the venue rate config, and returns the lines array for
 * postToLedger(). Throws on any invariant violation BEFORE posting.
 *
 * Account codes resolved from the seeded default COA (§3). If a venue
 * renames or remaps an account, those rewrites live in VenueRateConfig
 * (processing_fee_account) — keep code free of literals (I-10).
 */
import { toCents, sumCents } from "./money";

/** Default COA codes per §3. Stable; never inline literals at call sites. */
export const ACCT = {
  CASH:                "1000",
  CARD_CLEARING:       "1010",
  BANK:                "1020",
  INVENTORY:           "1200",
  STORED_VALUE_FLOAT:  "1300",
  GLYPHBUCKS_LIAB:     "2000",
  TIPS_PAYABLE:        "2100",
  TAX_PAYABLE:         "2200",
  DRIVER_PAYABLE:      "2300",
  OWNER_EQUITY:        "3000",
  BAR_REVENUE:         "4000",
  DOOR_REVENUE:        "4100",
  VIP_REVENUE:         "4200",
  VENDING_REVENUE:     "4300",
  SERVICE_REVENUE:     "4400",
  FEE_REVENUE:         "4500",
  COGS:                "5000",
  DRIVER_EXPENSE:      "6000",
  CARD_PROCESSING:     "6100",
  CONTRACTOR_EXPENSE:  "6200",
};

/** Revenue account for a station + source_type. */
function revenueAccountFor(source_type) {
  switch (source_type) {
    case "BAR_SALE":        return ACCT.BAR_REVENUE;
    case "DOOR":            return ACCT.DOOR_REVENUE;
    case "VIP_SHOW":        return ACCT.VIP_REVENUE;
    case "VENDING":         return ACCT.VENDING_REVENUE;
    case "SERVICE_REVENUE": return ACCT.SERVICE_REVENUE;
    default: throw new Error(`eventToEntry: unknown revenue source_type: ${source_type}`);
  }
}

/** Cash vs Card asset account based on payment_method. */
function tenderAccount(payment_method) {
  const cardish = ["Credit Card", "Debit Card", "Digital Wallet", "Card", "Gift Card", "Tab"];
  if (cardish.includes(payment_method)) return ACCT.CARD_CLEARING;
  // Cash, Other, falsy → drawer
  return ACCT.CASH;
}

/**
 * Split a gross cents amount into (net, tax) based on tax_mode + tax_rate_bps.
 * Returns { net_cents, tax_cents }. Integer math only.
 */
export function splitTax(gross_cents, { tax_mode = "NONE", tax_rate_bps = 0 } = {}) {
  if (tax_mode === "NONE" || !tax_rate_bps) {
    return { net_cents: gross_cents, tax_cents: 0 };
  }
  if (tax_mode === "EXCLUSIVE") {
    // Tax was already on top — net = gross - tax. But we're given gross with
    // tax already inside (this is the POSTransaction.total convention).
    // Treat the same as INCLUSIVE for posting purposes — split inside.
    const net = Math.round((gross_cents * 10000) / (10000 + tax_rate_bps));
    return { net_cents: net, tax_cents: gross_cents - net };
  }
  // INCLUSIVE — gross already includes tax
  const net = Math.round((gross_cents * 10000) / (10000 + tax_rate_bps));
  return { net_cents: net, tax_cents: gross_cents - net };
}

/* ──────────────────────────────────────────────────────────────────
 * REVENUE EVENTS — POSTransaction → JournalEntry
 *
 * Input event shape:
 *   {
 *     source_type:    "BAR_SALE" | "DOOR" | "VIP_SHOW" | "VENDING" | "SERVICE_REVENUE",
 *     station:        "door" | "bar" | "vip" | "kiosk" | "office",
 *     payment_method: "Cash" | "Credit Card" | "Comp" | "GlyphBucks" | …,
 *     total_cents:    integer (gross),
 *     comp_cents:     integer (default 0),
 *     gb_liability_cents: integer (GlyphBucks face value sold this tx; default 0),
 *   }
 * ───────────────────────────────────────────────────────────────── */

export function linesForRevenueEvent(event, config = {}) {
  const {
    source_type,
    payment_method,
    total_cents = 0,
    comp_cents = 0,
    gb_liability_cents = 0,
  } = event;

  const lines = [];

  // Comp: NO money moved. Posting a comp is purely an audit gap — skip the
  // ledger (gross stays visible on POSTransaction.total per spec, but no
  // revenue or asset entry). Returning [] tells the caller to no-op.
  if (payment_method === "Comp" || comp_cents >= total_cents) {
    return [];
  }

  // GlyphBucks redemption: handled by linesForGlyphBucksRedeem — never here.
  if (payment_method === "GlyphBucks") {
    throw new Error("eventToEntry: GlyphBucks redemption must use linesForGlyphBucksRedeem()");
  }

  // Bare-revenue sale: tender debit, revenue credit (split tax if configured)
  const net_revenue_cents = total_cents - gb_liability_cents;
  if (net_revenue_cents <= 0 && gb_liability_cents <= 0) {
    return []; // nothing to post (e.g. $0 line)
  }

  const revAcct = revenueAccountFor(source_type);
  const tenderAcct = tenderAccount(payment_method);
  const { net_cents, tax_cents } = splitTax(net_revenue_cents, {
    tax_mode: config.tax_mode,
    tax_rate_bps: Number(config.tax_rate_bps) || 0,
  });

  // Asset debit (gross tender received, including any GB liability portion)
  lines.push({ account_code: tenderAcct, debit_cents: total_cents, credit_cents: 0, memo: "tender" });

  // Revenue credit (net of tax)
  if (net_cents > 0) {
    lines.push({ account_code: revAcct, debit_cents: 0, credit_cents: net_cents, memo: "revenue" });
  }

  // Tax payable credit
  if (tax_cents > 0) {
    lines.push({ account_code: ACCT.TAX_PAYABLE, debit_cents: 0, credit_cents: tax_cents, memo: "sales tax" });
  }

  // GlyphBucks portion (when a transaction sells GB alongside revenue):
  // credit the liability for the face value.
  if (gb_liability_cents > 0) {
    lines.push({ account_code: ACCT.GLYPHBUCKS_LIAB, debit_cents: 0, credit_cents: gb_liability_cents, memo: "GB sold (liability)" });
  }

  return lines;
}

/* ──────────────────────────────────────────────────────────────────
 * GLYPHBUCKS §6
 * ───────────────────────────────────────────────────────────────── */

/** Sale: tender in → GlyphBucks Outstanding liability (NOT revenue). */
export function linesForGlyphBucksSale({ tender_cents, payment_method = "Credit Card" }) {
  if (tender_cents <= 0) throw new Error("linesForGlyphBucksSale: tender_cents_required");
  return [
    { account_code: tenderAccount(payment_method), debit_cents: tender_cents, credit_cents: 0, memo: "GB sale tender" },
    { account_code: ACCT.GLYPHBUCKS_LIAB,           debit_cents: 0,           credit_cents: tender_cents, memo: "GB issued (liability)" },
  ];
}

/** Redeem: liability OUT → revenue recognized at the destination account. */
export function linesForGlyphBucksRedeem({ face_cents, revenue_source_type = "VIP_SHOW" }) {
  if (face_cents <= 0) throw new Error("linesForGlyphBucksRedeem: face_cents_required");
  return [
    { account_code: ACCT.GLYPHBUCKS_LIAB, debit_cents: face_cents, credit_cents: 0, memo: "GB redeemed (liability cleared)" },
    { account_code: revenueAccountFor(revenue_source_type), debit_cents: 0, credit_cents: face_cents, memo: "revenue recognized" },
  ];
}

/* ──────────────────────────────────────────────────────────────────
 * TIPS §5 — pass-through, never revenue
 * ───────────────────────────────────────────────────────────────── */

export function linesForTipIn({ tip_cents }) {
  if (tip_cents <= 0) throw new Error("linesForTipIn: tip_cents_required");
  return [
    { account_code: ACCT.CASH,         debit_cents: tip_cents, credit_cents: 0, memo: "tip received" },
    { account_code: ACCT.TIPS_PAYABLE, debit_cents: 0,         credit_cents: tip_cents, memo: "owed to staff" },
  ];
}

export function linesForTipPayout({ tip_cents }) {
  if (tip_cents <= 0) throw new Error("linesForTipPayout: tip_cents_required");
  return [
    { account_code: ACCT.TIPS_PAYABLE, debit_cents: tip_cents, credit_cents: 0, memo: "tips paid" },
    { account_code: ACCT.CASH,         debit_cents: 0,         credit_cents: tip_cents, memo: "drawer out" },
  ];
}

/* ──────────────────────────────────────────────────────────────────
 * CONTRACTOR (entertainers) §7/I-7
 * ───────────────────────────────────────────────────────────────── */

export function linesForContractorPayout({ amount_cents, paid_in = "Cash" }) {
  if (amount_cents <= 0) throw new Error("linesForContractorPayout: amount_cents_required");
  return [
    { account_code: ACCT.CONTRACTOR_EXPENSE, debit_cents: amount_cents, credit_cents: 0, memo: "contractor expense" },
    { account_code: tenderAccount(paid_in),   debit_cents: 0,            credit_cents: amount_cents, memo: "paid" },
  ];
}

/* ──────────────────────────────────────────────────────────────────
 * DRIVER PAYOUT §7 — config-gated. THROWS until treatment set.
 * ───────────────────────────────────────────────────────────────── */

export function linesForDriverPayout({ payout_cents, paid_in = "Cash" }, config = {}) {
  const treatment = config.driver_payout_treatment || "UNSET";
  if (treatment === "UNSET") {
    throw new Error("DRIVER_PAYOUT_TREATMENT_UNSET — DACO must set driver_payout_treatment on VenueRateConfig before driver payouts can post (§7)");
  }
  if (payout_cents <= 0) throw new Error("linesForDriverPayout: payout_cents_required");

  if (treatment === "HOUSE_ABSORBED") {
    // Expense leg — revenue stays gross.
    return [
      { account_code: ACCT.DRIVER_EXPENSE,        debit_cents: payout_cents, credit_cents: 0, memo: "driver expense" },
      { account_code: tenderAccount(paid_in),     debit_cents: 0,            credit_cents: payout_cents, memo: "paid" },
    ];
  }

  if (treatment === "GUEST_DISCOUNT") {
    // Reduce door revenue by the payout amount — same cash leaves drawer.
    return [
      { account_code: ACCT.DOOR_REVENUE,          debit_cents: payout_cents, credit_cents: 0, memo: "guest discount (driver)" },
      { account_code: tenderAccount(paid_in),     debit_cents: 0,            credit_cents: payout_cents, memo: "paid" },
    ];
  }

  throw new Error(`linesForDriverPayout: unknown treatment ${treatment}`);
}

/* ──────────────────────────────────────────────────────────────────
 * CARD SETTLEMENT (§4) — Stripe payout clears Card Clearing into Bank,
 * minus the processing fees.
 * ───────────────────────────────────────────────────────────────── */

export function linesForCardSettlement({ gross_cents, fee_cents }) {
  if (gross_cents <= 0) throw new Error("linesForCardSettlement: gross_cents_required");
  const net = gross_cents - fee_cents;
  if (net < 0) throw new Error("linesForCardSettlement: fee_exceeds_gross");
  return [
    { account_code: ACCT.BANK,            debit_cents: net,      credit_cents: 0, memo: "Stripe payout" },
    { account_code: ACCT.CARD_PROCESSING, debit_cents: fee_cents, credit_cents: 0, memo: "processing fee" },
    { account_code: ACCT.CARD_CLEARING,   debit_cents: 0,         credit_cents: gross_cents, memo: "clearing → bank" },
  ];
}

/** Sanity helper exposed for tests / UI: balanced check. */
export function isBalanced(lines) {
  const dr = sumCents(lines.map((l) => l.debit_cents || 0));
  const cr = sumCents(lines.map((l) => l.credit_cents || 0));
  return dr === cr && dr > 0;
}

// Reexport toCents for convenience in source mappers.
export { toCents };