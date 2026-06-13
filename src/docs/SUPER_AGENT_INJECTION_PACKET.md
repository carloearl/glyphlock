# SUPER AGENT INJECTION PACKET — EXEC-01 → EXEC-02 CHAIN
## Packet ID: DACO-20260613-SAIP-01
## Issued: 2026-06-13 (America/Phoenix)
## Authority: DACO (Carlo René Earl / GlyphLock LLC)
## Target: Normal Agent (cold-start, no prior context)
## Status: ARMED — inject when ready to begin EXEC-01

---

## 0. PURPOSE OF THIS PACKET

You (the receiving agent) are being injected into an in-flight NUPS run with
**no prior memory** of the conversation that produced the directives. This
packet contains:

1. **Pre-injection state** — what the codebase looks like right now, what's
   done, what's not.
2. **Directive stack** — the binding documents you must obey in order.
3. **Execution sequence** — exactly what to do, in what order, with what
   verification gates.
4. **Post-injection state** — what the codebase must look like when you're
   done.
5. **The literal injection prompt** — the message DACO will paste into your
   chat window to start your run.

Read this packet end-to-end before touching a single file. If anything in
this packet contradicts itself or the directives, **stop and escalate** —
do not guess.

---

## 1. PRE-INJECTION STATE (YOU ARE HERE)

### 1.1 Platform
- **Base44 app:** `697a087fb354faebb72df54b` — NUPS (Nexus Unified Portal System)
- **Framework:** Vite + React + Tailwind, Base44 entity/function backend
- **Auth:** Base44 platform auth + `NUPSUser` role layer (PIN-based)
- **Mode resolver:** `src/lib/nups/modeResolver.js` — three-layer (session →
  SystemConfig → default DEMO)
- **Write gateway:** `src/lib/nups/writeEntity.js` — Tier 1 (observe-only)

### 1.2 Compliance State
- **BPAAA v3.0** in force. Append-only `ActivityLog`. No retroactive edits.
- **DACO OMEGA v6.0** governance. SOVEREIGN account (Carlo) bound via
  `SystemConfig.sovereign_user_id`.
- **Phases 0–3 of OMEGA:** DONE.
- **Phase 4 (writeEntity gateway):** DONE (Tier 1 observe-only).
- **Phase 5 (integrityCheck):** DONE.
- **Phase 6 (demo seed/clear):** DONE.
- **Phase 7 (Tier 2 promotion):** BLOCKED — requires shell + git access
  Base44 doesn't expose. Documented in `docs/TIER_DETECTION.md`.

### 1.3 Most Recent Work (last 7 days)
- `PayoutSafetyLimit` entity created with per-venue safety thresholds.
- `dailyPayoutSafetyAudit` and `dailyComplianceDigest` backend functions
  built and scheduled (03:00 and 07:00 Phoenix daily).
- `DriverPayout` entity has `payout_status` (PENDING/PROCESSED), settlement
  rollup wired through `DailySettlement`.
- `ActivityLogViewer`, `DailySettlementDashboard`, `DriverPayoutHistory`
  admin pages live behind role gates.

### 1.4 Open Threads (DO NOT TOUCH UNLESS DIRECTED)
- `PayoutSafetyLimit.notify_emails` and `compliance_digest_emails` are empty.
  Carlo populates these out-of-band when ready to activate alerting.
- `VenueRateConfig` driver-tier overrides: TBD whether runtime-written or
  seed-only. See Patch B §B.4.

---

## 2. DIRECTIVE STACK (READ IN THIS ORDER)

You MUST read these documents in this exact order before executing anything.
Each builds on the previous. A conflict between two documents is resolved by
**the later-issued one winning** (Patch B > Patch A > original ID-01).

