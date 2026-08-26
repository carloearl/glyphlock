# NUPS-RG-01 Phase Namespace Register

**Audit baseline:** `ebc520bf0fe9444cc9103c864c66aa6704d79fbb`  
**Repository:** `carloearl/glyphlock`  
**Audit target:** Base44 app `697a087fb354faebb72df54b`  
**Excluded application:** Dream Palace NUPS DCE `6a7b875c5d09dea363095721`

## Decision

The repository and connected history do **not** contain one self-authenticating document that defines a recent NUPS-only “Phase 1–18” program. The best recovered title authority is the December 8, 2025 **GL-MASTER-23** roadmap, whose first 18 phases run from Foundation through RDP/RDK/SDK. That title sequence is used as the working contract with **medium confidence**. Detailed acceptance requirements are reconstructed from current source, later directives, audit reports, and owner-reported behavior. Where those sources conflict, the matrix uses `CONFLICTING_OR_AMBIGUOUS` rather than inventing certainty.

The main source of confusion is that the project reused “Phase” and “18” for QR Studio, OMEGA, BPAAA, W3-012A, Release 18, Batch 18, and Phase 18.1. A green Batch 18 check therefore never meant eighteen visible product redesigns. Humanity survived Roman numerals but apparently not project numbering.

## Namespace Register

| Namespace | Labels | Date | Target | Source Type | Objective | Belongs to current 1–18? | Confidence | Evidence | Conflict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GL-MASTER-23 | Phase 1–23 | 2025-12-08 (recovered conversation context) | Integrated GlyphLock app / carloearl/glyphlock | Owner roadmap / planning sequence | Master product roadmap: Foundation through Monetization. Current RG-01 maps Phases 1–18 from this sequence. | YES, best recovered authority for titles only | Medium | Recovered prior conversation context; no exact source document located in repository or Google Drive. | Later NUPS-only, QR, OMEGA, W3, Release, and Batch sequences reuse the same numbers. Detailed acceptance criteria were not recovered. |
| NUPS-HIST-0-12 | NUPS Phase 0–12 | 2026-07-26 audit | Integrated NUPS | Retrospective build-phase audit | Historical NUPS build sequence and closure status. | NO, supporting NUPS evidence only | High | docs/audits/NUPS_BUILD_PHASE_AUDIT_2026-07-26.md | Its Phase 1–12 labels do not equal GL-MASTER-23 Phase 1–12. |
| QR-STUDIO-1-4 | QR Studio Phase 1–4 | 2026 internal-index reports | QR Studio | Audit / execution / final reports | QR Studio entry, customization, intelligence, and security modes. | NO, supporting Phases 3–6 evidence | High | src/docs/internal_index/PHASE_1_AUDIT_REPORT.md; PHASE_2_FINAL_REPORT.md; PHASE_3_FINAL_REPORT.md; PHASE_4_EXECUTION_REPORT.md | Direct number collision with GL-MASTER-23 Foundation, Branding, QR Core, and QR Multi-Mode. |
| QR-OMEGA | OMEGA phases / Omega Fix | 2026 internal-index reports | QR Studio / mobile visibility | Execution and visibility reports | Stabilize QR generation, visibility, and mobile behavior. | NO, supporting Phase 6 evidence | High | src/docs/internal_index/OMEGA_EXECUTION_REPORT.md; OMEGA_VISIBILITY_REPORT.md | OMEGA is a remediation namespace, not proof that GL-MASTER-23 Phase 6 is live. |
| BPAAA-V3 | BPAAA Phase 0–10 | 2026 | NUPS architecture/governance | Governance specification | Business-process architecture, accounting, audit, roles, and operational invariants. | NO, supporting Phases 12–16 evidence | High | src/docs/governance/BPAAA_v3.0_FINAL.md | BPAAA phase numbers are architecture stages, not roadmap phases. |
| W3-012 | W3-012 phases | 2026-07-08 | NUPS UI modernization | Proposal | Workspace-oriented NUPS UI modernization. | NO, supporting route/UI evidence | High | src/docs/governance/DACO-20260708-W3-012-PROPOSAL.md | Proposal status does not establish execution or live visibility. |
| W3-012A | W3-012A Phase 1–5 | 2026 | NUPS UI / workspace shell | UI execution plan and inventory | Workspace switcher, shell standardization, visual expansion, usability, consolidation. | NO, supporting Phases 12–16 evidence | High | src/docs/governance/DACO-W3-012A-UIX-001.md; W3-012A-FEATURE-INVENTORY.md | Explicitly non-destructive and does not change business logic/RBAC/data. It cannot substitute for live end-to-end product acceptance. |
| NUPS-BATCH-15-18 | Batch 15, 16, 17, 18 | 2026-08 | Integrated GlyphLock/NUPS | Engineering migration and verification | Governed writes, terminal/evidence boundaries, persistence migration, CI and release controls. | NO, supporting backend evidence | High | docs/audits/NUPS-BATCH15-VERIFICATION.md; NUPS-BATCH16-VERIFICATION.md; NUPS-BATCH17-VERIFICATION.md; GLYPHLOCK-BATCH18-VERIFICATION.md | Batch numbers were repeatedly spoken about as phases, creating the false impression of 18 visible product redesign stages. |
| NUPS-PHASE-18.1 | Phase 18.1 approvals | 2026-08-25/26 | NUPS access request and approval gateway | Security/approval patch and checks | Live/training/sandbox requests, self-approval controls, owner/admin routing. | NO, recovery patch evidence | High | scripts/check-nups-phase18-1-approvals.mjs; src/pages/AccessRequests.jsx; src/components/nups/kiosk/AccessRequestForm.jsx | Published build is older than the exact baseline containing the live-request repair. |
| GLYPHLOCK-RELEASE-18 | Release 18 | 2026-08 | Release engineering / integrations | Execution state report | Dependency, edge, Supabase, integration and publish readiness. | NO, supporting Phase 18 evidence | High | docs/audits/GLYPHLOCK-RELEASE18-EXECUTION-STATE.md | Release number 18 is not GL-MASTER-23 Phase 18. |
| DJ-CONTINUITY | DJ phases / continuity batches | 2026 | NUPS DJ module | Feature and continuity work | Persistent playback, provider handling, playlist/queue behavior. | NO, cross-cutting feature evidence | High | scripts/check-nups-dj-continuity.mjs; src/pages/DJHome.jsx; mixer/session source | DJ sequence is not a canonical 1–18 roadmap. |
| ORACLE-OHIP | Oracle/OHIP milestones | 2026 | Oracle Hospitality integration | Integration readiness/milestone sequence | OHIP/OPERA and separate Simphony readiness. | NO, integration evidence only | High | src/pages/OHIPReadiness.jsx; src/docs/integrations/OHIP_IMPLEMENTATION.md | Oracle milestones are independent of roadmap phase numbering. |

