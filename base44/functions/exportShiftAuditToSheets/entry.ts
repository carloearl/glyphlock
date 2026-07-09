import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// End-of-shift audit export — builds a CSV ledger of the night's driver
// payouts + entertainer check-ins and uploads it to the connected Google
// Drive, converted into a native Google Sheet.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Manager/Admin only — this is an audit surface.
    let allowed = user.role === 'admin';
    if (!allowed) {
      const matches = await base44.asServiceRole.entities.NUPSUser.filter({ created_by: user.email });
      const nupsRole = String((matches || [])[0]?.role || '').toUpperCase();
      allowed = ['MANAGER', 'VENUE_MANAGER', 'ADMIN', 'OWNER', 'VENUE_OWNER', 'PLATFORM_ADMIN', 'SOVEREIGN', 'BOOKKEEPER'].includes(nupsRole);
    }
    if (!allowed) return Response.json({ error: 'Forbidden — manager or admin required' }, { status: 403 });

    const { venue_id, date } = await req.json().catch(() => ({}));
    // Shift date (YYYY-MM-DD) — defaults to today.
    const shiftDate = date || new Date().toISOString().slice(0, 10);
    const dayStart = `${shiftDate}T00:00:00`;
    const dayEnd = `${shiftDate}T23:59:59`;

    // ---- Gather driver payouts for the shift ----
    const payoutQuery = { session_date: shiftDate };
    if (venue_id) payoutQuery.venue_id = venue_id;
    const payouts = await base44.asServiceRole.entities.DriverPayout.filter(payoutQuery, '-created_date', 500);

    // ---- Gather entertainer check-ins for the shift ----
    const shiftQuery = { check_in_time: { $gte: dayStart, $lte: dayEnd } };
    if (venue_id) shiftQuery.venue_id = venue_id;
    const shifts = await base44.asServiceRole.entities.EntertainerShift.filter(shiftQuery, '-check_in_time', 500);

    // Resolve entertainer names for the check-in rows.
    const entertainerIds = [...new Set(shifts.map(s => s.entertainer_id).filter(Boolean))];
    const nameById = {};
    for (const id of entertainerIds) {
      try {
        const e = await base44.asServiceRole.entities.Entertainer.get(id);
        nameById[id] = e?.stage_name || id;
      } catch { nameById[id] = id; }
    }

    // ---- Build CSV ----
    const esc = (v) => {
      const s = v === null || v === undefined ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const row = (cells) => cells.map(esc).join(',');
    const lines = [];

    lines.push(row([`NUPS SHIFT AUDIT LEDGER — ${shiftDate}`]));
    lines.push(row([`Exported by`, user.email, `Exported at`, new Date().toISOString()]));
    lines.push('');

    lines.push(row(['DRIVER PAYOUTS']));
    lines.push(row(['Driver', 'Driver #', 'Total Drops', 'VIP Count', 'Base Payout', 'Incentive Bonus', 'VIP Kickback', 'Total Payout', 'Payout Status', 'Processed By', 'Processed At', 'Notes']));
    let payoutTotal = 0;
    for (const p of payouts) {
      payoutTotal += Number(p.total_payout || 0);
      lines.push(row([
        p.driver_name, p.driver_number, p.total_drops || 0, p.vip_count || 0,
        (p.base_payout || 0).toFixed(2), (p.incentive_bonus || 0).toFixed(2),
        (p.vip_kickback || 0).toFixed(2), (p.total_payout || 0).toFixed(2),
        p.payout_status || p.status || '', p.processed_by || '', p.processed_at || '', p.notes || '',
      ]));
    }
    lines.push(row(['TOTAL DRIVER PAYOUTS', '', '', '', '', '', '', payoutTotal.toFixed(2)]));
    lines.push('');

    lines.push(row(['ENTERTAINER CHECK-INS']));
    lines.push(row(['Stage Name', 'Check-In Time', 'Check-Out Time', 'Status', 'Location', 'Shift Earnings', 'VIP Sessions']));
    for (const s of shifts) {
      lines.push(row([
        nameById[s.entertainer_id] || s.entertainer_id, s.check_in_time || '', s.check_out_time || '',
        s.status || '', s.location || '', (s.shift_earnings || 0).toFixed(2), s.vip_sessions || 0,
      ]));
    }
    lines.push(row(['TOTAL CHECK-INS', shifts.length]));

    const csv = lines.join('\r\n');

    // ---- Upload to Google Drive, converted to a native Google Sheet ----
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googledrive');
    const boundary = '----NUPSShiftAuditBoundary';
    const metadata = JSON.stringify({
      name: `NUPS Shift Audit — ${shiftDate}`,
      mimeType: 'application/vnd.google-apps.spreadsheet',
    });
    const body =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}` +
      `\r\n--${boundary}\r\nContent-Type: text/csv\r\n\r\n${csv}\r\n--${boundary}--`;

    const uploadResponse = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Google Drive upload error:', errorText);
      return Response.json({ error: 'Google Sheets export failed', details: errorText }, { status: 500 });
    }

    const sheet = await uploadResponse.json();
    return Response.json({
      success: true,
      sheet_id: sheet.id,
      sheet_name: sheet.name,
      sheet_url: sheet.webViewLink,
      driver_payout_count: payouts.length,
      driver_payout_total: payoutTotal,
      checkin_count: shifts.length,
    });
  } catch (error) {
    console.error('Shift audit export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});