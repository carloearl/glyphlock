/**
 * BPAA-NUPS-ACCT-001 P3 — Entertainer/contractor payout ledger autoposter.
 *
 * Fires on ContractorPayout create. Entertainers are independent contractors
 * (I-7) — NEVER post to wages or tip pool. Goes to 6200 Contractor Expense.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ACCT = { CASH: '1000', CARD_CLEARING: '1010', CONTRACTOR_EXPENSE: '6200' };
const CARDISH = new Set(['Credit Card', 'Debit Card', 'Card', 'Stripe', 'ACH', 'bank']);

function toCents(dollars) {
  if (dollars === null || dollars === undefined || dollars === '') return 0;
  const n = Number(dollars);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const event = payload?.event || {};
    const data = payload?.data || {};

    if (event.entity_name !== 'ContractorPayout') {
      return Response.json({ ok: true, skipped: 'not_contractor_payout' });
    }

    let cp = data;
    if (!cp?.id && event?.entity_id) {
      cp = await base44.asServiceRole.entities.ContractorPayout.get(event.entity_id);
    }
    if (!cp || !cp.id || !cp.venue_id) return Response.json({ ok: true, skipped: 'no_payout' });

    const amount_cents = toCents(cp.total_payout);
    if (amount_cents <= 0) return Response.json({ ok: true, skipped: 'zero_amount' });

    const mode = cp.mode || 'REAL';
    const idempotency_key = `ContractorPayout:${cp.id}`;

    const prior = await base44.asServiceRole.entities.JournalEntry.filter(
      { venue_id: cp.venue_id, mode, idempotency_key }, null, 1,
    );
    if (prior && prior.length) return Response.json({ ok: true, idempotent: true });

    const tender_acct = CARDISH.has(cp.payment_method) ? ACCT.CARD_CLEARING : ACCT.CASH;

    const accounts = await base44.asServiceRole.entities.LedgerAccount.filter(
      { venue_id: cp.venue_id, mode }, null, 200,
    );
    const codeSet = new Set(accounts.map(a => a.code));
    for (const c of [ACCT.CONTRACTOR_EXPENSE, tender_acct]) {
      if (!codeSet.has(c)) {
        return Response.json({ ok: false, error: `missing_account:${c}` }, { status: 400 });
      }
    }

    const lines = [
      { account_code: ACCT.CONTRACTOR_EXPENSE, debit_cents: amount_cents, credit_cents: 0, memo: 'entertainer contractor (I-7)' },
      { account_code: tender_acct,             debit_cents: 0,            credit_cents: amount_cents, memo: 'paid' },
    ];

    const entry = await base44.asServiceRole.entities.JournalEntry.create({
      venue_id: cp.venue_id, mode,
      posted_at: new Date().toISOString(),
      source_type: 'TIP_PAYOUT',  // tip-payout enum reused as nearest fit for "money out to person"
      source_id: cp.id,
      idempotency_key,
      actor_user_id: cp.paid_by || 'system',
      memo: `Contractor payout · ${cp.contractor_name} · $${cp.total_payout}`,
      status: 'POSTED',
      lines,
      total_debits_cents: amount_cents,
      total_credits_cents: amount_cents,
    });

    return Response.json({ ok: true, entry_id: entry.id });
  } catch (error) {
    console.error('postContractorPayoutToLedger error:', error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});