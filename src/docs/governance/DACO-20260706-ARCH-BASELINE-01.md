# DACO-20260706-ARCH-BASELINE-01
## Architecture Baseline Ratification & Production Stabilization

**Status:** EXECUTE → COMPLETE (awaiting DACO ratification)
**Authority:** DACO Sovereign Override
**Governance:** BPAAA v3.0 (FROZEN)
**Executor:** Base44 Normal Agent
**Platform:** NUPS / GlyphLock
**App ID:** 697a087fb354faebb72df54b
**Date:** 2026-07-06

---

## DIRECTIVE LINEAGE

- **Parent Directive:** DACO-20260706-NUPS-INVENTORY-ROUTEMAP-01
- **Prerequisite Directives:**
  - BPAAA v3.0 (FROZEN) ✅
  - DACO-20260706-SEED-CONTAINMENT-01 ✅ (HTTP 423 freeze applied)
  - DACO-20260706-SEED-CONTAINMENT-VERIFY-01 ✅ (preserved as forensic evidence)
- **Supersedes:** None (first architecture baseline)
- **Superseded By:** (none)
- **Architecture Baseline:** THIS DOCUMENT (pending ratification)
- **BPAAA Version:** v3.0 (FROZEN)

---

## EVIDENCE PRESERVATION

Evidence was captured before any inspection began:
- Source files: read via `read_file` tool (no modifications)
- Entity schemas: read from `base44/entities/*.jsonc` (no modifications)
- Route map: extracted from `src/App.jsx` and `src/pages.config.js` (no modifications)
- Write gateway: read from `src/lib/nups/writeEntity.js` (no modifications)
- Role matrix: read from `src/lib/nups/roleClass.js` (no modifications)

No code, data, schema, routing, or configuration was modified during this directive.

---

# A. CANONICAL ROUTE MAP

## A.1 Production NUPS Routes (KioskShell-wrapped, fullscreen)

These routes render inside the NUPS kiosk shell without the GlyphLock marketing Layout:

| Route | Component | Role Class | Status |
|---|---|---|---|
| `/` | Home (GlyphLock marketing) | Public | Production Ready |
| `/NUPSLanding` `/nupslanding` `/landing` | NUPSLanding | Public | Production Ready |
| `/NUPSGateway` `/nupsgateway` | NUPSGateway | Public | Production Ready |
| `/NUPSSandbox` `/nupssandbox` | NUPSSandbox | Public/Demo | Beta |
| `/NUPSLogin` `/nupslogin` | NUPSLogin | Public | Production Ready |
| `/NUPSOwner` `/nupsowner` | NUPSOwner | ADMIN | Beta |
| `/NUPSAdminPortal` `/nupsadminportal` | NUPSAdminPortal | ADMIN | Production Ready |
| `/NUPSStaff` `/nupsstaff` | NUPSStaff | STAFF | Beta |
| `/FrontDoor` `/frontdoor` | FrontDoor | STAFF+ | Production Ready |
| `/EntertainerCheckIn` `/entertainercheckin` | EntertainerCheckIn | ENTERTAINER | Production Ready |
| `/StaffHome` `/staffhome` | StaffHome | STAFF | Production Ready |
| `/EntertainerHome` `/entertainerhome` | EntertainerHome | ENTERTAINER | Production Ready |
| `/NUPSHub` `/nupshub` `/Hub` | NUPSHub | MANAGER+ | Production Ready |
| `/Register` `/register` `/RegisterConsole` | RegisterConsole | STAFF+ | Production Ready |
| `/Receipts` `/receipts` | Receipts | STAFF+ | Production Ready |
| `/DriverPayouts` `/driverpayouts` | DriverPayouts | MANAGER+ | Production Ready |
| `/Accounting` `/accounting` | Accounting | ADMIN | Production Ready |
| `/Tonight` `/tonight` | Tonight | MANAGER+ | Production Ready |
| `/Contracts` `/contracts` `/ContractsHub` | ContractsHub | STAFF+ | Production Ready |
| `/ManagerConsole` `/managerconsole` | ManagerConsole | MANAGER+ | Production Ready |
| `/PeopleArchive` `/peoplearchive` | PeopleArchive | ADMIN | Production Ready |
| `/LedgerTrialBalance` `/ledgertrialbalance` `/admin/ledger` | LedgerTrialBalance | ADMIN | Production Ready |
| `/AccountingHub` `/accountinghub` `/admin/accounting-reports` | AccountingHub | ADMIN | Production Ready |
| `/admin/settlement` | DailySettlementDashboard | ADMIN | Production Ready |
| `/admin/payout-history` | DriverPayoutHistory | ADMIN | Production Ready |
| `/admin/activity-log` | ActivityLogViewer | ADMIN | Production Ready |
| `/admin/audit-integrity` | AuditIntegrity | ADMIN | Production Ready |
| `/admin/venue-settings` | VenueAdminSettings | ADMIN | Production Ready |
| `/admin/registry` `/RegistryAdmin` `/registryadmin` | RegistryAdmin | ADMIN | Production Ready |
| `/admin/adr` `/ArchitecturalDecisionRegister` `/architecturaldecisionregister` | ArchitecturalDecisionRegister | ADMIN | Production Ready |
| `/NUPSInfrastructurePage` | NUPSInfrastructurePage | ADMIN | Beta |
| `/GlyphLockFinancialPage` | GlyphLockFinancialPage | ADMIN | Beta |
| `/ClubTV` `/clubtv` | ClubTV | STAFF+ | Incomplete |
| `/MobileScanner` `/mobilescanner` | MobileScanner | STAFF+ | Beta |
| `/demo/gate` | DemoGate | Public | Beta |
| `/demo/*` (7 demo preview pages) | Various | Public | Experimental |
| `/unauthorized` | Unauthorized | Public | Production Ready |

## A.2 GlyphLock Marketing Routes (LayoutWrapper-wrapped via pagesConfig)

~90 marketing/documentation pages rendered through the GlyphLock Layout. These are the SaaS marketing site, not NUPS operator surfaces. Key examples: `/Home`, `/About`, `/Pricing`, `/Services`, `/Partners`, `/FAQ`, `/Blog`, `/SecurityDocs`, etc.

## A.3 Explicit Routes in App.jsx (outside pagesConfig loop)

