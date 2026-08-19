/**
 * Pure settlement breakdown aggregator — no I/O, no mutation.
 *
 * Locked rules (BPAAA v3.0 / DACO):
 *   • total_sales = cash + card ONLY
 *   • GlyphBucks face value is a stored-value LIABILITY, never revenue
 *   • Payouts (driver / dancer / staff / tips) are DISBURSEMENTS, never sale reductions
 *   • Gross stays on the books; comps are an accounting GAP
 */

const num = (v) => Number(v) || 0;

const CASH = ["cash"];
const CARD = ["credit card", "debit card", "card", "credit_card", "debit_card", "digital wallet"];

function tenderOf(t) {
  const pm = (t.payment_method || "").toLowerCase();
  if (CASH.includes(pm)) return "cash";
  if (CARD.includes(pm)) return "card";
  return "other";
}

function emptyStation() {
  return { count: 0, gross: 0, cash: 0, card: 0, units: 0, comp: 0 };
}

function addTxn(bucket, t) {
  bucket.count += 1;
  bucket.gross += num(t.total);
  bucket.cash += num(t.cash_sales) || (tenderOf(t) === "cash" ? num(t.total) : 0);
  bucket.card += num(t.card_sales) || (tenderOf(t) === "card" ? num(t.total) : 0);
  bucket.comp += num(t.comp_amount);
  (t.items || []).forEach((i) => { bucket.units += num(i.quantity); });
}

/**
 * @param transactions POSTransaction rows already scoped to venue + business date
 * @param products     POSProduct catalogue for the venue (so unsold items show as 0)
 */
export function buildSettlementBreakdown({
  transactions = [],
  products = [],
  driverPayouts = [],
  contractorPayouts = [],
  payrollRecords = [],
  tipPayouts = [],
} = {}) {
  const live = transactions.filter((t) => t.status !== "void" && t.validation_run !== true);

  const stations = { door: emptyStation(), bar: emptyStation(), vip: emptyStation(), other: emptyStation() };
  const fees = { tax: 0, processing_fee: 0, service_fee: 0, tips: 0, discounts: 0 };
  const glyphbucks = { issued_count: 0, issued_face_value: 0 };
  const itemMap = new Map();

  live.forEach((t) => {
    const station = ["door", "bar", "vip"].includes(t.station) ? t.station : "other";
    addTxn(stations[station], t);

    fees.tax += num(t.tax);
    fees.processing_fee += num(t.processing_fee);
    fees.service_fee += num(t.service_fee);
    fees.tips += num(t.tip);
    fees.discounts += num(t.discount);

    if (num(t.gb_liability) > 0) {
      glyphbucks.issued_count += 1;
      glyphbucks.issued_face_value += num(t.gb_liability);
    }

    (t.items || []).forEach((i) => {
      const key = i.product_id || i.product_name || "unknown";
      const row = itemMap.get(key) || {
        key,
        product_id: i.product_id || null,
        name: i.product_name || "Unnamed item",
        category: null,
        quantity: 0,
        gross: 0,
        stations: new Set(),
      };
      row.quantity += num(i.quantity);
      row.gross += num(i.total) || num(i.price) * num(i.quantity);
      row.stations.add(station);
      itemMap.set(key, row);
    });
  });

  // Merge the full product catalogue so every drink / bottle appears even when
  // nothing sold tonight (shown as 0 / n/a rather than silently missing).
  products.forEach((p) => {
    const key = p.id || p.product_id || p.name;
    const byId = itemMap.get(p.product_id) || itemMap.get(p.id) || itemMap.get(p.name);
    if (byId) {
      byId.name = byId.name || p.name;
      byId.category = p.category || byId.category;
      return;
    }
    if (!itemMap.has(key)) {
      itemMap.set(key, {
        key,
        product_id: p.product_id || p.id,
        name: p.name || "Unnamed product",
        category: p.category || null,
        quantity: 0,
        gross: 0,
        stations: new Set(),
      });
    }
  });

  const items = Array.from(itemMap.values())
    .map((r) => ({ ...r, stations: Array.from(r.stations) }))
    .sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name));

  const gross_sales = stations.door.gross + stations.bar.gross + stations.vip.gross + stations.other.gross;
  const cash_sales = stations.door.cash + stations.bar.cash + stations.vip.cash + stations.other.cash;
  const card_sales = stations.door.card + stations.bar.card + stations.vip.card + stations.other.card;
  const total_sales = cash_sales + card_sales;

  const paidDriver = driverPayouts.filter((r) => r.status === "paid" || r.payout_status === "PROCESSED");
  const pendingDriver = driverPayouts.filter((r) => !(r.status === "paid" || r.payout_status === "PROCESSED"));
  const paidDancer = contractorPayouts.filter((r) => r.status === "paid");
  const paidPayroll = payrollRecords.filter((r) => r.status === "paid");
  const paidTips = tipPayouts.filter((r) => r.status === "completed");

  const payouts = {
    driver: paidDriver.reduce((s, r) => s + num(r.total_payout), 0),
    driver_pending: pendingDriver.reduce((s, r) => s + num(r.total_payout), 0),
    driver_count: paidDriver.length,
    dancer: paidDancer.reduce((s, r) => s + num(r.total_payout), 0),
    dancer_count: paidDancer.length,
    staff: paidPayroll.reduce((s, r) => s + num(r.net_payout), 0),
    staff_count: paidPayroll.length,
    tips: paidTips.reduce((s, r) => s + num(r.total_tips), 0),
    tips_count: paidTips.length,
  };
  payouts.total = payouts.driver + payouts.dancer + payouts.staff + payouts.tips;

  // Guests through the door — cover units rung at the door station.
  const guests = stations.door.units;

  return {
    guests,
    stations,
    items,
    fees,
    glyphbucks,
    payouts,
    totals: {
      gross_sales,
      cash_sales,
      card_sales,
      total_sales,
      // Net of every disbursement paid out of the drawer tonight.
      net_after_payouts: total_sales - payouts.total,
      door_net_after_drivers: stations.door.gross - payouts.driver,
      comps: stations.door.comp + stations.bar.comp + stations.vip.comp + stations.other.comp,
    },
  };
}

export const usd = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num(n));