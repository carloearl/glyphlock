# NUPS-RG-01 Codex Security Report

**Scan type:** Standard single-pass repository security scan  
**Scope:** `carloearl/glyphlock` at `ebc520bf0fe9444cc9103c864c66aa6704d79fbb`  
**Mode:** Read-only; no automatic fixes  
**Focus:** Authentication, approvals, role escalation, venue/mode isolation, kiosk sessions, terminal trust, PINs, protected evidence, identity, payments, accounting, contracts, uploads, integrations, secrets, public routes, Admin Override and legacy exposure.

## Executive Security Verdict

The baseline has meaningful fail-closed controls and its specialized approval, write-gateway, mode, terminal, protected-read, DJ, secret and integration checks passed. The scan nevertheless found one high-severity static authorization/data-isolation path, an unresolved high-severity dependency advisory set, and a medium-severity release-governance weakness. A clean specialized test suite cannot compensate for a dashboard/RLS path that those tests do not cover.

## Findings

| ID | Severity | Status | Title | Evidence | Impact | Limitations | Remediation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RGSEC-001 | HIGH | VALIDATED_STATIC | NUPSHub can mount without a NUPS role guard and reads cross-venue transaction data | src/App.jsx routes `/NUPSHub` without RoleClassGuard/KioskSessionGuard; src/pages/NUPSHub.jsx:92-105 calls POSTransaction.list without venue or mode filter; base44/entities/POSTransaction.jsonc read RLS contains unconditional staff and manager branches. | An authenticated platform account with a broad staff/manager role can potentially read and aggregate other venues' sales, items, cashier/customer identifiers, last-four/auth metadata, and payment details. The route defaults an unrecognized user to a DOOR_GIRL presentation, which is not authorization. | No production query or exploit was executed. Finding is based on exact baseline source and RLS logic. | Guard `/NUPSHub` with explicit NUPS grant/venue/mode authority; query exact venue and mode; remove unconditional staff/manager RLS branches; add a negative cross-venue runtime test and expand check:nups-sensitive-reads. |
| RGSEC-002 | HIGH | OPEN | Exact baseline has 18 production dependency advisories | `npm audit --omit=dev` on ebc520bf: 12 high, 6 moderate. Affected dependency families include dompurify, lodash, postcss, react-router/react-router-dom, react-quill/quill, ws/socket.io transitives, glob/minimatch, and Monaco nested dependencies. | Known vulnerable production packages increase XSS, routing, parser, denial-of-service, and supply-chain exposure depending on reachable code paths. | npm severity does not prove each advisory is exploitable in this application. PR #21 claims a clean audit but is open, stale-base, and non-mergeable. | Rebase and independently verify PR #21 or reproduce its minimal dependency patch; run full CI, application smoke tests, and npm audit on the exact resulting commit before publish. |
| RGSEC-003 | MEDIUM | OPEN | Main branch has no protection or required status checks | GitHub branch metadata for main reports protected=false and no required status-check contexts. | A direct or automated push can bypass the intended review/security/CI gate and become the source for Base44 publishing. | Repository permissions and Base44 publish permissions were not changed or enumerated. | Protect main, require NUPS CI and security checks, restrict force-push/deletion, and require exact-commit release evidence. |

## Controls Reviewed Without a New Validated Finding

- Access request submission is authenticated and owner-reviewed.
- Self-approval is blocked.
- Administrators cannot approve administrators or owners.
- Delegated owners cannot create another owner.
- Approval decisions are idempotent and status-bounded.
- Privileged access is restricted to REAL mode.
- Mode and venue checks are present across governed write paths.
- Kiosk sessions are server-validated rather than trusting sessionStorage.
- Temporary PIN change, lockout and manager unlock logic exists.
- Terminal commissioning and NKS2 session controls are represented in source.
- Protected evidence checks and tracked-secret guard passed.
- Frozen accounting rules and debits-equal-credits checks passed.
- Integration functions generally fail closed when configuration is absent.

These statements are source/control-review results, not proof from authenticated production sessions.

## Dependency Audit Summary

`npm audit --omit=dev` on the exact baseline reported:

- Critical: 0
- High: 12
- Moderate: 6
- Low: 0

PR #21 is a remediation candidate, but RG-01 did not merge or trust its claims without rebasing and independent exact-commit verification.

## Threat Model Notes

Primary assets include transaction data, customer/guest identity links, protected evidence, contracts, PIN/session authority, venue/mode boundaries, settlement and ledger records, GlyphBucks liability, API credentials and provider callbacks.

Primary trust boundaries include platform authentication, explicit NUPS approval grants, role guards, kiosk sessions, VenueTerminal commissioning, Base44 RLS, server write gateways, file retrieval functions, webhook signatures and external-provider credentials.

The most consequential failure mode found is authorization being delegated to broad entity RLS after an unguarded route mounts. This bypasses the intended NUPS grant/venue/mode model even though individual write gateways are disciplined.
