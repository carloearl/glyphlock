# DIRECTIVE PATCH B — ID-01 Quarantine Edge Cases
## Appendix to: DACO-20260611-ID01 (Driver/Device Quarantine Directive)
## Issued: 2026-06-13 (America/Phoenix)
## Authority: DACO (Carlo René Earl / GlyphLock LLC)
## Status: BINDING — apply before any Phase 1B / 1C execution begins.

---

## PURPOSE

Patch A tightened the quarantine fence with explicit entity allowlists/denylists
and DEMO/SANDBOX-before-REAL sequencing. Three implementation traps remain that
a literal agent reading will hit. This patch resolves them with directive
language so the Normal Agent cannot interpret the rules as self-contradictory
at execution time.

---

## §B.1 — DeviceAuditEvent Is Exempt From the Registration Gate

### Rule
The 1C registration gate validates that a device is registered in
`DoorStationDevice` before accepting writes **originating from that device**.
The gate does **NOT** apply to `DeviceAuditEvent` writes generated **about**
that device by the gate itself.

### Rationale
An unregistered device that attempts a write triggers (a) write rejection
and (b) a `DeviceAuditEvent` record documenting the rejection. If the audit
write is routed through the same gate, the audit event is itself rejected
on the same ground — producing an infinite "device not registered" loop and
losing the very evidence the gate exists to capture.

### Agent guidance
- `DeviceAuditEvent` is in the allowlist for **system-originated writes**
  regardless of the source device's registration status.
- The audit event is written by the gateway, **not by the device**. The
  actor is `SYSTEM` (or the gate function's service-role identity), never
  the rejected device's identity.
- The gateway MUST NOT recurse: if a `DeviceAuditEvent` write itself fails
  for any reason, log to `MigrationAuditLog` and stop. Do not generate a
  second `DeviceAuditEvent` about the first one.

---

## §B.2 — "No Partial Records" Does Not Mean "No Audit Record"

### Rule
The "failed writes leave no partial records" rule applies to the **target
entity** of the failed write. It does **NOT** apply to audit/observability
records generated **about** the failure.

### Rationale
A literal reading collapses two lanes into one and produces silent failures
with no audit trail — the exact outcome the directive was written to prevent.

### Agent guidance
Two distinct lanes exist on every failed write:

| Lane | Record | On failure |
|---|---|---|
| **Transactional** | The intended target entity (e.g., `Driver`, `DriverPayout`) | Must roll back fully. No partial row. |
| **Observational** | The audit record (`DeviceAuditEvent`, `MigrationAuditLog`, `ActivityLog`) | Must be written. It is a complete, intended record of the failure — not a partial artifact of the failed transaction. |

The observational record is itself a *successful* write of a record whose
*content* describes a failure. It is not a partial record. The two MUST NOT
share a transaction boundary.

---

## §B.3 — Mode Stamping Applies to Record Writes Only

### Rule
The "DEMO/SANDBOX must pass before REAL" mode-stamping rule applies to
**record writes** (Phase 0.4 synthetic queued write, and all of Phases 1B
and 1C). It does **NOT** apply to hardware bring-up proofs (Phases 0.1
through 0.3): power/data continuity, peripheral enumeration, print/scan
verification.

### Rationale
Phases 0.1–0.3 produce no entity write. There is no record to stamp with
a mode. An agent attempting to assign one will stall waiting for a mode
context that does not exist.

### Agent guidance
- Phases 0.1, 0.2, 0.3: **mode-agnostic**. Document outcome in the run
  log (`docs/HANDOFF.md` or equivalent). No mode field required.
- Phase 0.4 onward: **mode-stamped**. First pass must be DEMO or SANDBOX.
  REAL is gated behind a green DEMO/SANDBOX proof per Patch A.

---

## §B.4 — VenueRateConfig Driver-Tier Override Rows (Conditional Note)

### Rule (conditional)
If Phase 1B.3 **creates new rows** in `VenueRateConfig` to express
driver-tier rate overrides (rather than referencing pre-seeded config
rows), those new rows are record writes and MUST follow the standard
mode-stamping rule from Patch A §3.

### Agent guidance
- Inspect the 1B.3 implementation plan before execution.
- If overrides are **config-seeded out-of-band** (loaded by a SOVEREIGN-gated
  seed script or hand-edited by an admin), this clause is inert — ignore it.
- If overrides are **created at runtime** during driver onboarding, mode-
  stamp them. DEMO/SANDBOX proof required before REAL writes are accepted.

---

## ENFORCEMENT NOTES

- Patch B is **additive** to Patch A. It overrides nothing; it disambiguates.
- If Patch B and Patch A appear to conflict on any specific point, Patch B
  wins — it is the later-issued directive.
- The Normal Agent MUST read Patch B before beginning Phase 0.4, 1B, or 1C.
- A run that violates §B.1 (audit recursion), §B.2 (silent failure), or
  §B.3 (mode-stamp on hardware proof) is a stop-the-line event. Roll back
  the offending phase and re-enter with the rule applied.

---

## CHANGE LOG

| Version | Date | Note |
|---|---|---|
| B.0 | 2026-06-13 | Initial issue. Covers DeviceAuditEvent exemption, audit-vs-partial distinction, mode-stamp scope, conditional VenueRateConfig clause. |