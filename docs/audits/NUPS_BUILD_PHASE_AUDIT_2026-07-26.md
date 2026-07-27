# NUPS Build Phase and Production Readiness Audit

**Audit date:** 2026-07-26  
**Repository:** `carloearl/glyphlock`  
**Branch:** `main`  
**Current determination:** **NO-GO for live venue operations**

## Executive finding

NUPS is currently in **late Phase 1: role and navigation scaffolding**, with partial Phase 2 identity, mode, audit, and write-gateway code present. The codebase is not yet in final verification or production hardening.

The public preview and kiosk entry exist. Several role-specific routes and guards exist. However, key controls are still implemented in the browser, authenticated end-to-end proof is absent, automated CI was only just introduced, and multiple fail-open or cross-scope paths remain.

## Phase status

| Phase | Status | Evidence / blockers |
|---|---|---|
| 0. Inventory and evidence baseline | Partial | Repository and historical audits exist, but backend function source, live entity permissions, live records, and Base44 deployment state are not fully verified. |
| 1. Role and navigation scaffolding | Substantially implemented | Kiosk entry, role classes, guards, role homes, redirects, and admin role-view selector exist. Route coverage is inconsistent and some routes remain unguarded. |
| 2. Identity integrity and authorization | Incomplete / blocked | URL PIN preview grants ADMIN; role resolution has permissive fallbacks; NUPSUser lookup keys conflict across components; prior ID-01 contamination remains unproven as remediated. |
| 3. Mode isolation and write gateway | Incomplete / blocked | `writeEntity` runs client-side; missing SystemConfig defaults to REAL; demo seeding writes directly to Base44 entities; complete gateway-only enforcement is absent. |
| 4. Operator workflow hardening | Not proven | Staff, entertainer, POS, contracts, payouts, and Z-report flows require current source and authenticated runtime verification. Historical audits identify direct writes and missing venue filters. |
| 5. Financial integrity | Partial code only | Some arithmetic and tip-split checks exist, but server-side enforcement, entity permissions, and complete shift-cycle proof are missing. |
| 6. Contract execution | Not proven | Public walkthrough exists; current real contract persistence, signature chain, venue injection, and AuditEvent proof are not verified. |
| 7. Hardware hooks | Not verified | No current evidence package proving scanners, printers, terminals, fingerprint devices, or demo/real hardware gating. |
| 8. Final verification | Not started | No authenticated click-every-button run, database isolation proof, deliberate bypass tests, validator receipt, or BPAAA evidence package. |

## P0 blockers

### P0-1. Remove the production URL PIN admin bypass

`previewBypass.js` accepts `?pin=90210`, stores a preview flag, and creates a VENUE_OWNER session in `sessionStorage`. Both `RoleClassGuard` and `KioskSessionGuard` trust this bypass.

Required correction:

- Disable the bypass in production.
- Do not keep a shared PIN in frontend source.
- Preview access must use an authenticated, server-issued, expiring, view-only grant.
- Clear any existing `nups_owner_preview`, `nups_session`, and related preview storage when the app boots without a valid server grant.

### P0-2. Guard every data-bearing NUPS route

Several routes are reachable without a route-level role guard, including the owner dashboard and operational/data pages. Internal component checks must not be the only boundary.

Required correction:

- Apply canonical route guards to every NUPS page.
- Default unresolved roles to denial, not STAFF or DOOR_GIRL.
- Keep public routes limited to landing, kiosk authentication, access request, verification, and explicitly sandboxed demos.

### P0-3. Replace the client-side write gateway with server-side enforcement

`writeEntity` is a browser helper and ultimately calls `base44.entities.*` directly. A user able to call the SDK outside that helper can bypass its rules unless Base44 entity permissions independently block the write.

Required correction:

- Move protected writes to backend functions.
- Validate authenticated identity, role, venue, mode, record ownership, and financial rules server-side.
- Restrict direct entity writes using Base44 entity permissions.
- Keep frontend helpers as request clients only, never as the authority.

### P0-4. Fail closed on missing mode configuration

A missing global SystemConfig currently bootstraps to REAL. This can convert an unconfigured tenant into a live-write environment.

Required correction:

- Missing, duplicate, or invalid mode configuration must block protected writes.
- Initial tenants should require explicit administrator activation.
- DEMO and SANDBOX records must be physically and logically isolated from REAL reads and writes.

### P0-5. Enforce venue and mode scoping on every read

The owner dashboard loads up to 500 POSTransaction records without a venue filter or explicit mode filter and aggregates them client-side.

Required correction:

- Resolve venue and mode from a server-validated session.
- Query only authorized venue/mode records.
- Prohibit client-controlled venue switching without a new server grant.

## P1 blockers

1. Standardize NUPSUser identity lookup. Components currently query different fields such as `created_by` and `username`, while historical data indicates username may contain a login name rather than email.
2. Resolve MDL ID-01 record contamination and prove referential integrity for Entertainer, NUPSUser, EntertainerShift, UserRoleAssignment, payroll, contracts, and venue links.
3. Verify and repair entertainer contract gating. Historical audit found `contract_status` referenced by code but absent from the entity schema.
4. Verify every clock-in/out path writes a valid `venue_id`, mode, canonical person ID, active session ID, and audit references.
5. Eliminate direct frontend writes from entertainer check-in, Z-report generation, demo seeders, and any remaining POS, payroll, contract, or payout component.
6. Locate and audit the deployed backend implementations of `nupsAccessControl`, `nupsClockIn`, and every invoked function. Their source is not present at expected repository paths.
7. Remove hardcoded venue IDs and names from operational logic.
8. Add route and API tests for all role classes: STAFF, ENTERTAINER, MANAGER, and ADMIN.

## CI baseline added

A GitHub Actions workflow now runs on pushes and pull requests to `main`:

- `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

A passing build is necessary but not sufficient. Production readiness also requires authenticated integration tests, permission tests, database inspection, mode-isolation tests, and workflow evidence.

## Required release gates

NUPS remains NO-GO until all of the following are proven:

1. CI passes on the release commit.
2. No production frontend secret, shared PIN, or URL bypass exists.
3. Every protected route denies unauthenticated and unauthorized access.
4. Every protected write is server-authorized.
5. Every protected read is venue- and mode-scoped.
6. DEMO cannot write to or read REAL records, including through deliberate forged requests.
7. REAL cannot display DEMO records.
8. A complete staff shift, entertainer shift, POS sale, VIP contract, GlyphBucks flow, payout, closeout, Z-report, and dispute-evidence flow passes.
9. SystemAuditLog and AuditEvent both contain the expected records for the test session.
10. Live database inspection confirms canonical IDs, venue IDs, modes, and no orphaned records.
11. The Base44 deployment commit matches the audited GitHub release commit.
12. A signed BPAAA v3.0 evidence package is produced for the release.

## Operating model

- GitHub `main` is the source of truth.
- Changes should be made through small, auditable commits or pull requests.
- Base44 AI generation is not required for ordinary source maintenance.
- Base44 may remain the current runtime/backend until a deliberate migration is planned and tested.
- No assistant, model, or developer may self-certify production readiness. Evidence decides.