| Order | Document | Path |
|---|---|---|
| 1 | DACO OMEGA v6.0 Handoff | `docs/HANDOFF.md` |
| 2 | writeEntity Gateway Spec | `docs/GATEWAY.md` |
| 3 | Tier Detection Rationale | `docs/TIER_DETECTION.md` |
| 4 | **ID-01 Quarantine Directive** (EXEC-01) | (Referenced — Carlo's master prompt) |
| 5 | **Patch A** — entity allowlist/denylist + sequencing | (Referenced — Carlo's tightening pass) |
| 6 | **Patch B** — three edge-case clauses | `docs/DIRECTIVE_PATCH_B.md` |
| 7 | **Phase 4 stub** (EXEC-02) | `docs/DIRECTIVE_PHASE4_QR_RECEIPT_ENCODER.md` |

If documents 4 or 5 are not in the repo, **STOP and request them from DACO**
before proceeding. Do not reconstruct them from memory or guess their content.

---

## 3. EXECUTION SEQUENCE

### 3.1 EXEC-01 — ID-01 Driver/Device Quarantine

**Pre-flight gates** (all must be green before you write a single line of code):

- [ ] Documents 1–6 above read end-to-end.
- [ ] `NUPSUser` entity confirmed live with `sovereign_flag` and `SOVEREIGN`
      role enum value.
- [ ] `MigrationAuditLog` and `SystemConfig` entities confirmed live.
- [ ] `ActivityLog` entity confirmed live and append-only RLS verified.
- [ ] Mode resolver returns a non-null mode for the current session.

**Phase 0 — Hardware bring-up proofs (mode-agnostic per Patch B §B.3):**
- 0.1 Power/data continuity check on door station device.
- 0.2 Peripheral enumeration (scanner, printer, camera).
- 0.3 Print/scan round-trip verification.
- 0.4 Synthetic queued write (mode-stamped, first pass DEMO/SANDBOX).

**Phase 1B — Driver onboarding flow:**
- Allowed entities: `Driver`, `DriverCredential`.
- Denied entities: anything matching `employee|staff|badge|shift|time_clock|identity`.
- Mode-stamping: DEMO/SANDBOX first, REAL only after green proof.
- Per Patch B §B.4: if 1B.3 writes new rows to `VenueRateConfig`, mode-stamp
  them. If seed-only, ignore the clause.

**Phase 1C — Device registration gate:**
- Allowed entities: `DoorStationDevice`, `DeviceAuditEvent`.
- Per Patch B §B.1: `DeviceAuditEvent` is EXEMPT from the registration gate.
  It is written by the gateway (actor = SYSTEM), not by the device.
- Per Patch B §B.2: a failed device write rolls back the transactional record
  fully, but the audit event MUST be written. They are different lanes.
- The gateway MUST NOT recurse: if a `DeviceAuditEvent` write itself fails,
  log to `MigrationAuditLog` and stop. Do not generate a second audit event
  about the first.

**Verification gates (G-1 through G-5):**
- G-1 Code proof: files exist in repo.
- G-2 Build proof: Base44 saves without error.
- G-3 Live proof: writes appear in entity browser.
- G-4 Validator proof: `runIntegrityCheck()` returns `passed=true` for the
  new flow.
- G-5 Regression proof: existing POS / settlement / payout flows unchanged.

**Close criteria:** All gates green. Update `docs/HANDOFF.md` with Phase 1B
and 1C status. Mark EXEC-01 as DONE.

### 3.2 EXEC-02 — QR / Receipt Encoder (Phase 4)

**Do NOT start EXEC-02 until EXEC-01 is closed and locked.**

Read `docs/DIRECTIVE_PHASE4_QR_RECEIPT_ENCODER.md` cover to cover. Confirm
all execution gates listed there are green. Then follow the resume
instructions in that document.

---

## 4. POST-INJECTION STATE (WHEN YOU'RE DONE)

### 4.1 Entities (new / extended after EXEC-01)
- `Driver` — live, mode-stamped writes only.
- `DriverCredential` — live, mode-stamped writes only.
- `DoorStationDevice` — live, registration gate enforced.
- `DeviceAuditEvent` — live, system-actor writes only, exempt from
  registration gate.

### 4.2 Files (new after EXEC-01)
- `src/lib/nups/driverGate.js` — driver entity write gate.
- `src/lib/nups/deviceGate.js` — device registration gate (with Patch B §B.1
  exemption logic).
- `functions/registerDoorStationDevice.js` — SOVEREIGN-gated.
- `functions/onboardDriver.js` — manager-gated.
- Test stubs under `src/lib/nups/__tests__/` (run via integrityCheck).

### 4.3 Documentation updates
- `docs/HANDOFF.md` updated with EXEC-01 close summary.
- New file: `docs/EXEC-01_CLOSE_REPORT.md` — what shipped, what's deferred,
  what regressions were checked.

### 4.4 What MUST NOT have changed
- No edits to financial-flow files (`closePOSBatch`, `generateZReport`,
  `generateDailySettlement`).
- No edits to `total_sales` calculation.
- No edits to `ActivityLog` RLS.
- No edits to `NUPSUser.sovereign_flag` bootstrap.
- No new secrets requested unless EXEC-02 requires them (it doesn't).

---

## 5. THE LITERAL INJECTION PROMPT

Paste this verbatim into the Normal Agent's chat when ready to begin:

```
You are the Normal Agent for NUPS app 697a087fb354faebb72df54b.

Before doing anything else:

1. Read docs/SUPER_AGENT_INJECTION_PACKET.md end-to-end.
2. Read every document listed in §2 of that packet, in the order given.
3. Acknowledge in your first reply by listing:
   (a) the documents you read,
   (b) the pre-flight gates from §3.1 with green/red status for each,
   (c) the first three concrete actions you will take.

Do NOT write code, edit entities, or call backend functions until I
reply "PROCEED" after reviewing your acknowledgement.

Operating mode: BPAAA v3.0 compliance, DACO OMEGA v6.0 governance,
Tier 1 (observe-only) writeEntity gateway. Mode resolver default is
DEMO. SOVEREIGN account is bound — do not attempt to rebind.

Hard constraints:
- No new entities outside §4.1 of the packet.
- No edits to files in the "MUST NOT have changed" list in §4.4.
- No new secrets.
- Patch B §B.1, §B.2, §B.3 are binding and override any literal reading
  of Patch A or the original ID-01 directive.

If any directive contradicts another, the later-issued one wins
(Patch B > Patch A > ID-01). If you find a contradiction the packet
doesn't resolve, STOP and escalate. Do not guess.

Begin.
```

---

## 6. ESCALATION TRIGGERS (STOP-THE-LINE)

You MUST stop work and escalate to DACO if any of these happen:

| Trigger | Why |
|---|---|
| Documents 4 or 5 (ID-01 / Patch A) missing from repo | Cannot execute blind |
| `runIntegrityCheck()` returns `passed=false` on baseline | Pre-existing regression — diagnose, don't paper over |
| A directive clause contradicts itself and Patch B doesn't resolve it | Authorial intent unclear |
| Any file in §4.4 ("MUST NOT have changed") needs to be edited | Out of scope — requires new directive |
| Patch B §B.1 audit recursion observed in any code path | Stop-the-line per Patch B enforcement |
| `total_sales` calculation drifts from `cash_sales + card_sales` | BPAAA violation — immediate halt |

---

## 7. END-OF-RUN HANDOFF

When EXEC-01 closes:

1. Write `docs/EXEC-01_CLOSE_REPORT.md` with:
   - Phase-by-phase status (Phase 0 / 1B / 1C).
   - G-1 through G-5 results for each phase.
   - Files created / modified.
   - Known gaps (per CP-6 honesty rule — do not claim what isn't true).
   - Whether EXEC-02 pre-flight gates are now green.
2. Append a one-line entry to `docs/HANDOFF.md` under "PHASE STATUS".
3. Reply to DACO with: "EXEC-01 closed. Awaiting PROCEED for EXEC-02."

Do not auto-start EXEC-02. Wait for explicit go.

---

## CHANGE LOG

| Version | Date | Note |
|---|---|---|
| SAIP-01 | 2026-06-13 | Initial issue. Chains EXEC-01 (ID-01 + Patch A + Patch B) into EXEC-02 (Phase 4 QR/Receipt). |