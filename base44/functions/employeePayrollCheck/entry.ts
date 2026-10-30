import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';
import {
  ACCOUNT_ID,
  BANK_NAME,
  CHECK_STOCK,
  PayrollError,
  accountKeyFor,
  allocateCheckNumber,
  isOwnerOrAdmin,
  scopeDecision,
  validateDraftInput,
  validateReview,
} from './payrollPolicy.js';

const json = (body: Record<string, unknown>, status = 200) => Response.json(body, { status });

const nowIso = () => new Date().toISOString();
const normalizeEmail = (value: unknown) => String(value || '').trim().toLowerCase();

async function resolveNupsAccount(base44: any, email: string) {
  const E = base44.asServiceRole.entities;
  const byEmail = await E.NUPSUser.filter({ platform_email: email, status: 'active' }, '-created_date', 1).catch(() => []);
  if (byEmail?.[0]) return byEmail[0];
  const username = email.split('@')[0];
  const byUsername = await E.NUPSUser.filter({ username, status: 'active' }, '-created_date', 1).catch(() => []);
  return byUsername?.[0] || null;
}

async function resolveActor(base44: any) {
  const user = await base44.auth.me().catch(() => null);
  if (!user?.email) throw new PayrollError('authentication_required', 401);

  const email = normalizeEmail(user.email);
  const nups = await resolveNupsAccount(base44, email);
  const platformRole = String(user.role || '');
  const nupsRole = String(nups?.role || '');
  const actor = {
    email,
    userId: String(user.id || ''),
    platformRole,
    nupsRole,
    platformAdmin: platformRole.toLowerCase() === 'admin',
    venueId: String(nups?.venue_id || '').trim(),
    accountMode: nups
      ? String(nups.access_mode || (nups.is_demo ? 'DEMO' : 'REAL')).toUpperCase()
      : null,
  };

  if (!isOwnerOrAdmin(actor)) throw new PayrollError('owner_or_admin_required', 403);
  return actor;
}

async function resolveActiveVenue(base44: any, venueRef: string) {
  const ref = String(venueRef || '').trim();
  if (!ref) return null;
  const E = base44.asServiceRole.entities;
  const venue = await E.Venue.get(ref).catch(() => null)
    || (await E.Venue.filter({ venue_id: ref }, '-created_date', 1).catch(() => []))?.[0]
    || null;
  if (!venue || String(venue.status || '') !== 'active') return null;
  return String(venue.venue_id || venue.id || '').trim();
}

async function resolveScope(base44: any, actor: any, body: any) {
  const decision = scopeDecision({
    actor,
    requestedVenueId: body?.venue_id,
    requestedMode: body?.mode,
  });
  if (!decision.allowed) throw new PayrollError(decision.reason, decision.status || 403);

  let venueId = decision.venueId;
  if (decision.requiresVenueLookup) {
    const canonical = await resolveActiveVenue(base44, venueId);
    if (!canonical) throw new PayrollError('venue_not_active', 403);
    venueId = canonical;
  }

  return {
    venueId,
    mode: decision.mode,
    accountKey: accountKeyFor(venueId, decision.mode),
  };
}

async function auditWrite(base44: any, actor: any, scope: any, { operation, fields }: any) {
  await base44.asServiceRole.entities.MigrationAuditLog.create({
    entity_name: 'EmployeePayrollCheck',
    operation,
    result: 'allowed',
    actor_id: actor.userId || actor.email,
    actor_role: actor.nupsRole || actor.platformRole || 'ADMIN',
    fields_changed: fields,
    mode: scope.mode,
    venue_id: scope.venueId,
    notes: `employee_payroll:${scope.accountKey}: by ${actor.email}`,
  }).catch(() => null);
}

function buildNumberingRepo(base44: any) {
  const E = base44.asServiceRole.entities;
  return {
    async readSequence(accountKey: string) {
      const rows = await E.PayrollCheckSequence.filter({ account_key: accountKey }, '-created_date', 1);
      return rows?.[0] || null;
    },
    async createSequence({ account_key, next_number }: any) {
      try {
        return await E.PayrollCheckSequence.create({ account_key, next_number });
      } catch {
        return null;
      }
    },
    async claimSequence({ id, expected, next, token }: any) {
      await E.PayrollCheckSequence.updateMany(
        { id, next_number: expected },
        {
          $set: {
            next_number: next,
            last_allocated: expected,
            last_token: token,
            last_allocated_at: nowIso(),
          },
        },
      );
      const stored = await E.PayrollCheckSequence.get(id).catch(() => null);
      return stored?.last_token === token && Number(stored?.last_allocated) === expected;
    },
    async findCheckByNumber(accountKey: string, checkNumber: string) {
      const rows = await E.EmployeePayrollCheck.filter(
        { account_key: accountKey, check_number: checkNumber },
        null,
        1,
      ).catch(() => []);
      return rows?.[0] || null;
    },
    token: () => crypto.randomUUID(),
  };
}

