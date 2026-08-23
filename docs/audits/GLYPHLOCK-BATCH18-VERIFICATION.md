# GlyphLock / NUPS Batch 18 Verification Record

**App:** Main GlyphLock / NUPS  
**Base44 App ID:** `697a087fb354faebb72df54b`  
**Repository:** `carloearl/glyphlock`  
**Authority:** DACO / GlyphLock Engineering Protocol v5  
**Recorded:** 2026-08-23

## Executive result

```text
APP-WIDE GOVERNED-WRITE MIGRATION: PASS
BATCH 18 AGGREGATE:               PASS
PRODUCTION DEPENDENCY AUDIT:      REMEDIATION PR PREPARED
CLOUDFLARE EDGE DELIVERY:         TRUSTED-MAIN PREFLIGHT GATED
SUPABASE PRODUCTION DATABASE:     NOT SELECTED / FAIL-CLOSED
BATCH 17 PHYSICAL ACCEPTANCE:     STILL REQUIRED
PRODUCTION PUBLISH:               NOT TRIGGERED
```

Batch 18 completed the source and server migration of all 41 classified live GlyphLock business mutations outside NUPS. It does not silently promote the separate Batch 17 production release gate.

## Direct-write scorecard

| Metric | Result |
|---|---:|
| Original baseline | 287 |
| Batch 18 starting count | 161 |
| Batch 18 ending count | **120** |
| Removed in Batch 18 | **41** |
| Total removed since original | **167** |
| New bypasses | **0** |
| Live high-risk NUPS bypasses | **0** |
| Live-medium NUPS bypasses | **0** |
| Live GlyphLock business bypasses | **0** |

## Governed boundary

The canonical app-wide boundary is:

```text
frontend intent
→ src/lib/glyphlock/glyphlockWriteGateway.js
→ glyphlockWriteGateway backend function
→ explicit action allow-list
→ authenticated actor or constrained public action
→ scope/ownership/retention validation
→ Base44 entity mutation
→ append-only GlyphLockWriteAudit
```

The backend never accepts a client-selected entity name and does not trust client-provided actor identity or role.

## Governance and evidence retention

| Entity/workflow | Result |
|---|---|
| `AgentChangeSet` | PASS — normal removal archives rather than deleting deployment evidence |
| `GlyphBotAudit` | PASS — owner/admin create/update/archive; no hard delete |
| `FeatureRegistry` | PASS — administrative reconciliation, duplicate and route-owner collision rejection |
| `ArchitecturalDecisionRecord` | PASS — unique ADR identity, approved text immutability and explicit supersession |

## Consultation, contact and chat

| Workflow | Result |
|---|---|
| Public consultation | PASS — allow-list, email validation, rate limit and server-owned status/payment defaults |
| Consultation administration | PASS — authenticated administrative status update only |
| Public contact | PASS — validation, rate limit, server-derived fingerprint and server-stamped delivery result |
| User preferences | PASS — authenticated caller-scoped RLS and bounded settings |
| Conversations | PASS — authenticated caller-scoped create/update; service role cannot bypass ownership |

Private conversation bodies are excluded from generic audit metadata.

## QR, hotspot and interactive media

| Workflow | Result |
|---|---|
| Hotspot payload removal | PASS — archive with administrative evidence |
| Interactive-image create/update/finalize | PASS — owner/admin checks, bounded hotspots and immutable finalization evidence |
| Interactive-image removal | PASS — archive/revoke/unpublish, not ordinary hard delete |
| QR generation/history/AI score | PASS — server-derived creator, hourly limit, bounded input and payload hash |
| QR preview lifecycle | PASS — owner scope; vaulted records archive; only ephemeral cache may delete |

## Usage, feedback and partner content

| Workflow | Result |
|---|---|
| Trial/service usage | PASS — server-derived subject, allowed service, request-id idempotency and monotonic count |
| LLM feedback | PASS — valid rating, rate limit, bounded feedback and no copied prompt/response snippets |
| Partner documents | PASS — server-resolved partner, cross-partner denial and authorized access event |
| Marketing assets | PASS — active/tier checks and append-only download event |

