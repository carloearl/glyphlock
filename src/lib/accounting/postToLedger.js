/**
 * BPAA-NUPS-ACCT-001 §4 — The posting engine.
 *
 * ONE gateway. Every money source eventually calls this. The gateway:
 *   1. Validates actor + venue scope
 *   2. Resolves & verifies account codes against the LedgerAccount config (I-10)
 *   3. Validates line shape (I-2 integer cents, exactly one of debit/credit > 0)
 *   4. Validates the entry balances (I-1: sum debits === sum credits)
 *   5. Checks idempotency (I-4): same idempotency_key => no-op, returns the prior entry
 *   6. Writes ONE JournalEntry via writeEntity() — atomic header+lines (I-3, I-11)
 *
 * Failure modes are fail-CLOSED — no partial writes ever. On any validation
 * miss this function throws BEFORE the write attempt.
 */
import { base44 } from "@/api/base44Client";
import { writeEntity } from "@/lib/nups/writeEntity";
import { assertCents, sumCents } from "./money";
import { loadCoaMap } from "./coaSeed";

/**
 * Post a balanced journal entry.
 *
 * @param {Object} args
 * @param {string} args.venue_id          REQUIRED — tenant scope (I-9)
 * @param {string} args.source_type       REQUIRED — one of JournalEntry.source_type enum
 * @param {string} args.source_id         REQUIRED — id of originating record
 * @param {string} args.idempotency_key   REQUIRED — unique per source event (I-4)
 * @param {Array}  args.lines             REQUIRED — [{ account_code, debit_cents, credit_cents, memo? }, …]
 * @param {string} [args.memo]
 * @param {string} [args.reverses_entry_id]   set ONLY when posting a reversal
 * @param {Object} args.actor             REQUIRED — { id, email, role }
 * @param {string} [args.mode]            optional — defaults to global mode
 *
 * @returns {Promise<{ ok: true, entry, idempotent: boolean }>}
 */
