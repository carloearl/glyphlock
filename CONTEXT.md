# NUPS CONTEXT — Layer 3 Domain State

**System:** Nexus Unified POS System (NUPS) inside the canonical GlyphLock application  
**Canonical Base44 app:** `697a087fb354faebb72df54b`  
**Canonical source repository:** `carloearl/glyphlock`  
**Canonical branch:** `main`  
**Mapped:** 2026-08-22 (America/Phoenix)

This file describes what NUPS currently is. It is knowledge, not agent instructions. When this file conflicts with frozen invariants, the invariant wins and the mismatch belongs in `KNOWN_ISSUES.md`.

## Product boundary

NUPS is the venue-operations subsystem inside the broader GlyphLock application. It shares the Base44 runtime with GlyphLock website/product surfaces, GlyphBot, QR/security tooling, audit tooling, and related services, but NUPS financial and venue records remain venue- and mode-scoped.

## Canonical runtime facts

- Base44 app `697a087fb354faebb72df54b` is the active deployment/runtime surface.
- GitHub `carloearl/glyphlock` branch `main` is the canonical source-history repository.
- Base44 and GitHub synchronization rules are defined in `AGENTS.md`.
- The current Base44 model contains **170 entity schemas** across GlyphLock; NUPS uses a substantial subset rather than a separate database.
- NUPS frontend is React/Vite with Base44 SDK entities/functions.
- NUPS backend functions live under `base44/functions/`.
- NUPS workflows live under `base44/workflows/`.

## Domain vocabulary

Guest · Customer · Entertainer · Staff · Manager · Owner · Driver · Venue · Credential · License · Profile · Check-In · Contract · Transaction · Register · Batch · Z Report · GlyphBucks · REAL · DEMO · SANDBOX

Retired term: **Dream Dollars** → GlyphBucks.

## Person model

NUPS currently has multiple purpose-specific person records:

- `GuestProfile` — durable, venue-scoped guest identity profile using a deterministic one-way credential-derived key and minimized credential storage.
- `VIPGuest` — venue/VIP workflow projection linked to canonical identity through `guest_profile_id` and `guest_id`; historical broader fields remain compatibility-only.
- `Entertainer` — independent-contractor profile, credential status, agreement status, payout-hold state, and venue scope.
- `NUPSUser` — staff/manager/owner operational account and PIN/RBAC layer on top of Base44 authentication.
- `DriverProfile` — driver credential/profile, signed QR reference, venue scope, and YTD payout state.
- `PersonRecord` — append-only snapshot/archive layer for entertainer/staff/guest/driver lifecycle evidence.

Guest identity ownership is resolved: `GuestProfile` is canonical minimized identity and `VIPGuest` is the operational projection. Other person classes remain purpose-specific and are not merged casually.

## Venue model

- `Venue` is the venue record.
- `VenueRateConfig` is the active per-venue operational/rate configuration and includes the venue ledger mode.
- `useActiveVenue()` stores the operator's selected venue in local storage under `nups_active_venue`, validates it against active `Venue` rows, and preserves legitimate multi-venue selection.
- Code must prefer the selected live venue record and never introduce a new hardcoded production venue id.
- `VenueTerminal` is the sole pre-authentication device-to-venue trust boundary. A device is accepted only when its exact stable ID is active and trusted for the venue. Payment configuration does not confer device trust.

## Mode model

Canonical ledger modes are:

- `REAL` — live operational ledger
- `DEMO` — demo/training ledger
- `SANDBOX` — development-only ledger

Canonical resolver: `src/lib/nups/modeResolver.js`.

Resolution order:

1. explicit request-context override
2. active `VenueRateConfig.mode` for the selected venue
3. legacy per-venue `SystemConfig`
4. legacy global `SystemConfig`
5. default `REAL`

Frontend operating presentation is layered by `src/hooks/useNUPSOperatingMode.js` and `src/lib/nups/operatingMode.js`:

- ledger `REAL` → operating `LIVE`
- ledger `DEMO` may present `DEMO` or session-scoped `TRAINING`
- ledger `SANDBOX` → operating `SANDBOX`

`TRAINING` is an operator mode on the DEMO ledger, not a fourth canonical ledger.

## Core financial model

- `POSTransaction` records POS transaction facts and separates `cash_sales`, `card_sales`, `gb_liability`, comps, fees, station, batch, venue, and mode.
- `POSBatch` groups shift/register activity.
- `POSZReport` records close/reconciliation output.
- `DailySettlement` provides venue/business-day settlement.
- `JournalEntry` is the append-only double-entry ledger with balanced embedded lines.
- `LedgerAccount` / `ChartOfAccounts` support venue-scoped accounting classification.
- `ReconciliationRecord`, `ReconciliationException`, `ResolutionRequest`, and `FinancialResolutionLog` provide reconciliation and controlled correction workflows.

Frozen sales rule: `total_sales = cash_sales + card_sales`.

## GlyphBucks model

GlyphBucks is a closed-loop stored-value liability subsystem, not ordinary revenue. Current entities include:

