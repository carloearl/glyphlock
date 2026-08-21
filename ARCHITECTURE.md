# NUPS ARCHITECTURE — Layer 3 Domain State

**Mapped from live Base44 app:** `697a087fb354faebb72df54b`  
**Date:** 2026-08-20

## 1. System placement

```text
GlyphLock application
├── Public/company/product surfaces
├── GlyphBot / audit / QR / security tooling
└── NUPS venue operations
    ├── Identity & onboarding
    ├── Front door / check-in
    ├── Staff & RBAC
    ├── POS / batches / Z reports
    ├── VIP / contracts
    ├── GlyphBucks liability system
    ├── Drivers / payouts
    ├── Accounting / reconciliation
    ├── Audit / evidence
    ├── DJ / venue operations
    └── External integrations
```

NUPS is not a separate Base44 application. It is a large subsystem of the canonical GlyphLock app and shares the Base44 entity/function runtime.

## 2. Runtime and source boundary

- Runtime/deployment: Base44 app `697a087fb354faebb72df54b`
- Canonical source history: `carloearl/glyphlock`, branch `main`
- Frontend: React + Vite + Base44 SDK
- Backend: Base44 Deno functions under `base44/functions/`
- Workflows: `base44/workflows/`
- Entity schemas: Base44 entity model; 170 schemas across the full GlyphLock app at mapping time
- CI governance: GitHub workflow plus Base44 extension via `.base44/ci-checks.json`

## 3. NUPS frontend entry surfaces

The generated page registry and component tree expose NUPS operational surfaces including:

- `NUPSLanding`
- `NUPSPostLogin`
- `NUPSOwner`
- `NUPSStaff`
- `NUPSSandbox`
- `NUPSDemoManager`
- `NUPSAudit`
- `NUPSInfrastructurePage`
- front-door/check-in components
- bar/POS register components
- manager/batch/Z-report components
- VIP contract/room/session components
- accounting/reconciliation/settlement components
- entertainer onboarding/check-in/credential components
- driver tracking/payout components

`src/pages.config.js` is generated and should not be hand-maintained except for its supported configuration value.

## 4. Tenant / venue boundary

Primary records use `venue_id` for tenant isolation.

Venue resolution stack:

```text
Venue entity
  ↓
useActiveVenue()
  ↓
selected live Venue record
  ↓
venue-scoped config / queries / writes
```

Relevant files:

- `src/hooks/useActiveVenue.js`
- `src/lib/nups/venueRateConfig.js`
- `src/lib/nups/modeResolver.js`

`useActiveVenue()` persists the selected venue under `nups_active_venue`, validates it against active venues, and keeps a legitimate operator selection.

## 5. Environment boundary

Canonical ledger resolver: `src/lib/nups/modeResolver.js`.

```text
request context mode
      ↓
VenueRateConfig.mode
      ↓
legacy per-venue SystemConfig.mode
      ↓
legacy global SystemConfig.mode
      ↓
REAL default
```

Exports:

- `getMode(requestContext, venue_id)`
- `getActiveMode(venue_id)`
- `describeMode(venue_id)`
- `invalidateModeCache(venue_id)`

Operator presentation is handled by:

- `src/hooks/useNUPSOperatingMode.js`
- `src/lib/nups/operatingMode.js`

TRAINING is session-scoped presentation on the DEMO ledger. It is not a canonical financial ledger mode.

## 6. Write path

Desired architecture:

```text
UI / workflow
   ↓
writeEntity()
   ├── identity rebind
   ├── RBAC / role-scope gate
   ├── resolve venue + mode
   ├── stamp operational fields
   ├── validate frozen financial rules
   ├── execute Base44 entity mutation
   ├── MigrationAuditLog decision record
   ├── AuditEvent observational emission
   └── ActivityLog mirror
```

Canonical gateway: `src/lib/nups/writeEntity.js`.

Current migration reality: direct frontend entity writes still exist and are grandfathered by `config/nups-direct-write-legacy-manifest.json`. The guard passed on 2026-08-20 with **287/287** grandfathered calls and no new bypasses. Therefore the system is in a controlled migration state, not yet universal-gateway completion.

## 7. Identity architecture

### Staff / privileged actors

Base44 authentication is the underlying platform identity. NUPS overlays operational identity through `NUPSUser`, PIN controls, role assignment, and live identity rebind on protected writes.

Relevant files/entities:

- `NUPSUser`
- `UserRoleAssignment`
- `PlatformRole`
- `src/lib/nups/identityRebind.js`
- `src/lib/nups/identityVerify.js`
- `src/lib/nups/roleGate.js`

### Guests

Two significant guest models coexist:

- `GuestProfile` — minimized durable door identity model
- `VIPGuest` — older/richer VIP workflow model