The following routes are declared explicitly in App.jsx's non-fullscreen block AND in the fullscreen block — these are **duplicate route declarations**:

| Route Path | LayoutWrapper Copy | Fullscreen Copy | Canonical |
|---|---|---|---|
| `/Accounting` | ✅ LayoutWrapper | ✅ KioskShell | **Fullscreen KioskShell** is the production path |
| `/Contracts` | ✅ LayoutWrapper | ✅ KioskShell | **Fullscreen KioskShell** |
| `/Register` | ✅ LayoutWrapper | ✅ KioskShell | **Fullscreen KioskShell** |
| `/Receipts` | ✅ LayoutWrapper | ✅ KioskShell | **Fullscreen KioskShell** |
| `/DriverPayouts` | ✅ LayoutWrapper | ✅ KioskShell | **Fullscreen KioskShell** |
| `/NUPSHub` | ✅ LayoutWrapper | ✅ KioskShell | **Fullscreen KioskShell** |
| `/Tonight` | ✅ LayoutWrapper | ✅ KioskShell | **Fullscreen KioskShell** |
| `/admin/activity-log` | ✅ LayoutWrapper | ✅ KioskShell | **Fullscreen KioskShell** |
| `/admin/settlement` | ✅ LayoutWrapper | ✅ KioskShell | **Fullscreen KioskShell** |
| `/admin/payout-history` | ✅ LayoutWrapper | ✅ KioskShell | **Fullscreen KioskShell** |
| `/admin/audit-integrity` | ✅ LayoutWrapper | ✅ KioskShell | **Fullscreen KioskShell** |
| `/admin/venue-settings` | ✅ LayoutWrapper | ✅ KioskShell | **Fullscreen KioskShell** |

The fullscreen block wins (it renders first in the `if (isFullscreen)` branch). The LayoutWrapper duplicates in the fallback block are **dead routes** — unreachable when the path matches a fullscreen path.

## A.4 Orphan Routes

Routes that appear in App.jsx but have NO navigation entry in either:
- `NUPSAppShell.jsx` NAV_SECTIONS, or
- `Navbar.jsx` / `NavigationConfig.jsx`

| Route | Component | Status |
|---|---|---|
| `/NUPSPostLogin` | NUPSPostLogin | Orphan — referenced by post-login flow only |
| `/NUPSMISReport` | NUPSMISReport | Orphan — no sidebar link |
| `/NUPSDemoManager` | NUPSDemoManager | Orphan — no sidebar link |
| `/NUPSStateDiff` | NUPSStateDiff | Orphan — no sidebar link |
| `/DailyPerformanceReport` | DailyPerformanceReport | Orphan — no sidebar link |
| `/NUPSAudit` | NUPSAudit | Orphan (pagesConfig only) |
| `/NUPSReport` | NUPSReport | Orphan (pagesConfig only) |
| `/CaseStudyNUPS` | CaseStudyNUPS | Orphan (pagesConfig only) |
| `/OfficialChecks` | OfficialChecks | Orphan — no sidebar link |
| `/SystemAudit` | SystemAudit | Orphan (pagesConfig only) |
| `/SettlementReports` | SettlementReports | Orphan (pagesConfig only) |
| `/GovernanceHub` | GovernanceHub | Orphan (pagesConfig only) |
| `/AnalyticsDashboard` | AnalyticsDashboard | Orphan (pagesConfig only) |
| `/UnifiedSearch` `/search` | UnifiedSearch | Orphan (pagesConfig only) |

## A.5 Duplicate Route Paths

Every NUPS route is declared in both TitleCase and lowercase (e.g., `/FrontDoor` and `/frontdoor`). This is intentional for case-insensitive URL matching but doubles the route table. Not a defect — by design for kiosk URL entry.

## A.6 Recommended Canonical Routes

| Functional Area | Canonical Route | Remove |
|---|---|---|
| POS Register | `/register` | Remove `/Register`, `/RegisterConsole` duplicates from LayoutWrapper block |
| Contracts | `/contracts` | Remove `/Contracts`, `/ContractsHub` from LayoutWrapper block |
| Accounting | `/accounting` | Remove `/Accounting` from LayoutWrapper block |
| Settlements | `/admin/settlement` | Remove from LayoutWrapper block |
| Payout History | `/admin/payout-history` | Remove from LayoutWrapper block |
| Activity Log | `/admin/activity-log` | Remove from LayoutWrapper block |
| Audit Integrity | `/admin/audit-integrity` | Remove from LayoutWrapper block |
| Venue Settings | `/admin/venue-settings` | Remove from LayoutWrapper block |
| Hub | `/nupshub` | Remove `/Hub`, `/NUPSHub` from LayoutWrapper block |
| Receipts | `/receipts` | Remove from LayoutWrapper block |
| Driver Payouts | `/driverpayouts` | Remove from LayoutWrapper block |
| Tonight | `/tonight` | Remove from LayoutWrapper block |

---

# B. CANONICAL MODULE MAP

## B.1 Command Dashboard (NUPSHub)

| Field | Value |
|---|---|
| Purpose | Central operator dashboard; shift overview, live settlement ticker, operator flow strip, hourly sales, top products |
| Owner | MANAGER+ |
| Routes | `/nupshub`, `/Hub`, `/NUPSHub` |
| Entities (read) | POSBatch, POSTransaction, VenueRateConfig, DailySettlement, NUPSUser, StaffShift |
| Dependencies | NUPSAppShell, ModeToggle, useActiveVenue |
| Status | Production Ready |

## B.2 Register / POS

| Field | Value |
|---|---|
| Purpose | Unified POS register for door, bar, VIP stations; item selection, cart, checkout, payment processing, receipt hashing |
| Owner | STAFF+ (role-scoped) |
| Routes | `/register`, `/Register`, `/RegisterConsole` |
| Entities (write) | POSTransaction, POSBatch, AuditEvent, ActivityLog, MigrationAuditLog |
| Entities (read) | POSProduct, POSLocation, VIPGuest, DriverProfile, VenueRateConfig |
| Dependencies | POSCashRegister, writeEntity, receiptHash, receiptBreakdown, TransactionReceiptModal, CompAuthorizationModal, ManagerVoidGateModal |
| Status | Production Ready (door/bar); Beta (NFC/tap — known issue) |

## B.3 VIP Contracts

