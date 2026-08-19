import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * serverAuditGateway — DACO-20260706-ARCH-BASELINE-01 Step 1 (server half).
 *
 * The server-side equivalent of the frontend writeEntity() gateway. Backend
 * functions that mutate records with asServiceRole used to leave only ad-hoc
 * SystemAuditLog rows (B-CRITICAL-02). Routing those writes through this
 * gateway guarantees the same trail the frontend produces:
 *   MigrationAuditLog + AuditEvent + ActivityLog
 *
 * The actor is ALWAYS resolved from the authenticated session — never from the
 * payload. Callers cannot claim an identity.
 */

const AUDIT_EVENT_TYPES = [
  'GuestScan', 'GuestEntry', 'DoorSale', 'PromoApplied', 'DriverCredit', 'Discount',
  'Comp', 'CashPayment', 'CardPayment', 'GlyphBucksPayment', 'Refund', 'Void',
  'InventoryDeduction', 'BottleSale', 'StageFee', 'VipCharge', 'ShiftOpen', 'ShiftClose',
  'DrawerCount', 'PayoutCreated', 'PayoutApproved', 'PayoutPaid', 'PriceOverride',
  'SystemError', 'PerformanceSnapshot', 'SelfAuditAlert',
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const entity = String(body?.entity || '');
    const operation = String(body?.operation || 'create');
    const recordId = body?.id || null;
    const data = body?.data || {};
    const intent = String(body?.intent || `server:${entity}:${operation}`);

    if (!entity) return Response.json({ ok: false, error: 'entity is required' }, { status: 400 });
    if (!['create', 'update'].includes(operation)) {
      return Response.json({ ok: false, error: 'operation must be create or update' }, { status: 400 });
    }
    if (operation === 'update' && !recordId) {
      return Response.json({ ok: false, error: 'id is required for update' }, { status: 400 });
    }
    const svc = base44.asServiceRole.entities[entity];
    if (!svc) return Response.json({ ok: false, error: `Unknown entity: ${entity}` }, { status: 400 });

    // Actor resolved from the live session only.
    const nupsRows = await base44.asServiceRole.entities.NUPSUser.filter({ email: user.email });
    const nupsUser = (nupsRows || [])[0] || null;
    const actorRole = nupsUser?.role || (user.role === 'admin' ? 'PLATFORM_ADMIN' : (user.role || 'user'));

    const venueId = String(body?.venue_id || data?.venue_id || nupsUser?.venue_id || '');
    const mode = String(data?.mode || body?.mode || 'REAL').toUpperCase();

    // Previous state for update audits.
    let before = null;
    if (operation === 'update') {
      try { before = await svc.get(recordId); } catch { before = null; }
    }

    const record = operation === 'create'
      ? await svc.create({ ...data, ...(venueId && !data.venue_id ? { venue_id: venueId } : {}) })
      : await svc.update(recordId, data);

    const fieldsChanged = Object.keys(data || {});
    const auditFailures = [];

    // 1 — gateway decision log
    try {
      await base44.asServiceRole.entities.MigrationAuditLog.create({
        entity_name: entity,
        operation,
        actor_id: user.email,
        actor_role: actorRole,
        fields_changed: fieldsChanged,
        mode: mode === 'DEMO' ? 'DEMO' : 'REAL',
        tier: 'TIER_1_OBSERVE',
        result: 'allowed',
        venue_id: venueId,
        notes: intent,
      });
    } catch (e) { auditFailures.push(`migration:${e.message}`); }

    // 2 — observational audit ledger
    try {
      const eventType = AUDIT_EVENT_TYPES.includes(body?.event_type) ? body.event_type : 'PerformanceSnapshot';
      await base44.asServiceRole.entities.AuditEvent.create({
        venue_id: venueId || 'unknown',
        timestamp: new Date().toISOString(),
        event_type: eventType,
        event_category: body?.event_category || 'system',
        severity: body?.severity || 'low',
        mode: mode === 'DEMO' ? 'demo' : (mode === 'SANDBOX' ? 'sandbox' : 'real'),
        session_id: String(body?.session_id || `srv-${Date.now()}`),
        source: body?.source || 'system',
        entity_type: entity,
        entity_id: String(record?.id || recordId || 'unknown'),
        previous_value: before ? { ...before } : null,
        new_value: { ...data },
        actor_ref: user.email,
        identity_verified: false,
        retention_class: body?.retention_class || 'operational',
        event_version: 1,
        notes: { intent, actor_role: actorRole },
      });
    } catch (e) { auditFailures.push(`auditEvent:${e.message}`); }

    // 3 — append-only activity trail
    try {
      await base44.asServiceRole.entities.ActivityLog.create({
        timestamp: new Date().toISOString(),
        user_email: user.email,
        user_role: actorRole,
        action_type: operation === 'create' ? 'CREATE' : 'UPDATE',
        entity_affected: `${entity}:${record?.id || recordId || 'unknown'}`,
        before_value: before ? { ...before } : undefined,
        after_value: { ...data },
        venue_id: venueId,
        mode: ['REAL', 'DEMO', 'SANDBOX'].includes(mode) ? mode : 'REAL',
        notes: intent,
      });
    } catch (e) { auditFailures.push(`activityLog:${e.message}`); }

    if (auditFailures.length) console.warn('[serverAuditGateway] audit writes failed:', auditFailures.join(' | '));

    return Response.json({ ok: true, value: record, audit_failures: auditFailures });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});