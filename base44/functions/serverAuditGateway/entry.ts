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

const GATEWAY_POLICIES = {
  entertainer_contract_signed: {
    entity: 'Entertainer',
    operation: 'update',
    fields: new Set(['contract_signed', 'contract_signature', 'contract_signed_date', 'contract_ip_address', 'contract_status', 'status', 'mode']),
    grantRoles: new Set(['ENTERTAINER', 'MANAGER', 'ADMINISTRATOR', 'OWNER']),
    performerSelfOnly: true,
  },
  'license_expired:payout_hold': {
    entity: 'Entertainer',
    operation: 'update',
    fields: new Set(['payout_hold']),
    grantRoles: new Set(['MANAGER', 'ADMINISTRATOR', 'OWNER']),
  },
  entertainer_check_in: {
    entity: 'EntertainerShift',
    operation: 'create',
    fields: new Set(['entertainer_id', 'entertainer_type', 'stage_name', 'check_in_time', 'location', 'venue_id', 'status']),
    grantRoles: new Set(['MANAGER', 'ADMINISTRATOR', 'OWNER']),
  },
  entertainer_check_out: {
    entity: 'EntertainerShift',
    operation: 'update',
    fields: new Set(['check_out_time', 'status', 'shift_earnings']),
    grantRoles: new Set(['MANAGER', 'ADMINISTRATOR', 'OWNER']),
  },
  entertainer_earnings_accrual: {
    entity: 'Entertainer',
    operation: 'update',
    fields: new Set(['total_earnings']),
    grantRoles: new Set(['MANAGER', 'ADMINISTRATOR', 'OWNER']),
  },
};

const ACCOUNT_ROLE_BY_GRANT = {
  ENTERTAINER: 'PERFORMER',
  MANAGER: 'VENUE_MANAGER',
  ADMINISTRATOR: 'PLATFORM_ADMIN',
  OWNER: 'VENUE_OWNER',
};
const SOVEREIGN_EMAILS = new Set(['carloearl@glyphlock.com', 'carloearl@gmail.com']);

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

async function requireGatewayAuthority(base44, user, venueId, mode, policy) {
  const email = normalizeEmail(user?.email);
  if (!email || !venueId) return null;
  if (SOVEREIGN_EMAILS.has(email)) return { role: 'SOVEREIGN', grant: null, account: null };

  const grants = mode === 'REAL'
    ? await base44.asServiceRole.entities.NUPSAccessRequest.filter({ email, status: 'APPROVED', venue_id: venueId, mode: 'REAL' }, '-created_date', 500)
    : await base44.asServiceRole.entities.NUPSAccessRequest.filter({ email, status: 'APPROVED', venue_id: venueId, mode }, '-created_date', 500);

  for (const grant of (grants || [])) {
    if (
      normalizeEmail(grant.email) !== email
      || grant.status !== 'APPROVED'
      || grant.venue_id !== venueId
      || grant.mode !== mode
      || !grant.nups_user_id
      || !policy.grantRoles.has(grant.granted_role)
    ) continue;
    const account = await base44.asServiceRole.entities.NUPSUser.get(grant.nups_user_id).catch(() => null);
    const accountMode = account?.access_mode || (account?.is_demo ? 'DEMO' : 'REAL');
    if (
      account?.status !== 'active'
      || accountMode !== mode
      || normalizeEmail(account.platform_email) !== email
      || account.venue_id !== venueId
      || account.id !== grant.nups_user_id
      || account.role !== ACCOUNT_ROLE_BY_GRANT[grant.granted_role]
    ) continue;
    return { role: account.role, grant, account };
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const entity = String(body?.entity || '');
    const operation = String(body?.operation || '');
    const recordId = body?.id || null;
    const data = body?.data && typeof body.data === 'object' && !Array.isArray(body.data) ? body.data : null;
    const intent = String(body?.intent || '');
    const policy = GATEWAY_POLICIES[intent];

    if (!policy || policy.entity !== entity || policy.operation !== operation) {
      return Response.json({ ok: false, error: 'Unknown or mismatched gateway intent' }, { status: 403 });
    }
    if (!data) return Response.json({ ok: false, error: 'data must be an object' }, { status: 400 });
    if (operation === 'update' && !recordId) {
      return Response.json({ ok: false, error: 'id is required for update' }, { status: 400 });
    }
    const unexpectedFields = Object.keys(data).filter((field) => !policy.fields.has(field));
    if (unexpectedFields.length > 0) {
      return Response.json({ ok: false, error: `Fields not allowed for ${intent}: ${unexpectedFields.join(', ')}` }, { status: 403 });
    }

    const svc = entity === 'Entertainer'
      ? base44.asServiceRole.entities.Entertainer
      : entity === 'EntertainerShift'
        ? base44.asServiceRole.entities.EntertainerShift
        : null;
    if (!svc) return Response.json({ ok: false, error: 'Entity is not gateway-managed' }, { status: 403 });

    const venueId = String(body?.venue_id || data?.venue_id || '');
    const mode = String(data?.mode || body?.mode || 'REAL').toUpperCase();
    if (!venueId || !['REAL', 'TEST', 'DEMO', 'SANDBOX'].includes(mode)) {
      return Response.json({ ok: false, error: 'A valid venue and mode are required' }, { status: 400 });
    }

    let before = null;
    if (operation === 'update') {
      before = await svc.get(recordId).catch(() => null);
      if (!before) return Response.json({ ok: false, error: 'Record not found' }, { status: 404 });
      const recordVenue = String(before.venue_id || '');
      if (recordVenue !== venueId) {
        return Response.json({ ok: false, error: 'Record venue does not match the authorized venue' }, { status: 403 });
      }
    } else if (String(data.venue_id || '') !== venueId) {
      return Response.json({ ok: false, error: 'Created record must use the authorized venue' }, { status: 403 });
    }

    const authority = await requireGatewayAuthority(base44, user, venueId, mode, policy);
    if (!authority) {
      return Response.json({ ok: false, error: 'Active owner-approved NUPS authority required' }, { status: 403 });
    }
    if (
      policy.performerSelfOnly
      && authority.role === 'PERFORMER'
      && normalizeEmail(before?.email) !== normalizeEmail(user.email)
    ) {
      return Response.json({ ok: false, error: 'Performer may update only their own contract' }, { status: 403 });
    }
    const actorRole = authority.role;

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