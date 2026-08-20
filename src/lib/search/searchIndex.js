/**
 * Unified Cross-Entity Search
 * Pure scoring + adapter functions. No I/O.
 *
 * Each adapter:
 *   • Lists the fields searched (label + value)
 *   • Returns a normalized SearchResult { id, type, title, subtitle, fields[], score, deep_link, raw }
 *
 * Scoring (per matched field):
 *   exact match           → 100
 *   prefix match          → 70
 *   word boundary match   → 50
 *   substring match       → 25
 *   Field weight ×= 1.5 for primary identity fields (name, serial, id, date).
 */

const norm = (v) => String(v ?? "").toLowerCase().trim();
const safe = (v) => (v == null ? "" : String(v));

export const ENTITY_TYPES = {
  DriverPayout: { label: "Driver Payout", color: "yellow", icon: "Car" },
  DailySettlement: { label: "Settlement", color: "emerald", icon: "Banknote" },
  POSCustomer: { label: "Customer", color: "blue", icon: "User" },
  GuestProfile: { label: "Guest Profile", color: "blue", icon: "UserCheck" },
  Entertainer: { label: "Entertainer", color: "pink", icon: "Star" },
  DriverProfile: { label: "Driver Profile", color: "yellow", icon: "Car" },
  StaffApplication: { label: "Staff / Manager", color: "emerald", icon: "BadgeCheck" },
  GlyphBucksOrder: { label: "GB Order", color: "violet", icon: "Coins" },
  GlyphBucksBill: { label: "GB Bill", color: "violet", icon: "Banknote" },
  VenueContract: { label: "Contract", color: "amber", icon: "ScrollText" },
  ContractorPayout: { label: "Contractor Payout", color: "purple", icon: "DollarSign" },
  ActivityLog: { label: "Audit Log", color: "red", icon: "Shield" },
};

function scoreField(query, value, weight = 1) {
  const q = norm(query);
  const v = norm(value);
  if (!q || !v) return 0;
  if (v === q) return 100 * weight;
  if (v.startsWith(q)) return 70 * weight;
  const wordMatch = new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(v);
  if (wordMatch) return 50 * weight;
  if (v.includes(q)) return 25 * weight;
  return 0;
}

function makeResult({ type, id, title, subtitle, fields, deep_link, raw, score, ts }) {
  return { type, id, title, subtitle, fields, deep_link, raw, score, ts };
}

// ────────────────── ADAPTERS ──────────────────

function searchDriverPayouts(query, rows) {
  const out = [];
  for (const r of rows) {
    const score =
      scoreField(query, r.driver_name, 1.5) +
      scoreField(query, r.driver_number, 1.5) +
      scoreField(query, r.driver_code, 1.5) +
      scoreField(query, r.session_date, 1.2) +
      scoreField(query, r.payout_date, 1.0) +
      scoreField(query, r.payout_status, 0.5) +
      scoreField(query, r.notes, 0.5);
    if (score === 0) continue;
    out.push(
      makeResult({
        type: "DriverPayout",
        id: r.id,
        title: r.driver_name || "Unknown Driver",
        subtitle: `${r.session_date || "?"} · ${r.payout_status || r.status || "?"} · $${(r.total_payout || 0).toFixed(2)}`,
        fields: [
          { label: "Drops", value: r.total_drops || 0 },
          { label: "VIP", value: r.vip_count || 0 },
          { label: "Driver #", value: r.driver_number || "—" },
        ],
        deep_link: "/admin/payout-history",
        raw: r,
        score,
        ts: r.payout_date || r.session_date,
      })
    );
  }
  return out;
}

