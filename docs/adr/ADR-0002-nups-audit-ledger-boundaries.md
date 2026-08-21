# ADR-0002 — NUPS Audit Ledger Boundaries

Status: Accepted
Date: 2026-08-20

## Decision

For governed NUPS business writes, the canonical automatic audit pair is:

1. `MigrationAuditLog` — gateway decision evidence (actor, role, operation, mode, allow/block result, block reason, venue scope).
2. `AuditEvent` — append-only observational business-event evidence.

`ActivityLog` remains an operational/user-facing mirror and is best-effort.

`SystemAuditLog` is reserved for security/system/administrative events and is not required for every governed business write. Its schema and RLS are not appropriate as the universal business-write ledger because creation is admin-scoped and its semantics are system/security oriented.

## Consequences

- The prior wording requiring `SystemAuditLog + AuditEvent` for every protected write is superseded.
- `writeEntity()` remains the canonical frontend governed-write gateway.
- Server-side functions may satisfy the invariant with an equivalent or stronger path if they emit comparable decision/actor evidence plus business-event evidence.
- Existing direct frontend writes remain grandfathered only under the Tier 2 legacy manifest and may decrease but not increase.
- New code must not introduce a fresh bypass around the governed write architecture.

## Rationale

This aligns the invariant with the live schemas and current gateway architecture instead of forcing business writes into a system/security log whose RLS would make universal emission unreliable for non-admin operational actors.
