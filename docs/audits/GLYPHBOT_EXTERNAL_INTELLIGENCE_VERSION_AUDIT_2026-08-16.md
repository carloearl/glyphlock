# GlyphBot External Intelligence / BeenVerified — Version Audit

## Purpose
This is the canonical audit/versioning record for the GlyphBot Audit external-intelligence provider layer published on 2026-08-16.

## Release Identity
- Release label: `external-intel/beenverified`
- Release date (UTC): `2026-08-16`
- Canonical repository: `carloearl/glyphlock`
- Branch: `main`
- Published feature commit: `2f9d5cfe020e0c0445a88bc77239cd3d4d40e9a0`
- Source PR: `#2` — GlyphBot Audit: add guarded external intelligence provider layer
- Base44 checkpoint: `GlyphBot Audit external intelligence published state`
- Base44 checkpoint ID: `6a820dfd5b66c2e59de73091`
- Scope: GlyphBot Audit only. No NUPS/POS or venue integration.

## Included Work
1. Added append-only `AuditEvidence` provenance records for external GlyphBot Audit evidence.
2. Added admin-only `glyphbotAuditExternalIntelligence` backend gateway.
3. Registered BeenVerified as an optional provider without inventing undocumented endpoints or request/response contracts.
4. Added SHA-256 query fingerprints so raw lookup queries are not persisted in `AuditEvidence`.
5. Added purpose restrictions blocking employment, housing/tenant, credit/lending, insurance, and other eligibility-decision uses.
6. Updated GlyphBot instructions so external-provider results remain corroborative evidence rather than authoritative identity assertions.
7. Added provider configuration/status handling and fail-closed behavior.

## BeenVerified Activation State
Status: `AWAITING_OFFICIAL_PROVIDER_CONTRACT`

Required configuration values:
- `BEENVERIFIED_API_URL`
- `BEENVERIFIED_API_KEY`
- `BEENVERIFIED_API_CONTRACT_VERSION`

Live lookup remains intentionally disabled until BeenVerified supplies official commercial API documentation and the documented request/authentication/response contract is implemented and version-pinned.

## Provider Outreach
On 2026-08-16, a commercial API access request was sent to BeenVerified requesting API availability, documentation, endpoint/authentication requirements, pricing/rate limits, permitted uses, retention requirements, and available lookup types. The request explicitly excludes employment, tenant/housing, credit, insurance, and other FCRA/eligibility decision uses.

## Evidence and Safety Invariants
- External provider data is corroborative evidence, not a source of truth.
- A single provider match must not be represented as verified identity.
- Raw provider credentials and authentication headers must never be exposed to GlyphBot or audit reports.
- Raw lookup input is not stored in `AuditEvidence`; a SHA-256 fingerprint is stored instead.
- Evidence must retain provider, lookup type, retrieval timestamp, correlation identifier, confidence/corroboration state, and policy metadata when available.
- Provider integration must fail closed when configuration or contract mapping is incomplete.

## Current Release State
- GitHub: merged to canonical `main`.
- Base44 application state: verified to contain the GlyphBot instruction update, `AuditEvidence` entity, and `glyphbotAuditExternalIntelligence` backend function corresponding to the published commit.
- Base44 checkpoint: created after verification.
- BeenVerified live API calls: not active pending official provider contract/documentation.

## Versioning Rule
Any future change to the BeenVerified adapter, provider contract version, evidence normalization, permitted-purpose policy, or GlyphBot Audit external-intelligence behavior must update this record or add a successor version-audit entry that references this release.