| Field | Value |
|---|---|
| Purpose | VIP show contract lifecycle: Big Spender letter/questionnaire, VIP contract signing, contract lookup |
| Owner | STAFF+ |
| Routes | `/contracts?tab=vip`, `/contracts?tab=big_spender`, `/contracts?tab=lookup` |
| Entities | VenueContract, VIPContractRecord, VIPGuest, VerificationMedia, ContractTermsConfig |
| Dependencies | VIPContractFlow, BigSpenderLetter, BigSpenderQuestionnaire, ContractLookup, vipContractSign (backend) |
| Status | Production Ready |

## B.4 GlyphBucks

| Field | Value |
|---|---|
| Purpose | Club currency system: bill issuance, redemption, payout processing, ledger posting |
| Owner | MANAGER+ |
| Routes | `/contracts?tab=glyphbucks`, `/GlyphBucksHub` |
| Entities | GlyphBucksBill, GlyphBucksOrder, GlyphBucksBatch, GlyphBucksTransaction, ContractorPayout |
| Dependencies | GlyphBucksContract, BillRedemptionScanner, UnifiedGlyphBucksTab, createGlyphBucksSale (backend), redeemGlyphBucksBills (backend), postGlyphBucksToLedger (backend) |
| Status | Production Ready |

## B.5 Back Office (NUPSAdminPortal)

| Field | Value |
|---|---|
| Purpose | Isolated back-office management portal for admin operations, separated from live floor |
| Owner | ADMIN |
| Routes | `/nupsadminportal`, `/NUPSAdminPortal` |
| Entities | All entities (admin scope) |
| Dependencies | NUPSAppShell, RoleClassGuard |
| Status | Production Ready |

## B.6 Onboarding

| Field | Value |
|---|---|
| Purpose | Staff onboarding, entertainer contract signing, driver profile creation, guest check-in |
| Owner | MANAGER+ |
| Routes | `/entertainercheckin`, `/frontdoor` (sidebar), `/NUPSOwner?tab=staff` |
| Entities | NUPSUser, Entertainer, DriverProfile, GuestProfile, VIPGuest, PersonRecord, ContractorTaxForm |
| Dependencies | EntertainerContract, StaffOnboardingPanel, GuestCheckIn, IDScannerCamera, DriverQuickAdd, personArchive |
| Status | Production Ready |

## B.7 Identity

| Field | Value |
|---|---|
| Purpose | NUPS role resolution, authentication, role class routing, RBAC enforcement |
| Owner | ADMIN |
| Routes | `/nupslogin`, `/NUPSPostLogin` |
| Entities | NUPSUser, PlatformRole, UserRoleAssignment, User (platform built-in) |
| Dependencies | roleClass.js, roleGate.js, sovereign.js, identityVerify.js, NUPSRouteGuard, RoleClassGuard, AuthContext |
| Status | Production Ready (MDL ID-01 contamination risk — see Section D) |

## B.8 Reporting

| Field | Value |
|---|---|
| Purpose | Daily settlement, Z-reports, nightly reports, analytics dashboards, MIS reports |
| Owner | ADMIN |
| Routes | `/admin/settlement`, `/admin/accounting-reports`, `/AnalyticsDashboard`, `/DailyPerformanceReport`, `/NUPSMISReport` |
| Entities | DailySettlement, POSZReport, JournalEntry, LedgerAccount, POSTransaction, ContractorPayout, DriverPayout |
| Dependencies | generateDailySettlement (backend), generateZReport (backend), generateDailyReport (backend), aggregateFinancials, financialReports, AccountingHub |
| Status | Production Ready |

## B.9 Audit

| Field | Value |
|---|---|
| Purpose | Audit integrity monitoring, audit log viewer, activity log, self-audit engine |
| Owner | ADMIN |
| Routes | `/admin/audit-integrity`, `/admin/activity-log`, `/NUPSOwner?tab=audit` |
| Entities | AuditEvent, SystemAuditLog, ActivityLog, MigrationAuditLog |
| Dependencies | auditEventEmitter, selfAudit, auditIntegrity, auditDifferential |
| Status | Production Ready |

## B.10 Administration

| Field | Value |
|---|---|
| Purpose | Venue settings, rate configuration, chart of accounts, feature registry, ADR register, RBAC admin |
| Owner | ADMIN |
| Routes | `/admin/venue-settings`, `/admin/registry`, `/admin/adr`, `/NUPSOwner?tab=admin` |
| Entities | VenueRateConfig, LedgerAccount, FeatureRegistry, ArchitecturalDecisionRecord, SystemConfig, FrontDoorConfig, ContractTermsConfig, DailyChecklistConfig, PayoutSafetyLimit |
| Dependencies | ReceiptConfigEditor, ChartOfAccountsEditor, RateFeeEditor, ContractTermsEditor, DailyChecklistEditor, reconcileRegistry |
| Status | Production Ready |

---

# C. CANONICAL ENTITY REGISTRY

## C.1 Financial Entities (writeEntity-gated, financial rules enforced)

| Entity | Purpose | Primary Key | Venue Scope | Mode | Write Path | Audit Coverage | Consumers |
|---|---|---|---|---|---|---|---|
| POSTransaction | POS sales record | transaction_id | venue_id | REAL/DEMO | writeEntity → base44.entities.POSTransaction.create | MigrationAuditLog + AuditEvent + ActivityLog | Register, Receipts, Accounting |
| POSBatch | POS shift batch | batch_id | venue_id | REAL/DEMO | writeEntity | ✅ | Register, Settlement |
| POSZReport | Z-report end of day | (id) | venue_id | REAL/DEMO | writeEntity | ✅ | Accounting, Settlement |
| PayrollRecord | Staff payroll | (id) | venue_id | REAL/DEMO | writeEntity | ✅ | Payroll module |
| TipPayout | Tip distribution | (id) | venue_id | REAL/DEMO | writeEntity | ✅ | TipBreakdown |
| GlyphBucksTransaction | GB ledger entry | (id) | venue_id | REAL/DEMO | writeEntity | ✅ | GlyphBucks Hub |
| GlyphBucksOrder | GB purchase order | (id) | venue_id | REAL/DEMO | writeEntity | ✅ | GlyphBucks Contract |
| VenueContract | VIP/GlyphBucks contract | (id) | venue_id | REAL/DEMO | writeEntity | ✅ | Contracts Hub |
| DriverPayout | Per-night driver disbursement | payout_id | venue_id | REAL/DEMO | writeEntity | ✅ | DriverPayouts |
| DailySettlement | Daily reconciliation | (id) | venue_id | REAL/DEMO | writeEntity | ✅ | Settlement Dashboard |
| JournalEntry | Double-entry GL | (id) | venue_id | REAL/DEMO | postToLedger (backend) | ✅ | LedgerTrialBalance, AccountingHub |
| ContractorPayout | 1099 contractor payout | payout_id | venue_id | REAL/DEMO | writeEntity | ✅ | EntertainerPayrollEngine |

