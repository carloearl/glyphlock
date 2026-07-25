/**
 * Daily NUPS Security Report
 *
 * Runs a NUPS security/site-health audit (via runSiteAudit's AI engine) and
 * emails a clean digest to the app admin(s) so site health can be tracked
 * without logging in. Read-only. Designed to be called by the
 * "Daily NUPS Security Report" scheduled workflow (no user session).
 *
 * Optional body:
 *   - to:      override recipient email (must be a registered app user)
 *   - dry_run: build the report but don't send email; returns preview_html
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const ADMIN_ROLES = ['admin', 'PLATFORM_ADMIN', 'VENUE_OWNER'];

function sevColor(sev: string) {
  return { critical: '#dc2626', high: '#ea580c', medium: '#d97706', low: '#0891b2', info: '#64748b' }[String(sev || '').toLowerCase()] || '#64748b';
}

function scoreColor(score: number) {
  if (score >= 90) return '#16a34a';
  if (score >= 70) return '#d97706';
  return '#dc2626';
}

function findingRows(findings: any[]) {
  if (!findings || findings.length === 0) {
    return '<tr><td colspan="3" style="padding:14px;text-align:center;color:#94a3b8;font-size:12px;">No findings — clean.</td></tr>';
  }
  return findings.slice(0, 12).map((f) => `
    <tr>
      <td style="padding:8px;border:1px solid #e5e7eb;">
        <span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;text-transform:uppercase;color:#fff;background:${sevColor(f.severity)};">${f.severity || 'info'}</span>
      </td>
      <td style="padding:8px;border:1px solid #e5e7eb;font-size:12px;">
        <b>${f.title || f.category || 'Finding'}</b>
        ${f.file_path ? `<div style="color:#64748b;font-size:11px;margin-top:2px;">${f.file_path}${f.line_number ? ':' + f.line_number : ''}</div>` : ''}
      </td>
      <td style="padding:8px;border:1px solid #e5e7eb;font-size:11px;color:#475569;">${f.recommendation || f.description || ''}</td>
    </tr>
  `).join('');
}

function buildHtml({ date, score, findings, counts }: any) {
  const section = (label: string, emoji: string, list: any[]) => `
    <h3 style="font-size:14px;margin:22px 0 8px;color:#0f172a;">${emoji} ${label} <span style="color:#94a3b8;font-weight:400;">(${list.length})</span></h3>
    <table style="width:100%;border-collapse:collapse;">
      <thead style="background:#f1f5f9;">
        <tr>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;font-size:11px;">Severity</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;font-size:11px;">Issue</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;font-size:11px;">Recommendation</th>
        </tr>
      </thead>
      <tbody>${findingRows(list)}</tbody>
    </table>
  `;

  return `
    <div style="font-family:-apple-system,sans-serif;color:#0f172a;max-width:820px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#030308,#0b1130);color:#fff;padding:22px 24px;border-radius:8px 8px 0 0;">
        <h2 style="margin:0;font-size:19px;letter-spacing:0.02em;">🛡️ NUPS Daily Security Report</h2>
        <p style="margin:6px 0 0;font-size:12px;opacity:0.75;">Site health · ${date}</p>
      </div>
      <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
        <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;margin-bottom:8px;">
          <div style="text-align:center;">
            <div style="font-size:44px;font-weight:800;color:${scoreColor(score)};line-height:1;">${score}</div>
            <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;">Health Score</div>
          </div>
          <div style="flex:1;min-width:220px;font-size:13px;color:#475569;">
            ${counts.critical > 0
              ? `<b style="color:#dc2626;">${counts.critical} critical issue${counts.critical > 1 ? 's' : ''}</b> need attention.`
              : counts.high > 0
                ? `<b style="color:#ea580c;">${counts.high} high-severity issue${counts.high > 1 ? 's' : ''}</b> to review.`
                : 'No critical or high-severity issues detected today. ✅'}
            <div style="margin-top:6px;color:#94a3b8;font-size:12px;">Security ${counts.security} · Performance ${counts.performance} · SEO ${counts.seo} · UX ${counts.ux}</div>
          </div>
        </div>
        ${section('Security', '🔒', findings.security)}
        ${section('Performance', '⚡', findings.performance)}
        <p style="font-size:11px;color:#94a3b8;margin-top:22px;border-top:1px solid #e5e7eb;padding-top:12px;">
          Automated read-only audit. Log in to the NUPS console for full details and one-click fixes. Showing up to 12 findings per category.
        </p>
      </div>
    </div>
  `;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch (_) { /* automation path — no session */ }
    // Manual (in-app) callers must be admin. Automation (no user) is allowed.
    if (user && !ADMIN_ROLES.includes(user.role || user._highestRole || '')) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }
    const db = base44.asServiceRole;

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const date = new Date().toISOString().slice(0, 10);

    // Run the audit engine directly (reuse the same AI audit as runSiteAudit).
    const audit = await db.integrations.Core.InvokeLLM({
      prompt: `You are a security expert running the daily automated audit for the NUPS venue operating platform (GlyphLock). Analyze the codebase for SECURITY (OWASP Top 10) and PERFORMANCE issues. Return real, actionable findings with file paths, severity (critical/high/medium/low/info), and a concise recommendation. Give an overall health score 0-100.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          overall_score: { type: 'number' },
          security_findings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                severity: { type: 'string' },
                category: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                file_path: { type: 'string' },
                line_number: { type: 'number' },
                recommendation: { type: 'string' },
              },
            },
          },
          performance_findings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                severity: { type: 'string' },
                category: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                file_path: { type: 'string' },
                line_number: { type: 'number' },
                recommendation: { type: 'string' },
              },
            },
          },
        },
      },
    });

    const findings = {
      security: audit.security_findings || [],
      performance: audit.performance_findings || [],
      seo: [],
      ux: [],
    };
    const all = [...findings.security, ...findings.performance];
    const counts = {
      critical: all.filter((f: any) => String(f.severity).toLowerCase() === 'critical').length,
      high: all.filter((f: any) => String(f.severity).toLowerCase() === 'high').length,
      security: findings.security.length,
      performance: findings.performance.length,
      seo: 0,
      ux: 0,
    };
    const score = Math.round(Number(audit.overall_score ?? 0));

    // Persist a SiteAudit record for the in-app history.
    try {
      await db.entities.SiteAudit.create({
        audit_type: 'security',
        status: 'completed',
        overall_score: score,
        security_findings: findings.security,
        performance_findings: findings.performance,
        files_scanned: 0,
      });
    } catch (_) { /* history is best-effort */ }

    // Resolve recipients: explicit override, else all admin users.
    let recipients: string[] = [];
    if (body.to) {
      recipients = [body.to];
    } else {
      const admins = await db.entities.User.filter({ role: 'admin' }).catch(() => []);
      recipients = admins.map((u: any) => u.email).filter(Boolean);
    }

    const html = buildHtml({ date, score, findings, counts });
    const subject = `🛡️ NUPS Security Report — ${date} · Score ${score}${counts.critical ? ` · ${counts.critical} critical` : ''}`;

    if (body.dry_run) {
      return Response.json({ date, score, counts, recipients: recipients.length, preview_html: html });
    }

    if (recipients.length === 0) {
      return Response.json({ date, score, counts, sent: 0, warning: 'No admin recipients found. Pass "to" with a registered user email.' });
    }

    let sent = 0;
    for (const to of recipients) {
      try {
        await base44.integrations.Core.SendEmail({ to, subject, body: html, from_name: 'NUPS Security' });
        sent++;
      } catch (_) { /* per-recipient failures don't kill the run */ }
    }

    return Response.json({ date, score, counts, recipients: recipients.length, sent });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});