# Base44 Entity Optimization Plan

**Registry size:** 163 entities  
**Status:** Audit and consolidation planning  
**Rule:** No entity is deleted, renamed, merged, or repurposed until usage, permissions, record counts, relationships, and migration evidence are captured.

## Immediate finding

The registry contains both `QrScanEvent` and `QRScanEvent`. These normalize to the same name and must be treated as a likely duplicate until their schemas, records, permissions, and references are compared.

## Optimization standard for every entity

Each entity must have:

1. A single documented business purpose.
2. A named owning module.
3. A canonical primary identifier.
4. Required `venue_id`, `mode`, and actor/session fields where applicable.
5. Explicit read and write permissions.
6. Server-side validation for protected writes.
7. Documented relationships and deletion behavior.
8. Created/updated timestamps and audit linkage.
9. Retention and archival rules.
10. Tests proving allowed and denied operations.

## Domain groups

### Identity and access

Canonical identity should flow from a central person/account record into role-specific profiles rather than storing incompatible identities in unrelated tables.

Entities to reconcile:

- `PersonRecord`
- `NUPSUser`
- `UserRoleAssignment`
- `PlatformRole`
- `AuthenticatorCredential`
- `CustomerIdentity`
- `GuestProfile`
- `DriverProfile`
- `Entertainer`
- `VerificationToken`
- `NUPSAccessRequest`

Target model:

- One canonical person/account identifier.
- Role assignments separated from identity.
- Venue-scoped profiles linked to the canonical person.
- Credentials and verification tokens isolated from general profile data.

### Contracts and assent

Entities to reconcile:

- `VenueContract`
- `VIPContract`
- `VIPContractRecord`
- `VIPShowContract`
- `ContractTermsConfig`
- `AssentEvidence`
- `SealRecord`
- `VerificationMedia`

Target model:

- One contract record type or one contract superclass with explicit subtypes.
- Immutable contract version and rendered terms snapshot.
- Assent, signatures, media, QR/barcode references, and audit events linked by contract ID.
- No contract facts duplicated across multiple records without a declared source of truth.

### Payments, POS, payouts, and accounting

Entities to reconcile:

- `POSTransaction`
- `POSBatch`
- `POSZReport`
- `PaymentRecord`
- `PaymentProvider`
- `PaymentVerificationLog`
- `VenuePaymentConfig`
- `DailySettlement`
- `ReconciliationRecord`
- `ReconciliationException`
- `JournalEntry`
- `LedgerAccount`
- `ChartOfAccounts`
- `PayrollRecord`
- `TipPayout`
- `DriverPayout`
- `ContractorPayout`
- `ContractorTaxForm`
- `PayoutSafetyLimit`
- `FinancialResolutionLog`

Target model:

- POS events produce payment records and balanced journal entries.
- Settlement and reconciliation reference immutable transaction IDs.
- Payouts reference their source transactions, approved calculation, actor, and audit event.
- Financial writes occur only through server-authorized functions.

### GlyphBucks

Entities to reconcile:

- `GlyphBucksBatch`
- `GlyphBucksBill`
- `GlyphBucksLedger`
- `GlyphBucksOrder`
- `GlyphBucksSale`
- `GlyphBucksTransaction`

Target model:

- `GlyphBucksLedger` or `GlyphBucksTransaction` becomes the immutable source of truth.
- Bills, batches, orders, and sales become views or linked workflow records.
- Issuance, redemption, expiration, voiding, and replacement are explicit ledger event types.
- Printed identifiers and QR/barcode keys are unique and non-reusable.

### QR, barcode, and scan evidence

Entities to reconcile:

- `QrAsset`
- `QrPreview`
- `QrVersion`
- `QRGenHistory`
- `QRKeyRegistry`
- `QrScanEvent`
- `QRScanEvent`
- `QRThreatLog`
- `SecureQRCode`
- `BarcodeRegistry`
- `ScanConfig`
- `ScanRun`
- `QRAIScore`

Target model:

- One canonical QR/barcode asset.
- Immutable versions.
- One canonical scan-event stream.
- Threat analysis and AI scoring reference scan-event IDs rather than creating parallel event histories.

