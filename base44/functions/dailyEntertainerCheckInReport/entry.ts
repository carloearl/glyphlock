/**
 * dailyEntertainerCheckInReport
 *
 * Scheduled daily summary of entertainer check-in activity. Aggregates the
 * previous 24h of EntertainerShift + Entertainer records per venue and
 * emails the report to venue owners / platform admins.
 *
 * Invoked by a scheduled automation once per day. Can also be invoked
 * manually by an admin (auth-checked) for on-demand summaries.
 *
 * Payload (optional):
 *   { hours?: number,      // lookback window, default 24
 *     recipient?: string,  // override email address
 *     dryRun?: boolean }   // return report without sending
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Auth: allow scheduled invocations (no user) OR admin users only.
    let isScheduled = false;
    let user: any = null;
    try {
      user = await base44.auth.me();
    } catch {
      isScheduled = true;
    }
    if (!isScheduled && user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const hours = Number(body?.hours) > 0 ? Number(body.hours) : 24;
    const dryRun = !!body?.dryRun;
    const overrideRecipient = typeof body?.recipient === 'string' ? body.recipient : null;

    const nowMs = Date.now();
    const cutoffIso = new Date(nowMs - hours * 3600_000).toISOString();

    // Pull recent shifts + roster (service role — this is admin reporting).
    const [shifts, entertainers] = await Promise.all([
      base44.asServiceRole.entities.EntertainerShift.list('-check_in_time', 500),
      base44.asServiceRole.entities.Entertainer.list('-created_date', 500),
    ]);

    const rosterById: Record<string, any> = {};
    for (const e of entertainers) rosterById[e.id] = e;

    const recentShifts = shifts.filter((s: any) => {
      const t = s.check_in_time || s.created_date;
      return t && t >= cutoffIso;
    });

    // Aggregate per-venue
    const perVenue: Record<string, {
      checkedIn: any[];
      stillActive: any[];
      totalMinutes: number;
    }> = {};

    for (const s of recentShifts) {
      const v = s.venue_id || 'unknown';
      if (!perVenue[v]) perVenue[v] = { checkedIn: [], stillActive: [], totalMinutes: 0 };
      const ent = rosterById[s.entertainer_id] || {};
      const row = {
        stage_name: ent.stage_name || '(unknown)',
        check_in: s.check_in_time,
        check_out: s.check_out_time,
        location: s.location || '—',
        status: s.status,
        earnings: Number(s.shift_earnings || 0),
        vip_sessions: Number(s.vip_sessions || 0),
      };
      perVenue[v].checkedIn.push(row);
      if (!s.check_out_time) perVenue[v].stillActive.push(row);
      if (s.check_in_time) {
        const end = s.check_out_time ? new Date(s.check_out_time).getTime() : nowMs;
        const start = new Date(s.check_in_time).getTime();
        if (end > start) perVenue[v].totalMinutes += Math.round((end - start) / 60_000);
      }
    }

    const venueIds = Object.keys(perVenue);
    const summary = {
      window_hours: hours,
      generated_at: new Date().toISOString(),
      venue_count: venueIds.length,
      total_check_ins: recentShifts.length,
      still_active: recentShifts.filter((s: any) => !s.check_out_time).length,
    };

    // Build email HTML
    const rowsHtml = venueIds.map((vid) => {
      const g = perVenue[vid];
      const activeRows = g.stillActive.map((r) =>
        `<tr>
          <td style="padding:6px 10px;border-bottom:1px solid #eee">${escapeHtml(r.stage_name)}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee">${fmtTime(r.check_in)}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee">${escapeHtml(r.location)}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee">${escapeHtml(r.status || '—')}</td>
        </tr>`
      ).join('');
      const activeTable = g.stillActive.length
        ? `<table style="width:100%;border-collapse:collapse;font-size:13px;margin:8px 0 16px">
            <thead><tr style="background:#f8fafc">
              <th align="left" style="padding:6px 10px">Stage Name</th>
              <th align="left" style="padding:6px 10px">Checked In</th>
              <th align="left" style="padding:6px 10px">Location</th>
              <th align="left" style="padding:6px 10px">Status</th>
            </tr></thead>
            <tbody>${activeRows}</tbody>
          </table>`
        : `<div style="color:#64748b;font-size:13px;padding:8px 0 16px">No entertainers currently on the floor.</div>`;

      return `
        <div style="margin-bottom:24px;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px">
          <div style="font-weight:700;font-size:15px;color:#0f172a">Venue: ${escapeHtml(vid)}</div>
          <div style="color:#475569;font-size:12px;margin-bottom:8px">
            ${g.checkedIn.length} check-ins · ${g.stillActive.length} still active · ${g.totalMinutes} floor minutes
          </div>
          ${activeTable}
        </div>`;
    }).join('');

    const html = `
      <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:720px;margin:0 auto;color:#0f172a">
        <h2 style="margin:0 0 4px">Entertainer Check-In · Daily Summary</h2>
        <div style="color:#64748b;font-size:13px;margin-bottom:16px">
          Last ${hours}h · Generated ${new Date(summary.generated_at).toLocaleString('en-US')}
        </div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px">
          <div style="flex:1;min-width:140px;background:#f1f5f9;border-radius:8px;padding:10px 14px">
            <div style="font-size:11px;text-transform:uppercase;color:#64748b;letter-spacing:0.08em">Total Check-Ins</div>
            <div style="font-size:22px;font-weight:800">${summary.total_check_ins}</div>
          </div>
          <div style="flex:1;min-width:140px;background:#ecfccb;border-radius:8px;padding:10px 14px">
            <div style="font-size:11px;text-transform:uppercase;color:#4d7c0f;letter-spacing:0.08em">Still Active</div>
            <div style="font-size:22px;font-weight:800;color:#365314">${summary.still_active}</div>
          </div>
          <div style="flex:1;min-width:140px;background:#f1f5f9;border-radius:8px;padding:10px 14px">
            <div style="font-size:11px;text-transform:uppercase;color:#64748b;letter-spacing:0.08em">Venues</div>
            <div style="font-size:22px;font-weight:800">${summary.venue_count}</div>
          </div>
        </div>
        ${rowsHtml || '<div style="color:#64748b">No entertainer activity in this window.</div>'}
        <div style="color:#94a3b8;font-size:11px;margin-top:18px">
          Automated by NUPS · Do not reply. Manage recipients in Venue Settings.
        </div>
      </div>`;

    // Determine recipients — override, else all admin users
    let recipients: string[] = [];
    if (overrideRecipient) {
      recipients = [overrideRecipient];
    } else {
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
      recipients = admins.map((u: any) => u.email).filter(Boolean);
    }

    if (dryRun) {
      return Response.json({ ok: true, dryRun: true, summary, recipients, htmlPreview: html.slice(0, 2000) });
    }

    if (recipients.length === 0) {
      return Response.json({ ok: true, summary, warning: 'no recipients configured' });
    }

    const subject = `Entertainer Check-In Summary — ${summary.still_active} active · ${summary.total_check_ins} check-ins (${hours}h)`;
    let sent = 0;
    for (const to of recipients) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to, subject, body: html, from_name: 'NUPS Daily Report',
        });
        sent += 1;
      } catch (e) {
        console.error('SendEmail failed for', to, e?.message);
      }
    }

    return Response.json({ ok: true, summary, sent, recipient_count: recipients.length });
  } catch (error) {
    console.error('dailyEntertainerCheckInReport error:', error);
    return Response.json({ error: (error as any)?.message || 'unknown error' }, { status: 500 });
  }
});

function fmtTime(iso?: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }); }
  catch { return iso; }
}
function escapeHtml(s: any) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]!));
}