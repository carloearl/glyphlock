// DEMO SEEDER — NEW sealed contract systems (GlyphBucks stored-value + VIP Show v2).
// Seeds mode:DEMO records only, through the REAL seal paths so every demo contract
// has a valid Ed25519 signature / hash chain and a working QR verification.
//  - GlyphBucks: invokes glyphbucksSeal (DEMO) → SealRecord + GlyphBucksSale + AssentEvidence + Ledger
//  - VIP Show:  builds hash-chained records and invokes vipShowContractIngest (DEMO)
// clear_existing wipes ONLY mode:'DEMO' rows for the venue. REAL rows are never touched.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const enc = new TextEncoder();
async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

const GB_DEMOS = [
  { purchaser_name: 'James R. Holloway', purchaser_member_id: 'MBR-4821', gb_account_last4: '4821', denom_cents: 10000, qty: 3, card_fee_cents: 900, card_last4: '4821', esigs: { purchaser: '/s/ James Holloway', issuer_rep: '/s/ Dana Cash (Cashier)', manager: '/s/ M. Reyes (Manager)' } },
  { purchaser_name: 'Michael T. Vasquez', purchaser_member_id: 'MBR-7703', gb_account_last4: '7703', denom_cents: 5000, qty: 10, card_fee_cents: 1500, card_last4: '7703', esigs: { purchaser: '/s/ M. Vasquez', issuer_rep: '/s/ Dana Cash (Cashier)', manager: '/s/ M. Reyes (Manager)' } },
];

