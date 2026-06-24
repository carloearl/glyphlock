/**
 * BPAA-NUPS-AUDIT-001 §7 — Self-audit + trend derivations.
 *
 * READ-ONLY over AuditEvent and existing authoritative entities. These
 * functions never mutate business data. When they detect anomalies they may
 * emit a SelfAuditAlert AuditEvent (which itself is non-financial, so the
 * §3.1 invariant doesn't gate it).
 *
 * §0.11 — observational only. Revenue, totals, balances, and payouts come
 * from authoritative entities. These queries explain reality, they don't
 * redefine it.
 *
 * All queries are venue-scoped via venue_id and filter mode === 'real' for
 * production reporting. Pass mode='demo' explicitly for sandbox/demo views.
 */

import { base44 } from '@/api/base44Client';
import { emitAuditEvent } from './auditEventEmitter';

/* ───────────────────────────── HELPERS ───────────────────────────── */

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

async function listAuditEvents({ venue_id, mode = 'real', event_type, since, limit = 500 }) {
  if (!venue_id) return [];
  const q = { venue_id, mode };
  if (event_type) q.event_type = event_type;
  // base44 filter doesn't accept range operators reliably for date-time on
  // every tenant — fetch and filter `since` client-side, capped by `limit`.
  const rows = await base44.entities.AuditEvent.filter(q, '-timestamp', limit);
  if (!since) return rows;
  const sinceMs = new Date(since).getTime();
  return rows.filter((r) => new Date(r.timestamp).getTime() >= sinceMs);
}

/* ────────────────────── §3.1 INVARIANT SWEEP ────────────────────── */

/**
 * Scans recent financial AuditEvents and surfaces any row whose
 * financial_context violates §3.1. Returns the list and (optionally)
 * emits a SelfAuditAlert per violation.
 */
export async function sweepFinancialInvariant({ venue_id, mode = 'real', limit = 1000, emit = false }) {
  const rows = await listAuditEvents({ venue_id, mode, limit });
  const violations = [];

  for (const r of rows) {
    const fc = r.financial_context;
    if (!fc) continue;
    const expected = num(fc.cash_portion) + num(fc.card_portion);
    const impact = num(fc.total_sales_impact);
    if (Math.abs(impact - expected) > 0.01) {
      violations.push({
        id: r.id,
        event_type: r.event_type,
        timestamp: r.timestamp,
        expected,
        got: impact,
      });
      if (emit) {
        await emitAuditEvent({
          venue_id, mode,
          event_type: 'SelfAuditAlert',
          event_category: 'system',
          severity: 'critical',
          source: 'system',
          session_id: `sweep_${r.id}`,
          entity_type: 'AuditEvent',
          entity_id: r.id,
          reason: `financial_invariant_violation: expected ${expected}, got ${impact}`,
          alert: true,
          notes: { source_row: r.id, fc },
          retention_class: 'compliance',
          audit_depth: 1, // prevent recursion when sweep is invoked from another audit path
        });
      }
    }
  }
  return { scanned: rows.length, violations };
}

/* ───────────────── DRIVER CREDIT vs GUEST ENTRY ─────────────────── */

/**
 * Every DriverCredit must tie to a GuestEntry in the same session (§4).
 * Returns any DriverCredit AuditEvents missing a matching GuestEntry.
 */
export async function findUnmatchedDriverCredits({ venue_id, mode = 'real', limit = 500 }) {
  const credits = await listAuditEvents({ venue_id, mode, event_type: 'DriverCredit', limit });
  if (credits.length === 0) return [];
  const entries = await listAuditEvents({ venue_id, mode, event_type: 'GuestEntry', limit: 2000 });
  const guestSessions = new Set(entries.map((e) => e.session_id));
  return credits.filter((c) => !guestSessions.has(c.session_id));
}

/* ───────────────────── TREND DERIVATIONS ──────────────────────── */

/**
 * Hourly heat map of sales-impacting events (DoorSale + paid mixed/cash/card).
 * Returns [{ hour: 0..23, count, total_sales_impact }].
 */
export async function hourlyHeatMap({ venue_id, mode = 'real', since, limit = 2000 }) {
  const rows = await listAuditEvents({ venue_id, mode, since, limit });
  const buckets = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0, total_sales_impact: 0 }));
  for (const r of rows) {
    const fc = r.financial_context;
    if (!fc) continue;
    const h = new Date(r.timestamp).getHours();
    if (h < 0 || h > 23) continue;
    buckets[h].count += 1;
    buckets[h].total_sales_impact += num(fc.total_sales_impact);
  }
  return buckets;
}

/**
 * Top entity actors ranked by event count (e.g. top drivers by DriverCredit).
 * Generic so it works for any event_type.
 */
export async function topByEntity({ venue_id, mode = 'real', event_type, since, limit = 500, topN = 10 }) {
  const rows = await listAuditEvents({ venue_id, mode, event_type, since, limit });
  const tally = new Map();
  for (const r of rows) {
    const key = r.entity_id || 'unknown';
    const cur = tally.get(key) || { entity_id: key, count: 0, total_sales_impact: 0 };
    cur.count += 1;
    cur.total_sales_impact += num(r.financial_context?.total_sales_impact);
    tally.set(key, cur);
  }
  return Array.from(tally.values()).sort((a, b) => b.count - a.count).slice(0, topN);
}

/**
 * Trend rollup for a given event_type: count and summed gross by day.
 * Used for comp trend, discount trend, payout trend, etc.
 */
export async function trendByDay({ venue_id, mode = 'real', event_type, since, limit = 2000 }) {
  const rows = await listAuditEvents({ venue_id, mode, event_type, since, limit });
  const tally = new Map();
  for (const r of rows) {
    const day = (r.timestamp || '').slice(0, 10);
    if (!day) continue;
    const cur = tally.get(day) || { day, count: 0, gross: 0, total_sales_impact: 0 };
    cur.count += 1;
    cur.gross += num(r.financial_context?.gross_value);
    cur.total_sales_impact += num(r.financial_context?.total_sales_impact);
    tally.set(day, cur);
  }
  return Array.from(tally.values()).sort((a, b) => (a.day < b.day ? -1 : 1));
}

/* ────────────────── §8 PERFORMANCE PROXIES ──────────────────── */

/**
 * Derives app-measurable performance proxies from AuditEvent volume only.
 * Per §8: NO host CPU/memory/disk metrics. NEVER stored as a new entity —
 * just computed on demand.
 */
export async function performanceProxies({ venue_id, mode = 'real', since, limit = 2000 }) {
  const rows = await listAuditEvents({ venue_id, mode, since, limit });
  const sinceMs = since ? new Date(since).getTime() : null;
  const windowMin = sinceMs ? Math.max(1, (Date.now() - sinceMs) / 60000) : 60;

  let errors = 0;
  let alerts = 0;
  for (const r of rows) {
    if (r.event_type === 'SystemError') errors += 1;
    if (r.event_type === 'SelfAuditAlert') alerts += 1;
  }
  return {
    event_volume: rows.length,
    transactions_per_minute: rows.length / windowMin,
    system_error_count: errors,
    self_audit_alert_count: alerts,
  };
}