## C.2 Identity Entities

| Entity | Purpose | Primary Key | Venue Scope | Mode | Audit Coverage | Issues |
|---|---|---|---|---|---|---|
| NUPSUser | Staff identity + RBAC | username | venue_id | is_demo flag | MigrationAuditLog | ⚠️ RLS: created_by = user.email — filters by platform email, not NUPS username |
| Entertainer | Performer profile + contract | stage_name | venue_id | (none) | PersonRecord snapshots | No mode field — cannot isolate REAL vs DEMO |
| DriverProfile | Durable driver record | driver_id | venue_id | (none) | PersonRecord snapshots | No mode field |
| VIPGuest | Guest profile + card | guest_id (SHA-256) | venue_id | is_demo flag | PersonRecord snapshots | — |
| GuestProfile | Durable guest (ID hash) | guest_id (SHA-256) | venue_id | (none) | PersonRecord snapshots | No mode field |
| StaffShift | Non-entertainer shift | shift_id | venue_id | (none) | ✅ | identity_verified defaults false (ID-01 gate) |
| EntertainerShift | Performer shift | (id) | venue_id | (none) | ✅ | — |
| User (platform) | Base44 auth user | id | (none) | (none) | (platform-managed) | Read-only; can't be created via SDK |

## C.3 Audit Entities

| Entity | Purpose | Write Path | RLS | Issues |
|---|---|---|---|---|
| AuditEvent | Observational audit ledger | emitFromGatewayWrite (auto on every writeEntity) | (none) | identity_verified hardcoded false (ID-01) |
| SystemAuditLog | System-level audit | (via backend functions) | (none) | — |
| ActivityLog | User-facing audit trail | logActivity (auto on every writeEntity) | read: admin only; append-only | ✅ Solid |
| MigrationAuditLog | Migration gateway audit | writeEntity → audit() | (none) | Serves as the write gateway's own log |

## C.4 Configuration Entities

| Entity | Purpose | Venue Scope | Issues |
|---|---|---|---|
| VenueRateConfig | Rate sheet / receipt config | venue_id | ✅ Single source of truth |
| SystemConfig | Global mode (REAL/DEMO) | (none) | Global singleton — not venue-scoped |
| FeatureRegistry | Navigation keystone | (none) | Not venue-scoped (global) |
| VenueContract | Contract terms config | venue_id | — |
| FrontDoorConfig | Door station config | venue_id | — |
| ContractTermsConfig | Contract text config | venue_id | — |
| DailyChecklistConfig | Compliance checklist | venue_id | — |
| PayoutSafetyLimit | Payout guardrails | venue_id | — |
| LedgerAccount | Chart of accounts | venue_id + mode | ✅ |
| ArchitecturalDecisionRecord | ADR register | (none) | Global governance |
| ReconciliationRecord | Reconciliation outcomes | venue_id | ✅ |

## C.5 Flagged Entities

### Duplicate Entities
- **VIPGuest vs GuestProfile**: Both store guest identity. VIPGuest is the "rich" guest record (card on file, VIP sessions); GuestProfile is the durable ID-hash record. They share the same `guest_id` (SHA-256 of license) but are separate entities with overlapping data. Not a strict duplicate but a data redundancy risk.
- **ContractorPayout vs DriverPayout**: Different payout types (contractor 1099 vs driver per-night). Not duplicates — different disbursement types.

### Orphan Entities (no active consumers found in routes)
- **CrowdMetrics**: Defined but no route references it in App.jsx
- **PerformanceAnalytics**: Defined but no route references it
- **AgentRuntimeModule / AgentChangeSet**: Agent infrastructure entities with no visible UI consumer
- **Many audit/reporting entities** (SieFeatureRecord, SieComponentRecord, SieFindingRecord, etc.): SIE scanner infrastructure — consumed by backend functions only, no operator UI

### Missing Mode Field
Entities without a `mode` field cannot be isolated between REAL and DEMO:
- Entertainer
- DriverProfile
- GuestProfile
- StaffShift
- EntertainerShift
- VIPRoom
- VIPSessionReport
- VIPContractRecord
- VerificationMedia
- ContractorTaxForm
- PersonRecord

**Impact:** `clearDemoEcosystem()` queries by `mode: 'DEMO'` — entities without mode are invisible to the wipe and persist across demo resets. This is a known data hygiene risk.

### Missing Audit Coverage
- **PersonRecord**: Snapshot archive writes do NOT go through writeEntity — they use `base44.entities.PersonRecord.create()` directly. This bypasses the gateway's AuditEvent emission. (PersonRecord IS snapshotted via personArchive.js which calls base44.entities directly.)
- **EntertainerShift / StaffShift**: Created via backend functions (createEntertainerShift, checkoutEntertainerShift) which may bypass writeEntity.

---

# D. IDENTITY BASELINE

## D.1 Identity Pools

| Pool | Entity | Creation Path | Authentication |
|---|---|---|---|
| Platform Users | User (built-in) | Base44 invite system | base44.auth.me() |
| NUPS Staff | NUPSUser | StaffOnboardingPanel → writeEntity | NUPS login (NUPSLogin) + PIN |
| Entertainers | Entertainer | EntertainerContract → base44.entities.Entertainer.create | EntertainerCheckIn + nups_pin |
| Guests | VIPGuest / GuestProfile | GuestCheckIn / IDScannerCamera | ID scan at door |
| Drivers | DriverProfile | DriverQuickAdd → base44.entities.DriverProfile.create | QR token at door |
| Applicants | (none dedicated) | N/A | N/A |
| Admin Users | User (platform) + NUPSUser(role=PLATFORM_ADMIN) | Platform invite | base44.auth.me() |
| Demo Identities | NUPSUser(is_demo=true) | seedDemoEcosystem | NUPSSandbox |

