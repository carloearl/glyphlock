import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

const ALLOWED_METADATA_FIELDS = new Set(['name','permissions','rotation_schedule','geo_lock','device_lock','ip_allowlist']);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) return Response.json({ error: 'Authentication required' }, { status: 401 });
    const body = await req.json();
    const keyId = String(body.key_id || '').trim();
    const action = String(body.action || '').toLowerCase();
    const reason = String(body.reason || '').trim().slice(0, 300);
    if (!keyId || !action) return Response.json({ error: 'key_id and action required' }, { status: 400 });

    const E = base44.asServiceRole.entities;
    const key = await E.APIKey.get(keyId).catch(() => null);
    if (!key) return Response.json({ error: 'API key record not found' }, { status: 404 });
    const owner = String(key.owner_id || '').toLowerCase() === String(user.email).toLowerCase();
    const isAdmin = user.role === 'admin';
    if (!owner && !isAdmin) return Response.json({ error: 'API key action denied' }, { status: 403 });

    let updates:any = {};
    let eventType = '';
    if (action === 'revoke' || action === 'disable') {
      updates = { status: 'revoked', revoked_at: new Date().toISOString(), revoked_by: user.email, revoke_reason: reason || action };
      eventType = action === 'disable' ? 'API_KEY_DISABLED' : 'API_KEY_REVOKED';
    } else if (action === 'update_metadata') {
      const requested = body.data && typeof body.data === 'object' ? body.data : {};
      for (const [field, value] of Object.entries(requested)) if (ALLOWED_METADATA_FIELDS.has(field)) updates[field] = value;
      if (!Object.keys(updates).length) return Response.json({ error: 'No allowed metadata fields supplied' }, { status: 400 });
      eventType = 'API_KEY_METADATA_UPDATED';
    } else {
      return Response.json({ error: 'Unsupported API key security action' }, { status: 400 });
    }

    const updated = await E.APIKey.update(keyId, updates);
    await E.SystemAuditLog.create({
      event_type: eventType,
      description: `${eventType} for API key record ${keyId}`,
      status: 'security_action',
      actor_email: user.email,
      severity: action === 'update_metadata' ? 'medium' : 'high',
      metadata: { key_id: keyId, action, reason: reason || null, updated_fields: Object.keys(updates).filter((f) => !['revoked_by','revoke_reason'].includes(f)) },
    }).catch(() => null);
    return Response.json({ success: true, key: { id: updated.id, name: updated.name, public_key: updated.public_key, status: updated.status, last_used: updated.last_used } });
  } catch (error) {
    return Response.json({ error: error?.message || 'API key security action failed' }, { status: 500 });
  }
});