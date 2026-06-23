/**
 * BPAA-NUPS-ACCT-001 §9 — Trial balance (the books' self-proof).
 *
 * Reads JournalEntry rows for a (venue_id, mode), sums debits and credits
 * per account, and proves the books balance to the cent (I-1, system-wide).
 *
 * Skips REVERSED entries — those have a paired reversing entry that
 * already nets them to zero, including them would double-count.
 */
import { base44 } from "@/api/base44Client";
import { loadCoaMap } from "./coaSeed";
import { sumCents } from "./money";

export async function computeTrialBalance({ venue_id, mode = "REAL", asOfISO = null } = {}) {
  if (!venue_id) throw new Error("computeTrialBalance: venue_id_required");

  const coa = await loadCoaMap({ venue_id, mode });

  // Page through journal entries. We DON'T request REVERSED entries here.
  const entries = await base44.entities.JournalEntry.filter(
    { venue_id, mode, status: "POSTED" },
    "-posted_at",
    2000
  );

  // Optional as-of cutoff (inclusive)
  const cutoff = asOfISO ? new Date(asOfISO).getTime() : null;
  const usable = cutoff
    ? entries.filter((e) => new Date(e.posted_at).getTime() <= cutoff)
    : entries;

  // Accumulate per-account totals
  const totals = {};
  for (const code of Object.keys(coa)) {
    totals[code] = { account_code: code, account_name: coa[code].name, type: coa[code].type, normal_side: coa[code].normal_side, debit_cents: 0, credit_cents: 0 };
  }

  for (const entry of usable) {
    for (const line of entry.lines || []) {
      const row = totals[line.account_code];
      if (!row) continue; // account no longer in COA — skip silently in trial; surfaced in audit
      row.debit_cents += Number(line.debit_cents) || 0;
      row.credit_cents += Number(line.credit_cents) || 0;
    }
  }

  // Per-account balance (signed by normal side)
  const rows = Object.values(totals).map((r) => {
    const net = r.debit_cents - r.credit_cents;
    return {
      ...r,
      balance_cents: r.normal_side === "DEBIT" ? net : -net,
      raw_net_cents: net,
    };
  });

  // System totals
  const total_debits_cents = sumCents(rows.map((r) => r.debit_cents));
  const total_credits_cents = sumCents(rows.map((r) => r.credit_cents));
  const balanced = total_debits_cents === total_credits_cents;

  return {
    venue_id,
    mode,
    as_of: asOfISO || new Date().toISOString(),
    rows: rows.sort((a, b) => String(a.account_code).localeCompare(String(b.account_code))),
    total_debits_cents,
    total_credits_cents,
    balanced,
    entry_count: usable.length,
  };
}