function searchSettlements(query, rows) {
  const out = [];
  for (const r of rows) {
    const score =
      scoreField(query, r.business_date, 1.5) +
      scoreField(query, r.settlement_date, 1.5) +
      scoreField(query, r.status, 1.0) +
      scoreField(query, r.batch_reference, 1.2) +
      scoreField(query, r.venue_id, 0.5);
    if (score === 0) continue;
    const total = (r.cash_sales || 0) + (r.card_sales || 0);
    out.push(
      makeResult({
        type: "DailySettlement",
        id: r.id,
        title: r.business_date || r.settlement_date || "Settlement",
        subtitle: `${r.status || "OPEN"} · Total $${total.toFixed(2)}`,
        fields: [
          { label: "Cash", value: `$${(r.cash_sales || 0).toFixed(2)}` },
          { label: "Card", value: `$${(r.card_sales || 0).toFixed(2)}` },
          { label: "Batch", value: r.batch_reference || "—" },
        ],
        deep_link: "/admin/settlement",
        raw: r,
        score,
        ts: r.business_date || r.settlement_date,
      })
    );
  }
  return out;
}

function searchCustomers(query, rows) {
  const out = [];
  for (const r of rows) {
    const score =
      scoreField(query, r.full_name, 1.5) +
      scoreField(query, r.email, 1.5) +
      scoreField(query, r.phone, 1.2) +
      scoreField(query, r.customer_id, 1.0) +
      scoreField(query, r.loyalty_tier, 0.5);
    if (score === 0) continue;
    out.push(
      makeResult({
        type: "POSCustomer",
        id: r.id,
        title: r.full_name || "Unnamed",
        subtitle: `${r.loyalty_tier || "Bronze"} · ${r.visit_count || 0} visits · $${(r.total_spent || 0).toFixed(2)} lifetime`,
        fields: [
          { label: "Email", value: r.email || "—" },
          { label: "Phone", value: r.phone || "—" },
        ],
        deep_link: null,
        raw: r,
        score,
      })
    );
  }
  return out;
}

function searchGuestProfiles(query, rows) {
  const out = [];
  for (const r of rows) {
    const name = [r.first_name, r.last_name].filter(Boolean).join(" ");
    const score = scoreField(query, name, 1.5) + scoreField(query, r.guest_id, 1.4) +
      scoreField(query, r.license_last4, 1.2) + scoreField(query, r.last_initial, 0.8) +
      scoreField(query, r.license_state, 0.5);
    if (!score) continue;
    out.push(makeResult({ type: "GuestProfile", id: r.id, title: name || "Guest profile",
      subtitle: `${r.status || "active"} · ${r.visit_count || 0} visits`,
      fields: [{ label: "DOB", value: r.dob || "MISSING" }, { label: "ID", value: r.license_last4 ? `•••• ${r.license_last4}` : "MISSING" }, { label: "Expires", value: r.id_expiration || "MISSING" }],
      deep_link: "/FrontDoor", raw: r, score, ts: r.last_visit_at }));
  }
  return out;
}

function searchDriverProfiles(query, rows) {
  const out = [];
  for (const r of rows) {
    const score = scoreField(query, r.name, 1.5) + scoreField(query, r.driver_id, 1.4) +
      scoreField(query, r.phone, 1.0) + scoreField(query, r.license_last4, 1.2) +
      scoreField(query, r.license_state, 0.5);
    if (!score) continue;
    out.push(makeResult({ type: "DriverProfile", id: r.id, title: r.name || "Driver profile",
      subtitle: `${r.driver_id || "ID pending"} · ${r.status || "active"}`,
      fields: [{ label: "DOB", value: r.date_of_birth || "MISSING" }, { label: "ID", value: r.license_last4 ? `•••• ${r.license_last4}` : "MISSING" }, { label: "Expires", value: r.license_expiration || "MISSING" }],
      deep_link: "/FrontDoor", raw: r, score, ts: r.last_active_at }));
  }
  return out;
}

function searchStaffApplications(query, rows) {
  const out = [];
  for (const r of rows) {
    const score = scoreField(query, r.full_legal_name, 1.5) + scoreField(query, r.preferred_name, 1.2) +
      scoreField(query, r.email, 1.4) + scoreField(query, r.phone, 1.0) +
      scoreField(query, r.employee_number, 1.4) + scoreField(query, r.position, 1.0);
    if (!score) continue;
    out.push(makeResult({ type: "StaffApplication", id: r.id,
      title: r.full_legal_name || r.preferred_name || "Staff application",
      subtitle: `${r.position || "role pending"} · ${r.status || "DRAFT"}`,
      fields: [{ label: "Email", value: r.email || "MISSING" }, { label: "DOB", value: r.date_of_birth || "MISSING" }, { label: "Employee #", value: r.employee_number || "NOT ISSUED" }],
      deep_link: "/ManagerConsole", raw: r, score, ts: r.updated_date || r.created_date }));
  }
  return out;
}

