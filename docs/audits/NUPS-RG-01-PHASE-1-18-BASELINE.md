# NUPS-RG-01 Phase 1–18 Product Acceptance Baseline

**Evidence freeze:** `ebc520bf0fe9444cc9103c864c66aa6704d79fbb`  
**Audit branch:** `audit/nups-rg-01-phase-1-18-baseline`  
**Base44 app:** `Glyphlock` (`697a087fb354faebb72df54b`)  
**Published origins examined:** `glyphlock.io`, `glyphlock.base44.app`  
**Verdict:** **PHASE 1–18 PRODUCT ACCEPTANCE IS NOT PROVEN**

## Executive Verdict

The exact baseline compiles and its required static governance checks pass, but that does not establish live product acceptance. The currently published GlyphLock build is older than the audit baseline: the live kiosk chunk lacks the baseline's `Request Live Access` control and updated non-fullscreen behavior. Most roadmap requirements are either source-only, blocked pending authenticated/hardware proof, or visibly partial. One high-severity static access-control issue was also identified in the transaction dashboard path. The owner’s observation that little or no Phase 1–18 product difference was visible is supported by the release-state evidence.

## Baseline State

- The audit branch was created from `ebc520bf0fe9444cc9103c864c66aa6704d79fbb`.
- During the audit, `main` advanced one direct child commit to `ae10db138a3caf4df46dc9ab2d5b85b275fd2f23` (`Update base44 packages`).
- The connected Base44 sandbox and GitHub `main` agreed on that newer commit.
- The audit evidence remained frozen to `ebc520bf...`.
- `main` was reported by GitHub as unprotected, with no required status checks.
- Exact-baseline GitHub Actions run `22323285961` completed successfully.
- No production publish, deployment, connector change, schema change, or entity write occurred during RG-01.

## Published Build Mismatch

The two public origins served the same asset family:

- `assets/index-UgdpG7wn.js`
- `assets/index-BCZXi6OH.css`
- published kiosk chunk `NUPSKiosk-QsiYU1fT.js`

The exact baseline built:

- `NUPSKiosk-BBYls9Gu.js`
- a different index/CSS asset family

The published kiosk contains `Request Test Access`, `Request Training Access`, `Owner / Admin Sign In`, and the old `Fullscreen was blocked` text. It does not contain `Request Live Access`, `liveRequest`, `LIVE ACCESS REQUEST`, or the repaired mobile fallback message present in the baseline. Therefore source changes at the audit baseline were not the live interface.

## Requirement Verdict Counts

| Verdict | Count |
| --- | --- |
| PROVEN_LIVE | 2 |
| SOURCE_ONLY_NOT_LIVE | 18 |
| REACHABLE_PARTIAL_OR_BROKEN | 9 |
| DOCUMENTED_ONLY | 1 |
| ABSENT | 2 |
| CONFLICTING_OR_AMBIGUOUS | 1 |
| BLOCKED_HUMAN_OR_HARDWARE_PROOF | 18 |

## Phase Verdict Table

