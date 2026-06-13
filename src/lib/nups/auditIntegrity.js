/**
 * Audit Integrity Analyzer — pure functions, no I/O.
 * Detects:
 *   1. COVERAGE GAPS — critical actions that occurred but never produced an ActivityLog entry
 *   2. ANOMALIES   — suspicious patterns in existing log entries (timing, bursts, off-hours)
 *
 * Critical actions tracked (BPAAA §11.4):
 *   • DailySettlement.status === 'LOCKED' → must have SETTLEMENT_RUN or CONFIG_CHANGE log
 *   • DriverPayout.payout_status === 'PROCESSED' → must have PAYOUT_TOGGLE log
 *   • GlyphBucksOrder.glyphbucks_value >= 500 → must have ≥1 audit entry
 */

const safe = (v) => (v == null ? "" : String(v));

function indexLogsByEntity(activityLogs) {
  const map = new Map();
  for (const log of activityLogs) {
    if (!log.entity_affected) continue;
    const arr = map.get(log.entity_affected) || [];
    arr.push(log);
    map.set(log.entity_affected, arr);
  }
  return map;
}

export function analyzeAuditCoverage({
  activityLogs = [],
  settlements = [],
  driverPayouts = [],
  glyphBucksOrders = [],
} = {}) {
  const logsByEntity = indexLogsByEntity(activityLogs);
  const gaps = [];

  // 1. Locked settlements
  for (const s of settlements) {
    if (s.status !== "LOCKED") continue;
    const key = `DailySettlement:${s.id}`;
    const logs = logsByEntity.get(key) || [];
    const hasLockLog = logs.some(
      (l) =>
        l.action_type === "SETTLEMENT_RUN" ||
        (l.action_type === "CONFIG_CHANGE" && /lock/i.test(safe(l.notes)))
    );
    if (!hasLockLog) {
      gaps.push({
        kind: "missing_lock_log",
        entity: "DailySettlement",
        record_id: s.id,
        identifier: s.business_date || s.settlement_date || "—",
        severity: "high",
        message: `Settlement LOCKED by ${s.locked_by || "?"} — no SETTLEMENT_RUN audit entry`,
        ts: s.locked_at,
      });
    }
  }

  // 2. Processed driver payouts
  for (const p of driverPayouts) {
    const processed = p.payout_status === "PROCESSED" || p.status === "paid";
    if (!processed) continue;
    const key = `DriverPayout:${p.id}`;
    const logs = logsByEntity.get(key) || [];
    const hasToggleLog = logs.some((l) => l.action_type === "PAYOUT_TOGGLE");
    if (!hasToggleLog) {
      gaps.push({
        kind: "missing_payout_log",
        entity: "DriverPayout",
        record_id: p.id,
        identifier: `${p.driver_name || "?"} · ${p.session_date || "?"}`,
        severity: "critical",
        message: `Payout processed (${(p.total_payout || 0).toFixed(2)}) — no PAYOUT_TOGGLE entry`,
        ts: p.processed_at || p.paid_at,
      });
    }
  }

  // 3. High-value GlyphBucks orders
  for (const o of glyphBucksOrders) {
    if ((o.glyphbucks_value || 0) < 500) continue;
    const key = `GlyphBucksOrder:${o.id}`;
    const logs = logsByEntity.get(key) || [];
    if (logs.length === 0) {
      gaps.push({
        kind: "missing_gb_log",
        entity: "GlyphBucksOrder",
        record_id: o.id,
        identifier: o.order_number || o.id,
        severity: "medium",
        message: `High-value GB order ($${o.glyphbucks_value}) — zero audit entries`,
        ts: o.signed_at || o.created_date,
      });
    }
  }

  return gaps;
}

export function analyzeAnomalies(activityLogs = []) {
  const anomalies = [];
  const sorted = [...activityLogs]
    .filter((l) => l.timestamp)
    .sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));

  const SENSITIVE = new Set(["UPDATE", "DELETE", "PAYOUT_TOGGLE", "CONFIG_CHANGE"]);

  // 1. Off-hours sensitive actions (03:00–06:00 local)
  for (const log of sorted) {
    const d = new Date(log.timestamp);
    if (isNaN(d)) continue;
    const hour = d.getHours();
    if (hour >= 3 && hour < 6 && SENSITIVE.has(log.action_type)) {
      anomalies.push({
        kind: "after_hours",
        severity: "medium",
        log_id: log.log_id || log.id,
        timestamp: log.timestamp,
        user: log.user_email,
        message: `${log.action_type} on ${log.entity_affected || "?"} at ${String(hour).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
      });
    }
  }

  // 2. Action bursts — same user, ≥6 actions inside 10s
  const userTimes = new Map();
  for (const log of sorted) {
    const t = new Date(log.timestamp).getTime();
    if (!log.user_email || isNaN(t)) continue;
    const arr = userTimes.get(log.user_email) || [];
    arr.push(t);
    userTimes.set(log.user_email, arr);
  }
  for (const [user, times] of userTimes) {
    times.sort((a, b) => a - b);
    for (let i = 5; i < times.length; i++) {
      const window = times[i] - times[i - 5];
      if (window < 10_000) {
        anomalies.push({
          kind: "action_burst",
          severity: "low",
          user,
          timestamp: new Date(times[i]).toISOString(),
          message: `${user}: 6 actions within ${(window / 1000).toFixed(1)}s — possible script/automation`,
        });
        break;
      }
    }
  }

  // 3. Long time gaps (>24h between consecutive entries)
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].timestamp).getTime();
    const curr = new Date(sorted[i].timestamp).getTime();
    if (isNaN(prev) || isNaN(curr)) continue;
    const gap = curr - prev;
    if (gap > 24 * 3600 * 1000) {
      anomalies.push({
        kind: "time_gap",
        severity: "low",
        timestamp: sorted[i].timestamp,
        message: `${(gap / 3600_000).toFixed(1)}h gap in log stream`,
        from: sorted[i - 1].timestamp,
        to: sorted[i].timestamp,
      });
    }
  }

  return anomalies;
}

export function computeCoverageScore({
  settlements = [],
  driverPayouts = [],
  glyphBucksOrders = [],
  gaps = [],
}) {
  const total =
    settlements.filter((s) => s.status === "LOCKED").length +
    driverPayouts.filter((p) => p.payout_status === "PROCESSED" || p.status === "paid").length +
    glyphBucksOrders.filter((o) => (o.glyphbucks_value || 0) >= 500).length;
  if (total === 0) return { score: 1, total, covered: 0, missing: 0 };
  const missing = gaps.length;
  const covered = Math.max(0, total - missing);
  return { score: covered / total, total, covered, missing };
}

export function summarizeBySeverity(items = []) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const it of items) {
    if (counts[it.severity] != null) counts[it.severity]++;
  }
  return counts;
}