function searchEntertainers(query, rows) {
  const out = [];
  for (const r of rows) {
    const score =
      scoreField(query, r.stage_name, 1.5) +
      scoreField(query, r.legal_name, 1.2) +
      scoreField(query, r.email, 1.0) +
      scoreField(query, r.phone, 1.0) +
      scoreField(query, r.id, 0.8) +
      scoreField(query, r.license_number_last4, 1.4) +
      scoreField(query, r.license_state, 0.7);
    if (score === 0) continue;
    out.push(
      makeResult({
        type: "Entertainer",
        id: r.id,
        title: r.stage_name || r.legal_name || "Entertainer",
        subtitle: `${r.status || "—"}${r.legal_name ? ` · ${r.legal_name}` : ""}`,
        fields: [
          { label: "Email", value: r.email || "—" },
          { label: "Phone", value: r.phone || "—" },
        ],
        deep_link: null,
        raw: r,
        score,
      })
    );
  }
  return out;
}

function searchGBOrders(query, rows) {
  const out = [];
  for (const r of rows) {
    const score =
      scoreField(query, r.order_number, 1.5) +
      scoreField(query, r.customer_name, 1.5) +
      scoreField(query, r.customer_id_number, 1.2) +
      scoreField(query, r.purchaser_card_name, 1.0) +
      scoreField(query, r.card_last_four, 1.0) +
      scoreField(query, r.approval_code, 1.0);
    if (score === 0) continue;
    out.push(
      makeResult({
        type: "GlyphBucksOrder",
        id: r.id,
        title: r.order_number || r.id,
        subtitle: `${r.customer_name || "?"} · $${(r.glyphbucks_value || 0).toFixed(2)} face · ${r.status || "draft"}`,
        fields: [
          { label: "Total", value: `$${(r.grand_total || 0).toFixed(2)}` },
          { label: "Card", value: r.card_last_four ? `•••• ${r.card_last_four}` : "—" },
        ],
        deep_link: "/ContractLookup",
        raw: r,
        score,
        ts: r.signed_at || r.created_date,
      })
    );
  }
  return out;
}

function searchGBBills(query, rows) {
  const out = [];
  for (const r of rows) {
    const score =
      scoreField(query, r.serial_number, 1.5) +
      scoreField(query, r.barcode_number, 1.5) +
      scoreField(query, r.issued_to_customer, 1.0) +
      scoreField(query, r.status, 0.5);
    if (score === 0) continue;
    out.push(
      makeResult({
        type: "GlyphBucksBill",
        id: r.id,
        title: `Bill #${r.serial_number}`,
        subtitle: `$${r.denomination || 0} · ${r.status || "—"}${r.issued_to_customer ? ` · ${r.issued_to_customer}` : ""}`,
        fields: [
          { label: "Denomination", value: `$${r.denomination || 0}` },
          { label: "Status", value: r.status || "—" },
        ],
        deep_link: null,
        raw: r,
        score,
      })
    );
  }
  return out;
}

function searchContracts(query, rows) {
  const out = [];
  for (const r of rows) {
    const score =
      scoreField(query, r.contract_id, 1.5) +
      scoreField(query, r.customer_name, 1.5) +
      scoreField(query, r.entertainer_name, 1.2) +
      scoreField(query, r.customer_id_number, 1.0) +
      scoreField(query, r.approval_code, 0.8);
    if (score === 0) continue;
    out.push(
      makeResult({
        type: "VenueContract",
        id: r.id,
        title: r.contract_id || r.id,
        subtitle: `${r.contract_type || "?"} · ${r.customer_name || "?"} · $${(r.grand_total || r.contract_amount || 0).toFixed(2)}`,
        fields: [
          { label: "Status", value: r.status || "—" },
          { label: "Method", value: r.payment_method || "—" },
        ],
        deep_link: "/ContractLookup",
        raw: r,
        score,
        ts: r.signed_at || r.created_date,
      })
    );
  }
  return out;
}

