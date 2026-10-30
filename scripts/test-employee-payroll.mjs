#!/usr/bin/env node
/**
 * Employee payroll / check preparation tests.
 *
 * Covers: integer-cent rounding and net math, missing deductions/bank/issue
 * date, concurrent duplicate check-number allocation, unauthorized and
 * cross-tenant scope decisions, and non-negotiable paid reprints.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  allocateCheckNumber,
  accountKeyFor,
  documentStamp,
  isOwnerOrAdmin,
  scopeDecision,
  validateDraftInput,
  validateReview,
} from '../base44/functions/employeePayrollCheck/payrollPolicy.js';

const baseInput = {
  employee_name: 'Carlo Rene Earl',
  pay_type: 'SALARY',
  period_start: '2026-08-01',
  period_end: '2026-08-31',
  issue_date: '2026-09-04',
  gross_cents: 400000,
  deductions: [
    { code: 'FIT', label: 'Federal income tax withholding', amount_cents: 120000 },
    { code: 'FICA', label: 'FICA withholding', amount_cents: 30600 },
  ],
  ytd_status: 'UNAVAILABLE',
};

test('integer cents: gross, deductions and net reconcile exactly', () => {
  const result = validateDraftInput({
    ...baseInput,
    total_deductions_cents: 150600,
    net_cents: 249400,
  });
  assert.equal(result.ok, true, result.errors.join(','));
  assert.equal(result.normalized.net_cents, 249400);
  assert.equal(result.normalized.total_deductions_cents, 150600);
  assert.equal(result.normalized.gross_cents, 400000);
});

test('net must equal gross minus deductions', () => {
  const wrongNet = validateDraftInput({ ...baseInput, net_cents: 250000 });
  assert.equal(wrongNet.ok, false);
  assert.ok(wrongNet.errors.includes('net_mismatch'));

  const wrongTotal = validateDraftInput({ ...baseInput, total_deductions_cents: 1 });
  assert.equal(wrongTotal.ok, false);
  assert.ok(wrongTotal.errors.includes('deduction_total_mismatch'));
});

test('deductions larger than gross are rejected (no negative net)', () => {
  const result = validateDraftInput({
    ...baseInput,
    deductions: [{ code: 'OVER', label: 'Over-withholding', amount_cents: 500000 }],
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes('net_negative'));
});

test('missing deductions require explicit confirmation', () => {
  const missing = validateDraftInput({ ...baseInput, deductions: [] });
  assert.equal(missing.ok, false);
  assert.ok(missing.errors.includes('deductions_missing_or_unconfirmed'));

  const confirmed = validateDraftInput({ ...baseInput, deductions: [], no_deductions_confirmed: true });
  assert.equal(confirmed.ok, true, confirmed.errors.join(','));
  assert.equal(confirmed.normalized.net_cents, 400000);
});

test('missing issue date is rejected and stays distinct from the period', () => {
  const result = validateDraftInput({ ...baseInput, issue_date: '' });
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes('issue_date_required'));

  const ok = validateDraftInput(baseInput);
  assert.equal(ok.normalized.period_end, '2026-08-31');
  assert.equal(ok.normalized.issue_date, '2026-09-04');
});

test('period end before period start is rejected', () => {
  const result = validateDraftInput({ ...baseInput, period_start: '2026-09-30', period_end: '2026-08-01' });
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes('period_end_before_start'));
});

test('bank must be Chase and no bank digits are accepted', () => {
  const otherBank = validateDraftInput({ ...baseInput, bank_name: 'US Bank' });
  assert.equal(otherBank.ok, false);
  assert.ok(otherBank.errors.includes('bank_must_be_chase'));

  const digits = validateDraftInput({ ...baseInput, routing_number: '123456789', account_number: '000111222' });
  assert.equal(digits.ok, false);
  assert.ok(digits.errors.includes('bank_details_not_accepted'));
});

test('verified opening YTD must reconcile, otherwise it is unavailable', () => {
  const good = validateDraftInput({
    ...baseInput,
    ytd_status: 'VERIFIED_OPENING',
    ytd_gross_cents: 1200000,
    ytd_deductions_cents: 400000,
    ytd_net_cents: 800000,
  });
  assert.equal(good.ok, true, good.errors.join(','));
  assert.equal(good.normalized.ytd_net_cents, 800000);

  const bad = validateDraftInput({
    ...baseInput,
    ytd_status: 'VERIFIED_OPENING',
    ytd_gross_cents: 1200000,
    ytd_deductions_cents: 400000,
    ytd_net_cents: 700000,
  });
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.includes('ytd_net_mismatch'));

  const unavailable = validateDraftInput({ ...baseInput, ytd_status: 'UNAVAILABLE' });
  assert.equal(unavailable.normalized.ytd_status, 'UNAVAILABLE');
  assert.equal(unavailable.normalized.ytd_gross_cents, null);
});

test('review requires issued date, verified deductions, YTD state and confirmation', () => {
  const draft = {
    status: 'DRAFT',
    issue_date: '2026-09-04',
    gross_cents: 400000,
    deductions: [{ code: 'FIT', label: 'Federal income tax withholding', amount_cents: 120000 }],
    total_deductions_cents: 120000,
    net_cents: 280000,
    ytd_status: 'UNAVAILABLE',
    bank_name: 'Chase',
  };
  assert.equal(validateReview(draft, { confirm_totals: true }).ok, true);
  assert.ok(validateReview(draft, {}).errors.includes('review_confirmation_required'));
  assert.ok(validateReview({ ...draft, issue_date: '' }, { confirm_totals: true }).errors.includes('issue_date_required'));
  assert.ok(validateReview({ ...draft, deductions: [], total_deductions_cents: 0, net_cents: 400000 }, { confirm_totals: true })
    .errors.includes('deductions_missing_or_unconfirmed'));
  assert.ok(validateReview({ ...draft, status: 'REVIEWED' }, { confirm_totals: true }).errors.includes('only_drafts_reviewable'));
});

test('drafts and paid records print non-negotiable; paid reprints never lose it', () => {
  assert.equal(documentStamp({ status: 'DRAFT' }).negotiable, false);
  assert.match(documentStamp({ status: 'DRAFT' }).label, /NON-NEGOTIABLE/);

  const reviewed = documentStamp({ status: 'REVIEWED' });
  assert.equal(reviewed.negotiable, true);
  assert.match(reviewed.label, /UNSIGNED/);

  assert.equal(documentStamp({ status: 'REVIEWED' }, { reprinted: true }).negotiable, false);

  const paid = documentStamp({ status: 'PAID' });
  assert.equal(paid.negotiable, false);
  assert.match(paid.label, /NON-NEGOTIABLE COPY/);
  assert.equal(documentStamp({ status: 'REVIEWED' }, { reprinted: true }).negotiable, false);
});

test('only owner/admin identities are authorized', () => {
  assert.equal(isOwnerOrAdmin({ platformRole: 'admin' }), true);
  assert.equal(isOwnerOrAdmin({ nupsRole: 'VENUE_OWNER' }), true);
  assert.equal(isOwnerOrAdmin({ nupsRole: 'PLATFORM_ADMIN' }), true);
  assert.equal(isOwnerOrAdmin({ nupsRole: 'VENUE_MANAGER' }), false);
  assert.equal(isOwnerOrAdmin({ nupsRole: 'BARTENDER' }), false);
  assert.equal(isOwnerOrAdmin({}), false);
});

test('cross-tenant and mode writes are refused server-side', () => {
  const owner = { venueId: 'VENUE_A', accountMode: 'REAL', platformAdmin: false };

  assert.deepEqual(scopeDecision({ actor: owner, requestedVenueId: 'VENUE_A', requestedMode: 'REAL' }),
    { allowed: true, venueId: 'VENUE_A', mode: 'REAL' });

  assert.equal(scopeDecision({ actor: owner, requestedVenueId: 'VENUE_B', requestedMode: 'REAL' }).reason,
    'cross_tenant_write_blocked');
  assert.equal(scopeDecision({ actor: owner, requestedVenueId: 'VENUE_A', requestedMode: 'DEMO' }).reason,
    'mode_scope_blocked');
  assert.equal(scopeDecision({ actor: owner, requestedVenueId: 'VENUE_A', requestedMode: 'SANDBOX' }).reason,
    'invalid_mode');
  assert.equal(scopeDecision({ actor: { platformAdmin: false }, requestedVenueId: 'VENUE_A' }).reason,
    'venue_scope_required');
  assert.equal(scopeDecision({ actor: { platformAdmin: true } }).reason, 'venue_id_required');

  const platformAdmin = scopeDecision({ actor: { platformAdmin: true }, requestedVenueId: 'VENUE_C', requestedMode: 'REAL' });
  assert.equal(platformAdmin.allowed, true);
  assert.equal(platformAdmin.requiresVenueLookup, true);
});

test('account-scoped numbering key includes tenant and mode', () => {
  assert.equal(accountKeyFor('VENUE_A', 'REAL'), 'GLYPHLOCK_LLC:VENUE_A:REAL');
  assert.notEqual(accountKeyFor('VENUE_A', 'REAL'), accountKeyFor('VENUE_A', 'DEMO'));
  assert.notEqual(accountKeyFor('VENUE_A', 'REAL'), accountKeyFor('VENUE_B', 'REAL'));
});

/**
 * Deterministic fake repository. `staleReads` forces the first N readers to
 * see the same snapshot, which is exactly the interleaving that would let two
 * drafts claim one check number if allocation were not compare-and-set.
 */