## Runtime and policy verification

The Batch 18 controls prove:

- all 41 target frontend mutations are absent;
- unknown server actions fail closed;
- anonymous clients cannot write governance or partner content;
- public intake cannot inject privileged state;
- clients cannot forge authoritative service usage identity or count;
- conversation and preference writes remain user scoped;
- content mutations require owner or explicit administrator authority;
- finalized governance/evidence records archive or supersede instead of disappearing;
- audit metadata is safe-key filtered and stores before/after hashes rather than private content.

## Aggregate verification

The aggregate command is:

```text
npm run check:glyphlock-batch18
```

Required checks include:

```text
check:nups-batch17
check:glyphlock-write-governance
check:glyphlock-batch18-runtime
check:glyphlock-batch18-documentation
check:nups-write-gateway
check:nups-isolation
audit:entities
audit:nups-ui
check:secrets
check:integrations
check:seo-metadata
lint
typecheck
build
```

Current result:

```text
GREEN PASS
```

## Retained direct writes

| Category | Count | Treatment |
|---|---:|---|
| Security/admin audit | 33 | Retained as explicit append-only evidence |
| Domain events | 12 | Retained as canonical event emission |
| Operational telemetry | 13 | Retained as observational telemetry |
| Demo | 16 | Isolated non-production paths |
| Seed | 15 | Controlled seed/reset utilities |
| Sandbox | 7 | Isolated development workflows |
| Legacy/unmounted | 9 | Compatibility pending separate retirement evidence |
| Gateway/audit internals | 15 | Canonical implementation writes |
| **Total** | **120** | Classified and guarded |

## Cross-front release engineering

### GitHub and Base44

The Batch 18 source is synchronized through the canonical Base44/GitHub path. Exact ending-commit GitHub Actions evidence is required again after final dependency and edge-delivery merges.

### Cloudflare

The edge-guard delivery candidate is protected by:

- trusted-`main` account/zone inventory;
- deploy only when the exact route and script are absent and no collision exists;
- bounded Cloudflare API requests and response bodies;
- bounded public-origin verification;
- exact-route/script rollback;
- refusal to delete a script referenced by non-target routes;
- regression tests.

Cloudflare deployment remains conditional on the trusted inventory returning `safe_to_deploy=true` and `fresh_deploy=true`.

### Supabase

The connected Supabase projects visible during Batch 18 are inactive and do not match the project reference currently described by repository guidance. No unrelated database was reactivated or repurposed. The proxy and optional signer remain fail-closed pending explicit selection of the canonical GlyphLock Supabase project.

### OpenAI and Google

OpenAI-backed functions retain server-side secret handling. Current API modernization and runtime maturity are tracked separately; settings alone do not imply end-to-end verification. Google Drive and Google Analytics connector maturity remains evidence based and must not be promoted from connector presence alone.

## Frozen invariants

| Invariant | Result |
|---|---|
| `total_sales = cash_sales + card_sales` | Preserved |
| GlyphBucks remains stored-value liability | Preserved |
| Entertainers remain independent contractors | Preserved |
| REAL / DEMO / SANDBOX isolation | PASS |
| Dynamic venue isolation | PASS |
| Governed write/audit architecture | Improved to 120 / 287 |
| Identity and protected-evidence privacy | Preserved |
| Debits equal credits | Preserved |
| API credential secrecy | Preserved |
| VenueTerminal is sole pre-auth device trust | Preserved |
| NKS2-only kiosk session boundary | Preserved |
| Persistent DJ playback architecture | Preserved |
| Private chat/preferences user scope | PASS |
| Governance and audit evidence retention | PASS |
| Public forms cannot assign privileged state | PASS |

## Batch status and release boundary

**Batch 18 engineering status:** `COMPLETE`  
**Production release remains:** `NO-GO`

Batch 18 completion does not override Batch 17's human-authenticated and physical acceptance requirements. Production publishing was not triggered.
