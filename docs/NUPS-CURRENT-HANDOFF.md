# NUPS Current Engineering Handoff

**Authoritative through:** Batch 17 execution, 2026-08-23  
**App:** Main GlyphLock / NUPS  
**Base44 App ID:** `697a087fb354faebb72df54b`  
**Repository:** `carloearl/glyphlock`  
**Branch:** `main`

This document supersedes `src/docs/HANDOFF.md`, which is retained only as the historical NUPS DACO OMEGA v6.0 record from May 2026.

## Current verified baseline

```text
Original direct-write baseline:       287
Controlled write migration:           161 / 287
Current grandfathered frontend calls: 161
Total removed:                        126
New bypasses introduced:                0
Live high-risk NUPS bypasses:            0
Live-medium NUPS bypasses:               0
```

The remaining calls are classified in `docs/audits/NUPS-BATCH16-DIRECT-WRITE-CLASSIFICATION.md`. They are explicit security/domain/telemetry evidence, general GlyphLock persistence outside NUPS, demo/seed/sandbox paths, legacy/unmounted code, or canonical gateway internals.

## Canonical controls

- Business writes use `writeEntity()` or an equivalent server-side governed path.
- Automatic governed-write evidence is `MigrationAuditLog + AuditEvent`; `ActivityLog` is a best-effort operational mirror.
- `SystemAuditLog` is reserved for explicit security, system, and administrative events.
- Canonical modes are `REAL`, `DEMO`, and `SANDBOX`; TRAINING is DEMO-backed presentation.
- Production venue context resolves dynamically and fails closed.
- `VenueTerminal` is the sole pre-authentication device-to-venue trust boundary.
- Kiosk sessions use NKS2 only. The old NKS1 endpoint is an HTTP 410 tombstone.
- API secrets are generated server-side, displayed once, and stored only as hashes.
- Protected evidence uses private file URIs behind opaque `ProtectedEvidence` records and server-authorized signed retrieval.

## Identity model

```text
GuestProfile = canonical minimized guest identity
VIPGuest     = venue/VIP workflow projection
```

`VIPGuest` links through `guest_profile_id` and the deterministic `guest_id`. Current operational creation paths do not write full government ID numbers or copy protected images into the VIP projection.

Entertainers remain independent contractors. `EntertainerShift`, `ContractorTaxForm`, and `ContractorPayout` remain separate from employee payroll and employee tip pools.

## Financial invariants

```text
total_sales = cash_sales + card_sales
GlyphBucks  = stored-value liability, not revenue
Driver payout = disbursement, not negative sales
Debits = credits
```

REAL, DEMO, and SANDBOX data must remain isolated in records, reports, integrations, and analytics.

## Terminal commissioning

The software approval boundary is complete. Each physical browser/device must be commissioned once using the exact non-secret ID stored in that browser.

Runbook:

```text
docs/runbooks/NUPS-TERMINAL-APPROVAL.md
```

No synthetic terminal may remain active or trusted. The Batch 16 synthetic terminal is permanently revoked and untrusted.

## Protected evidence acceptance

Proven:

- private upload works with a real `File` payload;
- ordinary responses do not return `file_uri`;
- anonymous `getProtectedEvidence` is HTTP 401;
- anonymous access to a generated signed URL is denied;
- executable role/classification/venue policy is fail-closed;
- protected archive/list surfaces do not emit raw references.

Still requires five distinct authenticated sessions:

- same-venue manager allow;
- door identity allow;
- door tax/biometric denial;
- ordinary staff denial;
- wrong-venue manager denial;
- global-role behavior;
- authenticated signed-URL use and expiry;
- corresponding audit reconciliation.

Runner and runbook:

```text
npm run test:nups-batch17-authenticated
docs/runbooks/NUPS-BATCH17-AUTHENTICATED-ACCEPTANCE.md
```

Tokens are supplied only as runtime environment variables. No `.env` file is used.

Batch 17 prepared five disposable Base44 users and matching DEMO/SANDBOX NUPS roles without changing any real staff account. Base44 required the emailed OTP before password login, and that one-time-code step could not be submitted through the automated execution boundary. No bearer token was created and no authenticated result was inferred. All five NUPS test identities were suspended, their test window was closed, temporary credentials were removed, and the isolated Venue B configuration was disabled.

## DJ architecture

One `DJSessionProvider` owns the persistent mixer session. Deck state, song objects, provider health, queue, crossfade, and command acknowledgements survive internal view changes. Spotify and Apple Music remain discovery/import metadata sources, not venue playback sources. Club TV and external Fable surfaces remain visual or muted secondary displays rather than duplicate audio owners.

Automated continuity controls:

```text
npm run test:dj
npm run check:nups-dj-continuity
```

A real provider/browser soak remains a release-acceptance activity and must not be replaced by reducer tests.

## Permanent verification

```text
npm run check:nups-batch16
npm run check:nups-batch17
```

Core component checks include write-gateway, frozen financial rules, environment isolation, identity projection, protected evidence, API-secret lifecycle, terminal governance, sensitive reads, DJ continuity, UI audit, tracked-secret scan, integrations, lint, typecheck, and production build.

## Open domain state

- `NUPS-0002`: controlled app-wide migration remains `161/287`; live NUPS operational migration is complete.
- `NUPS-0009`: authenticated private-retrieval and expiry proof pending.
- `NUPS-0010`: resolved through governed `IntegrationMaturity` records; individual integrations retain their evidence-backed limitations.
- `NUPS-0011`: private boundary is implemented; authenticated E2E proof pending.
- `NUPS-0013`: software control complete; real physical devices require one-time commissioning.

See `KNOWN_ISSUES.md` for acceptance standards and history.

## Production boundary

No production publish is authorized by this handoff.

**Current release verdict: NO-GO.** The non-interactive engineering suite is green, but the five-session authenticated protected-evidence test, real physical terminal commissioning, full authenticated venue browser journey, and real-provider 30-minute DJ soak are not complete. A release requires a separate DACO directive after those acceptance items and the ending-commit GitHub Actions run pass.