## D.2 Identity Lifecycle

```
Platform Auth (base44.auth.me())
    ↓
NUPSUser lookup (filter by created_by = email)
    ↓
resolveRoleClass({ user, nupsUser, sovereign })
    ↓
Role Class → HOME_BY_CLASS routing
    STAFF       → /StaffHome
    ENTERTAINER → /EntertainerHome
    MANAGER     → /NUPSHub
    ADMIN       → /NUPSAdminPortal
```

## D.3 Identity Pool Overlap Points

### Overlap 1: Platform User ↔ NUPSUser
- NUPSUser RLS filters by `created_by: "{{user.email}}"` — the NUPSUser record is owned by the platform user's email.
- **Risk:** If a platform user's email changes, the NUPSUser record becomes orphaned. The lookup in NUPSAppShell (`base44.entities.NUPSUser.filter({ created_by: u.email })`) will fail silently.
- **ID-01 Contamination Risk:** `actor_user_id` in JournalEntry and `actor_ref` in AuditEvent are derived from `base44.auth.me()` email. If the email doesn't match the NUPSUser that the session claims to be, identity is unverified. This is the core of MDL ID-01.

### Overlap 2: NUPSUser.role ↔ Platform User.role
- NUPSUser has its own role enum (PLATFORM_ADMIN, VENUE_OWNER, etc.)
- Platform User has a separate role ('admin' / 'user')
- `resolveRoleClass()` checks BOTH and uses priority: sovereign > platform admin > NUPS role > fallback STAFF
- **Risk:** A platform 'admin' user without a NUPSUser record gets ADMIN class — they can access NUPSAdminPortal without a corresponding NUPS staff record. This is the platform user pool contamination vector.

### Overlap 3: Demo Users ↔ Real Users
- Demo NUPSUsers have `is_demo: true` but are stored in the same NUPSUser entity.
- NUPSUser RLS does NOT filter by `is_demo` — a demo user created by a real admin's email shares the same RLS scope.
- **Risk:** Demo operations could theoretically be attributed to real staff if the demo user's `created_by` matches a real email.

### Overlap 4: Guest Identity Duplication
- VIPGuest and GuestProfile both use SHA-256 of license number as `guest_id`.
- GuestCheckIn creates both. If one write succeeds and the other fails, identity is split.
- PersonRecord snapshots both, but the snapshot is a copy — not a reconciliation.

## D.4 MDL ID-01 Contamination Risk Points

1. **JournalEntry.actor_user_id** — derived from writeEntity actor, which comes from base44.auth.me(). Not verified against NUPSUser. Hardcoded warning in schema: "actor field trustworthiness gated on identity-contamination fix."

2. **AuditEvent.actor_ref** — RAW unverified user reference. `identity_verified` is hardcoded `false` in the schema description and in writeEntity: `actor_ref: actorId, // §6 — RAW unverified ref; identity_verified forced false`.

3. **StaffShift.identity_verified** — defaults `false`. The `identityVerify.js` module exists but is gated — verification logic is not implemented (per schema: "Do not build verification logic").

4. **ActivityLog.user_email** — captured from `base44.auth.me().email` at action time. If the platform session is contaminated (e.g., admin acting on behalf of a staff member), the email recorded is the admin's, not the staff member's.

5. **NUPSAppShell NUPSUser lookup** — `base44.entities.NUPSUser.filter({ created_by: u.email })` returns the FIRST match. If multiple NUPSUser records share the same `created_by` email (e.g., demo + real), the wrong record could be selected.

---

# E. WRITE ARCHITECTURE

## E.1 Canonical Write Path

```
Component / Page
    ↓
writeEntity({ entity, operation, data, id, actor, intent, venue_id, requestContext })
    ↓
1. validateActor(actor) — requires id + role
2. resolveMode(requestContext.mode) — reads SystemConfig, defaults REAL
3. enforceRoleScope({ role, entity, operation, data, actor }) — DOOR_GIRL/DOORMAN scope gate
4. Financial authorization check — FINANCIAL_AUTHORIZED_ROLES for REAL mode
5. validateFinancialRules(entity, data) — GlyphBucks leakage, total reconciliation, tip splits
6. injectMode(data, mode) — stamps mode on every record
7. base44.entities[entity].create/update/delete/bulkCreate(stamped)
    ↓ (on success)
8. audit() → MigrationAuditLog.create(entry) — gateway's own log
9. emitFromGatewayWrite() → AuditEvent.create() — observational (non-blocking)
10. logActivity() → ActivityLog.create() — user-facing trail
    ↓
return { ok, audit_id, mode, tier, result, value }
```

## E.2 Write Paths That BYPASS writeEntity()

### Bypass 1: seedDemoEcosystem / clearDemoEcosystem (writeEntity.js itself)
- These functions use `base44.entities[entityName].create()` and `.delete()` directly.
- **Justification:** They are SOVEREIGN-gated and write with `mode: 'DEMO'` explicitly.
- **Risk:** No AuditEvent emission per record — only a single summary MigrationAuditLog entry.
- **Status:** The frozen `seedDemoContracts` backend function has been contained (HTTP 423). The frontend `seedDemoEcosystem` in writeEntity.js is still active but SOVEREIGN-gated.

### Bypass 2: PersonRecord snapshots (personArchive.js)
- Uses `base44.entities.PersonRecord.create()` directly.
- **Justification:** PersonRecord is an archive — snapshotting is a side effect of other writes, not a user-initiated mutation.
- **Risk:** No AuditEvent for the snapshot write itself.

### Bypass 3: Backend functions writing directly
The following backend functions write to entities using `base44.asServiceRole.entities.X.create/update()`:
- `createEntertainerShift` / `checkoutEntertainerShift` — EntertainerShift writes
- `createGlyphBucksSale` — GlyphBucksOrder, GlyphBucksBatch, GlyphBucksBill writes
- `redeemGlyphBucksBills` — GlyphBucksBill, ContractorPayout updates
- `closePOSBatch` — POSBatch updates
- `postPOSTransactionToLedger` — JournalEntry writes
- `postGlyphBucksToLedger` — JournalEntry writes
- `postDriverPayoutToLedger` — JournalEntry writes
- `postContractorPayoutToLedger` — JournalEntry writes
- `postTipsToLedger` — JournalEntry writes
- `generateDailySettlement` — DailySettlement writes
- `generateZReport` — POSZReport writes
- `entertainerCheckIn` — EntertainerShift writes