async function listChecks(base44: any, actor: any, body: any) {
  const scope = await resolveScope(base44, actor, body);
  const rows = await base44.asServiceRole.entities.EmployeePayrollCheck.filter(
    { account_key: scope.accountKey },
    '-created_date',
    200,
  );
  return json({
    ok: true,
    scope,
    records: rows || [],
  });
}

async function createDraft(base44: any, actor: any, body: any) {
  const scope = await resolveScope(base44, actor, body);
  const validation = validateDraftInput(body);
  if (!validation.ok) return json({ error: 'invalid_draft', errors: validation.errors }, 400);

  const idempotencyKey = String(body?.idempotency_key || '').trim();
  if (idempotencyKey.length < 8 || idempotencyKey.length > 128) {
    throw new PayrollError('idempotency_key_required', 400);
  }

  const E = base44.asServiceRole.entities;
  const replay = (await E.EmployeePayrollCheck.filter(
    { account_key: scope.accountKey, idempotency_key: idempotencyKey },
    '-created_date',
    1,
  ).catch(() => []))?.[0];
  if (replay) return json({ ok: true, replay: true, record: replay });

  const allocation = await allocateCheckNumber(buildNumberingRepo(base44), {
    accountKey: scope.accountKey,
    stockStartNumber: body?.stock_start_number,
  });

  const normalized = validation.normalized;
  const record = await E.EmployeePayrollCheck.create({
    check_id: crypto.randomUUID(),
    check_number: allocation.checkNumber,
    account_key: scope.accountKey,
    account_id: ACCOUNT_ID,
    venue_id: scope.venueId,
    mode: scope.mode,
    is_demo: scope.mode !== 'REAL',
    employee_name: normalized.employee_name,
    employee_ref: normalized.employee_ref,
    pay_type: normalized.pay_type,
    period_start: normalized.period_start,
    period_end: normalized.period_end,
    issue_date: normalized.issue_date,
    gross_cents: normalized.gross_cents,
    deductions: normalized.deductions,
    total_deductions_cents: normalized.total_deductions_cents,
    net_cents: normalized.net_cents,
    no_deductions_confirmed: normalized.no_deductions_confirmed,
    ytd_status: normalized.ytd_status,
    ytd_gross_cents: normalized.ytd_gross_cents,
    ytd_deductions_cents: normalized.ytd_deductions_cents,
    ytd_net_cents: normalized.ytd_net_cents,
    ytd_note: String(body?.ytd_note || '').slice(0, 300) || null,
    bank_name: BANK_NAME,
    check_stock: CHECK_STOCK,
    memo: normalized.memo,
    status: 'DRAFT',
    idempotency_key: idempotencyKey,
    created_by_email: actor.email,
    created_at: nowIso(),
  });

  await auditWrite(base44, actor, scope, {
    operation: 'create',
    fields: ['check_number', 'employee_name', 'gross_cents', 'net_cents', 'issue_date', 'status'],
  });

  return json({ ok: true, record });
}

async function reviewCheck(base44: any, actor: any, body: any) {
  const scope = await resolveScope(base44, actor, body);
  const checkId = String(body?.check_id || '').trim();
  if (!checkId) throw new PayrollError('check_id_required', 400);

  const E = base44.asServiceRole.entities;
  const record = await E.EmployeePayrollCheck.get(checkId).catch(() => null);
  if (!record) throw new PayrollError('check_not_found', 404);
  if (record.account_key !== scope.accountKey) {
    throw new PayrollError('cross_tenant_write_blocked', 403);
  }

  const validation = validateReview(record, body);
  if (!validation.ok) return json({ error: 'invalid_review', errors: validation.errors }, 400);

  const updated = await E.EmployeePayrollCheck.update(checkId, {
    status: 'REVIEWED',
    reviewed_by: actor.email,
    reviewed_at: nowIso(),
    review_note: String(body?.review_note || '').slice(0, 300) || null,
  });

  await auditWrite(base44, actor, scope, {
    operation: 'update',
    fields: ['status', 'reviewed_by', 'reviewed_at'],
  });

  return json({ ok: true, record: updated });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  try {
    const base44 = createClientFromRequest(req);
    const actor = await resolveActor(base44);
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || 'list');

    if (action === 'list') return await listChecks(base44, actor, body);
    if (action === 'create_draft') return await createDraft(base44, actor, body);
    if (action === 'review') return await reviewCheck(base44, actor, body);

    return json({ error: 'unsupported_action' }, 400);
  } catch (error: any) {
    if (error instanceof PayrollError) {
      return json({ error: error.code }, error.status || 400);
    }
    return json({ error: 'employee_payroll_failed', detail: String(error?.message || error).slice(0, 200) }, 500);
  }
});