function searchContractorPayouts(query, rows) {
  const out = [];
  for (const r of rows) {
    const score =
      scoreField(query, r.contractor_name, 1.5) +
      scoreField(query, r.payout_id, 1.2) +
      scoreField(query, r.payment_reference, 1.0) +
      scoreField(query, r.payout_type, 0.5) +
      scoreField(query, r.payout_date, 1.0);
    if (score === 0) continue;
    out.push(
      makeResult({
        type: "ContractorPayout",
        id: r.id,
        title: r.contractor_name || "Contractor",
        subtitle: `${r.payout_type || "?"} · ${r.payout_date || "?"} · $${(r.total_payout || 0).toFixed(2)}`,
        fields: [
          { label: "Method", value: r.payment_method || "—" },
          { label: "Status", value: r.status || "—" },
        ],
        deep_link: null,
        raw: r,
        score,
        ts: r.payout_date,
      })
    );
  }
  return out;
}

function searchActivityLogs(query, rows) {
  const out = [];
  for (const r of rows) {
    const score =
      scoreField(query, r.user_email, 1.2) +
      scoreField(query, r.action_type, 1.0) +
      scoreField(query, r.entity_affected, 1.5) +
      scoreField(query, r.notes, 0.8);
    if (score === 0) continue;
    out.push(
      makeResult({
        type: "ActivityLog",
        id: r.id || r.log_id,
        title: `${r.action_type} · ${r.entity_affected || "—"}`,
        subtitle: `${r.user_email || "?"} · ${r.user_role || "?"} · ${r.timestamp ? new Date(r.timestamp).toLocaleString() : "?"}`,
        fields: [
          { label: "Mode", value: r.mode || "—" },
          { label: "Venue", value: r.venue_id || "—" },
        ],
        deep_link: "/admin/activity-log",
        raw: r,
        score,
        ts: r.timestamp,
      })
    );
  }
  return out;
}

// ────────────────── ORCHESTRATOR ──────────────────

export function runSearch(query, datasets = {}, { types = null, limit = 50 } = {}) {
  if (!query || query.trim().length < 2) return [];
  const allowed = types ? new Set(types) : null;

  const all = [
    ...(allowed === null || allowed.has("DriverPayout") ? searchDriverPayouts(query, datasets.driverPayouts || []) : []),
    ...(allowed === null || allowed.has("DailySettlement") ? searchSettlements(query, datasets.settlements || []) : []),
    ...(allowed === null || allowed.has("POSCustomer") ? searchCustomers(query, datasets.customers || []) : []),
    ...(allowed === null || allowed.has("GuestProfile") ? searchGuestProfiles(query, datasets.guestProfiles || []) : []),
    ...(allowed === null || allowed.has("Entertainer") ? searchEntertainers(query, datasets.entertainers || []) : []),
    ...(allowed === null || allowed.has("DriverProfile") ? searchDriverProfiles(query, datasets.driverProfiles || []) : []),
    ...(allowed === null || allowed.has("StaffApplication") ? searchStaffApplications(query, datasets.staffApplications || []) : []),
    ...(allowed === null || allowed.has("GlyphBucksOrder") ? searchGBOrders(query, datasets.gbOrders || []) : []),
    ...(allowed === null || allowed.has("GlyphBucksBill") ? searchGBBills(query, datasets.gbBills || []) : []),
    ...(allowed === null || allowed.has("VenueContract") ? searchContracts(query, datasets.contracts || []) : []),
    ...(allowed === null || allowed.has("ContractorPayout") ? searchContractorPayouts(query, datasets.contractorPayouts || []) : []),
    ...(allowed === null || allowed.has("ActivityLog") ? searchActivityLogs(query, datasets.activityLogs || []) : []),
  ];

  return all.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function countByType(results = []) {
  const counts = {};
  for (const r of results) counts[r.type] = (counts[r.type] || 0) + 1;
  return counts;
}