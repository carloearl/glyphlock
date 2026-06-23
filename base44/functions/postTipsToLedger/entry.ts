/**
 * BPAA-NUPS-ACCT-001 P3 — Tips ledger autoposter (pass-through, never revenue).
 *
 * Fires on POSTransaction create — if tip > 0, posts a SEPARATE journal entry
 * (in addition to the revenue entry posted by postPOSTransactionToLedger):
 *   Dr Cash · Cr Tips Payable
 *
 * Posted as a distinct entry so a tip reversal doesn't reverse revenue.
 * Idempotency key: `Tip:POSTransaction:${id}`.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ACCT = { CASH: '1000', TIPS_PAYABLE: '2100' };

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

    let tx = data;
    if (!tx?.id && event?.entity_id) {
      tx = await base44.asServiceRole.entities.POSTransaction.get(event.entity_id);
    }
    if (!tx || !tx.id || !tx.venue_id) return Response.json({ ok: true, skipped: 'no_tx' });
    if (tx.validation_run === true) return Response.json({ ok: true, skipped: 'validation_run' });
    if (tx.payment_method === 'Comp') return Response.json({ ok: true, skipped: 'comp' });

    const tip_cents = toCents(tx.tip);
    if (tip_cents <= 0) return Response.json({ ok: true, skipped: 'no_tip' });

    const mode = tx.mode || 'REAL';
    const idempotency_key = `Tip:POSTransaction:${tx.id}`;

    const prior = await base44.asServiceRole.entities.JournalEntry.filter(
      { venue_id: tx.venue_id, mode, idempotency_key }, null, 1,
    );
    if (prior && prior.length) return Response.json({ ok: true, idempotent: true });

    // Verify accounts exist
    const accounts = await base44.asServiceRole.entities.LedgerAccount.filter(
      { venue_id: tx.venue_id, mode }, null, 200,
    );
    const codeSet = new Set(accounts.map(a => a.code));
    for (const c of [ACCT.CASH, ACCT.TIPS_PAYABLE]) {
      if (!codeSet.has(c)) {
        return Response.json({ ok: false, error: `missing_account:${c}` }, { status: 400 });
      }
    }

    const lines = [
      { account_code: ACCT.CASH,         debit_cents: tip_cents, credit_cents: 0, memo: 'tip received' },
      { account_code: ACCT.TIPS_PAYABLE, debit_cents: 0,         credit_cents: tip_cents, memo: 'owed to staff (entertainers excluded I-7)' },
    ];

    const entry = await base44.asServiceRole.entities.JournalEntry.create({
      venue_id: tx.venue_id,
      mode,
      posted_at: new Date().toISOString(),
      source_type: 'TIP_IN',
      source_id: tx.id,
      idempotency_key,
      actor_user_id: tx.cashier_id || tx.cashier_email || 'system',
      memo: `Tip received · tx ${tx.transaction_id || tx.id}`,
      status: 'POSTED',
      lines,
      total_debits_cents: tip_cents,
      total_credits_cents: tip_cents,
    });

    return Response.json({ ok: true, entry_id: entry.id });
  } catch (error) {
    console.error('postTipsToLedger error:', error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});