- `GlyphBucksLedger`
- `GlyphBucksTransaction`
- `GlyphBucksOrder`
- `GlyphBucksBatch`
- `GlyphBucksBill`
- `GlyphBucksSale`
- `SealRecord`
- `AssentEvidence`

Payment proof is separated through `PaymentRecord` and `PaymentVerificationLog` before protected issuance paths.

## Contracts / VIP

Active contract/VIP surfaces include:

- `VIPContract`
- `VIPSession`
- `VIPConfig`
- `VIPRoom`
- `VIPShowContract`
- `VIPContractRecord`
- `VenueContract`
- `ContractTermsConfig`
- `VerificationMedia`
- `ChargebackEvidence`

Several generations coexist for backward compatibility. New work must identify the authoritative workflow before writing against a contract entity.

## RBAC

Frontend canonical role mapping is defined in `src/config/roles.js`. Current UI roles include:

- manager
- bartender
- door_girl
- hostess
- security
- dj
- vip_hostess

The persistent `NUPSUser.role` enum is broader and includes platform/venue owner/manager, floor host, hostess, door girl, doorman, driver, performer, bartender, security, DJ, kiosk, demo, and sovereign roles. The adapter explicitly maps supported operational roles and fails closed for unknown or deliberately unmapped roles; DRIVER and PERFORMER do not silently inherit generic permissions.

## Write governance

Canonical write gateway: `src/lib/nups/writeEntity.js`.

The gateway currently provides:

- live identity rebind on protected writes
- venue/mode stamping
- role-scope enforcement
- financial invariant validation
- GlyphBucks leakage protection
- obsolete tip-split rejection
- `MigrationAuditLog` decision evidence
- observational `AuditEvent` emission
- user-facing `ActivityLog` mirroring

The repository is under a Tier-2-style migration guard: direct frontend writes are grandfathered by `config/nups-direct-write-legacy-manifest.json`, and CI prevents the count/signature set from increasing. The current state is **161/287** with zero new bypasses, zero live high-risk NUPS business bypasses, and zero live-medium NUPS business bypasses. The retained calls are classified rather than erased for numerical theater.

## CI / verification controls

Relevant scripts:

- `npm run check:nups-write-gateway`
- `npm run check:nups-frozen-rules`
- `npm run check:nups-isolation`
- `npm run check:nups-protected-evidence`
- `npm run check:nups-api-key-secrets`
- `npm run check:nups-guest-identity`
- `npm run check:nups-live-venue-boundaries`
- `npm run check:nups-terminal-governance`
- `npm run test:dj`
- `npm run check:nups-dj-continuity`
- `npm run audit:entities`
- `npm run audit:nups-ui`
- `npm run check:integrations`
- `npm run check:secrets`
- `npm run ci:base44`
- `npm run check:nups-batch16`
- `npm run check:nups-batch17`

Verified on 2026-08-22:

- write-gateway guard passed: 161/287 grandfathered writes, no new bypasses
- frozen financial/contractor rules passed
- mode/isolation checks passed
- protected-evidence policy and anonymous denial passed
- guest identity projection passed
- terminal governance and NKS2 runtime boundaries passed
- DJ continuity contracts and reducer tests passed
- lint, typecheck, UI audit, secret scan, integration boundaries, and production build passed

These checks prove their stated policies. Distinct authenticated protected-evidence sessions, real physical device commissioning, full browser workflow, and a real provider DJ soak remain separate operational acceptance evidence.

## Current operating context — 2026-08-22

Batches 9–16 completed the risk-prioritized NUPS write migration and security hardening program. The live NUPS operational queue is now zero high-risk and zero medium-risk direct frontend business writes. The raw remaining count is 161/287 because the combined GlyphLock application retains explicit security/domain events, operational telemetry, non-NUPS product writes, controlled demo/seed utilities, legacy compatibility and gateway internals.

Key current boundaries:

- `GuestProfile` owns canonical minimized guest identity.
- `VIPGuest` is a linked venue/VIP workflow projection.
- protected identity, tax, biometric and contract evidence uses private file storage plus `ProtectedEvidence` opaque references;
- anonymous protected-evidence retrieval is denied at the deployed endpoint;
- authenticated role/venue allow and denial tests plus signed-URL expiry remain acceptance work;
- `VenueTerminal` is the sole pre-authentication device-to-venue trust source;
- actual venue browsers and stations require one-time commissioning;
- NKS2 is the only supported kiosk session; NKS1 returns HTTP 410;
- the DJ runtime preserves persistent deck/session state across internal views.

Batch 17 is an operational acceptance and release-gate run. It must not be converted into another raw counter-reduction exercise. Its release verdict depends on authenticated protected-evidence tests, physical-device commissioning appropriate to the launch venue, full DEMO/SANDBOX workflow evidence, a real DJ continuity soak, GitHub Actions, and a rollback checkpoint.

Current handoff: `docs/NUPS-CURRENT-HANDOFF.md`.

