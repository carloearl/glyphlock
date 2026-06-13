/**
 * Pure analytics over ActivityLog rows.
 * Surfaces compliance signals — never mutates input.
 *
 * Anomaly rules (BPAAA v3.0 §11):
 *   A1. Non-LOGIN writes with user_email = 'anonymous' → identity gap
 *   A2. DELETE without before_value → unrecoverable change
 *   A3. Burst: same actor > BURST_THRESHOLD events in BURST_WINDOW_MIN
 *   A4. Off-hours admin actions (02:00–06:00 local) on critical entities
 *   A5. Mode mismatch: DEMO/SANDBOX writes inside a REAL business window
 */

export const CRITICAL_ACTIONS = new Set([
  "DELETE",
  "CONFIG_CHANGE",
  "PAYOUT_TOGGLE",
  "SETTLEMENT_RUN",
  "EXPORT",
]);

const BURST_THRESHOLD = 20;
const BURST_WINDOW_MIN = 5;

const parseT = (s) => {
  const t = Date.parse(s);
  return Number.isNaN(t) ? 0 : t;
};

export function analyzeAuditLogs(logs = [], { systemMode = "REAL" } = {}) {
  const now = Date.now();
  const dayMs = 86_400_000;
  const last24h = logs.filter((l) => parseT(l.timestamp) >= now - dayMs);
  const prior24h = logs.filter((l) => {
    const t = parseT(l.timestamp);
    return t < now - dayMs && t >= now - 2 * dayMs;
  });

  // Action breakdown
  const actionCounts = {};
  logs.forEach((l) => {
    actionCounts[l.action_type] = (actionCounts[l.action_type] || 0) + 1;
  });
  const actionBreakdown = Object.entries(actionCounts)
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count);

  // Top actors
  const actorCounts = {};
  logs.forEach((l) => {
    const k = l.user_email || "unknown";
    if (!actorCounts[k]) actorCounts[k] = { email: k, role: l.user_role, count: 0, critical: 0 };
    actorCounts[k].count += 1;
    if (CRITICAL_ACTIONS.has(l.action_type)) actorCounts[k].critical += 1;
  });
  const topActors = Object.values(actorCounts).sort((a, b) => b.count - a.count).slice(0, 8);

  // Critical events (most recent first, top 25)
  const criticalEvents = logs
    .filter((l) => CRITICAL_ACTIONS.has(l.action_type))
    .sort((a, b) => parseT(b.timestamp) - parseT(a.timestamp))
    .slice(0, 25);

  // Anomaly findings
  const findings = [];

  // A1 — anonymous writes
  const anonWrites = logs.filter(
    (l) => l.action_type !== "LOGIN" && (!l.user_email || l.user_email === "anonymous")
  );
  if (anonWrites.length) {
    findings.push({
      code: "A1",
      severity: "high",
      title: "Identity gap: anonymous writes",
      count: anonWrites.length,
      description: "Write actions logged without a resolved actor identity.",
      sample: anonWrites.slice(0, 3),
    });
  }

  // A2 — DELETE without before_value
  const unsafeDeletes = logs.filter(
    (l) => l.action_type === "DELETE" && (!l.before_value || Object.keys(l.before_value).length === 0)
  );
  if (unsafeDeletes.length) {
    findings.push({
      code: "A2",
      severity: "high",
      title: "Deletes missing before-state snapshot",
      count: unsafeDeletes.length,
      description: "Hard deletes without before_value are unrecoverable for audit replay.",
      sample: unsafeDeletes.slice(0, 3),
    });
  }

  // A3 — burst detection
  const bursts = [];
  Object.values(actorCounts).forEach((a) => {
    const actorEvents = logs
      .filter((l) => l.user_email === a.email)
      .map((l) => parseT(l.timestamp))
      .sort((x, y) => x - y);
    for (let i = 0; i < actorEvents.length; i++) {
      let j = i;
      while (j < actorEvents.length && actorEvents[j] - actorEvents[i] <= BURST_WINDOW_MIN * 60_000) j++;
      const span = j - i;
      if (span >= BURST_THRESHOLD) {
        bursts.push({ email: a.email, count: span, started_at: new Date(actorEvents[i]).toISOString() });
        i = j;
      }
    }
  });
  if (bursts.length) {
    findings.push({
      code: "A3",
      severity: "medium",
      title: "Burst activity detected",
      count: bursts.length,
      description: `≥${BURST_THRESHOLD} events from one actor inside a ${BURST_WINDOW_MIN}-minute window.`,
      sample: bursts.slice(0, 3),
    });
  }

  // A4 — off-hours critical actions
  const offHoursCritical = logs.filter((l) => {
    if (!CRITICAL_ACTIONS.has(l.action_type)) return false;
    const d = new Date(l.timestamp);
    const h = d.getHours();
    return h >= 2 && h < 6;
  });
  if (offHoursCritical.length) {
    findings.push({
      code: "A4",
      severity: "medium",
      title: "Off-hours critical actions",
      count: offHoursCritical.length,
      description: "Critical actions executed between 02:00 and 06:00 local time.",
      sample: offHoursCritical.slice(0, 3),
    });
  }

  // A5 — mode mismatch
  const mismatched = logs.filter((l) => l.mode && l.mode !== systemMode);
  if (mismatched.length) {
    findings.push({
      code: "A5",
      severity: "low",
      title: `Mode mismatch (system = ${systemMode})`,
      count: mismatched.length,
      description: "Log entries written under a different mode than current system mode.",
      sample: mismatched.slice(0, 3),
    });
  }

  // Volume delta
  const delta = last24h.length - prior24h.length;
  const deltaPct = prior24h.length > 0 ? (delta / prior24h.length) * 100 : 0;

  // Integrity score (0–100): start at 100, subtract per finding weighted by severity
  const weights = { high: 15, medium: 7, low: 3 };
  const penalty = findings.reduce((s, f) => s + (weights[f.severity] || 0), 0);
  const integrityScore = Math.max(0, Math.min(100, 100 - penalty));

  return {
    totals: {
      all: logs.length,
      last24h: last24h.length,
      prior24h: prior24h.length,
      delta,
      deltaPct,
      critical: logs.filter((l) => CRITICAL_ACTIONS.has(l.action_type)).length,
    },
    actionBreakdown,
    topActors,
    criticalEvents,
    findings,
    integrityScore,
  };
}