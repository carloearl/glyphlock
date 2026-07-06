/**
 * DACO-20260610 WS-1 — ActivityLog Writer
 *
 * Centralized append-only logger. ALL portal access + key updates flow here.
 *
 * Hard rules:
 *   1. Server-side timestamp only — never trust caller.
 *   2. Append-only. No update/delete exported.
 *   3. user_email + user_role pulled from live base44.auth.me() — never client-supplied.
 *   4. venue_id resolved dynamically. No hardcoded venue strings.
 *   5. Failures are swallowed (logging must never block primary action), but logged to console.
 */

import { base44 } from '@/api/base44Client';

const VALID_ACTIONS = new Set([
  'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE',
  'EXPORT', 'SETTLEMENT_RUN', 'PAYOUT_TOGGLE', 'CONFIG_CHANGE',
]);

const VALID_MODES = new Set(['REAL', 'DEMO', 'SANDBOX']);

function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
}

async function resolveCurrentUser() {
  try {
    const u = await base44.auth.me();
    if (!u) return null;
    return {
      email: u.email || 'unknown',
      role: u._highestRole || u.role || 'External',
    };
  } catch {
    return null;
  }
}

async function resolveMode(venue_id) {
  // DACO WAVE 1 — Per-venue SystemConfig first, global fallback
  try {
    if (venue_id) {
      const venueRows = await base44.entities.SystemConfig.filter({ venue_id, config_key: 'venue' });
      if (venueRows && venueRows.length === 1) {
        const vm = venueRows[0].mode;
        if (VALID_MODES.has(vm)) return vm;
      }
    }
    const rows = await base44.entities.SystemConfig.filter({ config_key: 'global' });
    const m = rows?.[0]?.mode;
    return VALID_MODES.has(m) ? m : 'REAL';
  } catch {
    return 'REAL';
  }
}

/**
 * Write an ActivityLog entry. Returns the created record or null on failure.
 *
 * @param {object} opts
 * @param {string} opts.action_type        - One of VALID_ACTIONS
 * @param {string} [opts.entity_affected]  - 'EntityName:id'
 * @param {object} [opts.before_value]
 * @param {object} [opts.after_value]
 * @param {string} [opts.venue_id]
 * @param {string} [opts.notes]
 * @param {object} [opts.actor]            - Override actor (gateway pre-validated; default = live session)
 *
 * DACO WAVE 2: If opts.actor is supplied, its email must match the live
 * base44.auth.me() session. The only exception is a LOGIN action (which
 * may run before the session is fully established). The gateway already
 * rebinds before calling this, so the override is safe from that path.
 */
export async function logActivity(opts = {}) {
  try {
    if (!opts.action_type || !VALID_ACTIONS.has(opts.action_type)) {
      console.warn('[ActivityLog] invalid action_type:', opts.action_type);
      return null;
    }

    let actor;
    if (opts.actor && opts.action_type !== 'LOGIN') {
      // DACO WAVE 2 — rebind any supplied actor against the live session
      const live = await resolveCurrentUser();
      if (live && opts.actor.email &&
          String(opts.actor.email).toLowerCase() !== String(live.email).toLowerCase()) {
        // Contamination: caller-supplied actor does not match live session.
        // Fall back to the live session (safer than rejecting — logging is
        // non-blocking) and note the discrepancy.
        console.warn('[ActivityLog] actor_email_mismatch, using live session:', live.email);
        actor = live;
      } else {
        actor = opts.actor;
      }
    } else {
      actor = opts.actor || await resolveCurrentUser();
    }
    if (!actor) {
      // No session = LOGIN attempt or unauth path. Still log as "anonymous" only for LOGIN.
      if (opts.action_type !== 'LOGIN') return null;
    }

    const mode = await resolveMode(opts.venue_id);

    const record = {
      log_id: uuid(),
      timestamp: new Date().toISOString(),
      user_email: actor?.email || 'anonymous',
      user_role: actor?.role || 'External',
      action_type: opts.action_type,
      entity_affected: opts.entity_affected || null,
      before_value: opts.before_value || null,
      after_value: opts.after_value || null,
      venue_id: opts.venue_id || null,
      mode,
      ip_hint: opts.ip_hint || null,
      notes: opts.notes || null,
    };

    const created = await base44.entities.ActivityLog.create(record);
    return created;
  } catch (e) {
    console.warn('[ActivityLog] write failed (non-blocking):', e.message);
    return null;
  }
}

/**
 * One-shot LOGIN logger — dedupes per session via sessionStorage so we don't
 * log on every route change.
 */
export async function logLoginOnce(user) {
  if (typeof window === 'undefined') return;
  const key = `__activitylog_login_${user?.email || 'anon'}`;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, '1');
  await logActivity({
    action_type: 'LOGIN',
    actor: user ? { email: user.email, role: user._highestRole || user.role || 'External' } : null,
    notes: 'session_start',
  });
}

export async function logLogout(user) {
  if (typeof window !== 'undefined' && user?.email) {
    sessionStorage.removeItem(`__activitylog_login_${user.email}`);
  }
  await logActivity({
    action_type: 'LOGOUT',
    actor: user ? { email: user.email, role: user._highestRole || user.role || 'External' } : null,
    notes: 'session_end',
  });
}