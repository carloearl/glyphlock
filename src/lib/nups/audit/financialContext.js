/**
 * BPAA-NUPS-AUDIT-001 §3 — financial_context builders.
 *
 * Pure functions that produce a §3-compliant financial_context payload from
 * the canonical fields a POS sale already carries. Centralized so call sites
 * never inline the math and §3.1 (total_sales_impact === cash_portion +
 * card_portion) is always satisfied by construction.
 *
 * GlyphBucks and comps are NEVER added to total_sales_impact. §10.
 */

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const round2 = (v) => Math.round(num(v) * 100) / 100;

/**
 * Build financial_context for a POS transaction.
 *
 * Input (all optional unless noted):
 *   gross          — full price before discount/comp (§3 gross_value)
 *   discount       — dollar discount applied
 *   comp_amount    — dollars comped (manager override). Sets payment_type='comp'.
 *   promo_amount   — tracked promo (§ doorRates.promo_card_amount). Mirrors discount.
 *   cash           — cash tendered (cash_portion)
 *   card           — card charged (card_portion)
 *   glyphbucks     — GlyphBucks face value applied (glyphbucks_portion)
 *   payment_method — 'Cash' | 'Credit Card' | 'Debit Card' | 'Comp' | 'GlyphBucks' | 'mixed'
 *
 * Output is shaped exactly to §3 and validated against §3.1 by construction:
 *   total_sales_impact = cash_portion + card_portion (never includes GB/comp).
 */
export function buildFinancialContext({
  gross = 0,
  discount = 0,
  comp_amount = 0,
  promo_amount = 0,
  driver_credit_amount = 0,
  cash = 0,
  card = 0,
  glyphbucks = 0,
  payment_method,
} = {}) {
  const cash_portion = round2(cash);
  const card_portion = round2(card);
  const glyphbucks_portion = round2(glyphbucks);
  const total_sales_impact = round2(cash_portion + card_portion);

  // Derive payment_type per §3.2.
  let payment_type;
  if (payment_method === 'Comp' || comp_amount > 0) {
    payment_type = 'comp';
  } else if (glyphbucks_portion > 0 && (cash_portion > 0 || card_portion > 0)) {
    payment_type = 'mixed';
  } else if (glyphbucks_portion > 0) {
    payment_type = 'glyphbucks';
  } else if (cash_portion > 0 && card_portion > 0) {
    payment_type = 'mixed';
  } else if (card_portion > 0) {
    payment_type = 'card';
  } else {
    payment_type = 'cash';
  }

  return {
    gross_value: round2(gross),
    discount_amount: round2(discount),
    comp_amount: round2(comp_amount),
    promo_amount: round2(promo_amount),
    driver_credit_amount: round2(driver_credit_amount),
    payment_type,
    cash_portion,
    card_portion,
    glyphbucks_portion,
    total_sales_impact,
  };
}

/**
 * Map a POSTransaction.payment_method + tendered amounts → §3 context.
 * Convenience wrapper for the door POS finalize site.
 */
export function fromPOSTransaction(tx) {
  const method = tx?.payment_method || 'Cash';
  const gross = num(tx?.total);
  const isComp = method === 'Comp' || num(tx?.comp_amount) > 0;
  const isCard = method === 'Credit Card' || method === 'Debit Card' || method === 'Digital Wallet';
  const isGB = method === 'GlyphBucks';

  // §3.2 invariants per case
  if (isComp) {
    return buildFinancialContext({
      gross,
      comp_amount: gross,
      payment_method: 'Comp',
    });
  }
  if (isGB) {
    return buildFinancialContext({
      gross,
      glyphbucks: gross,
      payment_method: 'GlyphBucks',
    });
  }
  return buildFinancialContext({
    gross,
    discount: num(tx?.discount),
    cash: isCard ? 0 : gross,
    card: isCard ? gross : 0,
    payment_method: method,
  });
}