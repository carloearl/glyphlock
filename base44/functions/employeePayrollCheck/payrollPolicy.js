/**
 * Employee payroll policy — pure logic shared by the employeePayrollCheck
 * backend function and its tests. No SDK imports, no Deno APIs.
 *
 * Money is ALWAYS integer cents. Deductions are user-entered and explicitly
 * verified; this module never computes a tax rate or claims tax compliance.
 */

export const ACCOUNT_ID = 'GLYPHLOCK_LLC';
export const BANK_NAME = 'Chase';
export const CHECK_STOCK = 'PREPRINTED_CHASE_STOCK';

// Preprinted Chase stock in use: numbers read 26-395, 26-396, …
export const STOCK_NUMBER_PREFIX = '26-';
export const STOCK_START_NUMBER = 395;

/** Numeric suffix of a stock check number: '26-395' or '395' -> 395. */
export function parseStockCheckNumber(value) {
  const text = String(value ?? '').trim().toUpperCase().replace(/\s+/g, '');
  if (!text) return null;
  if (!/^(?:26-)?\d+$/.test(text)) return null;
  const digits = text.startsWith(STOCK_NUMBER_PREFIX) ? text.slice(STOCK_NUMBER_PREFIX.length) : text;
  if (!/^\d+$/.test(digits)) return null;
  const parsed = Number(digits);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

/** Rendered check number for the printed stock, e.g. 395 -> '26-395'. */
export const formatCheckNumber = (sequenceNumber) => `${STOCK_NUMBER_PREFIX}${sequenceNumber}`;
export const MODES = Object.freeze(['REAL', 'DEMO']);
export const YTD_STATUSES = Object.freeze(['VERIFIED_OPENING', 'UNAVAILABLE']);
export const OWNER_ADMIN_NUPS_ROLES = Object.freeze(['PLATFORM_ADMIN', 'VENUE_OWNER', 'SOVEREIGN']);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const FORBIDDEN_BANK_FIELDS = [
  'routing_number', 'account_number', 'bank_account', 'bank_routing',
  'routing', 'iban', 'swift', 'ach_account', 'account_last4',
];

export class PayrollError extends Error {
  constructor(code, status = 400) {
    super(code);
    this.name = 'PayrollError';
    this.code = code;
    this.status = status;
  }
}

const isIsoDate = (value) => {
  const text = String(value || '');
  if (!ISO_DATE.test(text)) return false;
  const parsed = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === text;
};

const isCents = (value) => Number.isInteger(value) && value >= 0;

const trimText = (value, max) => String(value ?? '').trim().slice(0, max);

/** True when the acting identity may use the employee payroll surface. */
export function isOwnerOrAdmin({ platformRole, nupsRole } = {}) {
  if (String(platformRole || '').toLowerCase() === 'admin') return true;
  return OWNER_ADMIN_NUPS_ROLES.includes(String(nupsRole || '').toUpperCase());
}

/**
 * Server-side tenant + mode decision. The client never supplies the winning
 * venue or mode: an actor with a resolved venue cannot act outside it.
 */
export function scopeDecision({ actor = {}, requestedVenueId, requestedMode } = {}) {
  const actorVenue = trimText(actor.venueId, 120);
  const requestedVenue = trimText(requestedVenueId, 120);
  const mode = String(requestedMode || actor.accountMode || 'REAL').toUpperCase();

  if (actorVenue && requestedVenue && requestedVenue !== actorVenue) {
    return { allowed: false, reason: 'cross_tenant_write_blocked', status: 403 };
  }
  if (!MODES.includes(mode)) {
    return { allowed: false, reason: 'invalid_mode', status: 400 };
  }
  if (actor.accountMode && String(actor.accountMode).toUpperCase() !== mode) {
    return { allowed: false, reason: 'mode_scope_blocked', status: 403 };
  }
  if (actorVenue) {
    return { allowed: true, venueId: actorVenue, mode };
  }
  if (!actor.platformAdmin) {
    return { allowed: false, reason: 'venue_scope_required', status: 403 };
  }
  if (!requestedVenue) {
    return { allowed: false, reason: 'venue_id_required', status: 400 };
  }
  return { allowed: true, venueId: requestedVenue, mode, requiresVenueLookup: true };
}

export const accountKeyFor = (venueId, mode) =>
  `${ACCOUNT_ID}:${trimText(venueId, 120)}:${String(mode || 'REAL').toUpperCase()}`;

/**
 * Validate a draft. Returns normalized cents so the handler never recomputes
 * money from untrusted values.
 */
export function validateDraftInput(input = {}) {
  const errors = [];
  const employeeName = trimText(input.employee_name, 120);
  if (employeeName.length < 2) errors.push('employee_name_required');

  const periodStart = isIsoDate(input.period_start) ? input.period_start : null;
  const periodEnd = isIsoDate(input.period_end) ? input.period_end : null;
  if (!periodStart) errors.push('period_start_required');
  if (!periodEnd) errors.push('period_end_required');
  if (periodStart && periodEnd && periodStart > periodEnd) errors.push('period_end_before_start');

  // Actual check date — must be supplied separately from the earning period.
  const issueDate = isIsoDate(input.issue_date) ? input.issue_date : null;
  if (!issueDate) errors.push('issue_date_required');

  const grossCents = isCents(input.gross_cents) ? input.gross_cents : null;
  if (grossCents === null || grossCents <= 0) errors.push('gross_amount_required');

  for (const field of FORBIDDEN_BANK_FIELDS) {
    if (input[field] !== undefined && input[field] !== null && String(input[field]).trim() !== '') {
      errors.push('bank_details_not_accepted');
      break;
    }
  }
  if (input.routing_number || input.account_number) errors.push('bank_details_not_accepted');

  const bankName = trimText(input.bank_name || BANK_NAME, 60) || BANK_NAME;
  if (bankName.toUpperCase() !== BANK_NAME.toUpperCase()) errors.push('bank_must_be_chase');

  const rawDeductions = Array.isArray(input.deductions) ? input.deductions : [];
  const deductions = [];
  const seenCodes = new Set();
  for (const item of rawDeductions) {
    const code = trimText(item?.code || item?.label, 40).toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const label = trimText(item?.label || item?.code, 80);
    const amount = item?.amount_cents;
    if (!label) {
      errors.push('deduction_label_required');
      continue;
    }
    if (!Number.isInteger(amount) || amount <= 0) {
      errors.push('deduction_amount_required');
      continue;
    }
    if (code && seenCodes.has(code)) {
      errors.push('duplicate_deduction_code');
      continue;
    }
    if (code) seenCodes.add(code);
    deductions.push({ code: code || 'DEDUCTION', label, amount_cents: amount });
  }

  const totalDeductions = deductions.reduce((sum, item) => sum + item.amount_cents, 0);
  if (input.total_deductions_cents !== undefined && input.total_deductions_cents !== null
    && input.total_deductions_cents !== totalDeductions) {
    errors.push('deduction_total_mismatch');
  }

  const tipsPaid = input.tips_paid_cents ?? 0;
  if (!isCents(tipsPaid) || tipsPaid < 0 || (grossCents !== null && tipsPaid > grossCents)) errors.push('tips_paid_invalid');
  const netCents = grossCents === null ? null : grossCents - totalDeductions - tipsPaid;
  if (netCents !== null && netCents < 0) errors.push('net_negative');
  if (input.net_cents !== undefined && input.net_cents !== null && input.net_cents !== netCents) {
    errors.push('net_mismatch');
  }

  if (deductions.length === 0 && input.no_deductions_confirmed !== true) {
    errors.push('deductions_missing_or_unconfirmed');
  }

  const ytdStatus = String(input.ytd_status || '').toUpperCase();
  let ytd = { ytd_status: null, ytd_gross_cents: null, ytd_deductions_cents: null, ytd_net_cents: null };
  if (!YTD_STATUSES.includes(ytdStatus)) {
    errors.push('ytd_status_required');
  } else if (ytdStatus === 'VERIFIED_OPENING') {
    const gross = input.ytd_gross_cents;
    const withheld = input.ytd_deductions_cents;
    const net = input.ytd_net_cents;
    if (!isCents(gross) || !isCents(withheld) || !isCents(net)) {
      errors.push('ytd_opening_figures_required');
    } else if (gross - withheld !== net) {
      errors.push('ytd_net_mismatch');
    }
    ytd = { ytd_status: ytdStatus, ytd_gross_cents: gross ?? null, ytd_deductions_cents: withheld ?? null, ytd_net_cents: net ?? null };
  } else {
    ytd = { ytd_status: 'UNAVAILABLE', ytd_gross_cents: null, ytd_deductions_cents: null, ytd_net_cents: null };
  }

  const payType = String(input.pay_type || 'SALARY').toUpperCase() === 'HOURLY' ? 'HOURLY' : 'SALARY';

  return {
    ok: errors.length === 0,
    errors,
    normalized: {
      employee_name: employeeName,
      employee_ref: trimText(input.employee_ref, 60) || null,
      pay_type: payType,
      period_start: periodStart,
      period_end: periodEnd,
      issue_date: issueDate,
      gross_cents: grossCents,
      deductions,
      total_deductions_cents: totalDeductions,
      net_cents: netCents,
      tips_paid_cents: tipsPaid,
      no_deductions_confirmed: input.no_deductions_confirmed === true,
      memo: trimText(input.memo, 120) || null,
      bank_name: BANK_NAME,
      check_stock: CHECK_STOCK,
      ...ytd,
    },
  };
}

/** A draft may only become REVIEWED once every required field is present. */
export function validateReview(record = {}, input = {}) {
  const errors = [];
  if (String(record.status || '') !== 'DRAFT') errors.push('only_drafts_reviewable');
  if (!isIsoDate(record.issue_date)) errors.push('issue_date_required');
  if (!YTD_STATUSES.includes(String(record.ytd_status || '').toUpperCase())) errors.push('ytd_status_required');

  const deductions = Array.isArray(record.deductions) ? record.deductions : [];
  if (deductions.length === 0 && record.no_deductions_confirmed !== true) {
    errors.push('deductions_missing_or_unconfirmed');
  }
  const total = deductions.reduce((sum, item) => sum + (Number(item?.amount_cents) || 0), 0);
  if (!Number.isInteger(record.gross_cents) || record.gross_cents <= 0) errors.push('gross_amount_required');
  if (!Number.isInteger(record.net_cents) || record.net_cents < 0) errors.push('net_invalid');
  const tipsPaid = record.tips_paid_cents ?? 0;
  if (!isCents(tipsPaid) || tipsPaid < 0) errors.push('tips_paid_invalid');
  if (Number.isInteger(record.gross_cents) && Number.isInteger(record.net_cents)
    && record.gross_cents - total - tipsPaid !== record.net_cents) {
    errors.push('net_mismatch');
  }
  if (Number(record.total_deductions_cents) !== total) errors.push('deduction_total_mismatch');
  if (String(record.bank_name || '').toUpperCase() !== BANK_NAME.toUpperCase()) errors.push('bank_must_be_chase');
  if (input.confirm_totals !== true) errors.push('review_confirmation_required');

  return { ok: errors.length === 0, errors };
}

const NONNEGOTIABLE = 'NON-NEGOTIABLE';

/**
 * What must be printed on the document. Only a REVIEWED record that has never
 * been reprinted loses the non-negotiable stamp — and it still prints UNSIGNED.
 */
export function documentStamp(record = {}, { reprinted = false } = {}) {
  const status = String(record.status || 'DRAFT').toUpperCase();
  if (status === 'PAID') {
    return { label: 'PAID RECORD — NON-NEGOTIABLE COPY', stamp: NONNEGOTIABLE, negotiable: false };
  }
  if (status === 'VOID') {
    return { label: 'VOID — NON-NEGOTIABLE COPY', stamp: NONNEGOTIABLE, negotiable: false };
  }
  if (status !== 'REVIEWED') {
    return { label: 'DRAFT — NON-NEGOTIABLE', stamp: NONNEGOTIABLE, negotiable: false };
  }
  if (reprinted) {
    return { label: 'REPRINT — NON-NEGOTIABLE COPY', stamp: NONNEGOTIABLE, negotiable: false };
  }
  return {
    label: 'REVIEWED — UNSIGNED, PRINT ON PREPRINTED CHASE STOCK',
    stamp: 'UNSIGNED',
    negotiable: true,
  };
}

/**
 * Allocate the next permanent check number for an account.
 *
 * Compare-and-set: `claimSequence` only persists when the stored next_number
 * still equals the value we read. A lost race means another draft took that
 * number, so we re-read and try the next one. A check that already carries the
 * candidate number also forces a retry, so numbers can never be shared.
 *
 * repo: {
 *   readSequence(accountKey) -> {id, next_number}|null
 *   createSequence({account_key, next_number}) -> object|null
 *   claimSequence({id, expected, next, token}) -> boolean
 *   findCheckByNumber(accountKey, checkNumber) -> object|null
 *   token() -> string
 * }
 */
/** Serialize draft persistence on the pre-provisioned bank sequence. No expiry:
 * a crashed writer requires reconciliation rather than unsafe lock takeover. */
export async function withPayrollWriteLock(repo, accountKey, work) {
  const sequence = await repo.readSequence(accountKey);
  if (!sequence) throw new PayrollError('numbering_setup_required', 409);
  const token = repo.token();
  if (!await repo.acquireWriteLock(sequence.id, token)) {
    throw new PayrollError('payroll_save_in_progress', 409);
  }
  try { return await work(); }
  finally { await repo.releaseWriteLock(sequence.id, token); }
}

export const sequenceKeyFor = (mode) => `${ACCOUNT_ID}:CHASE:${mode}`;

export async function allocateCheckNumber(repo, { accountKey, stockStartNumber, maxAttempts = 8 } = {}) {
  if (!accountKey) throw new PayrollError('account_key_required', 400);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const sequence = await repo.readSequence(accountKey);
    if (!sequence) {
      const start = parseStockCheckNumber(stockStartNumber);
      if (!start) {
        throw new PayrollError('stock_start_number_required', 400);
      }
      await repo.createSequence({ account_key: accountKey, next_number: start });
      continue;
    }

    const expected = Number(sequence.next_number);
    if (!Number.isInteger(expected) || expected <= 0) {
      throw new PayrollError('sequence_corrupt', 409);
    }

    const token = repo.token();
    const claimed = await repo.claimSequence({
      id: sequence.id,
      expected,
      next: expected + 1,
      token,
    });
    if (!claimed) continue;

    const checkNumber = formatCheckNumber(expected);
    const existing = await repo.findCheckByNumber(accountKey, checkNumber);
    if (existing) continue;

    return { checkNumber, token };
  }

  throw new PayrollError('check_number_allocation_failed', 409);
}