| Phase | Authoritative title | Intended outcome | Phase verdict | Most important evidence | Primary blocker | RG-02 action |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Foundation | App scaffold, routing, shared data/API foundation. | REACHABLE_PARTIAL_OR_BROKEN | src/App.jsx; package.json; exact-baseline build; baseline build assets; GitHub main/branch metadata | No durable commit/build fingerprint; published build is older than baseline. | Preserve; add build fingerprint to every release. |
| 2 | Branding / Homepage | GlyphLock brand system, homepage, navigation, public entry. | BLOCKED_HUMAN_OR_HARDWARE_PROOF | Home/Layout/SEO source; production build; Responsive source; UI audit passes | Viewport acceptance not executed. | Preserve and regression-test. |
| 3 | QR Core | Generate, persist, scan, and verify secure QR assets. | SOURCE_ONLY_NOT_LIVE | SecureQRStudio and QR functions in source; QR entities/functions; route definitions | Interactive browser/provider session unavailable. | Run public/authenticated create-scan-verify test. |
| 4 | QR Multi-Mode | Creation, customization, bulk, security, hotzone, and analytics modes. | CONFLICTING_OR_AMBIGUOUS | QR mode components; many legacy QrGenerator* page stubs; Source inventory | Cannot prove whether consolidation satisfied the original promised UI. | Document canonical mode map and retire aliases. |
| 5 | QR Intelligence Engine | AI scoring, threat/risk analysis, and scan intelligence. | SOURCE_ONLY_NOT_LIVE | Functions/entities and integration checks; check:integrations passed; provider source inventory | Provider and live scan proof missing. | Run controlled benign/malicious fixture tests. |
| 6 | QR Omega Fix | End-to-end stabilization and visibility repair for QR Studio. | DOCUMENTED_ONLY | OMEGA execution reports; Phase 1-4 QR reports; UI audit passes source-level checks | Execution reports are not live proof. | Re-run the original OMEGA acceptance cases. |
| 7 | GlyphBot Brain | LLM orchestration, tools, memory, and governed backend behavior. | SOURCE_ONLY_NOT_LIVE | Source inventory; integration checks; Batch 18 governance docs/checks | Provider/runtime proof missing. | Run bounded tool-use and denial tests. |
| 8 | GlyphBot UI | User-facing chat, controls, and accessible navigation. | SOURCE_ONLY_NOT_LIVE | Source/build; public navigation metadata; Source inventory | Authenticated/provider session unavailable. | Run mobile/tablet/desktop chat test. |
| 9 | GlyphBot Audio / TTS | Voice profiles, speech synthesis, and audible playback. | SOURCE_ONLY_NOT_LIVE | Source inventory; Source/build | No provider/browser audio proof. | Run speech synthesis and playback test. |
| 10 | GlyphBot Deep Integration | Cross-app knowledge, search, files, tools, and integrations. | REACHABLE_PARTIAL_OR_BROKEN | Source inventory; check:integrations passed; Supabase projects inspected inactive | Provider/connector proof missing. | Run allow/deny tests against approved sources. |
| 11 | Image Generation Polish | Image generation, editing, history, validation, and UX polish. | SOURCE_ONLY_NOT_LIVE | Source/build; Source inventory | Provider/runtime proof missing. | Run one governed generation/edit/history test. |
| 12 | NUPS Core | Public landing, kiosk gateway, operating modes, venue context, and operator shell. | REACHABLE_PARTIAL_OR_BROKEN | Exact-baseline source and build; Baseline source and phase18.1 checks; Source; isolation checks pass; 171 routes; 64 duplicate case-normalized groups; 75 zero-byte source files | Published build is stale. | Reconcile security findings, then publish exact approved commit. |
| 13 | NUPS Dancer / Staff Management | Access requests, onboarding, role routing, PINs, clock-in/out, and personnel records. | ABSENT | Phase18.1 checks pass; Source inventory; Source; terminal/approval checks pass; Source route/role mapping; DRIVER exists in NUPSUser/roleHomes | Human OTP and two accounts required. | Run applicant-to-approver test card. |
| 14 | NUPS Voucher / Currency | GlyphBucks issuance, sale, redemption, press, inventory, verification, and liability accounting. | SOURCE_ONLY_NOT_LIVE | Source; frozen-rule checks pass; check:nups-frozen-rules passed; Source inventory | Requires authorized role and controlled test value. | Run DEMO issue-sale-redeem reconciliation. |
| 15 | NUPS POS Integration | Register, products, transactions, tenders, receipts, barcode/QR linkage, and terminal behavior. | REACHABLE_PARTIAL_OR_BROKEN | Source/build; write-gateway/isolation checks passed; Source inventory; NUPSHub uses unfiltered POSTransaction.list; RLS grants staff/manager broad read | Authenticated terminal and test tender required. | Run DEMO cash/card register test. |
| 16 | NUPS Business Logic | VIP contracts, nightly close, settlements, accounting, payroll separation, audit, and operational rules. | REACHABLE_PARTIAL_OR_BROKEN | Source inventory; Source; financial checks; Source/build; frozen rules; Frozen-rule checks; source; Route inventory and legacy sections | Human handoffs required. | Run three-party DEMO contract test. |
| 17 | Payment Processing | Provider checkout, webhooks, refunds, payment confirmation, and reconciliation. | REACHABLE_PARTIAL_OR_BROKEN | Source/integration inventory; Source/build; npm audit on exact baseline; Source; integration checker | Provider account/test payment required. | Run provider test-mode authorization/refund/webhook reconciliation. |
| 18 | RDP / RDK / SDK | Developer documentation, SDK delivery, API keys, partner tooling, and integration maturity. | ABSENT | Source/build; API secret lifecycle checks in aggregate docs; Recovered roadmap title only; Source/build; Supabase/Cloudflare/OpenAI inspection; Required checks pass; Batch/Release docs | No consumer proof. | Run clean-environment SDK quickstart test. |

