# NUPS Batch 15 Verification Record

**App:** Main GlyphLock / NUPS  
**Base44 App ID:** `697a087fb354faebb72df54b`  
**Date:** 2026-08-21  
**Starting commit:** `d0b52401729248b901214c1e894d9d7ff5dda38f`  
**Starting direct-write count:** `170 / 287`

## Implemented

- Protected-evidence authorization policy extracted into a shared server policy and executable fail-closed matrix.
- Protected archive/list surfaces no longer emit stored credential, W-9, verification-media, thumbprint, ID, guest-photo, or hardcopy references as raw links/images.
- `VIPContract` uploads ID/biometric evidence privately, resolves token/venue context server-side, previews only local object URLs, and submits opaque `protected:<id>` references.
- `transactionLookup` requires manager-class NUPS identity, enforces venue, and returns minimized evidence-presence metadata instead of raw identity/media records.
- API secrets are generated server-side, persisted only as hashes, displayed only from transient create/rotate responses, and revoked without destroying history.
- `VerificationMedia.protected_evidence_id` is the canonical new relationship; `media_url` remains legacy-only.
- `VenueTerminal` is the canonical trusted terminal registry; unresolved terminals fail closed. No real terminal records were invented.
- `GuestProfile` is the canonical minimized identity; `VIPGuest` is the linked venue/VIP projection. All identified live frontend and production-backend creators follow this rule.
- Generic Admin Data Manager updates, single deletes, and demo purges now route through `writeEntity()`.
- Tax, tip, contract, audit, and evidence list/read paths are venue scoped.

## Permanent checks

- `npm run check:nups-protected-evidence`
- `npm run check:nups-api-key-secrets`
- `npm run check:nups-guest-identity`
- `npm run check:nups-live-venue-boundaries`
- `npm run check:nups-sensitive-reads`
- `npm run check:nups-write-gateway`
- `npm run check:nups-frozen-rules`
- `npm run check:nups-isolation`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

All listed static/policy/build checks passed in the final Batch 15 verification run. The direct-write guard reports `167 / 287` with zero new bypasses.

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
- `NUPS-0009`: OPEN, deployed adversarial retrieval tests pending.
- `NUPS-0011`: OPEN, deployed adversarial retrieval tests and signed-URL expiry test pending.
- `NUPS-0013`: OPEN, real terminal IDs have not yet been provisioned into `VenueTerminal`.

## Runtime limitation

The available execution interface did not provide separate deployed authenticated sessions for anonymous, wrong-role, and wrong-venue adversarial calls. Therefore these tests remain `NOT VERIFIED` rather than being inferred from source or policy tests:

- deployed anonymous protected-evidence denial
- deployed wrong-role denial
- deployed wrong-venue denial
- deployed signed-URL expiration
- real trusted-terminal public-mode flow

No production publish was triggered and no real protected identity document or live API secret was used for testing.

## Status

`PARTIAL`

Implementation, static policy tests, lint, typecheck, and production build are verified. The batch remains PARTIAL only because the required deployed multi-identity adversarial tests and real terminal provisioning are not available in the current execution boundary.
