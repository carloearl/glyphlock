import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

const GLOBAL_ROLES = new Set(['PLATFORM_ADMIN', 'SOVEREIGN']);

async function resolveNupsUser(base44: any, email: string) {
  const E = base44.asServiceRole.entities;
  const normalized = String(email || '').trim().toLowerCase();
  const byEmail = await E.NUPSUser.filter({ platform_email: normalized, status: 'active' }, null, 1).catch(() => []);
  if (byEmail?.[0]) return byEmail[0];
  const username = normalized.split('@')[0];
  return (await E.NUPSUser.filter({ username, status: 'active' }, null, 1).catch(() => []))?.[0] || null;
}

function safeEvent(row: any) {
  const metadata = row?.metadata || {};
  return {
    id: row?.id,
    event_type: row?.event_type,
    actor_email: row?.actor_email || null,
    status: row?.status || null,
    severity: row?.severity || null,
    created_date: row?.created_date || null,
    evidence_id: metadata.evidence_id || null,
    venue_id: metadata.venue_id || null,
    classification: metadata.classification || null,
    purpose: metadata.purpose || null,
    actor_role: metadata.actor_role || null,
    decision_reason: metadata.decision_reason || null,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) return Response.json({ error: 'Authentication required' }, { status: 401 });

    const nups = await resolveNupsUser(base44, user.email);
    const ownerFallback = String(user.email).toLowerCase() === 'carloearl@glyphlock.com';
    if (!ownerFallback && (!nups || !GLOBAL_ROLES.has(nups.role))) {
      return Response.json({ error: 'Global NUPS security administrator required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const requested = Array.isArray(body.evidence_ids)
      ? body.evidence_ids.map((value: unknown) => String(value || '').trim()).filter(Boolean).slice(0, 20)
      : [];
    if (!requested.length) return Response.json({ error: 'evidence_ids required' }, { status: 400 });

    const E = base44.asServiceRole.entities;
    const [accessRows, denialRows] = await Promise.all([
      E.SystemAuditLog.filter({ event_type: 'PROTECTED_EVIDENCE_ACCESSED' }, '-created_date', 500).catch(() => []),
      E.SystemAuditLog.filter({ event_type: 'PROTECTED_EVIDENCE_ACCESS_DENIED' }, '-created_date', 500).catch(() => []),
    ]);
    const requestedSet = new Set(requested);
    const events = [...(accessRows || []), ...(denialRows || [])]
      .filter((row: any) => requestedSet.has(String(row?.metadata?.evidence_id || '')))
      .map(safeEvent)
      .sort((a: any, b: any) => String(b.created_date || '').localeCompare(String(a.created_date || '')));

    const accessed = events.filter((row: any) => row.event_type === 'PROTECTED_EVIDENCE_ACCESSED').length;
    const denied = events.filter((row: any) => row.event_type === 'PROTECTED_EVIDENCE_ACCESS_DENIED').length;

    return Response.json({
      success: true,
      counts: { accessed, denied, total: events.length },
      events,
      safety: {
        protected_references_included: false,
        document_content_included: false,
      },
    });
  } catch (error: any) {
    return Response.json({ error: error?.message || 'Acceptance audit lookup failed' }, { status: 500 });
  }
});
