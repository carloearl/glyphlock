# NUPS KNOWN ISSUES — Layer 3 Domain State

**Mapped:** 2026-08-20  
**Rule:** confirmed defects and architecture drift get stable IDs. Do not erase history; close/supersede entries with evidence.

## NUPS-0001 — Write/audit invariant wording does not match live gateway

**Severity:** HIGH  
**Invariant:** INV-06  
**Status:** RESOLVED — ADR-0002 ACCEPTED

### Resolution
`docs/adr/ADR-0002-nups-audit-ledger-boundaries.md` accepts the live governed-write audit architecture:

1. `MigrationAuditLog` is the gateway decision/actor evidence ledger.
2. `AuditEvent` is the append-only observational business-event ledger.
3. `ActivityLog` is a best-effort operational mirror.
4. `SystemAuditLog` remains reserved for security/system/administrative events and is not required for every governed business write.

### Evidence
The decision matches the live entity schemas and `src/lib/nups/writeEntity.js` post-write audit path. INV-06 has been updated to reference ADR-0002.

---

## NUPS-0002 — Universal write gateway not yet achieved

**Severity:** HIGH  
**Invariant:** INV-06  
**Status:** OPEN — CONTROLLED MIGRATION

### Expected
All governed NUPS business writes converge on `writeEntity()` or an equivalent server-side governed path.

### Observed
`config/nups-direct-write-legacy-manifest.json` currently grandfathered **287 direct frontend entity writes**.

Verification on 2026-08-20:

`npm run check:nups-write-gateway` → PASS: `287/287 grandfathered frontend writes remain; no new bypasses.`

### Meaning
The migration guard prevents entropy: new bypasses fail CI. As of 2026-08-21 the baseline has decreased to **200/287** after the governed-write migration batches covering employee tips, contractor payouts/tax forms, Z-report creation, GlyphBucks/contract writes, guest/entertainer/driver/staff identity flows, customer profile writes, staff shift clock-outs, barcode-first hardcopy capture, privileged NUPS bootstrap, mode/configuration writes, venue settings, contract-terms editors, VIP session reports, and VIP room operational state. The remaining baseline includes live operational debt plus deliberately retained demo/seed/sandbox/legacy calls; it does not mean those exceptions have disappeared.

### Required resolution
Reduce the manifest monotonically, prioritizing financial, identity, contract, credential, payout, mode, and audit writes.

---

## NUPS-0003 — Legacy entertainer payroll naming/model remains in historical code

**Severity:** MEDIUM  
**Invariant:** INV-03  
**Status:** CONTAINED — ACTIVE UI REMOVED; HISTORICAL MIGRATION DEBT

### Expected
Entertainers are independent contractors and never enter employee payroll or employee tip-pool logic.

### Observed
The codebase still contains historical references to:

- `PayrollRecord` with `entertainer_id`, stage name, commissions, tips, withholding and payout fields
- `src/components/nups/EntertainerPayrollEngine.jsx`, including legacy direct create/update of `PayrollRecord`
- accounting/report surfaces that read historical `PayrollRecord` data

However, the active owner dashboard does not import or mount `EntertainerPayrollEngine`. The frozen-rule guard explicitly fails if it is reintroduced there. Current contractor onboarding uses `ContractorTaxForm`, and contractor-specific payout infrastructure exists through `ContractorPayout`.

### Static evidence
`npm run check:nups-frozen-rules` passed 2026-08-20 and reports entertainers excluded from employee payroll/tip-pool surfaces.

### Risk
The legacy component and historical entity naming can mislead future agents into reintroducing W-2 treatment if mounted again.

### Resolution / remaining work
The active UI boundary is now verified: entertainers are not mounted into employee payroll or employee tip-pool surfaces. Keep `EntertainerPayrollEngine` unmounted and treat its `PayrollRecord` writes as legacy code pending removal/migration. Historical `PayrollRecord` readers may remain for reporting, but new contractor payout functionality must use contractor-specific models. Do not delete historical records.

---

## NUPS-0004 — Hardcoded production venue fallbacks remain

**Severity:** HIGH  
**Invariant:** INV-05  
**Status:** OPEN

### Expected
Production/live paths resolve `venue_id` dynamically.

### Observed examples

- `src/lib/nups/accessRequestClient.js` falls back to `"dream_palace"`.
- `src/pages/VIPCommandCenter.jsx` falls back to `'dream_palace'`.
- `src/pages/GlyphBucksConsole.jsx` falls back to `"dream_palace"`.
- `src/components/nups/glyphbucks/GlyphBucksWorkspace.jsx` falls back to `'dream_palace'`.
- `NUPSAccessRequest` and `StaffApplication` schemas contain a default `venue_id` of `dream_palace`.

Demo-only `DEMO_VENUE_001` constants are not this defect when they are provably isolated from REAL mode.

### Required resolution
Replace production fallbacks with active/session venue resolution and fail closed when a required venue cannot be resolved.

---

## NUPS-0005 — TEST exists as a legacy/workflow mode outside canonical ledger enum

**Severity:** MEDIUM  
**Invariant:** INV-04  
**Status:** RESOLVED — NEW WRITES NORMALIZED; LEGACY TEST READABLE

### Expected
Canonical ledger modes are REAL, DEMO, SANDBOX. TRAINING rides on DEMO.

### Observed
Several access/VIP paths still use `TEST`, including:

