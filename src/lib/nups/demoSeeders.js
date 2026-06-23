/**
 * demoSeeders.js — per-section demo data factories.
 *
 * Every section that uses <DemoSeedControl /> imports its `seed` + `clear`
 * pair from here. All demo rows are tagged so they can be wiped without
 * touching real records:
 *
 *   • POSTransaction.notes      starts with  "[DEMO]"
 *   • DriverProfile.notes       starts with  "[DEMO]"
 *   • GuestProfile.notes        starts with  "[DEMO]"
 *   • DriverPayout.notes        starts with  "[DEMO]"
 *
 * Clearing filters on `notes` prefix so we never delete real rows.
 */
import { base44 } from "@/api/base44Client";

const DEMO_TAG = "[DEMO]";
const todayISO = () => new Date().toISOString().slice(0, 10);

// ── Venue Performance / Today's Summary ─────────────────────────────────
export async function seedVenuePerformance() {
  const venues = [
    { id: "DEMO_VENUE_NORTH", name: "North Club" },
    { id: "DEMO_VENUE_SOUTH", name: "South Club" },
    { id: "DEMO_VENUE_VIP",   name: "VIP Lounge" },
  ];
  const rows = [];
  const now = Date.now();
  venues.forEach((v, vi) => {
    const txCount = 6 + vi * 3;
    for (let i = 0; i < txCount; i++) {
      const total = 50 + Math.floor(Math.random() * 400);
      const cash = Math.random() > 0.5 ? total : 0;
      const card = cash === 0 ? total : 0;
      rows.push({
        transaction_id: `DEMO-${v.id}-${i}`,
        items: [{ product_name: v.name + " Cover", quantity: 1, price: total, total }],
        subtotal: total,
        tax: 0,
        total,
        cash_sales: cash,
        card_sales: card,
        payment_method: cash ? "Cash" : "Credit Card",
        status: "completed",
        station: "door",
        mode: "REAL",
        validation_run: false,
        funds_settled: true,
        venue_id: v.id,
        cashier_name: "Demo Cashier",
        notes: `${DEMO_TAG} venue-performance`,
        created_date: new Date(now - Math.floor(Math.random() * 6 * 3600 * 1000)).toISOString(),
      });
    }
  });
  await base44.entities.POSTransaction.bulkCreate(rows);
}

export async function clearVenuePerformance() {
  const all = await base44.entities.POSTransaction.list("-created_date", 500);
  const demoIds = all
    .filter((t) => (t.notes || "").startsWith(DEMO_TAG))
    .map((t) => t.id);
  for (const id of demoIds) {
    await base44.entities.POSTransaction.delete(id);
  }
}

// ── Drivers ─────────────────────────────────────────────────────────────
export async function seedDrivers() {
  const drivers = [
    { name: "Demo Driver — Mike",   phone: "555-0101", affiliated: true },
    { name: "Demo Driver — Sarah",  phone: "555-0102", affiliated: true },
    { name: "Demo Driver — Outside Tom", phone: "555-0103", affiliated: false },
  ];
  for (const d of drivers) {
    await base44.entities.DriverProfile.create({
      driver_id: `DEMO-DRV-${Math.random().toString(36).slice(2, 8)}`,
      venue_id: "DEMO_VENUE_001",
      name: d.name,
      phone: d.phone,
      affiliated: d.affiliated,
      status: "active",
      notes: `${DEMO_TAG} driver-roster`,
    });
  }
}

export async function clearDrivers() {
  const all = await base44.entities.DriverProfile.list("-created_date", 500);
  const demoIds = all
    .filter((d) => (d.notes || "").startsWith(DEMO_TAG))
    .map((d) => d.id);
  for (const id of demoIds) await base44.entities.DriverProfile.delete(id);
}

// ── Guests ──────────────────────────────────────────────────────────────
export async function seedGuests() {
  const guests = [
    { first: "Robert",  last: "Spender",  dob: "1985-06-15" },
    { first: "Anthony", last: "Platinum", dob: "1980-09-30" },
    { first: "James",   last: "Walker",   dob: "1990-11-22" },
  ];
  for (const g of guests) {
    await base44.entities.GuestProfile.create({
      guest_id: `DEMO-GST-${Math.random().toString(36).slice(2, 10)}`,
      venue_id: "DEMO_VENUE_001",
      first_name: g.first,
      last_name: g.last,
      dob: g.dob,
      license_state: "AZ",
      age_verified: true,
      visit_count: 1,
      status: "active",
      first_visit_at: new Date().toISOString(),
      last_visit_at: new Date().toISOString(),
      notes: `${DEMO_TAG} guest-roster`,
    });
  }
}

export async function clearGuests() {
  const all = await base44.entities.GuestProfile.list("-created_date", 500);
  const demoIds = all
    .filter((g) => (g.notes || "").startsWith(DEMO_TAG))
    .map((g) => g.id);
  for (const id of demoIds) await base44.entities.GuestProfile.delete(id);
}

// ── Driver Payouts ──────────────────────────────────────────────────────
export async function seedDriverPayouts() {
  const today = todayISO();
  const payouts = [
    { name: "Demo Driver — Mike",  drops: 5, total: 150 },
    { name: "Demo Driver — Sarah", drops: 3, total: 90  },
    { name: "Demo Driver — Tom",   drops: 2, total: 40  },
  ];
  for (const p of payouts) {
    await base44.entities.DriverPayout.create({
      driver_name: p.name,
      driver_number: "555-0000",
      driver_code: `DEMO-${Math.random().toString(36).slice(2, 8)}`,
      session_date: today,
      total_drops: p.drops,
      total_payout: p.total,
      status: "open",
      payout_status: "PENDING",
      notes: `${DEMO_TAG} driver-payouts`,
    });
  }
}

export async function clearDriverPayouts() {
  const all = await base44.entities.DriverPayout.list("-created_date", 500);
  const demoIds = all
    .filter((p) => (p.notes || "").startsWith(DEMO_TAG))
    .map((p) => p.id);
  for (const id of demoIds) await base44.entities.DriverPayout.delete(id);
}