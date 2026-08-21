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
The migration guard prevents entropy: new bypasses fail CI. As of 2026-08-21 the baseline has decreased to **167/287** after Batch 15 migrated the live generic Admin Data Manager update/delete paths through `writeEntity()`. The remaining inventory has been classified in `docs/audits/NUPS-BATCH15-DIRECT-WRITE-CLASSIFICATION.md`: **0 live high-risk NUPS business bypasses**, 6 live-medium NUPS playlist/checklist calls, 33 explicit security/admin audit events, 12 domain events, 13 operational telemetry calls, 41 live writes elsewhere in the combined GlyphLock app, and 62 demo/seed/sandbox/legacy/internal calls. The raw count is therefore not equivalent to unresolved NUPS production risk.

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
**Status:** RESOLVED — LIVE VENUE RESOLUTION HARDENED

### Expected
Production/live paths resolve `venue_id` dynamically.

### Observed examples

Batch 13 removed the `StaffApplication` production venue default and changed live staff onboarding, GlyphBucks sale, GlyphBucks contract, and unified contract flows to resolve active venue dynamically. Batch 14 removed the remaining live backend fixed-venue dependencies from `nupsClockIn`, `registerVIPBills`, `vipContractGenerate`, the Stripe integration health probe, and the source-coded `getSessionVenueId` allow-list.

`nupsClockIn` now resolves pre-auth public mode from the canonical trusted `VenueTerminal` registry and fails closed when no trusted terminal venue exists. A temporary migration fallback accepts an already configured `VenuePaymentConfig.terminal_id` only when no trusted `VenueTerminal` record exists. Authenticated staff sessions and shifts use the assigned active Venue. VIP bill registration, contract generation, and `vipWorkflow` derive or validate venue from authenticated NUPS/kiosk identity, with explicit global-role cross-venue handling. `getSessionVenueId` validates against active Venue records rather than a manual source-code list.

Remaining Dream Palace / DP identifiers are classified as demo/sandbox fixtures, historical cleanup/migration code, documentation/schema examples, a rate-limit action label, or venue-specific legal contract text. None identified by the Batch 14 sweep is a live production `venue_id` fallback.

### Resolution
Live production venue resolution is dynamic and fail-closed. New venues no longer require source-code allow-list edits for session validation. Batch 15 also removed Dream Palace wording from the live `vipWorkflow` configuration seeder and replaced it with the resolved venue name.

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
**Status:** RESOLVED — CANONICAL IDENTITY + WORKFLOW PROJECTION

### Canonical ownership
`GuestProfile` is the canonical minimized, venue-scoped identity record. It owns the deterministic credential-derived `guest_id`, legal name components, DOB required for re-verification, credential jurisdiction/type, last four, expiration, age-verification state, visit timestamps, and identity status.

`VIPGuest` is the venue/VIP operational projection. It owns current check-in/location, tier, permitted contact/card-last-four metadata, VIP counts/spend aggregates, room/session state, and workflow status. It links to canonical identity through `guest_profile_id` and the shared `guest_id`.

### Resolution evidence
Batch 15 changed every identified live frontend and production-backend creation path:

- `GuestCheckIn` finds/creates `GuestProfile` before creating or updating `VIPGuest`.
- `GuestTracking` can no longer create an identity from a typed name; it requires an existing venue-scoped verified `GuestProfile`.
- `scanCustomerID` uses the same normalized credential hash, does not persist the temporary OCR URL, and stores minimized credential fields.
- `vipWorkflow.guestIntake` requires a verified ID or canonical profile and creates/updates only a linked VIP projection.
- `vipContractSign` requires protected evidence references, binds the contract to canonical `GuestProfile`, and does not copy the full government ID, raw signature, or protected media into `VIPGuest`.

`npm run check:nups-guest-identity` passes and scans all non-demo backend `VIPGuest.create()` paths for an explicit canonical-profile link. Historical `VIPGuest.id_number` data remains legacy-readable but is not written by current operational paths.

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