**These backend functions do NOT route through the frontend writeEntity() gateway.** They use the service role directly. The frontend writeEntity gateway only covers writes initiated from React components.

### Bypass 4: StaffOnboardingPanel (NUPSUser creation)
- Uses `useMutation` with `base44.entities.NUPSUser.create()` — NOT writeEntity.
- Calls `snapshotPerson()` after creation, but the NUPSUser create itself bypasses the gateway.
- **Risk:** No MigrationAuditLog or AuditEvent for NUPSUser creation.

### Bypass 5: EntertainerContract
- Uses `useMutation` with `base44.entities.Entertainer.create()` — NOT writeEntity.
- Calls `snapshotPerson()` after creation.
- **Risk:** No MigrationAuditLog or AuditEvent for Entertainer creation.

### Bypass 6: DriverQuickAdd / DriverProfile creation
- Uses `base44.entities.DriverProfile.create()` directly.
- **Risk:** No gateway audit.

## E.3 Write Authorization Matrix

| Entity | REAL Mode Roles | DEMO Mode Roles | Gateway? |
|---|---|---|---|
| POSTransaction | PLATFORM_ADMIN, VENUE_OWNER, VENUE_MANAGER, SOVEREIGN, admin, manager + scoped DOOR_GIRL/DOORMAN | Any (financial rules still apply) | ✅ |
| JournalEntry | (backend only) | (backend only) | ❌ (postToLedger backend) |
| NUPSUser | (bypass) | (bypass) | ❌ |
| Entertainer | (bypass) | (bypass) | ❌ |
| DriverProfile | (bypass) | (bypass) | ❌ |
| PersonRecord | (bypass) | (bypass) | ❌ |
| All non-financial | Any authenticated | Any authenticated | ✅ |

---

# F. AUDIT ARCHITECTURE

## F.1 AuditEvent

| Field | Value |
|---|---|
| Purpose | Observational, append-only audit ledger for every business fact |
| Write Trigger | `emitFromGatewayWrite()` — auto-fired after every writeEntity success |
| Identity | `actor_ref` = RAW unverified; `identity_verified` = hardcoded `false` |
| Financial Context | Required for financial events; enforces `total_sales_impact === cash_portion + card_portion` |
| Coverage Gap | Only covers writes through writeEntity(). Backend function writes and bypass writes are NOT covered. |
| Retention | `retention_class` field set at write — operational/financial/compliance/security/permanent |

## F.2 SystemAuditLog

| Field | Value |
|---|---|
| Purpose | System-level audit events from backend functions |
| Write Trigger | Manual `auditLog` backend function calls |
| Coverage | Sparse — only where backend functions explicitly call it |

## F.3 MigrationAuditLog

| Field | Value |
|---|---|
| Purpose | The writeEntity gateway's own audit log — records every allowed/blocked write |
| Write Trigger | `audit()` inside writeEntity.js — fires on EVERY writeEntity call (success, block, error) |
| Coverage | Complete for writeEntity-routed writes. Does NOT cover bypass writes. |
| Tier | `TIER_1_OBSERVE` |

## F.4 ActivityLog

| Field | Value |
|---|---|
| Purpose | User-facing audit trail of portal access and key updates |
| Write Trigger | `logActivity()` inside writeEntity.js — auto-fired after every writeEntity success |
| RLS | read: admin only; create: open; update/delete: BLOCKED (append-only) |
| Coverage | Complete for writeEntity-routed writes. Does NOT cover bypass writes. |

## F.5 Audit Gaps

### Gap 1: Backend function writes have no AuditEvent coverage
- JournalEntry, DailySettlement, POSZReport, EntertainerShift writes from backend functions do NOT emit AuditEvents.
- These writes go through `base44.asServiceRole.entities.X.create()` directly.

### Gap 2: Bypass writes have no gateway audit
- NUPSUser, Entertainer, DriverProfile, PersonRecord creates bypass writeEntity entirely.
- No MigrationAuditLog, no AuditEvent, no ActivityLog for these writes.

### Gap 3: Identity verification not implemented
- `identity_verified` is hardcoded `false` across all audit entities.
- The `identityVerify.js` module exists but is gated — no verification logic implemented.
- All actor references are unverified.

### Gap 4: Duplicate logging
- writeEntity writes to THREE audit logs: MigrationAuditLog (gateway), AuditEvent (observational), ActivityLog (user-facing). This is by design (defense in depth) but creates redundancy.
- Not a defect — but consumers must understand which log is authoritative for which query.

---

# G. PAYMENT ARCHITECTURE

## G.1 Payment Surfaces

### Surface 1: Stripe
| Field | Value |
|---|---|
| Backend Functions | stripeCheckout, stripeCreateCheckout, stripePoll, stripeWebhook, stripe-webhook-handler, stripe-create-refund, get-stripe-config |
| Frontend | BillingAndPayments page, PaymentSuccess, PaymentCancel |
| Mode | SaaS subscription billing (GlyphLock platform), NOT NUPS venue payments |
| Status | Production Ready (SaaS billing) |
| Webhook | stripeWebhook + stripe-webhook-handler (duplicate — see below) |

### Surface 2: GoDaddy/Poynt
| Field | Value |
|---|---|
| Evidence | NOT FOUND — no backend functions or frontend code referencing Poynt or GoDaddy Payments |
| Status | Not implemented / remnants removed |

### Surface 3: PayKings
| Field | Value |
|---|---|
| Evidence | NOT FOUND — no backend functions or frontend code referencing PayKings |
| Status | Not implemented / remnants removed |

### Surface 4: NUPS Door POS (Cash/Card)
| Field | Value |
|---|---|
| Backend | No payment processor integration — POS records payment_method but does not process card transactions |
| Frontend | POSCashRegister, CardPaymentPanel, QuickChargePanel |
| Mode | REAL (cash/card sales recorded in POSTransaction) / DEMO (validation_run=true) |
| Status | Production Ready (cash); Beta (card — NFC/tap known issue) |
| Leakage Risk | None — card sales are recorded as `card_sales` in POSTransaction, not processed through a payment gateway |

