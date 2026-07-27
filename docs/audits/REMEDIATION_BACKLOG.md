# NUPS Remediation Backlog

This backlog translates the 2026-07-26 production-readiness audit into an ordered engineering program.

## Release status

**Current:** NO-GO  
**Target:** controlled DEMO release first, followed by evidence-backed REAL activation.

## Workstream A — Authentication and authorization

- [ ] A1 Disable `?pin=90210` and all frontend owner-preview authority in production.
- [ ] A2 Replace preview bypass with authenticated server-issued, expiring, view-only grants.
- [ ] A3 Guard every data-bearing NUPS route with the canonical role matrix.
- [ ] A4 Change unresolved identity/role behavior from STAFF fallback to deny.
- [ ] A5 Standardize NUPSUser identity lookup and migrate conflicting records.
- [ ] A6 Audit `nupsAccessControl` and `nupsClockIn` deployed backend implementations.
- [ ] A7 Add automated allow/deny tests for STAFF, ENTERTAINER, MANAGER, and ADMIN.

## Workstream B — Server-side data boundary

- [ ] B1 Inventory every `base44.entities.*.create/update/delete/bulkCreate` call.
- [ ] B2 Classify each write as public-safe, operational, financial, identity, or administrative.
- [ ] B3 Move protected writes behind backend functions.
- [ ] B4 Configure Base44 entity permissions to reject direct protected writes.
- [ ] B5 Require server-derived actor, role, venue, mode, and session context.
- [ ] B6 Add write rejection tests for forged actor, venue, mode, and record IDs.

## Workstream C — Mode isolation

- [ ] C1 Remove automatic REAL bootstrap when SystemConfig is missing.
- [ ] C2 Fail closed on missing, duplicate, or invalid mode configuration.
- [ ] C3 Enforce mode on every protected record and query.
- [ ] C4 Rebuild demo seeding through a server-side DEMO-only endpoint.
- [ ] C5 Prove DEMO cannot read/write REAL and REAL cannot display DEMO.
- [ ] C6 Prevent mid-session mode changes without a new server-issued session.

## Workstream D — Venue and identity integrity

- [ ] D1 Complete MDL ID-01 remediation.
- [ ] D2 Validate canonical IDs across NUPSUser, Entertainer, EntertainerShift, UserRoleAssignment, contracts, payroll, payouts, and audit records.
- [ ] D3 Require `venue_id` on all venue-scoped operational records.
- [ ] D4 Remove hardcoded venue names and IDs from operational code.
- [ ] D5 Repair or migrate orphaned, demo-contaminated, and cross-entity records.
- [ ] D6 Add integrity validators and database inspection receipts.

## Workstream E — Core workflows

- [ ] E1 Staff clock-in/out.
- [ ] E2 Entertainer onboarding, contract gate, clock-in/out, and payout.
- [ ] E3 Front-door identity and admission flow.
- [ ] E4 Register/POS sale, receipt, batch, and closeout.
- [ ] E5 VIP sale, contract, signature, and evidence linkage.
- [ ] E6 GlyphBucks issue, print, redemption, ledger, and expiration.
- [ ] E7 Driver payout and staff tip distribution.
- [ ] E8 Z-report and daily settlement.
- [ ] E9 Dispute evidence package and dual audit trail.

## Workstream F — Verification and release

- [x] F1 Add GitHub Actions build, lint, and type-check workflow.
- [ ] F2 Make CI pass on `main`.
- [ ] F3 Add component and permission tests.
- [ ] F4 Add authenticated integration tests.
- [ ] F5 Run click-every-button role-by-role test matrix.
- [ ] F6 Run deliberate route, write, identity, venue, and mode bypass tests.
- [ ] F7 Verify Base44 deployment commit matches audited GitHub commit.
- [ ] F8 Produce BPAAA v3.0 release evidence package.
- [ ] F9 Approve DEMO release.
- [ ] F10 Approve REAL release only after separate evidence review.

## Execution order

1. A1–A7
2. B1–B6
3. C1–C6
4. D1–D6
5. E1–E9
6. F2–F10

No later workstream closes an earlier control failure. A polished dashboard does not compensate for an authorization hole, despite the software industry's recurring attempts to prove otherwise.