### Batch 13 evidence
Live paths including `GlyphBucksContract`, `IDScannerCamera`, `BarcodeFirstCapture`, and `ContractorOnboardingPanel` used generic `UploadFile` and persisted returned URL strings directly. Archive/search viewers were hardened to stop emitting raw protected-media URLs or rendering archived ID/thumbprint/hardcopy images directly until an authorized private retrieval path could be proven.

### Batch 14 progress
The application already exposed Base44 private-file primitives (`UploadPrivateFile` + `CreateFileSignedUrl`). Batch 14 introduced `ProtectedEvidence` as the opaque canonical reference layer plus server-side `registerProtectedEvidence` and `getProtectedEvidence` authorization. Live W-9, government-ID, entertainer-license, verification-media, hardcopy-contract, guest-photo, and thumbprint capture paths now use private file URIs; signed URLs are short-lived and generated only for temporary OCR/preview or authorized retrieval. Contract archive queries were additionally venue-scoped.

The issue remains OPEN because anonymous, wrong-role, and wrong-venue retrieval denial have not yet been exercised end-to-end with runtime identities. Static architecture is implemented; adversarial retrieval testing remains required.

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

## NUPS-0011 — Protected identity uploads lack a verified private retrieval boundary

**Severity:** CRITICAL  
**Invariant:** INV-07  
**Status:** OPEN — PRIVATE BOUNDARY IMPLEMENTED; RUNTIME AUTHZ TESTS PENDING

### Expected
Government IDs, entertainer credentials, W-9 scans, signatures, thumbprint imagery, and signed-contract evidence must be stored non-publicly and retrieved only through an authenticated, role/venue-authorized path.

### Observed
Several live workflows call generic `UploadFile`, retain the returned `file_url`, and later store that URL directly on identity/contract records. The repository does not prove that those returned URLs are signed, temporary, or access-controlled. The generic `FileStorage` schema itself describes `file_url` as a public URL, so its `is_public` metadata flag alone cannot be treated as proof about the underlying object URL.

### Immediate mitigation
Batch 13 removed direct protected-media links/images from `ContractViewer`, `ContractDetailCard`, and `ContractDetailModal`. Presence and hashes remain visible, but raw archived media URLs are not emitted by those viewers.

### Batch 14 implementation
`ProtectedEvidence` now stores opaque private Base44 `file_uri` references and evidence metadata. `registerProtectedEvidence` resolves the authenticated NUPS identity and enforces venue/classification registration rules. `getProtectedEvidence` authorizes by role + venue + evidence classification + purpose context, emits explicit security audit events, and returns only a 120-second signed URL. Live protected capture paths store `protected:<evidence-record-id>` references instead of permanent routable media URLs.

### Remaining resolution
Run synthetic end-to-end authorization tests proving anonymous retrieval denial, wrong-role denial, and wrong-venue denial. Do not re-enable raw archived media viewing until those tests pass.

---

## NUPS-0012 — API-key UI assumes retrievable plaintext secrets

**Severity:** HIGH  
**Invariant:** INV-07  
**Status:** OPEN — UI/SECRET-LIFECYCLE DRIFT

### Expected
API-key plaintext secrets are generated server-side, returned only once during creation/rotation, and never persisted or assumed retrievable from ordinary APIKey list records.

### Observed
The canonical `APIKey` schema stores `secret_key_hash`, not plaintext `secret_key`, and `generateAPIKey` returns the plaintext secret only at creation. Batch 14 removed client-side secret generation and direct APIKey update/delete security actions, but `DeveloperKeys` still contains legacy display/copy UI that references fields such as `key.secret_key`, `environment`, and `env_key` as though persisted keys were recoverable.

### Risk
The stale UI can mislead operators about secret recoverability, produce broken copy/export controls, and encourage future code to reintroduce plaintext secret persistence.

### Required resolution
Refactor API-key list/detail UI to display only persisted safe metadata. Show/copy a plaintext secret exclusively from the one-time creation/rotation response and then discard it from client state.

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
