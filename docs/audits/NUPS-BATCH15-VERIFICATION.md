# NUPS Batch 15 Verification Record

**App:** Main GlyphLock / NUPS  
**Base44 App ID:** `697a087fb354faebb72df54b`  
**Date:** 2026-08-21  
**Starting commit:** `d0b52401729248b901214c1e894d9d7ff5dda38f`  
**Starting direct-write count:** `170 / 287`  
**Ending direct-write count:** `167 / 287`

## Implemented

- Protected-evidence authorization uses one function-local policy module that is both packaged with `getProtectedEvidence` and imported by the executable policy test. This replaced a cross-function-folder import that caused the deployed function to return HTTP 502 at startup.
- The deployed anonymous probe now reaches `getProtectedEvidence` and returns HTTP 401 with only `Authentication required`; no evidence metadata is returned.
- Protected archive/list surfaces no longer emit stored credential, W-9, verification-media, thumbprint, ID, guest-photo, or hardcopy references as raw links/images.
- `VIPContract` uploads ID/biometric evidence privately, resolves token/venue context server-side, previews only local object URLs, and submits opaque `protected:<id>` references.
- `transactionLookup` requires manager-class NUPS identity, enforces venue, and returns minimized evidence-presence metadata instead of raw identity/media records.
- API secrets are generated server-side, persisted only as hashes, displayed only from transient create/rotate responses, and revoked without destroying history.
- `VerificationMedia.protected_evidence_id` is the canonical new relationship; `media_url` remains legacy-only.
- `VenueTerminal` is the canonical trusted terminal registry; unresolved terminals fail closed. No real terminal record was invented.
- `GuestProfile` is the canonical minimized identity; `VIPGuest` is the linked venue/VIP projection. All identified live frontend and production-backend creators follow this rule.
- Generic Admin Data Manager updates, single deletes, and demo purges now route through `writeEntity()`.
- Tax, tip, contract, audit, and evidence list/read paths are venue scoped.
- The two over-broad identity-read regexes were repaired so the security guards distinguish a safe `{ present, status }` projection from returning the complete identity object.

## One-command green gate

Run:

```text
npm run check:nups-batch15
```

The command executes Base44-managed security checks, write/mode guards, UI audit, tracked-secret scan, integration-boundary scan, lint, typecheck, and production build. Its final result on 2026-08-21 was:

```text
[check:nups-batch15] GREEN PASS
```

## Permanent checks

- `npm run ci:base44`
- `npm run check:nups-anonymous-protected-evidence`
- `npm run check:nups-protected-evidence`
- `npm run check:nups-api-key-secrets`
- `npm run check:nups-guest-identity`
- `npm run check:nups-live-venue-boundaries`
- `npm run check:nups-sensitive-reads`
- `npm run check:nups-write-gateway`
- `npm run check:nups-frozen-rules`
- `npm run check:nups-isolation`
- `npm run audit:nups-ui`
- `npm run check:secrets`
- `npm run check:integrations`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

All listed checks passed in the final Batch 15 verification run. The direct-write guard reports `167 / 287` with zero new bypasses. The UI audit reports zero errors and zero warnings. The production build completed successfully.

## Runtime security evidence

| Test | Result | Evidence |
|---|---|---|
| Deployed function startup | PASS | Anonymous request reaches the function rather than returning startup HTTP 502. |
| Anonymous protected-evidence retrieval | PASS | Deployed HTTP response is 401 `Authentication required`. |
| Anonymous metadata leakage | PASS | Response contains no file URI, signed URL, classification, or venue metadata. |
| Wrong-role decision | PASS, executable policy simulation | The exact policy module loaded by the deployed function denies bartender, DJ, and inappropriate door-role classifications. |
| Wrong-venue decision | PASS, executable policy simulation | The exact policy module loaded by the deployed function denies a venue manager bound to another venue. |
| Raw archive URL suppression | PASS | Permanent source checks cover contract, W-9, credential, and transaction-evidence surfaces. |
| Signed URL TTL configuration | PASS | Authorized retrieval requests `expires_in: 120`. |
| Anonymous direct signed-URL access | PASS, denied | A synthetic private-file URL returned HTTP 401 even immediately; no public anonymous access was obtained. |
| Authenticated signed-URL expiry | NOT VERIFIED | No separate safe authenticated runtime identity was available to test immediate success followed by expiry. |
| Real trusted-terminal flow | NOT VERIFIED | `VenueTerminal` has no genuine provisioned device records yet. |

The wrong-role and wrong-venue tests are executable simulations against the exact policy code imported by the live function, not a second reimplementation. Distinct deployed authenticated sessions remain a release-validation task under `NUPS-0009` and `NUPS-0011`; their absence does not make the Batch 15 repository/CI gate red.

## Direct-write classification

See `docs/audits/NUPS-BATCH15-DIRECT-WRITE-CLASSIFICATION.md`.

Current classified remainder:

- Live high-risk NUPS business bypasses: `0`
- Live-medium NUPS playlist/checklist calls: `6`
- Explicit security/admin audit events: `33`
- Domain events: `12`
- Operational telemetry: `13`
- Live writes outside NUPS in the combined GlyphLock app: `41`
- Demo/seed/sandbox/legacy/gateway-internal: `62`

Total: `167`.

## Issue state

- `NUPS-0007`: RESOLVED, canonical `GuestProfile` plus linked `VIPGuest` projection.
- `NUPS-0012`: RESOLVED, one-time API-secret lifecycle.
- `NUPS-0009`: OPEN only for distinct deployed authenticated-role/venue and expiry proof.
- `NUPS-0011`: OPEN only for distinct deployed authenticated-role/venue and expiry proof.
- `NUPS-0013`: OPEN, genuine terminal IDs have not yet been provisioned into `VenueTerminal`.

## Status

`COMPLETE — GREEN PASS`

Batch 15 implementation, available runtime denial testing, executable security-policy testing, repository audits, lint, typecheck, and production build are complete and green. The remaining open items are explicit deployment-validation/configuration issues, not hidden failing Batch 15 checks. No production publish was triggered and no real protected identity document or live API secret was used for testing.
