import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Audit Digest Mailer — called by the "Nightly Site Guardian" workflow.
 * Reads the SiteAudit record + SIE scan status, and emails all admin users
 * a prioritized digest when Critical/High findings exist. Quiet nights are
 * skipped (no noise). READ-ONLY: never modifies site content.
 */

const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Automation scheduler runs with no user session — auth.me() may throw.
    let user = null;
    try { user = await base44.auth.me(); } catch (_) { /* automation path */ }
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }
    const db = base44.asServiceRole;

    const body = await req.json().catch(() => ({}));
    const { audit_id, scan_status, scan_id } = body;

    // Load audit findings
    let audit = null;
    if (audit_id) {
      const audits = await db.entities.SiteAudit.filter({ id: audit_id });
      audit = audits[0] || null;
    }

    const allFindings = audit ? [
      ...(audit.security_findings || []).map(f => ({ ...f, area: 'Security' })),
      ...(audit.performance_findings || []).map(f => ({ ...f, area: 'Performance' })),
      ...(audit.seo_findings || []).map(f => ({ ...f, area: 'SEO' })),
      ...(audit.ux_findings || []).map(f => ({ ...f, area: 'UX' })),
    ] : [];

    const urgent = allFindings
      .filter(f => f.severity === 'critical' || f.severity === 'high')
      .sort((a, b) => (SEV_ORDER[a.severity] ?? 9) - (SEV_ORDER[b.severity] ?? 9));

    const scanCritical = scan_status === 'critical';

    // Quiet night — nothing urgent, no email spam.
    if (urgent.length === 0 && !scanCritical) {
      return Response.json({ ok: true, skipped: 'no_critical_findings', total_findings: allFindings.length, overall_score: audit?.overall_score ?? null });
    }

    // Build digest body
    const lines = [];
    lines.push('GLYPHLOCK NIGHTLY SITE GUARDIAN — ACTION REQUIRED');
    lines.push('');
    if (audit) lines.push(`Overall site score: ${audit.overall_score ?? 'n/a'}/100 · ${allFindings.length} total findings`);
    if (scan_id) lines.push(`SIE integrity scan: ${scan_status?.toUpperCase() || 'unknown'} (scan ${scan_id})`);
    lines.push('');
    lines.push(`URGENT FINDINGS (${urgent.length}):`);
    for (const f of urgent.slice(0, 15)) {
      lines.push('');
      lines.push(`[${(f.severity || '').toUpperCase()}] ${f.area} — ${f.title || f.category || 'Finding'}`);
      if (f.file_path) lines.push(`  Where: ${f.file_path}${f.line_number ? `:${f.line_number}` : ''}`);
      if (f.description) lines.push(`  Issue: ${f.description}`);
      if (f.recommendation) lines.push(`  Fix: ${f.recommendation}`);
    }
    if (urgent.length > 15) lines.push(`\n…and ${urgent.length - 15} more urgent findings in the audit record.`);
    lines.push('');
    lines.push('Review the full report in the Site Audit dashboard. No changes were made automatically.');

    // Email every admin user
    const admins = await db.entities.User.filter({ role: 'admin' });
    let sent = 0;
    for (const admin of admins) {
      await db.integrations.Core.SendEmail({
        to: admin.email,
        subject: `🚨 Site Guardian: ${urgent.length} urgent finding${urgent.length === 1 ? '' : 's'}${scanCritical ? ' + integrity scan CRITICAL' : ''}`,
        body: lines.join('\n'),
        from_name: 'GlyphLock Site Guardian'
      });
      sent++;
    }

    return Response.json({ ok: true, urgent_count: urgent.length, emails_sent: sent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});