# NUPS Batch 16 — Direct-Write Classification

**App:** GlyphLock / NUPS (`697a087fb354faebb72df54b`)  
**Date:** 2026-08-22  
**Inventory source:** `node scripts/check-nups-write-gateway.mjs --snapshot`  
**Current frontend count:** **161 / 287** grandfathered direct entity writes  
**Policy:** New direct frontend writes remain prohibited. Retained audit, domain-event, demo, seed, sandbox, legacy and gateway-internal persistence is classified rather than erased for numerical theater.

## Executive classification

| Category | Calls | Production-risk meaning |
|---|---:|---|
| LIVE HIGH-RISK NUPS | **0** | No remaining direct frontend identity, financial, contract, RBAC, accounting, payout, venue-security or destructive-admin business mutation was identified. |
| LIVE MEDIUM NUPS | **0** | Batch 16 migrated the final checklist and entertainer-playlist writes and removed the mutating playlist permission probe. |
| EXPLICIT SECURITY / ADMIN AUDIT | **33** | Intentional SystemAuditLog events for blocks, overrides, refunds, batch controls, security scans and similar security facts. |
| DOMAIN EVENTS | **12** | Intentional business milestones such as contract signing, VIP session events, W-9 evidence, hardcopy capture, GlyphBucks lifecycle and Z-report generation. |
| OPERATIONAL TELEMETRY | **13** | Activity/timeline/log records used by operator dashboards, notifications and product audit views. |
| GLYPHLOCK GENERAL LIVE, OUTSIDE NUPS | **41** | Live persistence elsewhere in the combined GlyphLock app. It remains app-wide migration debt, not unresolved NUPS operational risk. |
| DEMO / SEED / SANDBOX / LEGACY / INTERNAL | **62** | Explicit demo, controlled seed, sandbox, unmounted legacy and canonical gateway/audit implementation calls. |
| **TOTAL** | **161** | |

## Batch 16 removals — six live-medium NUPS writes

| File | Removed calls | Replacement |
|---|---:|---|
| `src/components/admin/DailyChecklistEditor.jsx` | 2 | `writeEntity()` with actor, venue, intent, item validation and cross-venue update denial |
| `src/lib/nups/entertainerPlaylists.js` | 2 | authenticated, venue-aware `nupsDJGateway` create/update upsert |
| `src/components/mixer/automation/djDirectFallbacks.js` | 2 | non-mutating backend capability check; no diagnostic record creation/deletion |

Result:

```text
LIVE HIGH-RISK NUPS: 0
LIVE MEDIUM NUPS:    0
```

## Retained explicit security / administrative audit — 33

Representative retained events include:

- VIP guest/contract gate blocks
- batch backup/reset/open/close
- no-sale drawer and register security events
- manager overrides
- refund authorization/evidence
- GlyphBucks redemption blocks
- payment reconciliation/failure events
- safe-data-wipe backup evidence
- security scanner/monitor events

These are explicit facts used for investigations and controls. They must not be deleted merely because gateway audit evidence also exists.

## Retained domain events — 12

Representative retained milestones include:

- contract created/signed
- VIP session flagged/submitted/ended
- barcode/hardcopy capture
- driver payout finalized
- GlyphBucks lifecycle event
- contractor W-9 saved
- Z-report generated

## Retained operational telemetry — 13

Operational timeline calls remain in register activity, big-spender workflows, driver changes, GlyphBot activity and notification delivery tracking.

## Non-live / controlled remainder — 62

The retained non-live/internal set includes:

- `frontendDemoSeeder`
- `demoSeeders`
- `SeedDoorGuestsButton`
- `NUPSSandbox`
- demo contract seeding
- unmounted `EntertainerPayrollEngine`
- unmounted `LocationManagement`
- `writeEntity` internals
- audit emitter/activity mirror internals
- identity gateway internals

The gateway eventually has to write to the database. Recursive governance remains unavailable, mercifully.

## NKS2 and terminal boundary are outside the frontend counter

Batch 16 also completed backend/security work not represented by the 161-call frontend inventory:

- created `nupsClockInV2`
- switched all supported frontend/backend callers to NKS2
- migrated `NUPSUser.pin_lookup` to `pin_lookup_v2`
- removed the legacy lookup field from schema and data
- replaced the old route source with a 410 retirement tombstone
- added `manageVenueTerminal`
- added owner/admin terminal management UI
- tested trusted-active, unknown, inactive, untrusted and revoked terminal states
- left the synthetic test terminal revoked

## Next write-migration scope

The remaining 161 calls should not be treated as one NUPS queue. Future batches should separate:

1. app-wide GlyphLock general persistence (41)
2. explicit security/domain/telemetry audit design review (58)
3. demo/seed/sandbox/legacy/internal maintenance (62)

No live NUPS operational write remains in the Batch 16 classification.
