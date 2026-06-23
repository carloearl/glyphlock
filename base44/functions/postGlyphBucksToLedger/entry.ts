/**
 * BPAA-NUPS-ACCT-001 P2 — GlyphBucks ledger autoposter.
 *
 * Handles BOTH legs:
 *   - GlyphBucksBatch create  → SALE (tender debit → 2000 GB Outstanding credit)
 *   - GlyphBucksBill update with status=redeemed → REDEEM (2000 debit → revenue credit)
 *
 * GlyphBucks NEVER touches total_sales (I-6). Sale is a liability;
 * redemption recognizes revenue. ASC 606 / gift-card accounting.
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

async function ensureAccounts(base44, venue_id, mode, codes) {
  const accounts = await base44.asServiceRole.entities.LedgerAccount.filter(
    { venue_id, mode }, null, 200,
  );
  const have = new Set(accounts.map(a => a.code));
  for (const c of codes) {
    if (!have.has(c)) {
      throw new Error(`missing_account:${c} — seed default COA at /admin/ledger`);
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
    const data = payload?.data || {};
    const oldData = payload?.old_data || null;

    // ── BATCH CREATE → GB SALE (liability) ─────────────────────
    if (event.entity_name === 'GlyphBucksBatch' && event.type === 'create') {
      const b = data?.id ? data : await base44.asServiceRole.entities.GlyphBucksBatch.get(event.entity_id);
      if (!b || !b.venue_id) return Response.json({ ok: true, skipped: 'no_venue_id' });

      const mode = b.mode || 'REAL';
      const tender_cents = toCents(b.total_charged);
      if (tender_cents <= 0) return Response.json({ ok: true, skipped: 'zero_tender' });

      await ensureAccounts(base44, b.venue_id, mode, [ACCT.CASH, ACCT.CARD_CLEARING, ACCT.GLYPHBUCKS_LIAB]);

      // Default to card clearing — most GB sales are processed via card.
      // (Future: read payment_method from GlyphBucksBatch if added.)
      const tender_acct = ACCT.CARD_CLEARING;
      const face_cents = toCents(b.total_face_value);
      const surcharge_cents = tender_cents - face_cents; // surcharge is revenue

      const lines = [
        { account_code: tender_acct, debit_cents: tender_cents, credit_cents: 0, memo: 'GB sale tender' },
        { account_code: ACCT.GLYPHBUCKS_LIAB, debit_cents: 0, credit_cents: face_cents, memo: 'GB issued (liability)' },
      ];
      if (surcharge_cents > 0) {
        // Surcharge counts as VIP revenue (the GB program funds VIP shows).
        await ensureAccounts(base44, b.venue_id, mode, [ACCT.VIP_REVENUE]);
        lines.push({ account_code: ACCT.VIP_REVENUE, debit_cents: 0, credit_cents: surcharge_cents, memo: 'GB surcharge revenue' });
      }

      const result = await postIfNew(base44, b.venue_id, mode, `GlyphBucksBatch:${b.id}`, {
        source_type: 'GLYPHBUCKS_SALE',
        source_id: b.id,
        actor_user_id: b.issued_by || 'system',
        actor_email: b.issued_by || null,
        memo: `GB sale · batch ${b.batch_id} · $${b.total_charged}`,
        lines,
      });
      return Response.json({ ok: true, leg: 'SALE', ...result });
    }

    // ── BILL UPDATE → status flipped to redeemed → REDEMPTION (revenue) ──
    if (event.entity_name === 'GlyphBucksBill' && event.type === 'update') {
      const bill = data?.id ? data : await base44.asServiceRole.entities.GlyphBucksBill.get(event.entity_id);
      if (!bill || !bill.venue_id) return Response.json({ ok: true, skipped: 'no_venue_id' });
      if (bill.status !== 'redeemed') return Response.json({ ok: true, skipped: 'not_redeemed' });
      if (oldData && oldData.status === 'redeemed') {
        return Response.json({ ok: true, skipped: 'already_redeemed_before' });
      }

      const mode = bill.mode || 'REAL';
      const face_cents = toCents(bill.denomination);
      if (face_cents <= 0) return Response.json({ ok: true, skipped: 'zero_denom' });

      await ensureAccounts(base44, bill.venue_id, mode, [ACCT.GLYPHBUCKS_LIAB, ACCT.VIP_REVENUE]);

      const lines = [
        { account_code: ACCT.GLYPHBUCKS_LIAB, debit_cents: face_cents, credit_cents: 0, memo: 'GB redeemed (liability cleared)' },
        { account_code: ACCT.VIP_REVENUE,     debit_cents: 0,           credit_cents: face_cents, memo: 'revenue recognized' },
      ];

      const result = await postIfNew(base44, bill.venue_id, mode, `GlyphBucksBill:redeem:${bill.id}`, {
        source_type: 'GLYPHBUCKS_REDEEM',
        source_id: bill.id,
        actor_user_id: bill.redeemed_by_contractor_id || 'system',
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