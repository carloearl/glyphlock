/**
 * Default Chart of Accounts seed — aligned to the NUPS data model:
 *   • POSTransaction (cash_sales, card_sales, gb_liability, comp_amount, tax, discount)
 *   • DriverPayout (total_payout, PROCESSED only)
 *   • GlyphBucksBatch (surcharge_amount, total_face_value)
 *   • TipPayout / ContractorPayout / PayrollRecord
 *
 * Used by the Chart of Accounts editor when an admin clicks "Seed defaults"
 * on a venue that has no accounts yet. Every entry is editable after seeding.
 */
export const DEFAULT_CHART_OF_ACCOUNTS = [
  // ── ASSETS ────────────────────────────────────────────────
  { account_code: '1000', account_name: 'Cash on Hand — Door',          account_type: 'ASSET',          category: 'Cash',         mapped_source: 'POSTransaction.cash_sales WHERE station=door' },
  { account_code: '1010', account_name: 'Cash on Hand — Bar',           account_type: 'ASSET',          category: 'Cash',         mapped_source: 'POSTransaction.cash_sales WHERE station=bar' },
  { account_code: '1020', account_name: 'Cash on Hand — VIP',           account_type: 'ASSET',          category: 'Cash',         mapped_source: 'POSTransaction.cash_sales WHERE station=vip' },
  { account_code: '1100', account_name: 'Card Settlement Receivable',   account_type: 'ASSET',          category: 'Card',         mapped_source: 'POSTransaction.card_sales (all stations)' },

  // ── LIABILITIES ───────────────────────────────────────────
  { account_code: '2000', account_name: 'GlyphBucks Outstanding',       account_type: 'LIABILITY',      category: 'Stored Value', mapped_source: 'POSTransaction.gb_liability (face value issued, not yet redeemed)' },
  { account_code: '2100', account_name: 'Tip Pool Payable',             account_type: 'LIABILITY',      category: 'Tips',         mapped_source: 'DailySettlement.tip_pool_summary.total_pool' },
  { account_code: '2200', account_name: 'Driver Payouts Pending',       account_type: 'LIABILITY',      category: 'Disbursements',mapped_source: 'DriverPayout WHERE payout_status=PENDING' },

  // ── REVENUE ───────────────────────────────────────────────
  { account_code: '4000', account_name: 'Cover Charges',                account_type: 'REVENUE',        category: 'Door',         mapped_source: 'POSTransaction WHERE station=door AND payment_method!=Comp' },
  { account_code: '4100', account_name: 'VIP Room Revenue',             account_type: 'REVENUE',        category: 'VIP',          mapped_source: 'POSTransaction WHERE station=vip' },
  { account_code: '4200', account_name: 'Bottle Service',               account_type: 'REVENUE',        category: 'Bar',          mapped_source: 'POSTransaction line items tagged bottle_service' },
  { account_code: '4300', account_name: 'Bar Sales',                    account_type: 'REVENUE',        category: 'Bar',          mapped_source: 'POSTransaction WHERE station=bar' },
  { account_code: '4400', account_name: 'GlyphBucks Surcharge Revenue', account_type: 'REVENUE',        category: 'GlyphBucks',   mapped_source: 'GlyphBucksBatch.surcharge_amount' },

  // ── CONTRA-REVENUE (gross-stays-on-books accounting) ──────
  { account_code: '4900', account_name: 'Comps Authorized',             account_type: 'CONTRA_REVENUE', category: 'Adjustments',  mapped_source: 'POSTransaction.comp_amount' },
  { account_code: '4910', account_name: 'Discounts Granted',            account_type: 'CONTRA_REVENUE', category: 'Adjustments',  mapped_source: 'POSTransaction.discount' },

  // ── EXPENSES ──────────────────────────────────────────────
  { account_code: '5000', account_name: 'Driver Payouts',               account_type: 'EXPENSE',        category: 'Disbursements',mapped_source: 'DriverPayout.total_payout WHERE payout_status=PROCESSED' },
  { account_code: '5100', account_name: 'Entertainer Payouts',          account_type: 'EXPENSE',        category: 'Disbursements',mapped_source: 'ContractorPayout.total_payout + PayrollRecord.net_payout' },
  { account_code: '5200', account_name: 'Tip Pool Distributions',       account_type: 'EXPENSE',        category: 'Disbursements',mapped_source: 'TipPayout.total_tips' },
  { account_code: '5900', account_name: 'Credit Card Processing Fees',  account_type: 'EXPENSE',        category: 'Operating',    mapped_source: 'POSTransaction.tax WHERE station=door AND payment_method=Credit Card' },
];