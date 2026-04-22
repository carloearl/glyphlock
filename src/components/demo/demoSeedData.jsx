/**
 * demoSeedData.js — Deterministic seeded values for CommandCenterDemo.
 * NEVER reads from Dream Palace production entities.
 * venue_id is intentionally "demo-venue-one" (not real Dream Palace).
 */
export const DEMO_VENUE_ID = "demo-venue-one";
export const DEMO_VENUE_NAME = "Demo Venue One";

// Tonight's seeded figures (cash + card ONLY — GlyphBucks excluded from total_sales)
export const DEMO_SEED = {
  batch: {
    status: "OPEN",
    opened_at: "2026-04-22T19:00:00Z",
    opened_display: "Opened 7:00 PM",
    opening_cash: 1500,
  },
  cash_sales: 3240,
  card_sales: 8760,
  get total_sales() {
    return this.cash_sales + this.card_sales; // = 12000 — cash + card only
  },
  cash_position: 4740, // opening_cash + cash_sales = drawer
  vip_rooms_active: 3,
  vip_rooms_total: 6,
  pending_contracts: 2,
  alerts: [
    { id: "a1", severity: "warn", message: "VIP Room 3 contract pending signature" },
    { id: "a2", severity: "info", message: "Bar float below $200 — top-up recommended" },
  ],
  glyphbucks_liability: 450, // tracked in notes only — NOT in total_sales
};

export const fmtUSD = (n) =>
  `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;