function makeRepo({ sequence = null, existingChecks = [], staleReads = 0 } = {}) {
  let state = sequence ? { ...sequence } : null;
  const checks = new Map(existingChecks.map((number) => [number, { check_number: number }]));
  let reads = 0;
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  let waiting = 0;

  return {
    get sequence() { return state ? { ...state } : null; },
    checks,
    async readSequence() {
      if (staleReads) {
        reads += 1;
        if (reads <= staleReads - 1) {
          waiting += 1;
          if (waiting === staleReads - 1) release();
          await gate;
        }
        return state ? { ...state } : null;
      }
      return state ? { ...state } : null;
    },
    async createSequence({ account_key, next_number }) {
      if (state) return null;
      state = { id: 'seq-1', account_key, next_number };
      return state;
    },
    async claimSequence({ id, expected, next, token }) {
      if (!state || state.id !== id || state.next_number !== expected) return false;
      // Yield once so concurrent claimers genuinely interleave.
      await Promise.resolve();
      if (state.next_number !== expected) return false;
      state = { ...state, next_number: next, last_allocated: expected, last_token: token };
      return true;
    },
    async findCheckByNumber(_accountKey, checkNumber) {
      return checks.get(checkNumber) || null;
    },
    token: () => `token-${Math.random().toString(36).slice(2)}`,
  };
}

