/**
 * DACO-20260611 — Daily Compliance Email Digest
 *
 * Aggregates yesterday's DriverPayout + POSTransaction activity per venue and
 * emails a clean compliance-grade summary to the configured recipients.
 * Read-only — does not mutate ledger data. Writes one ActivityLog EXPORT entry
 * per send for the audit trail.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const MANAGER_ROLES = ['admin', 'PLATFORM_ADMIN', 'VENUE_OWNER', 'VENUE_MANAGER'];

function money(n) { return `$${Number(n || 0).toFixed(2)}`; }
function yesterdayISO() {
  const d = new Date(Date.now() - 86400000);
  return d.toISOString().slice(0, 10);
}

function buildHtmlBody({ date, venues }) {
  const rows = venues.map(v => `
    <tr>
      <td style="padding:8px;border:1px solid #e5e7eb;"><b>${v.venue_id}</b></td>
      <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${money(v.cash_sales)}</td>
      <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${money(v.card_sales)}</td>
      <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;"><b>${money(v.total_sales)}</b></td>
      <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${v.tx_count}</td>
      <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;color:#dc2626;">${money(v.driver_payouts_total)}</td>
      <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${v.payout_count}</td>
    </tr>
  `).join('');

  return `
    <div style="font-family:-apple-system,sans-serif;color:#0f172a;max-width:780px;margin:0 auto;">
      <div style="background:#0f172a;color:#fff;padding:18px 24px;border-radius:8px 8px 0 0;">
        <h2 style="margin:0;font-size:18px;">NUPS Daily Compliance Digest</h2>
        <p style="margin:4px 0 0;font-size:12px;opacity:0.8;">Business date: ${date} · BPAAA v3.0</p>
      </div>
      <div style="padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
        <p style="font-size:13px;color:#475569;">Below is the consolidated daily activity log for compliance records. Driver payouts are disbursements (money OUT) and are NOT included in <code>total_sales</code>.</p>
        <table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:12px;">
          <thead style="background:#f1f5f9;">
            <tr>
              <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Venue</th>
              <th style="padding:8px;border:1px solid #e5e7eb;text-align:right;">Cash</th>
              <th style="padding:8px;border:1px solid #e5e7eb;text-align:right;">Card</th>
              <th style="padding:8px;border:1px solid #e5e7eb;text-align:right;">Total Sales</th>
              <th style="padding:8px;border:1px solid #e5e7eb;text-align:right;">Tx</th>
              <th style="padding:8px;border:1px solid #e5e7eb;text-align:right;">Payouts</th>
              <th style="padding:8px;border:1px solid #e5e7eb;text-align:right;"># Payouts</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="7" style="padding:16px;text-align:center;color:#94a3b8;">No activity recorded.</td></tr>'}</tbody>
        </table>
        <p style="font-size:11px;color:#94a3b8;margin-top:16px;">Invariant enforced: total_sales = cash_sales + card_sales. GlyphBucks redemptions are tracked as liability and excluded from total_sales.</p>
      </div>
    </div>
  `;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && !MANAGER_ROLES.includes(user._highestRole || user.role || '')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const targetDate = body.date || yesterdayISO();

    const [allPayouts, allTx, limits] = await Promise.all([
      base44.asServiceRole.entities.DriverPayout.list('-session_date', 2000),
      base44.asServiceRole.entities.POSTransaction.list('-created_date', 2000),
      base44.asServiceRole.entities.PayoutSafetyLimit.list('-created_date', 200),
    ]);

    const payouts = allPayouts.filter(p => p.session_date === targetDate);
    const txs = allTx.filter(t => (t.created_date || '').slice(0, 10) === targetDate);

    // Per-venue rollup
    const venueMap = {};
    const ensure = (v) => (venueMap[v] = venueMap[v] || {
      venue_id: v, cash_sales: 0, card_sales: 0, total_sales: 0, tx_count: 0,
      driver_payouts_total: 0, payout_count: 0,
    });

    for (const t of txs) {
      const v = ensure(t.venue_id || 'unknown');
      const cash = Number(t.cash_amount || 0);
      const card = Number(t.card_amount || 0);
      v.cash_sales += cash;
      v.card_sales += card;
      v.total_sales += cash + card;
      v.tx_count += 1;
    }
    for (const p of payouts) {
      const v = ensure(p.venue_id || 'unknown');
      v.driver_payouts_total += Number(p.total_payout || 0);
      v.payout_count += 1;
    }

    const venues = Object.values(venueMap).sort((a, b) => b.total_sales - a.total_sales);

    // Collect recipient list (union of all venue digest emails)
    const recipients = new Set();
    for (const lim of limits) {
      if (lim.enabled === false) continue;
      (lim.compliance_digest_emails || []).forEach(e => e && recipients.add(e));
    }
    const recipientList = Array.from(recipients);

    if (!body.dry_run && recipientList.length === 0) {
      return Response.json({
        date: targetDate,
        sent: 0,
        warning: 'No compliance_digest_emails configured on any PayoutSafetyLimit. Email skipped.',
        summary: venues,
      });
    }

    const html = buildHtmlBody({ date: targetDate, venues });
    const subject = `NUPS Compliance Digest — ${targetDate}`;

    let sent = 0;
    if (!body.dry_run) {
      for (const to of recipientList) {
        try {
          await base44.integrations.Core.SendEmail({
            to, subject, body: html, from_name: 'NUPS Compliance',
          });
          sent++;
        } catch (_) { /* per-recipient failures don't kill the run */ }
      }

      await base44.asServiceRole.entities.ActivityLog.create({
        log_id: `log_${Date.now()}_compliance_digest`,
        timestamp: new Date().toISOString(),
        user_email: user?.email || 'system@nups.automation',
        user_role: 'SYSTEM',
        action_type: 'EXPORT',
        entity_affected: 'ComplianceDigest:DAILY',
        venue_id: null,
        mode: 'REAL',
        notes: `Daily compliance digest sent to ${sent}/${recipientList.length} recipients for ${targetDate}`,
      });
    }

    return Response.json({
      date: targetDate,
      recipients: recipientList.length,
      sent,
      venues_summarized: venues.length,
      summary: venues,
      preview_html: body.dry_run ? html : undefined,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});