const VIP_DEMOS = [
  { guest: { name: 'Robert Spender', membership_id: 'MBR-0001', member_tier: 'high_roller', id_scan_ref: 'DEMO-ID-001', card_last4: '9921', face_match_pct: 98.2, thumb_match_pct: 97.1 }, staff: { hostess: 'Amber', duty_manager: 'M. Reyes', suite: 'Skyline Suite' }, lines: [{ description: 'VIP Suite — 60 min', qty: 1, amount: 300 }, { description: 'Performance — Crystal', qty: 2, amount: 150 }], cash: 200, card: 430 },
  { guest: { name: 'Anthony Platinum', membership_id: 'MBR-0042', member_tier: 'whale', id_scan_ref: 'DEMO-ID-002', card_last4: '0107', face_match_pct: 99.0, thumb_match_pct: 98.4 }, staff: { hostess: 'Jade', duty_manager: 'M. Reyes', suite: 'Diamond Lounge' }, lines: [{ description: 'Ultra Suite — 120 min', qty: 1, amount: 800 }, { description: 'Bottle service', qty: 2, amount: 175 }], cash: 0, card: 1207 },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const venueId = String(body.venue_id || 'DP-TEMPE-001');
    const clearExisting = !!body.clear_existing;

    const results: any = { cleared: {}, glyphbucks: [], vip_show: [], errors: [] };

    // --- CLEAR previous DEMO rows only (REAL evidence never touched) ---
    if (clearExisting) {
      const wipe = async (entity: string) => {
        try {
          const rows = await (base44.asServiceRole.entities as any)[entity].filter({ venue_id: venueId, mode: 'DEMO' }, '-created_date', 200);
          for (const row of rows) await (base44.asServiceRole.entities as any)[entity].delete(row.id);
          results.cleared[entity] = rows.length;
        } catch (e) { results.cleared[entity] = 'skip: ' + (e as Error).message; }
      };
      await wipe('GlyphBucksSale');
      await wipe('SealRecord');
      await wipe('AssentEvidence');
      await wipe('GlyphBucksLedger');
      await wipe('VIPShowContract');
    }

    // --- GLYPHBUCKS DEMO SALES — through the real seal path (DEMO mode) ---
    for (const [index, d] of GB_DEMOS.entries()) {
      try {
        const seedDigest = await sha256Hex(JSON.stringify({
          venue_id: venueId,
          index,
          purchaser_member_id: d.purchaser_member_id,
          denom_cents: d.denom_cents,
          qty: d.qty,
          card_fee_cents: d.card_fee_cents,
        }));
        const res = await base44.functions.invoke('glyphbucksSeal', {
          idempotency_key: `GBSEAL:DEMO:SEED:${seedDigest.slice(0, 48)}`,
          mode: 'DEMO',
          venue_id: venueId,
          purchaser_name: d.purchaser_name,
          purchaser_member_id: d.purchaser_member_id,
          gb_account_last4: d.gb_account_last4,
          denom_cents: d.denom_cents,
          qty: d.qty,
          card_fee_cents: d.card_fee_cents,
          currency: 'USD',
          card_auth_code: 'DEMO' + Math.floor(1000 + Math.random() * 9000),
          card_last4: d.card_last4,
          card_entry: 'CHIP',
          esigs: d.esigs,
          assent: {
            clickwrap_accepted: true,
            terms_shown_at: new Date(Date.now() - 120000).toISOString(),
            scroll_depth_pct: 100,
            dwell_seconds: 95,
            accepted_at: new Date().toISOString(),
            initials_term1: d.purchaser_name.split(' ').map((w) => w[0]).join('').slice(0, 3),
            initials_term3: d.purchaser_name.split(' ').map((w) => w[0]).join('').slice(0, 3),
          },
          identity: { id_scan_ref: 'DEMO-ID-SCAN', age_verified: true, face_id_match_pct: 98.5, thumb_match_pct: 97.9 },
        });
        const out = res?.data || res;
        results.glyphbucks.push({ verify_ref: out.verify_ref, agreement_no: out.agreement_no, amount_cents: out.amount_cents });
      } catch (e) { results.errors.push('glyphbucks: ' + (e as Error).message); }
    }

    // --- VIP SHOW DEMO CONTRACTS — hash-chained, ingested through the real gate ---
    for (const d of VIP_DEMOS) {
      try {
        const subtotal = d.lines.reduce((s, l) => s + l.qty * l.amount, 0);
        const cardFee = Math.round(d.card * 0.03 * 100) / 100;
        const total = d.cash + d.card;
        const now = new Date();
        const ymd = now.toISOString().slice(2, 10).replace(/-/g, '');
        const contractRef = `VIP-${ymd}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

        // Record with verify_ref present (null) at hash time — key order is hash-significant.
        const record: any = {
          verify_ref: null,
          contract_ref: contractRef,
          venue_id: venueId,
          venue: 'Dream Palace Tempe',
          operator: user.email,
          software: 'NUPS by GlyphLock',
          mode: 'DEMO',
          executed_at: now.toISOString(),
          guest: d.guest,
          staff: d.staff,
          lines: d.lines,
          subtotal,
          card_fee: cardFee,
          total,
          tender: { cash_sales: d.cash, card_sales: d.card, total_sales: total },
          notes: { glyphbucks_tendered: 0, treatment: 'DEMO seeded contract', statute: 'A.R.S. § 44-7402' },
          terms_hash: await sha256Hex('NUPS VIP SHOW TERMS v2 — DEMO'),
        };
        const recordHash = await sha256Hex(JSON.stringify(record));

        let prevSeal = '0'.repeat(64);
        try {
          const last = await base44.asServiceRole.entities.VIPShowContract.filter({ venue_id: venueId }, '-created_date', 1);
          if (last?.[0]?.chain_seal) prevSeal = last[0].chain_seal;
        } catch (_) { /* genesis */ }
        const chainSeal = await sha256Hex(prevSeal + recordHash);

        record.verify_ref = chainSeal.slice(0, 12).toUpperCase();
        record.record_hash = recordHash;
        record.prev_seal = prevSeal;
        record.chain_seal = chainSeal;
        record.anchor = { status: 'ANCHOR_PENDING_SERVER', protocol: 'OpenTimestamps→Bitcoin' };

        const res = await base44.functions.invoke('vipShowContractIngest', {
          mode: 'DEMO',
          writes: [{ entity: 'VIPShowContract', op: 'create', data: record }],
          invariants: { total_sales_equals_components: true },
        });
        const out = res?.data || res;
        if (out?.ok) results.vip_show.push({ verify_ref: record.verify_ref, contract_ref: contractRef, total, anchor: out.anchor });
        else results.errors.push('vip_show: ' + (out?.error || 'unknown'));
      } catch (e) { results.errors.push('vip_show: ' + (e as Error).message); }
    }

    await base44.asServiceRole.entities.SystemAuditLog.create({
      event_type: 'DEMO_SEALED_CONTRACTS_SEEDED',
      description: `Demo sealed contracts seeded for ${venueId} — ${results.glyphbucks.length} GlyphBucks, ${results.vip_show.length} VIP Show (mode: DEMO)`,
      actor_email: user.email,
      metadata: { venue_id: venueId, clear_existing: clearExisting, results },
      status: results.errors.length ? 'partial' : 'success',
    }).catch(() => {});

    return Response.json({ ok: results.errors.length === 0, venue_id: venueId, ...results });
  } catch (error) {
    return Response.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
});