### Audit and governance

Audit entities currently appear highly fragmented:

- `ActivityLog`
- `AuditEvent`
- `SystemAuditLog`
- `MigrationAuditLog`
- `AuditReport`
- `AuditComment`
- `AccessibilityAuditRow`
- `AgentAuditRow`
- `BackendAuditRow`
- `ContentAuditRow`
- `DomainAuditRow`
- `FeatureAuditRow`
- `IntegrationTestAuditRow`
- `NavAuditRow`
- `PerformanceAuditRow`
- `RouteAuditRow`
- `SecurityAuditRow`
- `SeoAuditRow`
- `SitemapAuditRow`
- `UxAuditRow`
- `GlyphBotAudit`
- `GlyphBotActivityLog`
- `BuilderActionLog`
- `SIEActionLog`

Target model:

- `AuditEvent`: immutable event stream for security, data, financial, and workflow actions.
- `AuditReport`: a report/run header.
- Typed finding records or structured metadata linked to the report.
- `ActivityLog`: optional human-readable operational feed derived from authoritative events.
- Migration logs remain separate only when required for chain-of-custody and deployment evidence.

### SIE and application inventory

Entities to reconcile:

- `ComponentRegistry`
- `FeatureRegistry`
- `ArchitecturalDecisionRecord`
- `PlatformDecisions`
- `SieComponentRecord`
- `SieFeatureRecord`
- `SieFindingRecord`
- `SiePageRecord`
- `SieRouteRecord`
- `SieScanRun`
- `SiteAudit`

Target model:

- One component registry and one feature registry.
- One ADR entity.
- SIE scan runs reference pages, routes, components, features, and findings through stable IDs.

### AI, agents, and conversations

Entities to reconcile:

- `AgentRuntimeModule`
- `AgentChangeSet`
- `BrowserAgentSession`
- `AgentAuditRow`
- `Conversation`
- `ConversationStorage`
- `GlyphBotChat`
- `GlyphBotMemory`
- `GlyphBotFeedback`
- `BotFeedback`
- `LLMFeedback`
- `PromptSpec`
- `AIDJPersona`
- `VoiceProfile`
- `ImageGenAttempt`
- `ImageGenAudit`

Target model:

- Separate conversation content, memory, feedback, runtime sessions, and change sets.
- Do not store credentials, unrestricted prompts, or sensitive user content in general audit rows.
- Every automated code or data change must link to actor, model/tool, source request, approval state, and resulting commit or record IDs.

## Execution phases

### Phase E0: Inventory

- Run the repository entity audit.
- Export each entity schema, permissions, indexes, relationships, and record count from Base44.
- Mark every entity as ACTIVE, LEGACY, DUPLICATE-CANDIDATE, MIGRATION-ONLY, or UNUSED-CANDIDATE.

### Phase E1: Security boundary

- Identify every direct frontend create/update/delete/bulkCreate call.
- Move critical writes behind authenticated backend functions.
- Verify row/entity permissions independently block forbidden SDK calls.

### Phase E2: Identity and venue integrity

- Standardize canonical IDs.
- Require venue and mode scope.
- Repair orphaned and cross-type references.

### Phase E3: Domain consolidation

- Consolidate duplicate QR scan streams.
- Consolidate contracts and assent evidence.
- Consolidate financial ledgers and payout provenance.
- Reduce audit-table fragmentation.

### Phase E4: Migration

- Back up every affected entity.
- Run idempotent migrations with before/after counts and hashes.
- Keep compatibility readers during transition.
- Block new writes to retired entities before archival.

### Phase E5: Verification and retirement

- Run role, venue, mode, financial, contract, and audit tests.
- Confirm no source references remain.
- Archive before deletion.
- Record the decision in an ADR and BPAAA evidence package.

## Non-negotiable release checks

- No normalized duplicate entity names.
- No critical direct frontend writes.
- No unscoped financial or identity reads.
- No missing `venue_id` or mode on scoped records.
- No orphaned foreign identifiers.
- No demo records in REAL queries.
- No undocumented entity with active records.
- No retirement without export, migration receipt, and rollback plan.
