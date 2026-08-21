# NUPS Batch 15 — Direct-Write Classification

**App:** GlyphLock / NUPS (`697a087fb354faebb72df54b`)  
**Date:** 2026-08-21  
**Inventory source:** `node scripts/check-nups-write-gateway.mjs --snapshot`  
**Current frontend count:** **167 / 287** grandfathered direct entity writes  
**Policy:** New direct frontend writes remain prohibited. This classification does not grant permission for retained writes; it distinguishes production risk from intentional audit, demo, seed, sandbox, legacy, and gateway implementation calls.

## Executive classification

| Category | Calls | Production-risk meaning |
|---|---:|---|
| LIVE HIGH-RISK NUPS | **0** | No remaining direct frontend business mutation was classified as live identity, financial, contract, RBAC, accounting, venue-security, or destructive-admin high risk after Batch 15 migrated the generic Admin Data Manager update/delete paths. |
| LIVE MEDIUM NUPS | **6** | Real operational configuration/DJ persistence that should move next, but does not currently alter money, identity, contracts, or access control. |
| EXPLICIT SECURITY / ADMIN AUDIT | **33** | Intentional `SystemAuditLog` events for blocks, overrides, refunds, batch controls, security scans, and similar facts. Preserve unless proven redundant. |
| DOMAIN EVENTS | **12** | Intentional business milestones such as contract signing, VIP session events, W-9 save evidence, hardcopy capture, GlyphBucks lifecycle, and Z-report generation. |
| OPERATIONAL TELEMETRY | **13** | Activity/timeline/logging records used by operator dashboards, notifications, or product audit views. |
| GLYPHLOCK GENERAL LIVE, OUTSIDE NUPS | **41** | Live writes elsewhere in the combined GlyphLock app. They remain governed by the app-wide cutoff but are not NUPS Batch 15 production-risk debt. |
| DEMO | **16** | Explicit demo-only creation/reset paths. |
| SEED | **15** | Controlled seed/purge utilities. |
| SANDBOX | **7** | NUPSSandbox-only paths. |
| LEGACY / UNMOUNTED | **9** | Historical entertainer payroll and an unmounted location editor. |
| GATEWAY / AUDIT INTERNAL | **15** | Canonical persistence implementation inside the write/audit/identity infrastructure. The gateway must eventually write to the database; recursive governance is not a feature. |
| **TOTAL** | **167** | |

## Remaining LIVE NUPS operational queue

| File | Calls | Classification | Recommended order |
|---|---:|---|---:|
| `src/components/admin/DailyChecklistEditor.jsx` | 2 | LIVE MEDIUM — venue compliance configuration | 1 |
| `src/lib/nups/entertainerPlaylists.js` | 2 | LIVE MEDIUM — entertainer/DJ playlist create/update | 2 |
| `src/components/mixer/automation/djDirectFallbacks.js` | 2 | LIVE MEDIUM — authenticated playlist permission probe create/delete | 3 |

The permission probe should eventually become a non-mutating capability check or a server-side diagnostic. Creating and deleting a real playlist to ask whether playlists can be created is functional, but it is also the software equivalent of testing a fire alarm by setting a chair on fire.

## Explicit security / administrative audit — 33

| File | Calls retained |
|---|---:|
| `src/components/nups/VIPRoomBoard.jsx` | 6 gate/block events |
| `src/components/nups/BatchManagement.jsx` | 5 batch backup/reset/open/close events |
| `src/components/nups/POSCashRegister.jsx` | 2 security/control events |
| `src/components/glyphbot/ProactiveMonitor.jsx` | 3 |
| `src/components/commandcenter/ThreatDetectionEngine.jsx` | 2 |
| `src/components/glyphbot/KnowledgeBaseConnector.jsx` | 2 |
| `src/components/nups/ManagerOverrideModal.jsx` | 2 |
| `src/components/nups/VIPRoomManagement.jsx` | 1 contract-gate block |
| `src/components/glyphbot/AuditGenerator.jsx` | 1 |
| `src/components/glyphbot/CodeExecutor.jsx` | 1 |
| `src/components/glyphbot/FileAnalysisView.jsx` | 1 |
| `src/components/glyphbot/SecurityDashboard.jsx` | 1 |
| `src/components/glyphbot/SecurityScanner.jsx` | 1 |
| `src/components/nups/DoorPOSFinalizationAudit.jsx` | 1 |
| `src/components/nups/glyphbucks/BillScanner.jsx` | 1 redemption-block event |
| `src/components/nups/GlyphBucksContract.jsx` | 1 payment failure/reconciliation event |
| `src/components/nups/RefundManager.jsx` | 1 refund event |
| `src/components/nups/SafeDataWipeModal.jsx` | 1 backup/wipe event |

These calls are not candidates for numerical deletion without proving that their event names and metadata are reproduced elsewhere and unused downstream.

## Domain events — 12

