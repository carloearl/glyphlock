/**
 * DACO-20260611 — Driver Payout Audit PDF Export
 *
 * Generates a BPAAA v3.0 compliance-grade PDF containing:
 *   - Filter context (date range, driver, venue, status)
 *   - One row per matching DriverPayout with full payload snapshot
 *   - Linked ActivityLog before/after values (PAYOUT_TOGGLE)
 *   - SHA-256 integrity hash of the report body
 *
 * Manager-gated. Logs an EXPORT action to ActivityLog.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { jsPDF } from 'npm:jspdf@2.5.1';

const MANAGER_ROLES = ['admin', 'PLATFORM_ADMIN', 'VENUE_OWNER', 'VENUE_MANAGER'];

async function sha256Hex(str) {
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function money(n) { return `$${Number(n || 0).toFixed(2)}`; }
function safe(v) { return (v == null || v === '') ? '—' : String(v); }

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const role = user._highestRole || user.role || 'External';
    if (!MANAGER_ROLES.includes(role)) {
      return Response.json({ error: 'Manager role required' }, { status: 403 });
    }

    const body = req.method === 'POST' ? await req.json() : {};
    const { payout_ids = [], filters = {}, venue_id = null } = body;

    // 1. Load matching payouts (service role for full audit reach)
    const allPayouts = await base44.asServiceRole.entities.DriverPayout.list('-session_date', 1000);
    const payouts = payout_ids.length
      ? allPayouts.filter(p => payout_ids.includes(p.id))
      : allPayouts;

    // 2. Load ActivityLog PAYOUT_TOGGLE entries for the matched payouts
    const allLogs = await base44.asServiceRole.entities.ActivityLog.list('-timestamp', 2000);
    const toggleLogs = allLogs.filter(l =>
      l.action_type === 'PAYOUT_TOGGLE' &&
      payouts.some(p => l.entity_affected === `DriverPayout:${p.id}`)
    );

    // 3. Build PDF
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 40;
    let y = margin;

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 60, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('NUPS — Driver Payout Audit Report', margin, 30);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('BPAAA v3.0 Compliance Document · DACO-20260611', margin, 46);
    y = 80;

    // Meta block
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    const meta = [
      `Generated: ${new Date().toISOString()}`,
      `Requested by: ${user.email} (${role})`,
      `Venue scope: ${safe(venue_id) || 'ALL'}`,
      `Filter context: ${JSON.stringify(filters)}`,
      `Records: ${payouts.length} payouts · ${toggleLogs.length} audit events`,
    ];
    meta.forEach(line => { doc.text(line, margin, y); y += 12; });
    y += 8;

    // Body rows
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageW - margin, y);
    y += 14;

    const sumProcessed = payouts.filter(p => (p.payout_status || 'PENDING') === 'PROCESSED').reduce((s, p) => s + (Number(p.total_payout) || 0), 0);
    const sumPending = payouts.filter(p => (p.payout_status || 'PENDING') === 'PENDING').reduce((s, p) => s + (Number(p.total_payout) || 0), 0);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`Totals:  PROCESSED ${money(sumProcessed)}   ·   PENDING ${money(sumPending)}`, margin, y);
    y += 20;

    for (const p of payouts) {
      if (y > pageH - 140) { doc.addPage(); y = margin; }

      // Payout header
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y - 12, pageW - margin * 2, 22, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`${safe(p.driver_name)}  ·  ${safe(p.session_date)}  ·  ${money(p.total_payout)}`, margin + 6, y + 3);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(8);
      doc.text(`Status: ${safe(p.payout_status || 'PENDING')}   ID: ${p.id}`, pageW - margin - 220, y + 3);
      y += 22;

      // Payout details
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(8);
      const lines = [
        `Driver #: ${safe(p.driver_number)}   Code: ${safe(p.driver_code)}   Venue: ${safe(p.venue_id)}`,
        `Drops: ${safe(p.total_drops)}   VIP: ${safe(p.vip_count)}   Pass: ${safe(p.pass_count)}`,
        `Base: ${money(p.base_payout)}   Bonus: ${money(p.incentive_bonus)}   VIP Kickback: ${money(p.vip_kickback)}   Total: ${money(p.total_payout)}`,
        `Processed by: ${safe(p.processed_by)}   At: ${safe(p.processed_at)}`,
      ];
      lines.forEach(l => { doc.text(l, margin + 6, y); y += 11; });

      // Linked audit events
      const events = toggleLogs.filter(l => l.entity_affected === `DriverPayout:${p.id}`);
      if (events.length) {
        y += 4;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(`Audit trail (${events.length}):`, margin + 6, y);
        y += 11;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        for (const ev of events) {
          if (y > pageH - 80) { doc.addPage(); y = margin; }
          const before = JSON.stringify(ev.before_value || {});
          const after = JSON.stringify(ev.after_value || {});
          doc.text(`• ${ev.timestamp}  ${ev.user_email}  (${ev.user_role || '—'})`, margin + 12, y); y += 10;
          doc.text(`  BEFORE: ${before.slice(0, 110)}`, margin + 12, y); y += 10;
          doc.text(`  AFTER:  ${after.slice(0, 110)}`, margin + 12, y); y += 10;
          if (ev.notes) { doc.text(`  Notes: ${String(ev.notes).slice(0, 110)}`, margin + 12, y); y += 10; }
        }
      }

      y += 8;
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y, pageW - margin, y);
      y += 12;
    }

    // Integrity hash + footer on last page
    const bodyDigest = await sha256Hex(JSON.stringify({ payouts, toggleLogs }));
    if (y > pageH - 60) { doc.addPage(); y = margin; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('Integrity SHA-256:', margin, y); y += 10;
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.text(bodyDigest, margin, y); y += 14;

    // Page numbers
    const total = doc.internal.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text(`Page ${i} of ${total} · NUPS Audit Export · ${bodyDigest.slice(0, 12)}`, margin, pageH - 18);
    }

    // 4. Log the EXPORT action
    await base44.asServiceRole.entities.ActivityLog.create({
      log_id: `log_${Date.now()}_export_payout_pdf`,
      timestamp: new Date().toISOString(),
      user_email: user.email,
      user_role: role,
      action_type: 'EXPORT',
      entity_affected: 'DriverPayout:BULK',
      venue_id: venue_id || null,
      mode: 'REAL',
      notes: `payout_audit_pdf rows=${payouts.length} events=${toggleLogs.length} sha256=${bodyDigest.slice(0, 16)}`,
    });

    const pdfBytes = doc.output('arraybuffer');
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="payout-audit-${new Date().toISOString().slice(0,10)}.pdf"`,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});