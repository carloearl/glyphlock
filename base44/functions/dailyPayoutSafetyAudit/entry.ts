/**
 * DACO-20260611 — Daily Payout Safety Audit
 *
 * Scans yesterday's DriverPayout records against PayoutSafetyLimit thresholds.
 * For each breach: creates a SecurityAlert, logs an ActivityLog event, and emails
 * the configured notify_emails list. Admin-only direct invocation; scheduled
 * automation runs it nightly.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const MANAGER_ROLES = ['admin', 'PLATFORM_ADMIN', 'VENUE_OWNER', 'VENUE_MANAGER'];

function money(n) { return `$${Number(n || 0).toFixed(2)}`; }

function yesterdayISO() {
  const d = new Date(Date.now() - 86400000);
  return d.toISOString().slice(0, 10);
}

async function sendEmail(base44, to, subject, body) {
  if (!to || !to.length) return;
  for (const recipient of to) {
    try {
      await base44.integrations.Core.SendEmail({
        to: recipient,
        subject,
        body,
        from_name: 'NUPS Compliance',
      });
    } catch (_) { /* swallow per-recipient errors so one bad address doesn't kill the run */ }
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    // Allow scheduled automation (no user) OR manager-tier manual run
    if (user && !MANAGER_ROLES.includes(user._highestRole || user.role || '')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const targetDate = body.date || yesterdayISO();

    const [allPayouts, allLimits] = await Promise.all([
      base44.asServiceRole.entities.DriverPayout.list('-session_date', 2000),
      base44.asServiceRole.entities.PayoutSafetyLimit.list('-created_date', 200),
    ]);

    const payouts = allPayouts.filter(p => p.session_date === targetDate);
    const limitsByVenue = {};
    for (const lim of allLimits) {
      if (lim.enabled !== false) limitsByVenue[lim.venue_id] = lim;
    }
    const globalLimit = limitsByVenue['*'] || {
      max_single_payout_usd: 300,
      max_daily_driver_total_usd: 600,
      max_daily_venue_total_usd: 3000,
      notify_emails: [],
    };
    const resolveLimit = (venueId) => limitsByVenue[venueId] || globalLimit;

    // Aggregate per-driver and per-venue totals
    const driverDayTotals = {};   // key: `${venue}|${driver_number}` -> total
    const venueDayTotals = {};    // key: venue -> total
    for (const p of payouts) {
      const v = p.venue_id || 'unknown';
      const k = `${v}|${p.driver_number || p.driver_code || p.driver_name}`;
      driverDayTotals[k] = (driverDayTotals[k] || 0) + (Number(p.total_payout) || 0);
      venueDayTotals[v] = (venueDayTotals[v] || 0) + (Number(p.total_payout) || 0);
    }

    const breaches = [];

    // Single-payout breaches
    for (const p of payouts) {
      const lim = resolveLimit(p.venue_id);
      const cap = Number(lim.max_single_payout_usd ?? 300);
      const amt = Number(p.total_payout) || 0;
      if (amt > cap) {
        breaches.push({
          type: 'SINGLE_PAYOUT_OVER_CAP',
          severity: amt > cap * 1.5 ? 'critical' : 'high',
          venue_id: p.venue_id,
          driver: p.driver_name,
          amount: amt,
          cap,
          payout_id: p.id,
          notify_emails: lim.notify_emails || [],
        });
      }
    }

    // Per-driver-per-day breaches
    for (const [k, total] of Object.entries(driverDayTotals)) {
      const [venue_id, driverKey] = k.split('|');
      const lim = resolveLimit(venue_id);
      const cap = Number(lim.max_daily_driver_total_usd ?? 600);
      if (total > cap) {
        breaches.push({
          type: 'DRIVER_DAILY_OVER_CAP',
          severity: total > cap * 1.5 ? 'critical' : 'high',
          venue_id,
          driver: driverKey,
          amount: total,
          cap,
          notify_emails: lim.notify_emails || [],
        });
      }
    }

    // Per-venue-per-day breaches
    for (const [venue_id, total] of Object.entries(venueDayTotals)) {
      const lim = resolveLimit(venue_id);
      const cap = Number(lim.max_daily_venue_total_usd ?? 3000);
      if (total > cap) {
        breaches.push({
          type: 'VENUE_DAILY_OVER_CAP',
          severity: total > cap * 1.5 ? 'critical' : 'high',
          venue_id,
          amount: total,
          cap,
          notify_emails: lim.notify_emails || [],
        });
      }
    }

    // Write alerts + log + email
    for (const b of breaches) {
      const title = `Payout safety breach — ${b.type} (${b.venue_id || 'unknown'})`;
      const description = `Type: ${b.type}\nVenue: ${b.venue_id}\nDriver: ${b.driver || '—'}\nAmount: ${money(b.amount)}\nLimit: ${money(b.cap)}\nDate: ${targetDate}`;

      await base44.asServiceRole.entities.SecurityAlert.create({
        title,
        severity: b.severity,
        source: 'audit',
        description,
        status: 'new',
        notificationSent: false,
        metadata: { ...b, audit_date: targetDate },
      });

      await base44.asServiceRole.entities.ActivityLog.create({
        log_id: `log_${Date.now()}_safety_${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        user_email: user?.email || 'system@nups.automation',
        user_role: 'SYSTEM',
        action_type: 'CONFIG_CHANGE',
        entity_affected: b.payout_id ? `DriverPayout:${b.payout_id}` : `Venue:${b.venue_id}`,
        venue_id: b.venue_id || null,
        mode: 'REAL',
        after_value: b,
        notes: `Payout safety breach: ${b.type} — ${money(b.amount)} over ${money(b.cap)}`,
      });

      const emailSubject = `[NUPS ALERT] ${b.severity.toUpperCase()} — ${b.type}`;
      const emailBody = `A driver payout safety threshold was breached.\n\n${description}\n\nReview the payout history at /admin/payout-history`;
      await sendEmail(base44, b.notify_emails, emailSubject, emailBody);
    }

    return Response.json({
      date: targetDate,
      payouts_scanned: payouts.length,
      breaches_found: breaches.length,
      breaches,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});