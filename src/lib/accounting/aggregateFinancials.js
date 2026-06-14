/**
 * Pure aggregator — never mutates input, always returns the same shape.
 * Source of truth rules (DACO-locked):
 *   • total_sales = cash_sales + card_sales ONLY
 *   • GlyphBucks face value is LIABILITY, never revenue
 *   • Driver/payroll/tip/contractor payouts are DISBURSEMENTS (cash out)
 *   • Net position = gross_revenue − total_disbursements (excludes GB outstanding)
 */

const safeNum = (v) => Number(v) || 0;
const safeJSON = (s) => {
  try { return typeof s === "string" ? JSON.parse(s) : (s || {}); } catch { return {}; }
};

export function aggregateFinancials({
  settlements = [],
  driverPayouts = [],
  payrollRecords = [],
  tipPayouts = [],
  contractorPayouts = [],
  glyphBucksOrders = [],
  glyphBucksBills = [],
  posTransactions = [],
} = {}) {
  // Revenue — from DailySettlement (canonical)
  const cash_sales = settlements.reduce((s, r) => s + safeNum(r.cash_sales), 0);
  const card_sales = settlements.reduce((s, r) => s + safeNum(r.card_sales), 0);
  const gross_revenue = cash_sales + card_sales;

  // Comps — gross value rung up but given away. Tracked as an accounting GAP,
  // never as revenue (cash_sales/card_sales for comp transactions are zero).
  const compTxs = posTransactions.filter(
    (t) => t.payment_method === "Comp" && t.status !== "void" && !t.validation_run
  );
  const comps_total = compTxs.reduce((s, t) => s + safeNum(t.comp_amount || t.total), 0);
  const comps_count = compTxs.length;
  const comps_by_reason = compTxs.reduce((acc, t) => {
    const r = (t.comp_reason || "Unspecified").split(" — ")[0];
    acc[r] = (acc[r] || 0) + safeNum(t.comp_amount || t.total);
    return acc;
  }, {});

  // Disbursements (only PAID / PROCESSED count toward outflow)
  const driver_disbursements = driverPayouts
    .filter((r) => r.status === "paid" || r.payout_status === "PROCESSED")
    .reduce((s, r) => s + safeNum(r.total_payout), 0);

  const payroll_disbursements = payrollRecords
    .filter((r) => r.status === "paid")
    .reduce((s, r) => s + safeNum(r.net_payout), 0);

  const tip_disbursements = tipPayouts
    .filter((r) => r.status === "completed")
    .reduce((s, r) => s + safeNum(r.total_tips), 0);

  const contractor_disbursements = contractorPayouts
    .filter((r) => r.status === "paid")
    .reduce((s, r) => s + safeNum(r.total_payout), 0);

  const total_disbursements =
    driver_disbursements + payroll_disbursements + tip_disbursements + contractor_disbursements;

  // GlyphBucks Liability Ledger (never affects revenue)
  const gb_issued_face_value = glyphBucksOrders.reduce(
    (s, o) => s + safeNum(o.glyphbucks_value),
    0
  );
  const gb_issued_count = glyphBucksOrders.length;
  const gb_redeemed_face_value = contractorPayouts
    .filter((r) => r.payout_type === "glyphbucks_redemption")
    .reduce((s, r) => s + safeNum(r.total_face_value), 0);
  const gb_redeemed_count = glyphBucksBills.filter((b) => b.status === "redeemed").length;
  const gb_outstanding_face_value = Math.max(0, gb_issued_face_value - gb_redeemed_face_value);
  const gb_redemption_rate =
    gb_issued_face_value > 0
      ? gb_redeemed_face_value / gb_issued_face_value
      : 0;

  // Pending / outstanding
  const driver_pending = driverPayouts
    .filter((r) => r.status === "pending" || r.payout_status === "PENDING")
    .reduce((s, r) => s + safeNum(r.total_payout), 0);

  const payroll_pending = payrollRecords
    .filter((r) => r.status === "approved" || r.status === "draft")
    .reduce((s, r) => s + safeNum(r.net_payout), 0);

  // Net Position — gross revenue minus paid disbursements
  const net_position = gross_revenue - total_disbursements;

  // Per-day timeline (for charts)
  const dayMap = new Map();
  const bump = (date, key, amount) => {
    if (!date) return;
    const d = String(date).slice(0, 10);
    if (!dayMap.has(d)) {
      dayMap.set(d, { date: d, cash: 0, card: 0, revenue: 0, disbursements: 0 });
    }
    const row = dayMap.get(d);
    row[key] = (row[key] || 0) + amount;
  };
  settlements.forEach((r) => {
    const d = r.business_date || r.settlement_date;
    bump(d, "cash", safeNum(r.cash_sales));
    bump(d, "card", safeNum(r.card_sales));
    bump(d, "revenue", safeNum(r.cash_sales) + safeNum(r.card_sales));
  });
  driverPayouts.filter((r) => r.status === "paid").forEach((r) =>
    bump(r.payout_date, "disbursements", safeNum(r.total_payout))
  );
  payrollRecords.filter((r) => r.status === "paid").forEach((r) =>
    bump(r.pay_period_end, "disbursements", safeNum(r.net_payout))
  );
  tipPayouts.filter((r) => r.status === "completed").forEach((r) =>
    bump(r.payout_date, "disbursements", safeNum(r.total_tips))
  );
  contractorPayouts.filter((r) => r.status === "paid").forEach((r) =>
    bump(r.payout_date, "disbursements", safeNum(r.total_payout))
  );
  const timeline = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  return {
    revenue: { cash_sales, card_sales, gross_revenue },
    disbursements: {
      driver: driver_disbursements,
      payroll: payroll_disbursements,
      tips: tip_disbursements,
      contractor: contractor_disbursements,
      total: total_disbursements,
    },
    outstanding: {
      driver_pending,
      payroll_pending,
      gb_face_value: gb_outstanding_face_value,
    },
    glyphbucks: {
      issued_face_value: gb_issued_face_value,
      issued_count: gb_issued_count,
      redeemed_face_value: gb_redeemed_face_value,
      redeemed_count: gb_redeemed_count,
      outstanding_face_value: gb_outstanding_face_value,
      redemption_rate: gb_redemption_rate,
    },
    comps: {
      total: comps_total,
      count: comps_count,
      by_reason: comps_by_reason,
    },
    net_position,
    timeline,
    _meta: {
      counts: {
        settlements: settlements.length,
        driverPayouts: driverPayouts.length,
        payrollRecords: payrollRecords.length,
        tipPayouts: tipPayouts.length,
        contractorPayouts: contractorPayouts.length,
        glyphBucksOrders: glyphBucksOrders.length,
        glyphBucksBills: glyphBucksBills.length,
        posTransactions: posTransactions.length,
        comps: comps_count,
      },
    },
  };
}

export const fmtUSD = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(safeNum(n));

export const fmtPct = (n) =>
  new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 }).format(safeNum(n));