## What the Owner Can Actually See

Only the following were proven from the current public origins:

1. A live public GlyphLock homepage and NUPS marketing/landing presence.
2. A published NUPS kiosk bundle containing Test Access, Training Access, and Owner/Admin Sign In strings.
3. The older fullscreen-blocking gateway behavior.
4. Public app assets shared between `glyphlock.io` and `glyphlock.base44.app`.

No authenticated role workspace, transaction, approval, onboarding, contract, payment, DJ, accounting, or hardware workflow was promoted to `PROVEN_LIVE`.

## Built but Hidden, Unpublished, or Unproven

- Baseline live-access request panel and repaired fullscreen fallback.
- Role Views, Access Requests, NUPS Hub, Manager Console, role homes, mode and venue controls.
- QR creation/intelligence functions and multiple QR surfaces.
- GlyphBot backend, conversation, search, memory, TTS and file/tool functions.
- NUPS onboarding, PIN, terminal, guest, VIP, POS, receipt, GlyphBucks, settlement, accounting and audit code.
- SDK documentation, download, API-key and partner surfaces.
- Most of the above require authenticated, provider, or physical-device acceptance and were not inferred from source.

## Missing or Broken

- Source-to-published commit traceability.
- Published live access request.
- Dedicated driver role journey.
- Definitive RDP/RDK deliverable definition.
- A single canonical route registry. The exact baseline contains 171 explicit route definitions, 64 case-normalized duplicate groups, 37 NUPS navigation destinations, and 75 zero-byte source files.
- Proven multi-role, multi-mode, multi-venue live behavior.
- Proven responsive acceptance at the four required viewports.
- Cross-venue transaction read isolation in the NUPS Hub path.
- Production dependency hygiene on the exact baseline.

## Infrastructure-Only Work

Batch 15–18 and related checks materially improved write governance, mode isolation, terminal trust, protected evidence policy, accounting invariants, secrets handling, and CI. Those are legitimate backend results. Their observable effect should be safer writes and denials, not a dramatic visual redesign. They cannot be counted as visual acceptance and do not establish that the published bundle contains the code.

## Read-Only Engineering Results

Passed on the exact baseline:

- `typecheck`
- `lint`
- `build`
- `audit:nups-ui`
- `check:nups-phase18-1-approvals`
- `check:nups-write-gateway`
- `check:nups-frozen-rules`
- `check:nups-isolation`
- `check:nups-terminal-governance`
- `check:nups-sensitive-reads`
- `check:nups-dj-continuity`
- `check:secrets` in an exact detached Git worktree
- `check:integrations`

These are compile, static, policy, and source-runtime checks. They are not published-browser or human/hardware proof.

## Security Summary

See `NUPS-RG-01-CODEX-SECURITY-REPORT.md`.

- `RGSEC-001` HIGH: unguarded NUPS Hub plus broad/unscoped transaction read path.
- `RGSEC-002` HIGH: 18 production dependency advisories at the exact baseline.
- `RGSEC-003` MEDIUM: unprotected main branch with no required checks.

## Conclusion

The current result is a **recovery baseline**, not a completion certificate. RG-02 must first contain the financial read issue, restore release governance, reconcile the published gateway with the approved source, then validate the operational slices one at a time. Phase 19 remains frozen.
