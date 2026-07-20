/**
 * BPAA-NUPS-ACCT-001 P2 — GlyphBucks ledger autoposter.
 *
 * Handles BOTH legs:
 *   - GlyphBucksBatch create  → SALE (tender debit → 2000 GB Outstanding credit)
 *   - GlyphBucksBill update with status=redeemed → REDEEM (2000 debit → revenue credit)
 *
 * GlyphBucks NEVER touches total_sales (I-6). Sale is a liability;
 * redemption recognizes revenue. ASC 606 / gift-card accounting.
 *
 * W3-006 REMEDIATION — Dual-invocation hardened auth model:
 *   - Automation path: requires event.entity_name + event.entity_id; source
 *     entity ALWAYS fetched from DB. payload.data is NEVER trusted.
 *   - Direct HTTP path: requires base44.auth.me() + admin role.
 *   - All financial values (venue_id, mode, total_charged, denomination,
 *     face_value, actor attribution) originate from persisted DB state only.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ACCT = {
  CASH: '1000',
  CARD_CLEARING: '1010',
  GLYPHBUCKS_LIAB: '2000',
  VIP_REVENUE: '4200',
};

const CARDISH = new Set(['Credit Card', 'Debit Card', 'Digital Wallet', 'Card']);

function toCents(dollars) {
  if (dollars === null || dollars === undefined || dollars === '') return 0;
  const n = Number(dollars);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

// Definitions for the accounts this poster touches — auto-seeded when a
// venue/mode has no COA yet, so a GB sale never 500s on a fresh venue.
const ACCT_DEFS = {
  '1000': { name: 'Cash on Hand', type: 'ASSET', normal_side: 'DEBIT' },
  '1010': { name: 'Card Clearing', type: 'ASSET', normal_side: 'DEBIT' },
  '2000': { name: 'GlyphBucks Outstanding', type: 'LIABILITY', normal_side: 'CREDIT' },
  '4200': { name: 'VIP Revenue', type: 'REVENUE', normal_side: 'CREDIT' },
};

async function ensureAccounts(base44, venue_id, mode, codes) {
  const accounts = await base44.asServiceRole.entities.LedgerAccount.filter(
    { venue_id, mode }, null, 200,
  );
  const have = new Set(accounts.map(a => a.code));
  for (const c of codes) {
    if (!have.has(c)) {
      const def = ACCT_DEFS[c];
      if (!def) {
        throw new Error(`missing_account:${c} — seed default COA at /admin/ledger`);
      }
      await base44.asServiceRole.entities.LedgerAccount.create({
        venue_id,
        mode,
        code: c,
        ...def,
        active: true,
        seeded_by_default: true,
        description: 'Auto-seeded by postGlyphBucksToLedger (COA missing at posting time)',
      });
      have.add(c);
    }
  }
}

async function postIfNew(base44, venue_id, mode, idempotency_key, payload) {
  const prior = await base44.asServiceRole.entities.JournalEntry.filter(
    { venue_id, mode, idempotency_key }, null, 1,
  );
  if (prior && prior.length) return { idempotent: true, entry_id: prior[0].id };

  const sumDr = payload.lines.reduce((s, l) => s + (l.debit_cents || 0), 0);
  const sumCr = payload.lines.reduce((s, l) => s + (l.credit_cents || 0), 0);
  if (sumDr !== sumCr || sumDr === 0) {
    throw new Error(`unbalanced_or_zero: dr=${sumDr} cr=${sumCr}`);
  }

  const entry = await base44.asServiceRole.entities.JournalEntry.create({
    ...payload,
    venue_id,
    mode,
    posted_at: new Date().toISOString(),
    idempotency_key,
    status: 'POSTED',
    total_debits_cents: sumDr,
    total_credits_cents: sumCr,
  });
  return { idempotent: false, entry_id: entry.id };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const event = payload?.event || {};
    const oldData = payload?.old_data || null;

    // ── W3-006: Dual-invocation detection ───────────────────────
    // Automation calls carry event.entity_name + event.entity_id.
    // Direct HTTP calls carry neither — they must pass auth.
    const isAutomationCall = !!(event.entity_name && event.entity_id);

    // ── Direct HTTP path: require authenticated admin ───────────
    if (!isAutomationCall) {
      let user;
      try {
        user = await base44.auth.me();
      } catch (_) {
        return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
      }
      if (!user) {
        return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
      }

      // Resolve NUPSUser for role check
      let nupsUser = null;
      try {
        const nupsUsers = await base44.asServiceRole.entities.NUPSUser.filter(
          { email: user.email }, null, 1,
        );
        nupsUser = nupsUsers?.[0] || null;
      } catch (_) { /* fall through to role check */ }

      const role = nupsUser?.role || user.role;
      const isSovereign = nupsUser?.sovereign_flag === true || role === 'SOVEREIGN';

      if (!isSovereign && role !== 'admin' && role !== 'ADMIN') {
        return Response.json({
          ok: false,
          error: 'Forbidden: admin role required for direct ledger invocation',
          role,
        }, { status: 403 });
      }

      // Direct calls must specify which entity to process
      const entityType = payload.entity_type || payload.entity_name;
      const entityId = payload.entity_id;
      if (!entityType || !entityId) {
        return Response.json({
          ok: false,
          error: 'Bad Request: entity_type and entity_id required for direct invocation',
        }, { status: 400 });
      }

      // Synthesize event for unified processing below
      event.entity_name = entityType;
      event.entity_id = entityId;
      event.type = payload.event_type || 'create';
    }

    // ── BATCH CREATE → GB SALE (liability) ─────────────────────
    if (event.entity_name === 'GlyphBucksBatch' && event.type === 'create') {
      // W3-006: ALWAYS fetch from DB — never trust payload.data
      let b;
      try {
        b = await base44.asServiceRole.entities.GlyphBucksBatch.get(event.entity_id);
      } catch (_) {
        return Response.json({
          ok: false,
          skipped: 'source_batch_not_found',
          entity_id: event.entity_id,
        });
      }
      if (!b || !b.id) {
        return Response.json({
          ok: false,
          skipped: 'source_batch_not_found',
          entity_id: event.entity_id,
        });
      }
      if (!b.venue_id) return Response.json({ ok: true, skipped: 'no_venue_id' });

      // W3-006: mode always from DB-fetched record
      const mode = b.mode || 'REAL';
      const tender_cents = toCents(b.total_charged);
      if (tender_cents <= 0) return Response.json({ ok: true, skipped: 'zero_tender' });

      await ensureAccounts(base44, b.venue_id, mode, [ACCT.CASH, ACCT.CARD_CLEARING, ACCT.GLYPHBUCKS_LIAB]);

      // Default to card clearing — most GB sales are processed via card.
      const tender_acct = ACCT.CARD_CLEARING;
      const face_cents = toCents(b.total_face_value);
      const surcharge_cents = tender_cents - face_cents; // surcharge is revenue

      const lines = [
        { account_code: tender_acct, debit_cents: tender_cents, credit_cents: 0, memo: 'GB sale tender' },
        { account_code: ACCT.GLYPHBUCKS_LIAB, debit_cents: 0, credit_cents: face_cents, memo: 'GB issued (liability)' },
      ];
      if (surcharge_cents > 0) {
        await ensureAccounts(base44, b.venue_id, mode, [ACCT.VIP_REVENUE]);
        lines.push({ account_code: ACCT.VIP_REVENUE, debit_cents: 0, credit_cents: surcharge_cents, memo: 'GB surcharge revenue' });
      }

      // W3-006: actor attribution from persisted record only
      const actor_user_id = b.issued_by || 'system';
      const result = await postIfNew(base44, b.venue_id, mode, `GlyphBucksBatch:${b.id}`, {
        source_type: 'GLYPHBUCKS_SALE',
        source_id: b.id,
        actor_user_id,
        actor_email: b.issued_by || null,
        memo: `GB sale · batch ${b.batch_id} · $${b.total_charged}`,
        lines,
      });
      return Response.json({ ok: true, leg: 'SALE', ...result });
    }

    // ── BILL UPDATE → status flipped to redeemed → REDEMPTION (revenue) ──
    if (event.entity_name === 'GlyphBucksBill' && event.type === 'update') {
      // W3-006: ALWAYS fetch from DB — never trust payload.data
      let bill;
      try {
        bill = await base44.asServiceRole.entities.GlyphBucksBill.get(event.entity_id);
      } catch (_) {
        return Response.json({
          ok: false,
          skipped: 'source_bill_not_found',
          entity_id: event.entity_id,
        });
      }
      if (!bill || !bill.id) {
        return Response.json({
          ok: false,
          skipped: 'source_bill_not_found',
          entity_id: event.entity_id,
        });
      }
      if (!bill.venue_id) return Response.json({ ok: true, skipped: 'no_venue_id' });
      if (bill.status !== 'redeemed') return Response.json({ ok: true, skipped: 'not_redeemed' });

      // W3-006: oldData only trusted from automation (entity automation engine provides it)
      if (isAutomationCall && oldData && oldData.status === 'redeemed') {
        return Response.json({ ok: true, skipped: 'already_redeemed_before' });
      }

      // W3-006: mode always from DB-fetched record
      const mode = bill.mode || 'REAL';
      const face_cents = toCents(bill.denomination);
      if (face_cents <= 0) return Response.json({ ok: true, skipped: 'zero_denom' });

      await ensureAccounts(base44, bill.venue_id, mode, [ACCT.GLYPHBUCKS_LIAB, ACCT.VIP_REVENUE]);

      const lines = [
        { account_code: ACCT.GLYPHBUCKS_LIAB, debit_cents: face_cents, credit_cents: 0, memo: 'GB redeemed (liability cleared)' },
        { account_code: ACCT.VIP_REVENUE,     debit_cents: 0,           credit_cents: face_cents, memo: 'revenue recognized' },
      ];

      // W3-006: actor attribution from persisted record only
      const actor_user_id = bill.redeemed_by_contractor_id || 'system';
      const result = await postIfNew(base44, bill.venue_id, mode, `GlyphBucksBill:redeem:${bill.id}`, {
        source_type: 'GLYPHBUCKS_REDEEM',
        source_id: bill.id,
        actor_user_id,
        memo: `GB redeemed · serial ${bill.serial_number} · $${bill.denomination}`,
        lines,
      });
      return Response.json({ ok: true, leg: 'REDEEM', ...result });
    }

    return Response.json({ ok: true, skipped: 'not_glyphbucks_event' });
  } catch (error) {
    console.error('postGlyphBucksToLedger error:', error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});