- `src/lib/nups/accessRequestClient.js`
- `src/components/nups/kiosk/AccessRequestForm.jsx`
- `src/components/vip2/ContractWizard.jsx`
- schemas such as `VIPContract`, `VIPSession`, `VIPConfig`, `NUPSAccessRequest`, and `StaffApplication`

`ZReportGenerator` also treats `TEST` as demo-like data when filtering.

### Risk
A fourth pseudo-ledger label can create ambiguous isolation rules and reporting mistakes.

### Resolution
New access requests now use `SANDBOX` for technical test access and `DEMO` for training. New VIP contracts default to `DEMO`; the backend accepts only REAL/DEMO/SANDBOX for new contract creation. Historical `TEST` rows remain readable/cleanup-compatible and are labeled as legacy rather than treated as a fourth ledger. `MigrationAuditLog.mode` now accepts SANDBOX.

---

## NUPS-0006 — Persistent and frontend role vocabularies are not aligned

**Severity:** HIGH  
**Invariant:** Security/RBAC boundary  
**Status:** RESOLVED — FAIL-CLOSED ROLE MAPPING

### Expected
Every persistent NUPS role maps deliberately to a canonical permission role or has a deliberate no-access path.

### Observed
`NUPSUser.role` includes:

`PLATFORM_ADMIN, VENUE_OWNER, VENUE_MANAGER, FLOOR_HOST, HOSTESS, DOOR_GIRL, DOORMAN, DRIVER, PERFORMER, BARTENDER, SECURITY, DJ, KIOSK, DEMO, SOVEREIGN`

Resolved 2026-08-20: `src/config/roles.js` now explicitly maps SOVEREIGN, HOSTESS, DOOR_GIRL, DOORMAN and other supported roles; DRIVER and PERFORMER deliberately map to no generic RBAC role. Unknown role strings now return `null` and therefore receive no mapped permissions instead of silently inheriting bartender access.

`PlatformRole` / `UserRoleAssignment` also expose a narrower role set than `NUPSUser`.

### Risk
A role can fall into an unintended permission profile instead of failing closed.

### Required resolution
Create one canonical role vocabulary/adapter, explicitly map every persistent role, and replace permissive/default mapping with a deliberate fail-closed result for unknown roles.

---

## NUPS-0007 — Guest identity models overlap

**Severity:** MEDIUM  
**Invariant:** Security / identity consistency  
**Status:** OPEN — CONSOLIDATION

### Observed
`GuestProfile` is a minimized durable door profile using a one-way credential-derived ID and last-four credential storage, while `VIPGuest` retains a broader identity/payment-oriented shape including an `id_number` field.

### Risk
Different workflows can create separate records for the same person, producing search/contract retrieval inconsistencies and inconsistent PII handling.

### Required resolution
Define canonical guest identity ownership and explicit compatibility/projection rules. Do not blindly merge schemas or copy broad PII into `GuestProfile`.

---

## NUPS-0008 — Historical handoff documentation is stale relative to live code

**Severity:** MEDIUM  
**Status:** OPEN — DOC DEBT

### Observed
`src/docs/HANDOFF.md` records an earlier OMEGA state in which `writeEntity()` had few/no migrated callers, mode behavior differed, and several phases were unstarted. The live repository now has gateway CI guards, expanded accounting, mode hooks, audit emitters, VIP/payment systems, and many later changes.

### Authority rule
This historical document is useful evidence, but it ranks below current verified production/code behavior and accepted modern ADR/domain state.

### Required resolution
Mark the old handoff historical/superseded or publish a current handoff that points to the Layer 3 files.

---

## NUPS-0009 — Identity-file privacy needs path-level verification

**Severity:** HIGH  
**Invariant:** INV-07  
**Status:** OPEN — VERIFY

### Observed
Protected identity/credential entities reference uploaded media URLs. Generic `FileStorage` supports an `is_public` flag (default false), while some identity records store direct URL fields.

### Unknown
This mapping did not prove that every identity upload path forces non-public storage and rejects public-addressable identity evidence.

### Required resolution
Trace entertainer, guest, driver, contract, thumbprint, ID-front/back, W-9, and verification-media upload functions. Prove access control at the storage and retrieval boundary.

---

## NUPS-0010 — Integration maturity is not uniformly persisted

**Severity:** MEDIUM  
**Status:** OPEN

### Observed
The repository has rich integration code (Stripe, OHIP, Drive, QuickBooks-style exports), but current maturity is often represented in UI state or historical notes rather than one authoritative integration-status record.

### Required resolution
Persist per-integration/per-environment state using the standard ladder:

`configured → connected → authenticated → request succeeded → response validated → end-to-end verified`

Store non-secret evidence and test timestamp. Never promote from settings alone.

---

## Closed / controlled findings from this mapping

### NUPS-C001 — No new direct-write bypasses

**Status:** CONTROL PASS  
**Evidence:** `npm run check:nups-write-gateway` passed 2026-08-20 with 287/287 grandfathered writes and zero new bypasses.

### NUPS-C002 — Frozen static rules pass

**Status:** CONTROL PASS  
**Evidence:** `npm run check:nups-frozen-rules` passed 2026-08-20.

### NUPS-C003 — Mode-boundary consolidation guard passes

**Status:** CONTROL PASS  
**Evidence:** `npm run check:nups-isolation` passed 2026-08-20.