| File | Calls retained |
|---|---:|
| `src/components/nups/VIPRoomBoard.jsx` | 1 print-trigger event |
| `src/components/nups/ContractManager.jsx` | 2 contract-created/signed events |
| `src/components/nups/VIPEntertainerQuestionnaire.jsx` | 2 session report events |
| `src/components/nups/VIPRoomManagement.jsx` | 1 session-ended event |
| `src/components/nups/AuditLogDashboard.jsx` | 1 domain audit emitter |
| `src/components/nups/BarcodeFirstCapture.jsx` | 1 hardcopy capture event |
| `src/components/nups/DriverDropOffTracker.jsx` | 1 payout-finalized event |
| `src/components/nups/GlyphBucksLedger.jsx` | 1 GlyphBucks lifecycle event |
| `src/components/nups/payroll/ContractorOnboardingPanel.jsx` | 1 W-9 save event |
| `src/components/nups/ZReportGenerator.jsx` | 1 Z-report event |

## Operational telemetry — 13

| File | Calls retained |
|---|---:|
| `src/components/glyphlock/bot/logic/useGlyphBotAudit.jsx` | 5 |
| `src/components/nups/POSCashRegister.jsx` | 3 ActivityLog events |
| `src/components/nups/contracts/BigSpenderLetter.jsx` | 1 |
| `src/components/nups/contracts/BigSpenderQuestionnaire.jsx` | 1 |
| `src/components/nups/QuickDriverGuestAdd.jsx` | 1 |
| `src/lib/notifications/sendFormNotification.js` | 1 |
| `src/pages/GlyphBot.jsx` | 1 |

## Demo / seed / sandbox — 38

### DEMO — 16
- `src/lib/nups/frontendDemoSeeder.js` — 12
- `src/pages/NUPSDemoManager.jsx` — 3
- `src/components/nups/contracts/DemoContractSeeder.jsx` — 1

### SEED — 15
- `src/lib/nups/demoSeeders.js` — 8
- `src/components/nups/SeedDoorGuestsButton.jsx` — 7

### SANDBOX — 7
- `src/pages/NUPSSandbox.jsx` — 6
- `src/components/nups/ContractScanBack.jsx` — 1; repository reachability remains limited to `NUPSSandbox`.

## Legacy / unmounted — 9

- `src/components/nups/EntertainerPayrollEngine.jsx` — 7. Verified unmounted; frozen-rule CI fails if it is reintroduced into the active owner payroll/tip-pool surface.
- `src/components/nups/LocationManagement.jsx` — 2. No active import/render path found.

## Gateway / audit internal — 15

- `src/lib/nups/writeEntity.js` — 9
- `src/lib/nups/audit/auditEventEmitter.js` — 3
- `src/lib/nups/activityLog.js` — 1
- `src/lib/nups/auditDifferential.js` — 1
- `src/lib/nups/identityWrites.js` — 1

## GlyphLock general live writes outside NUPS — 41

These calls remain app-wide migration debt but are not part of the NUPS live high-risk queue established by Batch 15:

- `src/components/Chat.jsx` — 4
- `src/components/qr/QrPreviewStorage.jsx` — 4
- `src/components/qr/QrStudio.jsx` — 4
- `src/pages/Blockchain.jsx` — 4
- `src/components/imageLab/tabs/InteractiveTab.jsx` — 3
- `src/lib/registry/reconcileRegistry.js` — 3
- `src/pages/ArchitecturalDecisionRegister.jsx` — 3
- `src/components/FreeTrialGuard.jsx` — 2
- `src/components/imageLab/tabs/GalleryTab.jsx` — 2
- `src/pages/Contact.jsx` — 2
- `src/components/admin/AdminConsultations.jsx` — 1
- `src/components/devengine/DeployPanel.jsx` — 1
- `src/components/glyphbot/FeedbackWidget.jsx` — 1
- `src/components/glyphlock/HotspotPayloadConfig.jsx` — 1
- `src/components/partners/DocumentCenter.jsx` — 1
- `src/components/partners/MarketingCollateral.jsx` — 1
- `src/components/qr/QrBatchUploader.jsx` — 1
- `src/components/qr/QrPreviewPanel.jsx` — 1
- `src/components/studio/EditorTab.jsx` — 1
- `src/components/verification/VerificationIntakeForm.jsx` — 1

## Server-side identity writes not represented by the frontend count

The 167-call manifest scans `src/` only. Batch 15 separately inspected backend functions and corrected:

- `scanCustomerID` — one normalized credential hash, venue authorization, minimized GuestProfile storage, no temporary OCR URL persistence.
- `vipWorkflow.guestIntake` — canonical GuestProfile required; VIPGuest is a linked projection; typed-name-only new identity creation is rejected.
- `vipContractSign` — protected media references required; canonical GuestProfile linked; VIPGuest stores hash/last-four projection fields rather than full government ID, raw signatures, or protected images.

Continuous checks:

- `check:nups-protected-evidence`
- `check:nups-api-key-secrets`
- `check:nups-guest-identity`

## Batch 16 priority derived from this classification

1. Govern `DailyChecklistConfig` create/update.
2. Move entertainer playlist persistence behind a venue-aware server/gateway path.
3. Replace the DJ create/delete permission probe with a non-mutating capability check.
4. Provision trusted `VenueTerminal` records and remove the temporary payment-terminal compatibility fallback after deployed stations are registered.
5. Execute deployed protected-evidence tests with distinct anonymous, wrong-role, wrong-venue, and authorized sessions.
6. Address the separate 41-call GlyphLock-general migration queue only under its own scope rather than inflating NUPS progress with unrelated UI persistence.
