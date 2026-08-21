# INVARIANTS.md

**Layer 3 — Domain State.** Authoritative record of NUPS frozen business rules.  
**Owner:** Carlo — GlyphLock LLC. Only the owner may change an invariant, and only via ADR.  
**Mapped/confirmed:** 2026-08-20

> Agents: this file outranks existing implementation. If code contradicts an invariant here, the code is the defect or an explicitly documented migration exception in `KNOWN_ISSUES.md`.

## Changing an invariant

1. Open an ADR in `docs/adr/` stating the current rule, proposed rule, and blast radius.
2. Owner approves.
3. Update this file, bump the version, and add a change-log row.
4. Re-issue Tier 0 CORE if the seven-line summary changed.

Never change an invariant as a side effect of a feature.

## INV-01 — Sales composition

`total_sales = cash_sales + card_sales`

No other value enters `total_sales`. Z Report and settlement revenue must be recomputed from these two fields only.

**Live enforcement located:** `src/lib/nups/writeEntity.js` validates this for `POSZReport` and `DailySettlement`; accounting/reporting paths also treat cash/card as the bridge.  
**Status:** FROZEN

## INV-02 — GlyphBucks treatment

GlyphBucks is a closed-loop stored-value liability instrument. Former name **Dream Dollars** is retired.

- Issuing, transferring, or displaying GlyphBucks never creates revenue.
- GlyphBucks must not enter `total_sales`.
- Accounting treatment remains separated from cash/card sales.
- Stored-value/compliance treatment may not be altered as a side effect of another feature.

The live system currently has dedicated GlyphBucks liability entities in addition to older notes-JSON compatibility paths. The invariant is the accounting treatment, not a requirement to force all storage into one legacy field.

**Status:** FROZEN

## INV-03 — Entertainer classification

Entertainers are independent contractors.

- Never classify entertainers as W-2 employees.
- Never include entertainers in employee payroll or employee tip pools.
- Never place entertainers on the staff tip line.
- The obsolete 70/15/10/5 tip-pool split is forbidden and must be flagged on sight.
- Contractor-specific payout/tax workflows may exist but must remain semantically separate from employee payroll.

**Live static guard:** `npm run check:nups-frozen-rules` passed 2026-08-20.  
**Migration debt:** legacy entity/component names still use `PayrollRecord` / `EntertainerPayrollEngine`; see `KNOWN_ISSUES.md`.  
**Status:** FROZEN

## INV-04 — Environment isolation

REAL, DEMO, and SANDBOX are the canonical ledger modes and are resolved through the canonical NUPS mode resolver. Provider credentials must agree with the resolved environment.

- Canonical resolver: `src/lib/nups/modeResolver.js`
- Canonical exports: `getMode(requestContext, venue_id)` and `getActiveMode(venue_id)`
- Resolution order: request context → `VenueRateConfig.mode` → legacy venue `SystemConfig` → legacy global `SystemConfig` → REAL default.
- For Stripe, `sk_live_` is valid only in REAL and `sk_test_` only in non-production contexts.
- Credential prefixes are validation signals, never the source of truth for application mode.
- Environment data, credentials, transactions, analytics, and financial reports must not cross boundaries.
- TRAINING is an operator mode on the DEMO ledger, not a fourth ledger mode.

**Live static guard:** `npm run check:nups-isolation` passed 2026-08-20.  
**Status:** FROZEN

## INV-05 — Venue scoping

`venue_id` resolves dynamically for production/live paths. No new hardcoded production venue identifiers may be introduced.

Demo fixtures may use a clearly isolated constant such as `DEMO_VENUE_001` only when the path is provably DEMO-only and cannot contaminate REAL data.

**Canonical selection helper:** `src/hooks/useActiveVenue.js`.  
**Known violations/legacy fallbacks:** see `KNOWN_ISSUES.md`.  
**Status:** FROZEN

## INV-06 — Write path and audit

All NUPS business writes are intended to converge on `writeEntity()` or a server-side function that provides an equivalent or stronger governed path.

The frozen audit requirement remains: protected writes must produce sufficient immutable/append-only evidence for both gateway decision/actor context and business-event auditability.

**Canonical gateway:** `src/lib/nups/writeEntity.js`.

**Current automatic gateway evidence:**
- `MigrationAuditLog` allow/block decision record
- `AuditEvent` observational business event
- `ActivityLog` operational mirror

Per `docs/adr/ADR-0002-nups-audit-ledger-boundaries.md`, the canonical automatic audit pair for governed business writes is `MigrationAuditLog + AuditEvent`. `ActivityLog` remains a best-effort operational mirror. `SystemAuditLog` is reserved for security/system/administrative events and is not required for every business write.

Direct frontend writes remain grandfathered under `config/nups-direct-write-legacy-manifest.json`; their count may decrease but may not increase. This is a migration exception, not permission for new bypasses.

**Static guard result 2026-08-20:** 287/287 grandfathered writes; no new bypasses.  
**Status:** FROZEN — MIGRATION IN PROGRESS

## INV-07 — Security boundary

Never expose secrets, API keys, provider credentials, private identity information, or privileged configuration to client-side code or unauthorized roles.

Uploaded identity/credential evidence must not be intentionally configured for public access. Public sharing features must remain separate from protected identity evidence.

- Secrets are read server-side from environment/secrets storage.
- `.env`, private keys, OAuth secrets, and tokens must never be committed.
- Identity evidence requires role-restricted access and minimized fields where practical.

**Status:** FROZEN

## Roles

Operational vocabulary currently includes Manager · Bartender · Door Girl · Doorman · Hostess · VIP Hostess · Security · DJ · Driver · Entertainer/Performer · Owner · Admin · Kiosk.

Persistent and frontend role sets are not perfectly aligned; see `KNOWN_ISSUES.md`.

## Change log

| Version | Date | Change | ADR |
|---|---|---|---|
| 5.0 | 2026-08-20 | Baseline seven invariants mapped to canonical live GlyphLock/NUPS app; resolver path filled; live migration exceptions documented without weakening rules | ADR pending |
