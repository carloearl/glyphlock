import { calculateHourlyEarnings } from './hourlyEarnings.js';
import { calculatePayrollTaxes } from './taxes2026.js';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';
import {
  ACCOUNT_ID,
  BANK_NAME,
  CHECK_STOCK,
  STOCK_START_NUMBER,
  PayrollError,
  accountKeyFor,
  allocateCheckNumber,
  withPayrollWriteLock,
  sequenceKeyFor,
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
  // Only a full, authenticated email binding can grant a payroll role.
  return null;
}

async function resolveActor(base44: any) {
  const user = await base44.auth.me().catch(() => null);
  if (!user?.email) throw new PayrollError('authentication_required', 401);

  const email = normalizeEmail(user.email);
  const platformRole = String(user.role || '');
  // Platform admins select an active venue explicitly; an old staff/demo
  // profile must not override their authenticated platform role and scope.
  const nups = platformRole.toLowerCase() === 'admin'
    ? null
    : await resolveNupsAccount(base44, email);
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

async function auditWrite(base44: any, actor: any, scope: any, { operation, fields, entity = 'EmployeePayrollCheck', reference = '' }: any) {
  await base44.asServiceRole.entities.MigrationAuditLog.create({
    entity_name: entity,
    operation,
    result: 'allowed',
    actor_id: actor.userId || actor.email,
    actor_role: actor.nupsRole || actor.platformRole || 'ADMIN',
    fields_changed: fields,
    mode: scope.mode,
    venue_id: scope.venueId,
    notes: `employee_payroll:${scope.accountKey}: ${reference} by ${actor.email}`,
  }).catch(() => null);
}

function buildNumberingRepo(base44: any) {
  const E = base44.asServiceRole.entities;
  return {
    async readSequence(accountKey: string) {
      const rows = await E.PayrollCheckSequence.filter({ account_key: accountKey }, 'created_date', 2);
      if (rows.length > 1) throw new PayrollError('numbering_setup_conflict', 409);
      return rows?.[0] || null;
    },
    async createSequence() {
      // Provision exactly one sequence during owner setup, never in a save race.
      throw new PayrollError('numbering_setup_required', 409);
    },
    async acquireWriteLock(id: string, token: string) {
      await E.PayrollCheckSequence.updateMany(
        { id, $or: [{ write_lock_token: { $exists: false } }, { write_lock_token: null }] },
        { $set: { write_lock_token: token, write_lock_at: nowIso() } },
      );
      return (await E.PayrollCheckSequence.get(id))?.write_lock_token === token;
    },
    async releaseWriteLock(id: string, token: string) {
      await E.PayrollCheckSequence.updateMany(
        { id, write_lock_token: token },
        { $unset: { write_lock_token: '', write_lock_at: '' } },
      );
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
        { account_id: ACCOUNT_ID, mode: accountKey.split(':').at(-1), check_number: checkNumber },
        null,
        1,
      );
      return rows?.[0] || null;
    },
    token: () => crypto.randomUUID(),
  };
}

async function listChecks(base44: any, actor: any, body: any) {
  const scope = await resolveScope(base44, actor, body);
  const skip = body.skip ?? 0;
  if (!Number.isSafeInteger(skip) || skip < 0) throw new PayrollError('invalid_page', 400);
  const rows = await base44.asServiceRole.entities.EmployeePayrollCheck.filter(
    { account_key: scope.accountKey },
    '-created_date',
    201, skip,
  );
  return json({
    ok: true,
    scope,
    records: (rows || []).slice(0, 200),
    has_more: rows.length > 200,
  });
}

