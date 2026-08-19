# Tier 2 Detection — Active Source Cutoff

**Status:** ACTIVE FOR NEW FRONTEND WRITES (Phase 7 source gate)  
**Activated:** 2026-08-19  
**Runtime migration state:** Existing call sites remain grandfathered and are reduced incrementally.

## Method A — Cutoff Commit SHA

Not used. The Base44 sandbox still does not expose a local `.git` history suitable for deterministic line-history checks.

## Method B — Explicit Legacy Manifest

Implemented with:

- `scripts/check-nups-write-gateway.mjs`
- `config/nups-direct-write-legacy-manifest.json`
- package script `check:nups-write-gateway`
- required `NUPS CI` step before lint, typecheck, and build

The manifest records each existing frontend file, entity-operation signature, and allowed count. The guard fails when:

1. A direct `base44.entities.*.create/update/delete/bulkCreate` call appears in a new file.
2. A file introduces a new entity-operation signature.
3. An existing grandfathered signature count increases.
4. A dynamic `base44.entities[expression]` write exceeds its cutoff.

Counts may decrease without updating the manifest. New protected writes must use `writeEntity()` or an authenticated backend function.

## Current cutoff

- Grandfathered frontend writes at activation: **287**
- New direct frontend writes permitted: **0**
- `QrStudio` diagnostics were moved behind `recordQrScanEvent` before the cutoff.

## Honest limitation

This is a source/CI enforcement tier, not proof that all 287 legacy calls are safe. Existing calls remain a migration backlog. Backend service-role writes require separate function-level authorization and audit review.