## Working Phase Titles

| Phase | Working authoritative title | Working objective | Authority confidence |
| --- | --- | --- | --- |
| 1 | Foundation | Establish the application foundation and reliable release baseline. | Medium: recovered roadmap title; detailed contract reconstructed |
| 2 | Branding / Homepage | Deliver the public GlyphLock brand and responsive homepage. | Medium: recovered roadmap title; detailed contract reconstructed |
| 3 | QR Core | Provide the basic QR generation workflow. | Medium: recovered roadmap title; detailed contract reconstructed |
| 4 | QR Multi-Mode | Expose the supported QR modes through one coherent interface. | Medium: recovered roadmap title; detailed contract reconstructed |
| 5 | QR Intelligence Engine | Add AI/risk scoring, analytics and intelligent QR services. | Medium: recovered roadmap title; detailed contract reconstructed |
| 6 | QR Omega Fix | Stabilize QR reliability, visibility and mobile behavior. | Medium: recovered roadmap title; detailed contract reconstructed |
| 7 | GlyphBot Brain | Establish the secured GlyphBot reasoning, provider and memory layer. | Medium: recovered roadmap title; detailed contract reconstructed |
| 8 | GlyphBot UI | Deliver a usable GlyphBot conversation interface. | Medium: recovered roadmap title; detailed contract reconstructed |
| 9 | GlyphBot Audio / TTS | Add voice input/output and speech providers. | Medium: recovered roadmap title; detailed contract reconstructed |
| 10 | GlyphBot Deep Integration | Connect GlyphBot to governed files, tools, search and application workflows. | Medium: recovered roadmap title; detailed contract reconstructed |
| 11 | Image Generation Polish | Stabilize image generation, reference-image and validation workflows. | Medium: recovered roadmap title; detailed contract reconstructed |
| 12 | NUPS Core | Deliver the NUPS entry, modes, workspaces and operating shell. | Medium: recovered roadmap title; detailed contract reconstructed |
| 13 | NUPS Dancer / Staff Management | Deliver access, onboarding, PIN, timeclock and role-specific staff/entertainer operations. | Medium: recovered roadmap title; detailed contract reconstructed |
| 14 | NUPS Voucher / Currency | Deliver GlyphBucks issuance, print, verification, redemption and liability controls. | Medium: recovered roadmap title; detailed contract reconstructed |
| 15 | NUPS POS Integration | Deliver governed register, batch, receipt and transaction workflows. | Medium: recovered roadmap title; detailed contract reconstructed |
| 16 | NUPS Business Logic | Complete the operational domain workflows, accounting, settlement and audit invariants. | Medium: recovered roadmap title; detailed contract reconstructed |
| 17 | Payment Processing | Integrate payment providers, callbacks, reconciliation and operational payment acceptance. | Medium: recovered roadmap title; detailed contract reconstructed |
| 18 | RDP / RDK / SDK | Deliver developer/partner tooling, SDK distribution and governed integration surfaces. | Medium: recovered roadmap title; detailed contract reconstructed |

## Rules Applied

1. Matching numbers were never treated as matching programs.
2. “Complete” in an execution report was treated as a claim, not live product evidence.
3. Current source, active route, published asset, authenticated browser, provider, and physical-device evidence were recorded separately.
4. The standalone Dream Palace NUPS DCE app was excluded.
5. Phase 19 was not started.