### Surface 5: GlyphBucks (stored value)
| Field | Value |
|---|---|
| Backend | createGlyphBucksSale, processGlyphBucksPayment, confirmGlyphBucksPayment, redeemGlyphBucksBills |
| Frontend | GlyphBucksContract, GlyphBucksPOS, BillRedemptionScanner |
| Mode | REAL / DEMO |
| Status | Production Ready |
| Leakage Risk | writeEntity enforces GlyphBucks leakage check — GB fields forbidden in total_sales, subtotal, total. gb_liability is stored separately. |

## G.2 Duplicate Payment Infrastructure

- `stripeWebhook` and `stripe-webhook-handler` are TWO separate backend functions handling Stripe webhooks.
- **Risk:** If both are deployed as webhook endpoints, events could be processed twice (idempotency dependent).
- **Recommendation:** One should be deprecated. Evidence does not show which is active.

## G.3 Mode Leakage Risk

- NUPS POS transactions stamp `mode` from `resolveMode()` which reads `SystemConfig` global singleton.
- If SystemConfig is set to DEMO, ALL writes get mode=DEMO — including real door sales if an admin accidentally toggles mode.
- `toggleMode()` requires SOVEREIGN role — this is the correct gate.
- **Risk:** No per-venue mode. SystemConfig is global. A multi-venue deployment would share one mode flag.

---

# H. PRODUCTION READINESS MATRIX

| Module | Rating | Justification |
|---|---|---|
| Command Dashboard (NUPSHub) | Production Ready | Fully wired, reads from live entities, settlement ticker operational |
| Register / POS (Door/Bar) | Production Ready | writeEntity gateway, receipt hashing, financial rules enforced; NFC/tap is Beta |
| Register / POS (NFC/Tap) | Beta | Known issue: NFC payment flows unresponsive in CardPaymentPanel |
| VIP Contracts | Production Ready | Full lifecycle: Big Spender → questionnaire → signing → lookup |
| GlyphBucks | Production Ready | Issuance, redemption, ledger posting, leakage prevention |
| Back Office (NUPSAdminPortal) | Production Ready | Isolated admin portal, role-guarded |
| Onboarding (Staff) | Production Ready | StaffOnboardingPanel, personArchive snapshots |
| Onboarding (Entertainer) | Production Ready | EntertainerContract with clickwrap, IP capture |
| Onboarding (Driver) | Production Ready | DriverQuickAdd, HMAC-signed QR tokens |
| Onboarding (Guest) | Production Ready | GuestCheckIn, ID scanner, SHA-256 dedup |
| Identity | Beta | MDL ID-01 contamination risk — identity_verified hardcoded false |
| Reporting (Settlement) | Production Ready | generateDailySettlement backend, DailySettlementDashboard |
| Reporting (GL) | Production Ready | Double-entry ledger, trial balance, P&L |
| Reporting (Analytics) | Production Ready | AnalyticsDashboard, aggregateFinancials |
| Audit | Production Ready | Four-tier audit, self-audit engine, integrity checks |
| Administration | Production Ready | Venue settings, rate config, COA editor, feature registry, ADR |
| ClubTV | Incomplete | No visible content pipeline or data source |
| MobileScanner | Beta | QR scanner functional but not integrated into all flows |
| Demo Previews (7 pages) | Experimental | Static preview pages for demo walkthroughs |
| Stripe Webhooks | Beta | Duplicate webhook handlers (stripeWebhook + stripe-webhook-handler) |
| Music / DJ Console | Beta | UnifiedMusicConsole exists but integration with live club hardware unverified |

---

# I. CRITICAL BLOCKERS

## CRITICAL

### B-CRITICAL-01: MDL ID-01 Identity Contamination
**Evidence:** `identity_verified` hardcoded `false` in AuditEvent schema and writeEntity.js. `actor_ref` / `actor_user_id` are RAW unverified references. StaffShift.identity_verified defaults false. The `identityVerify.js` module exists but contains no verification logic.
**Impact:** All audit records carry unverified actor identity. Actor-level reports cannot be trusted. Financial attribution to specific staff members is not reliable.
**Rank:** CRITICAL

### B-CRITICAL-02: Bypass Writes Have No Audit Coverage
**Evidence:** NUPSUser, Entertainer, DriverProfile, PersonRecord creates use `base44.entities.X.create()` directly, bypassing writeEntity(). Backend function writes (JournalEntry, DailySettlement, EntertainerShift) use `base44.asServiceRole` directly.
**Impact:** Staff creation, entertainer onboarding, driver onboarding, and all ledger postings have no AuditEvent, MigrationAuditLog, or ActivityLog coverage. Audit trail has gaps for the most sensitive identity and financial records.
**Rank:** CRITICAL

## HIGH

### B-HIGH-01: No Per-Entity Mode Field on Identity Entities
**Evidence:** Entertainer, DriverProfile, GuestProfile, StaffShift, EntertainerShift, VIPRoom, VIPContractRecord, VerificationMedia, ContractorTaxForm, PersonRecord have no `mode` field.
**Impact:** `clearDemoEcosystem()` queries by `mode: 'DEMO'` — these entities are invisible to the wipe. Demo data persists across resets, contaminating production data.
**Rank:** HIGH

### B-HIGH-02: Global Mode (No Per-Venue Mode)
**Evidence:** SystemConfig is a global singleton with `config_key: 'global'`. `resolveMode()` reads this single record.
**Impact:** Multi-venue deployments share one mode flag. Toggling DEMO affects ALL venues simultaneously.
**Rank:** HIGH

### B-HIGH-03: Duplicate Stripe Webhook Handlers
**Evidence:** `stripeWebhook` and `stripe-webhook-handler` are two separate backend functions.
**Impact:** If both are configured as Stripe webhook endpoints, events may be processed twice. Double-charging or double-subscription-activation risk.
**Rank:** HIGH

### B-HIGH-04: Dead Route Duplicates in App.jsx
**Evidence:** 12 NUPS routes are declared in BOTH the fullscreen KioskShell block AND the LayoutWrapper fallback block. The LayoutWrapper copies are unreachable (fullscreen wins).
**Impact:** Dead code. No runtime impact but maintenance confusion and potential for future routing bugs if the fullscreen check changes.
**Rank:** HIGH (maintenance risk, not runtime risk)

