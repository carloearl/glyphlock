# Tier 2 Detection — Deferred

**Status:** BLOCKED (Phase 7)
**Reason:** Base44 builder environment does not expose the primitives
required for either deterministic detection method.

## Method A — Cutoff Commit SHA
Requires `git log -L` line-history queries against a stamped cutoff SHA.
The Base44 builder has no shell access and no git command surface
exposed to backend functions or frontend code. **Not implementable here.**

## Method B — Explicit Legacy Manifest
Requires a custom linter (e.g., ESLint plugin) wired into the build step
that fails the build when a direct entity write occurs in a file not
listed in `LEGACY_MANIFEST.txt`. Base44 does not support custom build
steps, custom ESLint rules, or build-fail gating. **Not implementable here.**

## Decision

Per OMEGA v6.0 CP-7 (Blocker Protocol) and the master directive's own
fallback clause ("If neither method is implementable in your environment
within a single atomic step, REMAIN AT TIER 1"), this run remains at
**TIER_1_OBSERVE** indefinitely until the NUPS code is moved to a
self-hosted environment with shell + CI access.

## What this means

- writeEntity() is callable and emits MigrationAuditLog entries.
- Direct entity writes from existing or new code do NOT break the build.
- Adoption of writeEntity() is voluntary and tracked via audit log frequency.
- Migration to Tier 2 is a future-environment task, not a code task.