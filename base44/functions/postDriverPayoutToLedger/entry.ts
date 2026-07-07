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

    // ── W3-005 REMEDIATION: Dual invocation model ──
    //   1. Automation-triggered (entity event): payload has
    //      event.entity_name=DriverPayout + event.entity_id.
    //      Source entity is ALWAYS fetched from DB — payload.data is NEVER
    //      trusted. This prevents forged direct HTTP calls from injecting
    //      arbitrary JournalEntry records.
    //   2. Direct HTTP invocation: requires authenticated admin session.
    let dp = null;
    let oldData = null;
    const isAutomationCall = !!(event?.entity_id && event?.entity_name === 'DriverPayout');

    if (isAutomationCall) {
      // Automation path — fetch source from DB, never trust payload data.
      // Return controlled response if source does not exist.
      try {
        dp = await base44.asServiceRole.entities.DriverPayout.get(event.entity_id);
      } catch {
        return Response.json({
          ok: false,
          skipped: 'source_driver_payout_not_found',
          entity_id: event.entity_id,
        });
      }
      oldData = payload?.old_data || null;
    } else {
      // Direct HTTP path — require authenticated admin
      let user;
      try {
        user = await base44.auth.me();
      } catch {
        return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
      }
      if (!user || !user.email) {
        return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
      }

      // Resolve NUPSUser for role check
      const nupsUsers = await base44.asServiceRole.entities.NUPSUser.filter({
        created_by: user.email,
      });
      const nupsUser = (nupsUsers && nupsUsers.length > 0) ? nupsUsers[0] : null;
      const isSovereign = nupsUser && (nupsUser.sovereign_flag === true || nupsUser.role === 'SOVEREIGN');
      const ADMIN_ROLES = new Set([
        'PLATFORM_ADMIN', 'VENUE_OWNER', 'VENUE_MANAGER', 'SOVEREIGN', 'admin',
      ]);
      const isAdmin = isSovereign || (nupsUser && ADMIN_ROLES.has(nupsUser.role));

      if (!isAdmin) {
        return Response.json({
          ok: false,
          error: 'Forbidden: admin role required for direct ledger invocation',
          role: nupsUser?.role || 'none',
        }, { status: 403 });
      }

      // Direct call requires a driver_payout_id in the payload
      const dpId = payload?.driver_payout_id || payload?.data?.id;
      if (!dpId) {
        return Response.json({
          ok: false,
          error: 'driver_payout_id required for direct invocation',
        }, { status: 400 });
      }
      try {
        dp = await base44.asServiceRole.entities.DriverPayout.get(dpId);
      } catch {
        return Response.json({
          ok: false,
          error: 'driver_payout_not_found',
          driver_payout_id: dpId,
        }, { status: 404 });
      }
    }

    if (!dp || !dp.id) {
      return Response.json({
        ok: false,
        skipped: 'no_payout',
        entity_id: event.entity_id || null,
      });
    }

    // Non-DriverPayout entity_name for automation calls is not applicable
    // (already gated by isAutomationCall check). For direct calls, entity
    // type is verified by the DB fetch above.

    // Only fire when payout_status crosses → PROCESSED
    if (dp.payout_status !== 'PROCESSED') {
      return Response.json({ ok: true, skipped: 'not_processed' });
    }
    if (oldData && oldData.payout_status === 'PROCESSED') {
      return Response.json({ ok: true, skipped: 'already_processed_before' });
    }

    // W3-005: mode is always taken from the DB-fetched record, never from
    // the payload. All financial values (venue_id, total_payout, driver_id,
    // etc.) come from the persisted DriverPayout — never from request JSON.
    const venue_id = dp.venue_id;
    if (!venue_id) return Response.json({ ok: true, skipped: 'no_venue_id' });
    const mode = dp.mode || 'REAL';
    const actor_user_id = dp.processed_by || dp.paid_by || 'system';

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
      actor_user_id,
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