## MEDIUM

### B-MEDIUM-01: NFC/Tap Payment Unresponsive
**Evidence:** Known issue documented in project notes: "NFC/Tap payment flows unresponsive in current POSCashRegister/CardPaymentPanel implementation."
**Impact:** Digital Wallet / tap-to-pay not functional at the door register.
**Rank:** MEDIUM

### B-MEDIUM-02: Orphan Routes with No Navigation
**Evidence:** 14 routes exist in App.jsx with no sidebar or navbar link (NUPSMISReport, NUPSDemoManager, NUPSStateDiff, DailyPerformanceReport, OfficialChecks, SystemAudit, etc.)
**Impact:** Pages are reachable only by direct URL. No operator discoverability.
**Rank:** MEDIUM

### B-MEDIUM-03: VIPGuest / GuestProfile Data Redundancy
**Evidence:** Both entities store guest identity with the same guest_id (SHA-256 of license). VIPGuest has rich data (card, VIP sessions); GuestProfile has durable ID data.
**Impact:** Data can diverge between the two records. No reconciliation mechanism.
**Rank:** MEDIUM

### B-MEDIUM-04: NUPSUser RLS Fragility
**Evidence:** RLS filters by `created_by: "{{user.email}}"`. If platform email changes, NUPSUser record is orphaned.
**Impact:** Staff could lose access to their NUPS profile after an email change.
**Rank:** MEDIUM

## LOW

### B-LOW-01: ClubTV Has No Content Pipeline
**Evidence:** ClubTV route exists but no data source or content management visible.
**Impact:** Non-functional page.
**Rank:** LOW

### B-LOW-02: 15 Dirty Records from Unauthorized seedDemoContracts Run
**Evidence:** 15 records with `is_demo: null` from the 2026-07-06 unauthorized seed run. 29+ legacy records with null is_demo at DEMO_VENUE_001.
**Impact:** Data contamination. These records are invisible to clearDemoEcosystem (which queries mode: 'DEMO', not is_demo).
**Rank:** LOW (data hygiene, not blocking)

---

# J. RECOMMENDED EXECUTION ORDER

Each recommendation references findings from this report. No implementation is authorized — this is a sequence for DACO to consider.

### Step 1: Close B-CRITICAL-02 — Route All Writes Through writeEntity()
**References:** Section E.2 (Bypasses 2-6), Section F.5 (Gap 2)
**Action:** Refactor StaffOnboardingPanel, EntertainerContract, DriverQuickAdd, personArchive, and all backend ledger-posting functions to route through writeEntity() or an equivalent gateway that emits AuditEvent + MigrationAuditLog + ActivityLog.
**Why first:** Every subsequent audit and identity fix depends on complete write coverage.

### Step 2: Close B-CRITICAL-01 — Implement MDL ID-01 Identity Verification
**References:** Section D.4 (ID-01 risk points), Section F.5 (Gap 3)
**Action:** Implement `identityVerify.js` to cross-verify `base44.auth.me()` email against NUPSUser.created_by at every write. Flip `identity_verified` to true on match. Block writes on mismatch.
**Why second:** Depends on Step 1 (all writes must go through the gateway first).

### Step 3: Close B-HIGH-01 — Add Mode Field to Identity Entities
**References:** Section C.5 (Missing Mode Field)
**Action:** Add `mode` field to Entertainer, DriverProfile, GuestProfile, StaffShift, EntertainerShift, VIPRoom, VIPContractRecord, VerificationMedia, ContractorTaxForm, PersonRecord. Migrate existing records. Update all write paths to stamp mode.
**Why third:** Data hygiene prerequisite for safe demo/production separation.

### Step 4: Close B-HIGH-02 — Per-Venue Mode
**References:** Section G.3 (Mode Leakage Risk)
**Action:** Change SystemConfig from global singleton to per-venue records. Update `resolveMode()` to accept and use `venue_id`.
**Why fourth:** Depends on Step 3 (entities must have mode fields first).

### Step 5: Close B-HIGH-03 — Consolidate Stripe Webhook Handlers
**References:** Section G.2 (Duplicate Payment Infrastructure)
**Action:** Determine which webhook handler is active. Deprecate and archive the other.
**Why fifth:** Financial risk — should be addressed early but depends on audit infrastructure (Step 1).

### Step 6: Close B-HIGH-04 — Remove Dead Route Duplicates
**References:** Section A.3 (Duplicate Route Declarations)
**Action:** Remove the 12 LayoutWrapper duplicate routes from the fallback block in App.jsx. Keep only the fullscreen KioskShell versions.
**Why sixth:** Maintenance cleanup — low risk, but should be done before any routing changes.

### Step 7: Close B-MEDIUM-01 — Fix NFC/Tap Payment
**References:** Section H (Register/POS NFC rating)
**Action:** Debug CardPaymentPanel and POSCashRegister NFC flow.
**Why seventh:** Feature fix — depends on stable payment architecture (Steps 1-5).

### Step 8: Close B-MEDIUM-02 — Wire Orphan Routes to Navigation
**References:** Section A.4 (Orphan Routes)
**Action:** Add sidebar entries for NUPSMISReport, NUPSDemoManager, NUPSStateDiff, DailyPerformanceReport, OfficialChecks, SystemAudit, etc. — or remove the routes if they are deprecated.
**Why eighth:** Navigation cleanup after core architecture is stabilized.

### Step 9: Close B-LOW-02 — Quarantine Dirty seedDemoContracts Records
**References:** Section I (B-LOW-02)
**Action:** Query for records with `is_demo: null` at DEMO_VENUE_001. Evaluate each for quarantine or deletion. Execute via writeEntity with audit trail.
**Why last:** Data cleanup — lowest priority, no runtime impact.

---

# STOP CONDITION

The Architecture Baseline report is complete.

**STOP.**

Awaiting DACO ratification.

No implementation directive may execute until this baseline has been approved.

No code changes were made during this directive.

No data mutations were made during this directive.

No schema changes were made during this directive.

No routing changes were made during this directive.

This document is the official Architecture Baseline for NUPS upon DACO ratification.

---

**End of Report — DACO-20260706-ARCH-BASELINE-01**