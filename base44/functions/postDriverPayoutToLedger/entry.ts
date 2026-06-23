/**
 * BPAA-NUPS-ACCT-001 P4 — Driver payout ledger autoposter.
 *
 * Fires on DriverPayout update when payout_status flips to PROCESSED.
 *
 * ⚠ REQUIRES DACO RULING on VenueRateConfig.driver_payout_treatment.
 *   • UNSET (default)     → posts a FLAGGED ReconciliationRecord and skips
 *   • HOUSE_ABSORBED       → Dr 6000 Driver Expense / Cr Cash
 *   • GUEST_DISCOUNT       → Dr 4100 Door Revenue / Cr Cash (contra-revenue)
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ACCT = {
  CASH: '1000',
  DOOR_REVENUE: '4100',
  DRIVER_EXPENSE: '6000',
};

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
    const oldData = payload?.old_data || null;

    if (event.entity_name !== 'DriverPayout') {
      return Response.json({ ok: true, skipped: 'not_driver_payout' });
    }

    let dp = data;
    if (!dp?.id && event?.entity_id) {
      dp = await base44.asServiceRole.entities.DriverPayout.get(event.entity_id);
    }
    if (!dp || !dp.id) return Response.json({ ok: true, skipped: 'no_payout' });

    // Only fire when payout_status crosses → PROCESSED
    if (dp.payout_status !== 'PROCESSED') {
      return Response.json({ ok: true, skipped: 'not_processed' });
    }
    if (oldData && oldData.payout_status === 'PROCESSED') {
      return Response.json({ ok: true, skipped: 'already_processed_before' });
    }

    const venue_id = dp.venue_id;
    if (!venue_id) return Response.json({ ok: true, skipped: 'no_venue_id' });
    const mode = dp.mode || 'REAL';

    // ── Resolve treatment from VenueRateConfig ───────────────────
    const cfgs = await base44.asServiceRole.entities.VenueRateConfig.filter({ venue_id }, null, 1);
    const treatment = cfgs?.[0]?.driver_payout_treatment || 'UNSET';

    const payout_cents = toCents(dp.total_payout);
    if (payout_cents <= 0) return Response.json({ ok: true, skipped: 'zero_payout' });

    // ── UNSET — flag and DO NOT post ─────────────────────────────
    if (treatment === 'UNSET') {
      await base44.asServiceRole.entities.ReconciliationRecord.create({
        venue_id, mode,
        kind: 'DAILY',
        period_start: new Date().toISOString(),
        period_end: new Date().toISOString(),
        expected_cents: payout_cents,
        actual_cents: 0,
        variance_cents: -payout_cents,
        status: 'FLAGGED',
        notes: `DACO RULING REQUIRED: driver_payout_treatment=UNSET for venue ${venue_id}. Payout ${dp.id} ($${dp.total_payout}) NOT posted to ledger. Set treatment to HOUSE_ABSORBED or GUEST_DISCOUNT on VenueRateConfig.`,
      });
      return Response.json({ ok: false, blocked: 'driver_payout_treatment_UNSET' }, { status: 409 });
    }

    // ── Idempotency ──────────────────────────────────────────────
    const idempotency_key = `DriverPayout:${dp.id}`;
    const prior = await base44.asServiceRole.entities.JournalEntry.filter(
      { venue_id, mode, idempotency_key }, null, 1,
    );
    if (prior && prior.length) return Response.json({ ok: true, idempotent: true });

    // ── Account check ────────────────────────────────────────────
    const accounts = await base44.asServiceRole.entities.LedgerAccount.filter(
      { venue_id, mode }, null, 200,
    );
    const codeSet = new Set(accounts.map(a => a.code));
    const required = treatment === 'HOUSE_ABSORBED'
      ? [ACCT.DRIVER_EXPENSE, ACCT.CASH]
      : [ACCT.DOOR_REVENUE, ACCT.CASH];
    for (const c of required) {
      if (!codeSet.has(c)) {
        return Response.json({ ok: false, error: `missing_account:${c}` }, { status: 400 });
      }
    }

    // ── Lines ────────────────────────────────────────────────────
    let lines;
    if (treatment === 'HOUSE_ABSORBED') {
      lines = [
        { account_code: ACCT.DRIVER_EXPENSE, debit_cents: payout_cents, credit_cents: 0, memo: 'driver expense' },
        { account_code: ACCT.CASH,           debit_cents: 0,            credit_cents: payout_cents, memo: 'paid out' },
      ];
    } else { // GUEST_DISCOUNT
      lines = [
        { account_code: ACCT.DOOR_REVENUE,   debit_cents: payout_cents, credit_cents: 0, memo: 'guest discount (driver)' },
        { account_code: ACCT.CASH,           debit_cents: 0,            credit_cents: payout_cents, memo: 'paid out' },
      ];
    }

    const entry = await base44.asServiceRole.entities.JournalEntry.create({
      venue_id, mode,
      posted_at: new Date().toISOString(),
      source_type: 'DRIVER_PAYOUT',
      source_id: dp.id,
      idempotency_key,
      actor_user_id: dp.processed_by || dp.paid_by || 'system',
      memo: `Driver payout · ${dp.driver_name} · ${treatment} · $${dp.total_payout}`,
      status: 'POSTED',
      lines,
      total_debits_cents: payout_cents,
      total_credits_cents: payout_cents,
    });

    return Response.json({ ok: true, entry_id: entry.id, treatment });
  } catch (error) {
    console.error('postDriverPayoutToLedger error:', error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});