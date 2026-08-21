# NUPS CONTEXT — Layer 3 Domain State

**System:** Nexus Unified POS System (NUPS) inside the canonical GlyphLock application  
**Canonical Base44 app:** `697a087fb354faebb72df54b`  
**Canonical source repository:** `carloearl/glyphlock`  
**Canonical branch:** `main`  
**Mapped:** 2026-08-20 (America/Phoenix)

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
- `VIPGuest` — VIP workflow guest record; legacy/operational fields remain broader than `GuestProfile`.
- `Entertainer` — independent-contractor profile, credential status, agreement status, payout-hold state, and venue scope.
- `NUPSUser` — staff/manager/owner operational account and PIN/RBAC layer on top of Base44 authentication.
- `DriverProfile` — driver credential/profile, signed QR reference, venue scope, and YTD payout state.
- `PersonRecord` — append-only snapshot/archive layer for entertainer/staff/guest/driver lifecycle evidence.

Canonical profile consolidation is still in progress; see `KNOWN_ISSUES.md` for overlapping identity models.

## Venue model

- `Venue` is the venue record.
- `VenueRateConfig` is the active per-venue operational/rate configuration and includes the venue ledger mode.
- `useActiveVenue()` stores the operator's selected venue in local storage under `nups_active_venue`, validates it against active `Venue` rows, and preserves legitimate multi-venue selection.
- Code must prefer the selected live venue record and never introduce a new hardcoded production venue id.

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

The persistent `NUPSUser.role` enum is broader and includes platform/venue owner/manager, floor host, hostess, door girl, doorman, driver, performer, bartender, security, DJ, kiosk, demo, and sovereign roles. This creates mapping drift that must be treated deliberately; see `KNOWN_ISSUES.md`.

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

The repository is under a Tier-2-style migration guard: direct frontend writes are grandfathered by `config/nups-direct-write-legacy-manifest.json`, and CI prevents the count/signature set from increasing. The mapped baseline on 2026-08-20 is **287 grandfathered direct frontend writes**.

## CI / verification controls

Relevant scripts:

- `npm run check:nups-write-gateway`
- `npm run check:nups-frozen-rules`
- `npm run check:nups-isolation`
- `npm run audit:entities`
- `npm run audit:nups-ui`
- `npm run check:integrations`
- `npm run check:secrets`
- `npm run ci:base44`

Verified on 2026-08-20:

- write-gateway guard passed: 287/287 grandfathered writes, no new bypasses
- frozen-rules check passed
- mode/isolation check passed

These checks prove their stated static policies only; they do not by themselves prove live end-to-end venue workflows.
