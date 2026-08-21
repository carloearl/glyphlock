import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

const GLOBAL_ROLES = new Set(['PLATFORM_ADMIN', 'SOVEREIGN']);
const SIGNING_ROLES = new Set(['PLATFORM_ADMIN', 'VENUE_OWNER', 'VENUE_MANAGER', 'SOVEREIGN']);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) return Response.json({ error: 'Authentication required' }, { status: 401 });

    const body = await req.json();
    const token = String(body.token || '').trim();
    if (!token) return Response.json({ error: 'Contract token is required' }, { status: 400 });

    const E = base44.asServiceRole.entities;
    const email = String(user.email).toLowerCase();
    const nupsUser = (await E.NUPSUser.filter({ platform_email: email, status: 'active' }, null, 1).catch(() => []))?.[0]
      || (await E.NUPSUser.filter({ username: email.split('@')[0], status: 'active' }, null, 1).catch(() => []))?.[0]
      || null;
    if (!nupsUser || !SIGNING_ROLES.has(nupsUser.role)) {
      return Response.json({ error: 'Manager-class NUPS identity required' }, { status: 403 });
    }

    const record = (await E.VIPContractRecord.filter({ token, record_type: 'contract_token' }, null, 1).catch(() => []))?.[0] || null;
    if (!record) return Response.json({ error: 'Contract token not found' }, { status: 404 });
    if (!record.venue_id) return Response.json({ error: 'Contract token has no venue assignment' }, { status: 409 });
    if (!GLOBAL_ROLES.has(nupsUser.role) && nupsUser.venue_id !== record.venue_id) {
      return Response.json({ error: 'Contract belongs to another venue' }, { status: 403 });
    }
    if (record.used || record.status === 'signed') return Response.json({ error: 'Contract has already been signed' }, { status: 409 });
    if (record.expires_at && Date.now() > new Date(record.expires_at).getTime()) {
      return Response.json({ error: 'Contract token has expired' }, { status: 410 });
    }

    const venue = (await E.Venue.filter({ venue_id: record.venue_id, status: 'active' }, null, 1).catch(() => []))?.[0]
      || await E.Venue.get(record.venue_id).catch(() => null);
    if (!venue || venue.status === 'inactive') return Response.json({ error: 'Contract venue is not active' }, { status: 409 });

    return Response.json({
      success: true,
      contract_record_id: record.id,
      venue_id: venue.venue_id || venue.id,
      venue_name: venue.name,
      expires_at: record.expires_at || null,
      status: record.status,
    });
  } catch (error) {
    return Response.json({ error: error?.message || 'Contract context lookup failed' }, { status: 500 });
  }
});
