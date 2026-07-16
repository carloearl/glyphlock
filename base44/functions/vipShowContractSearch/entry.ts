// DACO VIP SHOW CONTRACT SYSTEM v2 — STAFF SEARCH
// Searchable, printable retrieval tied to membership. Matches guest name,
// membership_id, verify_ref, contract_ref; optional from/to dates; mode
// defaults REAL (DEMO/SANDBOX never mix into REAL views).
// Returns the stored sealed record for reprint — reprints render from
// evidence, hashes are never regenerated. RBAC: page is Manager+ gated;
// this endpoint requires an authenticated staff session.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { q = '', from, to, mode = 'REAL', limit = 50 } = await req.json();
    const rows = await base44.asServiceRole.entities.VIPShowContract.filter(
      { mode }, '-executed_at', 300,
    );

    const needle = String(q).trim().toLowerCase();
    const fromTs = from ? new Date(from).getTime() : null;
    const toTs = to ? new Date(to).getTime() : null;

    const matched = rows.filter((r: any) => {
      if (fromTs && new Date(r.executed_at).getTime() < fromTs) return false;
      if (toTs && new Date(r.executed_at).getTime() > toTs) return false;
      if (!needle) return true;
      return [r.guest?.name, r.guest?.membership_id, r.membership_id, r.verify_ref, r.contract_ref]
        .some((v) => String(v || '').toLowerCase().includes(needle));
    }).slice(0, Number(limit) || 50);

    return Response.json({
      count: matched.length,
      mode,
      results: matched.map((r: any) => ({
        id: r.id,
        verify_ref: r.verify_ref,
        contract_ref: r.contract_ref,
        guest: r.guest?.name,
        membership_id: r.guest?.membership_id || r.membership_id,
        member_tier: r.guest?.member_tier,
        suite: r.staff?.suite,
        total: r.total,
        executed_at: r.executed_at,
        anchor_status: r.anchor?.status,
        reprint_url: '/v/' + r.verify_ref,
        // Stored sealed record for reprint — evidence copy, never re-hashed.
        record: r.sealed_json ? JSON.parse(r.sealed_json) : r,
        anchor: r.anchor || null,
      })),
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});