async function createDraft(base44: any, actor: any, body: any) {
  const scope = await resolveScope(base44, actor, body);
  const payType = String(body.pay_type || 'SALARY').toUpperCase();
  if (!['SALARY', 'HOURLY'].includes(payType)) throw new PayrollError('invalid_pay_type', 400);
  let earnings = null;
  if (payType === 'HOURLY') {
    if (!body.tax_profile) throw new PayrollError('tax_settings_invalid', 400);
    try { earnings = calculateHourlyEarnings({ ...body.hourly_earnings, period_start: body.period_start, period_end: body.period_end }); }
    catch (failure: any) { throw new PayrollError(failure.message || 'invalid_hourly_earnings', 400); }
    if (body.gross_cents !== earnings.gross_cents || body.tips_paid_cents !== earnings.tips_paid_cents) throw new PayrollError('earnings_mismatch', 400);
  } else if (body.hourly_earnings || (body.tips_paid_cents ?? 0) !== 0) {
    throw new PayrollError('earnings_mismatch', 400);
  }
  let draftInput = { ...body, pay_type: payType, tips_paid_cents: earnings?.tips_paid_cents || 0 };
  let taxCalculation = null;
  if (body.tax_profile) {
    if (String(body.issue_date || '').slice(0, 4) !== '2026') throw new PayrollError('tax_year_mismatch', 400);
    try { taxCalculation = calculatePayrollTaxes(body.gross_cents, body.tax_profile); }
    catch { throw new PayrollError('tax_settings_invalid', 400); }
    const taxCodes = new Set(['FEDERAL', 'SOCIAL_SECURITY', 'MEDICARE', 'ADDITIONAL_MEDICARE', 'ARIZONA']);
    const extras = (Array.isArray(body.deductions) ? body.deductions : []).filter((d: any) => !taxCodes.has(d.code));
    draftInput = { ...draftInput, deductions: [...taxCalculation.deductions, ...extras] };
  }
  const validation = validateDraftInput(draftInput);
  if (!validation.ok) return json({ error: 'invalid_draft', errors: validation.errors }, 400);

  const idempotencyKey = String(body?.idempotency_key || '').trim();
  if (idempotencyKey.length < 8 || idempotencyKey.length > 128) {
    throw new PayrollError('idempotency_key_required', 400);
  }

  const repo = buildNumberingRepo(base44);
  const sequenceKey = sequenceKeyFor(scope.mode);
  return await withPayrollWriteLock(repo, sequenceKey, async () => {
  const E = base44.asServiceRole.entities;
  const replay = (await E.EmployeePayrollCheck.filter(
    { account_key: scope.accountKey, idempotency_key: idempotencyKey },
    '-created_date',
    1,
  ))?.[0];
  if (replay) return json({ ok: true, replay: true, record: replay });

  const allocation = await allocateCheckNumber(repo, {
    accountKey: sequenceKey,
    // Defaults to the physical Chase stock in use (26-395); the operator may
    // still supply a later number when a sheet is partly used.
    stockStartNumber: body?.stock_start_number ?? STOCK_START_NUMBER,
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
    hourly_earnings: earnings,
    tips_paid_cents: normalized.tips_paid_cents,
    tax_calculation: taxCalculation ? { version: taxCalculation.version, profile: body.tax_profile, deductions: taxCalculation.deductions } : null,
    memo: normalized.memo,
    status: 'DRAFT',
    idempotency_key: idempotencyKey,
    created_by_email: actor.email,
    created_at: nowIso(),
  });

  await auditWrite(base44, actor, scope, {
    operation: 'create',
    fields: ['check_number', 'employee_name', 'gross_cents', 'net_cents', 'issue_date', 'status'],
    reference: record.check_number,
  });

  return json({ ok: true, record });
  });
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
    reference: record.check_number,
  });

  return json({ ok: true, record: updated });
}

async function workspace(base44: any, actor: any, body: any) {
  const scope = await resolveScope(base44, actor, body);
  const E = base44.asServiceRole.entities;
  const [employees, activity] = await Promise.all([
    E.EmployeePayrollProfile.filter({ account_key: scope.accountKey }, 'employee_name', 1000),
    E.MigrationAuditLog.filter({ entity_name: { $in: ['EmployeePayrollCheck', 'EmployeePayrollProfile'] }, venue_id: scope.venueId, mode: scope.mode }, '-created_date', 1000),
  ]);
  return json({ ok: true, scope, employees, activity, employee_limit: 1000, activity_limit: 1000 });
}

async function saveEmployee(base44: any, actor: any, body: any) {
  const scope = await resolveScope(base44, actor, body);
  const input = body.employee || {};
  const id = String(input.id || '').trim();
  const E = base44.asServiceRole.entities;
  if (id) {
    const prior = await E.EmployeePayrollProfile.get(id);
    if (!prior) throw new PayrollError('employee_not_found', 404);
    if (prior.account_key !== scope.accountKey) throw new PayrollError('cross_tenant_write_blocked', 403);
  }
  const name = String(input.employee_name || '').trim();
  const ref = String(input.employee_ref || '').trim();
  if (!name || name.length > 120 || ref.length > 80
      || !Number.isSafeInteger(input.base_salary_cents) || input.base_salary_cents < 0 || input.base_salary_cents > 10000000000
      || (input.pay_type === 'SALARY' && input.base_salary_cents <= 0)
      || (input.pay_type === 'HOURLY' && (!Number.isSafeInteger(input.hourly_rate_cents) || input.hourly_rate_cents <= 0 || input.hourly_rate_cents > 10000000000))
      || !['SALARY', 'HOURLY'].includes(input.pay_type)
      || ![2, 4, 12, 24, 26, 52].includes(input.pay_periods)
      || !Number.isInteger(input.pay_day) || input.pay_day < 1 || input.pay_day > 28
      || !['ACTIVE', 'INACTIVE'].includes(input.status)
      || String(input.notes || '').length > 500) throw new PayrollError('invalid_employee_settings', 400);
  const data = {
    account_key: scope.accountKey, venue_id: scope.venueId, mode: scope.mode,
    employee_name: name, employee_ref: ref, base_salary_cents: input.base_salary_cents,
    hourly_rate_cents: input.pay_type === 'HOURLY' ? input.hourly_rate_cents : 0,
    pay_type: input.pay_type, pay_periods: input.pay_periods, pay_day: input.pay_day,
    status: input.status, notes: String(input.notes || ''), updated_by: actor.email, updated_at: nowIso(),
  };
  const employee = id ? await E.EmployeePayrollProfile.update(id, data) : await E.EmployeePayrollProfile.create(data);
  await auditWrite(base44, actor, scope, {
    entity: 'EmployeePayrollProfile', operation: id ? 'update' : 'create',
    fields: ['employee_name', 'employee_ref', 'base_salary_cents', 'hourly_rate_cents', 'pay_periods', 'pay_day', 'status'],
    reference: employee.id,
  });
  return json({ ok: true, employee });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  try {
    const base44 = createClientFromRequest(req);
    const actor = await resolveActor(base44);
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || 'list');

    if (action === 'workspace') return await workspace(base44, actor, body);
    if (action === 'save_employee') return await saveEmployee(base44, actor, body);
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