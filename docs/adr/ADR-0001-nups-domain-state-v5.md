# ADR-0001 — NUPS Engineering Protocol v5 / Layer 3 Domain State

**Status:** Proposed for owner approval  
**Date:** 2026-08-20  
**Authority:** GlyphLock LLC / DACO  
**Scope:** NUPS engineering governance and living architecture documentation

## Context

NUPS has accumulated implementation history across Base44, GitHub, operational directives, handoffs, and evolving venue requirements. Long agent prompts and historical chat instructions are not reliable as the sole architecture record. Current code also contains legacy compatibility paths that must not be mistaken for current business intent.

## Decision

Adopt a four-layer engineering knowledge model:

1. **Layer 0 — CORE:** short always-on frozen rules and completion discipline.
2. **Layer 1 — AGENT DIRECTIVE:** engineering workflow and source-of-truth hierarchy.
3. **Layer 2 — ENGINEERING REFERENCE:** detailed reusable procedures.
4. **Layer 3 — DOMAIN STATE:** current verified facts about NUPS, stored in repository documents.

Layer 3 canonical files are:

- `/CONTEXT.md`
- `/ARCHITECTURE.md`
- `/INVARIANTS.md`
- `/INTEGRATIONS.md`
- `/KNOWN_ISSUES.md`
- `/docs/adr/`

## Source-of-truth hierarchy

When requirements conflict:

1. latest explicit owner directive
2. frozen NUPS invariants
3. accepted specification / ADR
4. current verified production behavior
5. repository documentation
6. existing implementation
7. agent inference

Historical chat text is not automatically rank 1. Agent inference never overrides a higher source.

## Consequences

### Positive

- agents can orient against the real current system instead of old chat context
- frozen rules are separated from implementation facts
- known mismatches become explicit defects rather than silent reinterpretations
- architecture changes update Layer 3 without rewriting the agent constitution
- integration maturity and verification claims become evidence-driven

### Tradeoffs

- Layer 3 must be maintained when architecture changes
- legacy code may temporarily contradict desired invariants and must be recorded as controlled migration debt
- some current rules require owner decisions before code/docs can be reconciled

## Initial mapping evidence

The 2026-08-20 mapping used the canonical Base44 app `697a087fb354faebb72df54b` and confirmed:

- canonical repository `carloearl/glyphlock`, branch `main`
- 170 Base44 entity schemas across the GlyphLock app
- canonical mode resolver at `src/lib/nups/modeResolver.js`
- canonical write gateway at `src/lib/nups/writeEntity.js`
- active frontend RBAC mapping at `src/config/roles.js`
- Base44 connector state
- Tier-2 direct-write guard baseline of 287 grandfathered frontend writes
- passing frozen-rule and mode-isolation checks

## Open decisions created by this ADR

This ADR does **not** silently settle:

- whether INV-06 should specifically require `SystemAuditLog + AuditEvent` or ratify the live `MigrationAuditLog + AuditEvent + ActivityLog` gateway evidence design
- how legacy `PayrollRecord` contractor-oriented history should be renamed/migrated
- how TEST labels in legacy VIP/access flows normalize into canonical ledger modes
- final canonical RBAC vocabulary across `NUPSUser`, `PlatformRole`, `UserRoleAssignment`, and frontend roles

Those require separate owner-approved ADRs if they change frozen intent or public architecture.