The overlap is an architectural consolidation issue, not permission to merge fields casually.

### Entertainers

`Entertainer` is the contractor profile. `EntertainerShift` is operational presence. `ContractorTaxForm` and `ContractorPayout` are contractor-oriented tax/payout records.

### Drivers

`DriverProfile` is durable identity/profile. `DriverPayout` is per-night financial/disbursement state.

### Durable evidence

`PersonRecord` provides append-only lifecycle snapshots across person classes.

## 8. RBAC architecture

Frontend role policy: `src/config/roles.js`.

Key permission groups include POS, VIP rooms, Z reports, batch management, financial overview, staff/entertainer management, DJ app, discounts, voids, audit, inventory, marketing, payroll, and RBAC.

Persistent role models are distributed among:

- `NUPSUser.role`
- `PlatformRole.role_key`
- `UserRoleAssignment.role_key`
- frontend `ROLES` + `mapNUPSRoleToRBAC()`

These sets are not perfectly aligned. Mapping drift is recorded in `KNOWN_ISSUES.md`.

## 9. Financial architecture

```text
Operational event
   ↓
POSTransaction / DriverPayout / GlyphBucks / VIP source record
   ↓
write gateway / posting engine
   ↓
JournalEntry (balanced, append-only)
   ↓
LedgerAccount / trial balance
   ↓
financialReports / settlement / reconciliation
```

Important files:

- `src/lib/accounting/postToLedger.js`
- `src/lib/accounting/trialBalance.js`
- `src/lib/accounting/financialReports.js`
- `src/lib/accounting/coaSeed.js`
- `src/lib/accounting/eventToEntry.js`

Core entities:

- `POSTransaction`
- `POSBatch`
- `POSZReport`
- `DailySettlement`
- `JournalEntry`
- `LedgerAccount`
- `ChartOfAccounts`
- `ReconciliationRecord`
- `ReconciliationException`
- `ResolutionRequest`
- `FinancialResolutionLog`

Corrections are intended to use compensating/reversal workflows rather than silently mutating historical accounting facts.

## 10. GlyphBucks architecture

```text
payment evidence
   ↓
PaymentRecord / PaymentVerificationLog
   ↓
GlyphBucks issuance workflow
   ├── GlyphBucksSale / Order / Batch / Bill
   ├── GlyphBucksLedger / Transaction
   ├── AssentEvidence
   └── SealRecord
```

GlyphBucks remains outside `total_sales`; issuance represents stored-value liability.

## 11. VIP / contract architecture

Multiple contract generations coexist:

- `VIPContract` + `VIPSession` + `VIPConfig`
- `VIPShowContract`
- `VIPContractRecord`
- `VenueContract`
- `ContractTermsConfig`
- `VerificationMedia`
- `ChargebackEvidence`

A new implementation must identify which workflow owns the target behavior before adding another contract persistence path.

## 12. Audit architecture

Current audit/evidence entities include:

- `MigrationAuditLog` — write-gateway allow/block decision evidence
- `AuditEvent` — observational NUPS business-event stream
- `ActivityLog` — append-only user-facing operational audit trail
- `SystemAuditLog` — broader GlyphLock/system security and event log
- `PaymentVerificationLog`
- `FinancialResolutionLog`
- `PersonRecord`
- `ChargebackEvidence`

Important current mismatch: the frozen invariant currently names `SystemAuditLog + AuditEvent` as the required dual audit for all writes, while the live gateway automatically emits `MigrationAuditLog + AuditEvent + ActivityLog`. This is unresolved governance drift and is tracked in `KNOWN_ISSUES.md`.

## 13. Integration architecture

Payment integrations are provider-adapter based:

- `PaymentProvider`
- `VenuePaymentConfig`
- `PaymentRecord`
- backend functions for Stripe and external/manual verification

Oracle Hospitality is implemented through a dedicated server-side `ohipReadiness` function and the `OHIPReadiness` UI. Its runtime maturity must be recorded from successful calls, not inferred from stored settings.

QuickBooks support includes an export/sync workflow that explicitly does not imply an active Intuit OAuth connector.

Base44 OAuth connector state is recorded in `INTEGRATIONS.md`.

## 14. Static governance

Repository controls include:

- `scripts/check-nups-write-gateway.mjs`
- `scripts/check-nups-frozen-rules.mjs`
- `scripts/check-nups-mode-boundaries.mjs`
- `scripts/audit-entity-model.mjs`
- `scripts/audit-nups-operational-ui.mjs`
- `scripts/check-integration-boundaries.mjs`
- `scripts/check-no-tracked-secrets.mjs`

The current Base44 CI extension executes `check:nups-frozen-rules`; GitHub workflow governance is controlled separately per `AGENTS.md`.
