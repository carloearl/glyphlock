/**
 * BPAA-NUPS-ACCT-001 P1 — POSTransaction → ledger autoposter.
 *
 * Fires on POSTransaction create. Translates the sale into a balanced
 * journal entry and posts via the postToLedger() helper (re-implemented
 * server-side because backend functions can't import local libs).
 *
 * Idempotency: keyed on POSTransaction.id — re-fires are no-ops.
 * Skips: validation_run=true (funds-off), payment_method=Comp (audit gap),
 *        any transaction already mirrored to the ledger.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── Account codes (must match lib/accounting/eventToEntry.js ACCT) ──
const ACCT = {
  CASH: '1000', CARD_CLEARING: '1010', BANK: '1020',
  GLYPHBUCKS_LIAB: '2000', TIPS_PAYABLE: '2100', TAX_PAYABLE: '2200',
  BAR_REVENUE: '4000', DOOR_REVENUE: '4100', VIP_REVENUE: '4200',
  VENDING_REVENUE: '4300', SERVICE_REVENUE: '4400',
  CARD_PROCESSING: '6100',
};

const STATION_TO_SOURCE = {
  bar: 'BAR_SALE',
  door: 'DOOR',
  vip: 'VIP_SHOW',
  kiosk: 'VENDING',
  office: 'SERVICE_REVENUE',
};

const REVENUE_ACCT_FOR_SOURCE = {
  BAR_SALE: ACCT.BAR_REVENUE,
  DOOR: ACCT.DOOR_REVENUE,
  VIP_SHOW: ACCT.VIP_REVENUE,
  VENDING: ACCT.VENDING_REVENUE,
  SERVICE_REVENUE: ACCT.SERVICE_REVENUE,
};

const CARDISH = new Set(['Credit Card', 'Debit Card', 'Digital Wallet', 'Card', 'Gift Card', 'Tab']);

function toCents(dollars) {
  if (dollars === null || dollars === undefined || dollars === '') return 0;
  const n = Number(dollars);
  if (!Number.isFinite(n)) return 0;
  const sign = n < 0 ? -1 : 1;
  return sign * Math.round(Math.abs(n) * 100);
}

function tenderAccount(payment_method) {
  if (CARDISH.has(payment_method)) return ACCT.CARD_CLEARING;
  return ACCT.CASH;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const event = payload?.event || {};

    // ── W3-004 REMEDIATION: Authentication & source verification ──
    // Two call paths:
    //   1. Automation-triggered (entity event): payload has event.entity_id.
    //      Source entity is ALWAYS fetched from DB — payload.data is NEVER
    //      trusted. This prevents forged direct HTTP calls from injecting
    //      arbitrary JournalEntry records.
    //   2. Direct HTTP invocation: requires authenticated admin session.
    let tx = null;
    const isAutomationCall = !!(event?.entity_id && event?.entity_name === 'POSTransaction');

    if (isAutomationCall) {
      // Automation path — fetch source from DB, never trust payload data
      tx = await base44.asServiceRole.entities.POSTransaction.get(event.entity_id);
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

      // Direct call requires a transaction_id in the payload
      const txId = payload?.transaction_id || payload?.data?.id;
      if (!txId) {
        return Response.json({ ok: false, error: 'transaction_id required for direct invocation' }, { status: 400 });
      }
      tx = await base44.asServiceRole.entities.POSTransaction.get(txId);
    }

    if (!tx || !tx.id) {
      return Response.json({ ok: false, skipped: 'no_transaction' });
    }

    // ── Skip rules ───────────────────────────────────────────────
    if (tx.validation_run === true) {
      return Response.json({ ok: true, skipped: 'validation_run' });
    }
    if (tx.payment_method === 'Comp') {
      return Response.json({ ok: true, skipped: 'comp_audit_gap_only' });
    }
    if (tx.payment_method === 'GlyphBucks') {
      // Redemption is posted by a separate flow when the bill is redeemed.
      return Response.json({ ok: true, skipped: 'glyphbucks_redeem_handled_elsewhere' });
    }
    if (tx.status === 'void' || tx.status === 'refunded' || tx.status === 'held') {
      return Response.json({ ok: true, skipped: `status_${tx.status}` });
    }
    if (!tx.venue_id) {
      return Response.json({ ok: false, skipped: 'no_venue_id' });
    }

    // W3-004: mode is always taken from the DB-fetched record, never from
    // the payload. actor_user_id is derived from the transaction's audit
    // fields — these were set at write time through writeEntity().
    const mode = tx.mode || 'REAL';
    const actor_user_id = tx.cashier_email || tx.cashier_id || tx.cashier || 'system';
    const idempotency_key = `POSTransaction:${tx.id}`;

    // ── Idempotency (I-4) ────────────────────────────────────────
    const prior = await base44.asServiceRole.entities.JournalEntry.filter(
      { venue_id: tx.venue_id, mode, idempotency_key },
      null, 1,
    );
    if (prior && prior.length) {
      return Response.json({ ok: true, idempotent: true, entry_id: prior[0].id });
    }

    // ── Resolve venue config (for tax) ───────────────────────────
    const configs = await base44.asServiceRole.entities.VenueRateConfig.filter(
      { venue_id: tx.venue_id }, null, 1,
    );
    const cfg = configs?.[0] || {};
    const tax_mode = cfg.tax_mode || 'NONE';
    const tax_rate_bps = Number(cfg.tax_rate_bps) || 0;

    // ── Compute cents ────────────────────────────────────────────
    const total_cents = toCents(tx.total);
    const gb_liability_cents = toCents(tx.gb_liability);
    const net_revenue_cents = total_cents - gb_liability_cents;

    if (total_cents <= 0) {
      return Response.json({ ok: true, skipped: 'zero_total' });
    }

    const source_type = STATION_TO_SOURCE[tx.station] || 'BAR_SALE';
    const revenue_acct = REVENUE_ACCT_FOR_SOURCE[source_type];
    const tender_acct = tenderAccount(tx.payment_method);

    // Tax split — only on the non-GB revenue portion
    let net_cents = net_revenue_cents;
    let tax_cents = 0;
    if (tax_mode !== 'NONE' && tax_rate_bps > 0 && net_revenue_cents > 0) {
      net_cents = Math.round((net_revenue_cents * 10000) / (10000 + tax_rate_bps));
      tax_cents = net_revenue_cents - net_cents;
    }

    const lines = [];
    lines.push({ account_code: tender_acct, debit_cents: total_cents, credit_cents: 0, memo: 'tender' });
    if (net_cents > 0) {
      lines.push({ account_code: revenue_acct, debit_cents: 0, credit_cents: net_cents, memo: source_type });
    }
    if (tax_cents > 0) {
      lines.push({ account_code: ACCT.TAX_PAYABLE, debit_cents: 0, credit_cents: tax_cents, memo: 'sales tax' });
    }
    if (gb_liability_cents > 0) {
      lines.push({ account_code: ACCT.GLYPHBUCKS_LIAB, debit_cents: 0, credit_cents: gb_liability_cents, memo: 'GB issued' });
    }

    // ── Balance check (I-1) ──────────────────────────────────────
    const sumDr = lines.reduce((s, l) => s + (l.debit_cents || 0), 0);
    const sumCr = lines.reduce((s, l) => s + (l.credit_cents || 0), 0);
    if (sumDr !== sumCr) {
      return Response.json({
        ok: false,
        error: 'unbalanced',
        debits: sumDr,
        credits: sumCr,
        tx_id: tx.id,
      }, { status: 400 });
    }

    // ── Account existence check (I-10) ───────────────────────────
    const accounts = await base44.asServiceRole.entities.LedgerAccount.filter(
      { venue_id: tx.venue_id, mode }, null, 200,
    );
    const codeSet = new Set(accounts.map(a => a.code));
    for (const l of lines) {
      if (!codeSet.has(l.account_code)) {
        return Response.json({
          ok: false,
          error: 'missing_account',
          code: l.account_code,
          hint: 'Seed default COA from /admin/ledger',
        }, { status: 400 });
      }
    }

    // ── Write atomic entry ───────────────────────────────────────
    const entry = await base44.asServiceRole.entities.JournalEntry.create({
      venue_id: tx.venue_id,
      mode,
      posted_at: new Date().toISOString(),
      source_type,
      source_id: tx.id,
      idempotency_key,
      actor_user_id,
      actor_email: tx.cashier_email || null,
      memo: `${source_type} · ${tx.transaction_id || tx.id} · ${tx.payment_method}`,
      status: 'POSTED',
      lines,
      total_debits_cents: sumDr,
      total_credits_cents: sumCr,
    });

    return Response.json({ ok: true, entry_id: entry.id, lines: lines.length });
  } catch (error) {
    console.error('postPOSTransactionToLedger error:', error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});