test('concurrent drafts never share a check number', async () => {
  const repo = makeRepo({ staleReads: 2 });
  const accountKey = accountKeyFor('VENUE_A', 'REAL');

  const [first, second] = await Promise.all([
    allocateCheckNumber(repo, { accountKey, stockStartNumber: 10001 }),
    allocateCheckNumber(repo, { accountKey, stockStartNumber: 10001 }),
  ]);

  assert.notEqual(first.checkNumber, second.checkNumber);
  assert.deepEqual([first.checkNumber, second.checkNumber].sort(), ['10001', '10002']);
  assert.equal(repo.sequence.next_number, 10003);
});

test('five-way concurrency still yields distinct sequential numbers', async () => {
  const repo = makeRepo({
    sequence: { id: 'seq-1', account_key: 'acct', next_number: 10001 },
    staleReads: 5,
  });
  const results = await Promise.all(Array.from({ length: 5 }, () =>
    allocateCheckNumber(repo, { accountKey: 'acct', stockStartNumber: 10001 })));

  const numbers = results.map((r) => r.checkNumber);
  assert.equal(new Set(numbers).size, 5);
  assert.deepEqual(numbers.map(Number).sort((a, b) => a - b), [10001, 10002, 10003, 10004, 10005]);
});

test('a number already present on a check is skipped', async () => {
  const repo = makeRepo({
    sequence: { id: 'seq-1', account_key: 'acct', next_number: 10001 },
    existingChecks: ['10001', '10002'],
  });
  const allocated = await allocateCheckNumber(repo, { accountKey: 'acct', stockStartNumber: 10001 });
  assert.equal(allocated.checkNumber, '10003');
});

test('first allocation requires the physical stock start number', async () => {
  const repo = makeRepo();
  await assert.rejects(
    () => allocateCheckNumber(repo, { accountKey: 'acct' }),
    /stock_start_number_required/,
  );
});

test('allocation initializes a new account sequence at the stock number', async () => {
  const repo = makeRepo();
  const allocated = await allocateCheckNumber(repo, { accountKey: 'acct', stockStartNumber: 20050 });
  assert.equal(allocated.checkNumber, '20050');
  assert.equal(repo.sequence.next_number, 20051);
});