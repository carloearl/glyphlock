# NUPS-RG-01 — Full System Audit
**Date:** 2026-08-29 · **Baseline:** "NUPS-RG-01 pre-audit baseline — Phase 1-18 product acceptance recovery"
**Scope:** Live data integrity, financial ledger consistency, credential compliance, RBAC/security posture, communications.

---

## 1. Financial / POS Integrity (live data)

| Check | Result | Status |
|---|---|---|
| Total POSTransactions sampled | 14 (10 REAL, 4 DEMO) | ✅ mode isolation clean |
| REAL tx missing cashier identity | 0 | ✅ |
| REAL tx missing venue scope | 0 | ✅ |
| REAL tx missing receipt hash | **1** | ⚠️ RG-01-F1 |
| Comp authorization violations | 0 | ✅ |
| validation_run / funds_settled mismatch | 0 | ✅ |
| Refunded tx missing refund reference | 0 | ✅ |
| **Open POS batches** | **12 of 12 sampled — none closed** | 🔴 RG-01-F2 |

**RG-01-F2 (HIGH):** Every sampled batch is still open. Nightly close / Z-report discipline is not being executed, which blocks DailySettlement rollups and reconciliation.

**RG-01-F1 (LOW):** One REAL transaction predates receipt-hash enforcement. Legacy record; hash cannot be retro-generated without payload replay.

## 2. Credential & Contractor Compliance

| Check | Result | Status |
|---|---|---|
| Active REAL entertainers | 12 | — |
| Expired licenses | 0 | ✅ |
| **No license expiration on file** | **12 / 12** | 🔴 RG-01-F3 |
| **Contract status not VALID** | **12 / 12** | 🔴 RG-01-F4 |
| Payout-hold mismatches | 0 | ✅ |
| IOU balance outstanding | $0 | ✅ |
| Active drivers | 1 | — |
| **Driver missing signed HMAC QR token (legacy qr_code only)** | 1 / 1 | ⚠️ RG-01-F5 |
| 1099 flag misses | 0 | ✅ |

**RG-01-F3/F4 (HIGH):** The entire active roster lacks captured license credentials and VALID contract status. Per policy these entertainers should be blocked at check-in and cash payout should accrue as IOU. Onboarding tooling exists (EntertainerIdOnboardPanel) — the roster needs re-credentialing, or check-in gates are being bypassed.

**RG-01-F5 (MEDIUM):** The sole active driver carries only the legacy display token; re-issue via signDriverQrToken to enable server-verifiable scans.

## 3. Security / RBAC Posture

| Item | Finding | Status |
|---|---|---|
| D-008-001 NUPSRouteGuard skipping role validation | **Remediated** — guard now resolves server grant via resolveGuardAccess on every mount, enforces mode=REAL, maps grants to operational roles, honors requiredRoles | ✅ closed |
| NUPS-CRIT-002 hardcoded owner-email bypass | **Still present** (src/lib/nups/ownerEmails.js) — frontend mirror for 2 sovereign accounts. Backend remains source of truth for non-owners, but frontend guards short-circuit for these emails | 🔴 open (accepted-risk pending DACO ruling) |
| NUPS-HIGH-003 kiosk operator from sessionStorage | Not re-verified this pass | ⏳ carried |
| Mode/demo ledger contamination | None detected in sample | ✅ |

## 4. Communications & Contracts

| Check | Result |
|---|---|
| EmailDeliveryLog failures | 0 of 1 sends — ✅ |
| VIPContract records (new v2 system) | 0 — system deployed but **zero production or TEST runs**; unvalidated end-to-end (ties to known issue W3-008B) |

## 5. Findings Register

| ID | Severity | Finding | Recommended action |
|---|---|---|---|
| RG-01-F2 | HIGH | 12 open POS batches, none closed | Run closePOSBatch / Z-report on stale batches; enforce close-at-settlement |
| RG-01-F3 | HIGH | 12/12 active entertainers missing license credentials | Re-credential roster via ID onboarding; verify check-in gate enforcement |
| RG-01-F4 | HIGH | 12/12 active entertainers with non-VALID contract status | Execute clickwrap onboarding for active roster |
| NUPS-CRIT-002 | HIGH | Frontend owner-email RBAC bypass | Replace with server-issued sovereign grant |
| RG-01-F5 | MED | Driver lacks signed QR token | Re-issue via signDriverQrToken |
| RG-01-F1 | LOW | 1 legacy REAL tx without receipt hash | Annotate as pre-hash-era; no action |
| W3-008B | CARRIED | VIP contract v2 unproven in production (0 records) | Run TEST-mode acceptance pass |

## 6. Verdict

Ledger and mode-isolation controls are **holding** (0 comp/settlement/identity violations). The system's operational risk is concentrated in **process compliance** — unclosed batches and an uncredentialed entertainer roster — plus the long-standing frontend sovereign bypass. No new code defects surfaced this pass; D-008-001 is confirmed closed.