export async function postToLedger({
  venue_id,
  source_type,
  source_id,
  idempotency_key,
  lines,
  memo = "",
  reverses_entry_id = null,
  actor,
  mode,
}) {
  // ── A. Argument shape ────────────────────────────────────────
  if (!venue_id) throw new Error("postToLedger: venue_id_required (I-9)");
  if (!source_type) throw new Error("postToLedger: source_type_required");
  if (!source_id) throw new Error("postToLedger: source_id_required");
  if (!idempotency_key) throw new Error("postToLedger: idempotency_key_required (I-4)");
  if (!Array.isArray(lines) || lines.length < 2) {
    throw new Error("postToLedger: at_least_two_lines_required");
  }
  if (!actor || !(actor.id || actor.email)) {
    throw new Error("postToLedger: actor_required");
  }

  // Resolve the mode the same way writeEntity does (SystemConfig.global)
  const resolvedMode = mode || (await resolveActiveMode());

  // ── B. Idempotency (I-4) ─────────────────────────────────────
  // If this idempotency_key already posted in this (venue, mode), return
  // the prior entry as a no-op. NEVER double-post.
  const prior = await base44.entities.JournalEntry.filter(
    { venue_id, mode: resolvedMode, idempotency_key },
    null,
    1
  );
  if (prior && prior.length) {
    return { ok: true, entry: prior[0], idempotent: true };
  }

  // ── C. COA resolution (I-10) ─────────────────────────────────
  const coa = await loadCoaMap({ venue_id, mode: resolvedMode });
  if (Object.keys(coa).length === 0) {
    throw new Error(
      `postToLedger: no_chart_of_accounts_for_venue: ${venue_id}/${resolvedMode} — seed it first`
    );
  }

  // ── D. Line validation (I-2 integer cents, shape) ────────────
  const normalizedLines = [];
  for (let i = 0; i < lines.length; i += 1) {
    const ln = lines[i];
    if (!ln || !ln.account_code) {
      throw new Error(`postToLedger: line[${i}].account_code_required`);
    }
    const acct = coa[ln.account_code];
    if (!acct) {
      throw new Error(`postToLedger: line[${i}].account_code_unknown: ${ln.account_code}`);
    }
    if (acct.active === false) {
      throw new Error(`postToLedger: line[${i}].account_inactive: ${ln.account_code}`);
    }

    const dr = Number(ln.debit_cents) || 0;
    const cr = Number(ln.credit_cents) || 0;
    if (dr === 0 && cr === 0) {
      throw new Error(`postToLedger: line[${i}].must_have_debit_or_credit`);
    }
    if (dr !== 0 && cr !== 0) {
      throw new Error(`postToLedger: line[${i}].cannot_have_both_debit_and_credit`);
    }
    if (dr < 0 || cr < 0) {
      throw new Error(`postToLedger: line[${i}].negative_amount_forbidden — use a reversing entry`);
    }
    // I-2 — integer cents, no floats.
    if (dr !== 0) assertCents(dr, `line[${i}].debit_cents`);
    if (cr !== 0) assertCents(cr, `line[${i}].credit_cents`);

    normalizedLines.push({
      account_code: ln.account_code,
      debit_cents: dr,
      credit_cents: cr,
      memo: ln.memo || "",
    });
  }

  // ── E. Balance check (I-1) ───────────────────────────────────
  const totalDr = sumCents(normalizedLines.map((l) => l.debit_cents));
  const totalCr = sumCents(normalizedLines.map((l) => l.credit_cents));
  if (totalDr !== totalCr) {
    throw new Error(
      `postToLedger: unbalanced_entry — debits=${totalDr} credits=${totalCr} (I-1)`
    );
  }
  if (totalDr === 0) {
    throw new Error("postToLedger: zero_value_entry_forbidden");
  }

  // ── F. Write (atomic, append-only, via writeEntity I-11) ─────
  const result = await writeEntity({
    entity: "JournalEntry",
    operation: "create",
    actor,
    venue_id,
    intent: `postToLedger:${source_type}:${source_id}`,
    requestContext: { mode: resolvedMode },
    data: {
      venue_id,
      mode: resolvedMode,
      posted_at: new Date().toISOString(),
      source_type,
      source_id,
      idempotency_key,
      actor_user_id: actor.id || actor.email,
      actor_email: actor.email || null,
      memo,
      reverses_entry_id,
      status: "POSTED",
      lines: normalizedLines,
      total_debits_cents: totalDr,
      total_credits_cents: totalCr,
    },
  });

  if (!result.ok) {
    throw new Error(`postToLedger: write_failed: ${result.block_reason || "unknown"}`);
  }

  // If this is a reversal, flip the original entry to REVERSED.
  if (reverses_entry_id) {
    try {
      const mark = await writeEntity({
        entity: "JournalEntry",
        operation: "update",
        id: reverses_entry_id,
        data: { status: "REVERSED", venue_id, mode: resolvedMode },
        actor,
        venue_id,
        intent: `postToLedger:mark_reversed:${reverses_entry_id}`,
        requestContext: { mode: resolvedMode },
      });
      if (!mark?.ok) throw new Error(mark?.block_reason || "journal reversal status update rejected");
    } catch (e) {
      // Don't fail the reversal — log only. The reversal entry itself is the legal record.
      console.warn("postToLedger: could_not_mark_original_REVERSED", e?.message);
    }
  }

  return { ok: true, entry: result.value, idempotent: false };
}

/**
 * Build a reversal entry for an existing JournalEntry. Flips debits and
 * credits one-for-one. Idempotency key = original's key + ':reversal'.
 *
 * Caller still supplies actor + memo so we know WHO reversed and WHY.
 */
export async function reverseEntry({ entry_id, actor, memo = "" }) {
  if (!entry_id) throw new Error("reverseEntry: entry_id_required");
  const original = await base44.entities.JournalEntry.get(entry_id);
  if (!original) throw new Error(`reverseEntry: entry_not_found: ${entry_id}`);
  if (original.status === "REVERSED") {
    throw new Error("reverseEntry: already_reversed");
  }

  const flipped = (original.lines || []).map((l) => ({
    account_code: l.account_code,
    debit_cents: Number(l.credit_cents) || 0,
    credit_cents: Number(l.debit_cents) || 0,
    memo: l.memo,
  }));

  return postToLedger({
    venue_id: original.venue_id,
    mode: original.mode,
    source_type: "REVERSAL",
    source_id: original.id,
    idempotency_key: `${original.idempotency_key}:reversal`,
    lines: flipped,
    memo: memo || `Reversal of ${original.id}`,
    reverses_entry_id: original.id,
    actor,
  });
}

async function resolveActiveMode() {
  const rows = await base44.entities.SystemConfig.filter({ config_key: "global" }, null, 1);
  if (rows && rows[0]?.mode) return rows[0].mode;
  return "REAL";
}