// ============================================================
// VENUE RATE CONFIG RESOLVER — BPAAA v3.0 / DACO-FRONTDOOR-DRIVER
// ============================================================
// Single resolver for every dollar figure used at the door or in
// the driver payout engine. NEVER hardcode rates in components.
//
// Usage:
//   const rates = await loadVenueRates(venueId);
//   const cover = rates.cover_charge;          // dynamic, per-venue
//   const payout = computeDriverNetDue(rates, { guests, affiliated });
// ============================================================

import { base44 } from "@/api/base44Client";
import { writeEntity } from "@/lib/nups/writeEntity";

// Seed defaults — used ONLY when no VenueRateConfig record exists yet.
// First write to the entity supersedes these forever.
const SEED_DEFAULTS = {
  cover_charge: 20,
  house_fee: 20,
  glyphbucks_tender_enabled: false,
  reentry_charge: 10,
  card_discount: 10,
  vip_entry: 100,
  bottle_service_base: 250,
  two_drink_min: 25,
  late_night_fee: 15,
  friends_military: 10,
  driver_payout_affiliated: 30,
  driver_payout_outside: 20,
  driver_bonus_tiers: [],
  tax_rate: 0.08,
  cc_processing_fee_rate: 0.05, // 5% door card fee — cover charges are tax-exempt
  service_fee_pct: 0,            // 0 = disabled. e.g. 0.05 = 5% service fee line on receipt
  service_fee_label: "Service Fee",
  show_processing_fee: true,
  show_service_fee: false,
  payment_terminal_enabled: false,
  gift_card_enabled: false,
  room_tab_enabled: false,
  receipt_auto_prompt: true,
  receipt_print_copies: 1,
  receipt_legal_name: "",        // Legal entity name on receipt header (e.g. RAS Liberty Holding LLC)
  receipt_footer_text: "",
  receipt_tax_id: "",
  promo_card_amount: 5,          // door promo card ($X OFF) — counted via is_promo line items
  house_commission_rate: 0.40,
  mode: "REAL",
};

// In-memory cache (per page lifecycle) — keyed by venue_id.
const _cache = new Map();

export async function loadVenueRates(venueId) {
  if (!venueId) {
    // No venue resolved — return seed defaults but flag missing context
    return { ...SEED_DEFAULTS, _venue_id: null, _source: "seed_no_venue" };
  }
  if (_cache.has(venueId)) return _cache.get(venueId);

  try {
    const found = await base44.entities.VenueRateConfig.filter({ venue_id: venueId, active: true }, "-created_date", 1);
    if (found?.length > 0) {
      const merged = { ...SEED_DEFAULTS, ...found[0], _venue_id: venueId, _source: "entity" };
      _cache.set(venueId, merged);
      return merged;
    }
  } catch (e) {
    // Entity may not yet exist for this venue — fall through to seed
  }

  const fallback = { ...SEED_DEFAULTS, _venue_id: venueId, _source: "seed_fallback" };
  _cache.set(venueId, fallback);
  return fallback;
}

export function invalidateRateCache(venueId) {
  if (venueId) _cache.delete(venueId); else _cache.clear();
}

// Seed a config record for a venue if one is missing. Idempotent.
export async function ensureVenueRateConfig(venueId, venueName, actorEmail) {
  if (!venueId) return null;
  const existing = await base44.entities.VenueRateConfig.filter({ venue_id: venueId }, "-created_date", 1);
  if (existing?.length > 0) return existing[0];
  const me = await base44.auth.me().catch(() => null);
  const result = await writeEntity({
    entity: "VenueRateConfig",
    operation: "create",
    data: {
      ...SEED_DEFAULTS,
      venue_id: venueId,
      venue_name: venueName || "",
      last_edited_by: actorEmail || me?.email || "system",
      last_edited_at: new Date().toISOString(),
      notes: "Auto-seeded with defaults. Edit via Venue Settings.",
    },
    actor: { email: me?.email || actorEmail, id: me?.id, role: me?._highestRole || me?.role || "External" },
    venue_id: venueId,
    intent: "VENUE_RATE_CONFIG_AUTO_SEED",
  });
  if (!result?.ok) throw new Error(result?.block_reason || "Venue rate config seed was rejected.");
  const created = result.value;
  invalidateRateCache(venueId);
  return created;
}

// ─── Driver payout formula (parametric — NO hardcoded numbers) ──────────────
// NET_DUE = (COVER − CARD_DISC) × N  −  PAYOUT_PER_GUEST × N  ± BONUS_TIER
//
// All operands sourced from rates. Affiliated drivers get card_discount;
// outside drivers do not. Bonus tiers apply additively based on context.
export function computeDriverNetDue(rates, { guests, affiliated, bonusLabel = null }) {
  const N = Math.max(0, Number(guests) || 0);
  if (N === 0) return { net_due: 0, breakdown: { N: 0 } };

  const cover = Number(rates.cover_charge) || 0;
  const cardDisc = affiliated ? (Number(rates.card_discount) || 0) : 0;
  const perGuest = affiliated
    ? (Number(rates.driver_payout_affiliated) || 0)
    : (Number(rates.driver_payout_outside) || 0);

  const grossCover = (cover - cardDisc) * N;
  const driverShare = perGuest * N;

  // Bonus tier lookup — admin-defined; matched by label
  let bonus = 0;
  if (bonusLabel && Array.isArray(rates.driver_bonus_tiers)) {
    const tier = rates.driver_bonus_tiers.find(t => t?.label === bonusLabel);
    if (tier?.bonus_amount) bonus = Number(tier.bonus_amount) || 0;
  }

  const net_due = grossCover - driverShare + bonus;

  return {
    net_due,
    breakdown: {
      N,
      cover,
      card_discount: cardDisc,
      gross_cover_collected: grossCover,
      per_guest_payout: perGuest,
      driver_share: driverShare,
      bonus_label: bonusLabel,
      bonus_amount: bonus,
      affiliated,
    },
  };
}

// Pure driver-side payout (what the driver receives) — independent of cover collection
export function computeDriverPayoutAmount(rates, { guests, affiliated, bonusLabel = null }) {
  const N = Math.max(0, Number(guests) || 0);
  const perGuest = affiliated
    ? (Number(rates.driver_payout_affiliated) || 0)
    : (Number(rates.driver_payout_outside) || 0);
  let bonus = 0;
  if (bonusLabel && Array.isArray(rates.driver_bonus_tiers)) {
    const tier = rates.driver_bonus_tiers.find(t => t?.label === bonusLabel);
    if (tier?.bonus_amount) bonus = Number(tier.bonus_amount) || 0;
  }
  return (perGuest * N) + bonus;
}