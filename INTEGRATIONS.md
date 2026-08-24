# NUPS / GlyphLock INTEGRATIONS — Layer 3 Domain State

**Mapped:** 2026-08-22  
**Canonical app:** Base44 `697a087fb354faebb72df54b`

## Maturity vocabulary

Use exactly:

`configured → connected → authenticated → request succeeded → response validated → end-to-end verified`

Never infer a higher state from a lower state. Stored credentials alone mean **configured**.

Authoritative current state is persisted in the governed `IntegrationMaturity` entity. `recordIntegrationMaturity` is the server-side update boundary and rejects secret/private-reference metadata. This document explains the evidence and limitations behind those records.

## Base44 OAuth connectors — runtime-verified connector state

### Google Drive

- Base44 connector: connected
- Connector status: active
- Granted scopes: `drive.file`, email identity
- Maturity supported by current evidence: **authenticated**
- Notes: connector authorization is live. Individual NUPS export/upload workflows still require separate end-to-end verification before claiming E2E.

### Google Analytics

- Base44 connector: connected
- Connector status: active
- Granted scopes: Analytics read-only + email identity
- Maturity supported by current evidence: **authenticated**
- Notes: authorization is verified; this mapping did not execute an Analytics data request.

### Notion

- Base44 connector: connected
- Connector status: active
- Granted scopes: read content, write content, user info
- Maturity supported by current evidence: **authenticated**
- Notes: connector authorization is live; no NUPS-critical operational dependency identified in this map.

### Other Base44 OAuth connectors

Runtime connector inventory on 2026-08-22 confirms exactly three active Base44 OAuth connectors: Google Drive, Google Analytics, and Notion. Relevant connectors still **not connected** include Gmail, Google Sheets, Google Docs, Google Calendar, QuickBooks, Square, Supabase, the Base44 GitHub API connector, Docusign, Slack, Microsoft 365 connectors, and others.

The separate ChatGPT/GitHub capability used for repository inspection is not evidence that the Base44 app-level GitHub OAuth connector is connected.

This does not mean the app lacks custom/API integrations for those services; it means the Base44 OAuth connector itself is not connected.

## Stripe

### Architecture

Stripe is implemented as a server-side provider/API integration rather than a Base44 OAuth connector.

Relevant surfaces include:

- `PaymentProvider`
- `VenuePaymentConfig`
- `PaymentRecord`
- `PaymentVerificationLog`
- `base44/functions/stripe-integration-health/entry.ts`
- `base44/functions/stripeCreateCheckout/entry.ts`
- `base44/functions/stripeWebhook/entry.ts`
- `base44/functions/stripe-create-refund/entry.ts`
- `base44/functions/createPaymentRecord/entry.ts`
- `base44/functions/confirmGlyphBucksPayment/entry.ts`

Server-side functions read `STRIPE_SECRET_KEY` or the provider-specific configured secret name. No secret value is documented here.

### Maturity

- Code path: **configured-capable**
- Runtime credential presence: **not verified in this mapping**
- Successful API request: **not verified in this mapping**
- E2E payment flow: **not verified in this mapping**

Do not promote the state until the health function and a non-destructive provider verification supply evidence.

## Oracle Hospitality / OHIP

### Architecture

Oracle Hospitality integration is custom server-side OHIP code, not a Base44 catalog connector.

Relevant surfaces:

- `base44/functions/ohipReadiness/entry.ts`
- `src/pages/OHIPReadiness.jsx`

The readiness function supports secure configuration checks, OAuth/client-credentials authentication, and read-only Partner Sandbox calls. It references server-held configuration such as gateway URL, client ID/secret, app key, enterprise ID, and hotel ID without exposing secret values.

### Maturity

- Integration implementation: **configured**
- Partner Sandbox connection: **connected**
- Stored server-side credential completeness: **configured** — reverified through the owner-only readiness console on August 24, 2026; secret values were not displayed
- Partner Sandbox OAuth: **authenticated** — fresh owner-only read-only test on August 24, 2026
- Partner Sandbox room-configuration request: **request succeeded** — 250 rows were scanned and nothing was written
- Sanitized Partner Sandbox room response: **response validated** — 0 format-clean, 250 requiring review; no token, credential, guest, reservation, payment, or raw Oracle payload reached the browser
- End-to-end production customer environment: **not verified** — the Oracle portal showed zero customer environments on August 24, 2026

Historical evidence separately records an August 12, 2026 authenticated read-only Partner Sandbox request with HTTP success and 921 ms latency. It must not be represented as the August 24 result. The highest current maturity is **response validated**, not **end-to-end verified**.

## Payment provider overlay / external terminals

NUPS is provider-agnostic by design.

Relevant entities:

- `PaymentProvider`
- `VenuePaymentConfig`
- `PaymentRecord`

The system supports an `external_terminal`/manual evidence path in addition to optional native API adapters. NUPS can record processor references and approval evidence without pretending GlyphLock is itself the merchant processor.

Maturity is venue-specific and must be recorded per `VenuePaymentConfig` plus a verified transaction/evidence path.

## QuickBooks

The codebase contains `base44/functions/quickbooksNightlySync/entry.ts`, whose own description states that it provides a QuickBooks-style auto-sync/export path **without Intuit OAuth**.

The Base44 QuickBooks OAuth connector is currently not connected.

Therefore:

- export/sync implementation exists
- native QuickBooks OAuth connection: **not connected**
- native QuickBooks API E2E: **not verified**

Do not describe the export workflow as a connected QuickBooks API integration.

## Google Drive exports

Because the Google Drive connector is active/authenticated, NUPS/GlyphLock functions that use the connector have an available authorization substrate. Each actual export path must still prove request success and returned file/reference before being labeled E2E verified.

## Protected private-file storage

Batch 17 exercised the Base44 private-file substrate with synthetic text only.

- `UploadPrivateFile` accepted a real multipart `File` payload: **request succeeded**
- a generated signed URL denied anonymous access immediately: **response validated for anonymous denial**
- anonymous `getProtectedEvidence` remains HTTP 401: **response validated**
- the role/classification/venue policy matrix passes: **response logic validated statically/executably**
- authenticated signed retrieval and expiry: **not yet end-to-end verified** because five distinct authenticated sessions are not available to the sandbox

The token-driven acceptance runner is `npm run test:nups-batch17-authenticated`. It must not be promoted to PASS until real runtime tokens are supplied.

## GitHub source and CI

- Canonical source repository: `carloearl/glyphlock`, branch `main`
- Source synchronization from Base44 remote development: **request succeeded / response validated** through current commits
- GitHub Actions result must be verified per ending commit before claiming CI E2E
- Base44 app-level GitHub OAuth connector: **not connected**

Do not conflate repository access through an external connected capability with an in-app OAuth connector.

## Hardware

NUPS models hardware through `VenueHardware`, `VenueTerminal`, and browser/backend workflows for scanners, printers, terminals, and related station devices.

The software terminal boundary is **response validated** for trusted-active, unknown, inactive, untrusted, and revoked synthetic states. Physical hardware maturity remains per venue/device:

`configured → browser/device detected → exact device ID approved → request succeeded → output/input validated → E2E workflow verified`

No real physical venue terminal has been marked E2E from the cloud sandbox. Each device requires one-time commissioning from its own browser.

## Updating this file

Whenever an integration is tested, record:

- venue/environment
- date/time
- exact maturity state reached
- non-secret evidence/reference
- failure stage if unsuccessful
- whether the test was read-only, funds-off, or live

## Batch 17 integration maturity record — 2026-08-22

Maturity labels are evidence-based:

| Integration | Environment | Highest proven level | Evidence | Remaining limitation |
|---|---|---|---|---|
| Base44 application/functions | Preview / repository main | response validated | Batch 16 aggregate, deployed anonymous probes, NKS1 and playlist 410 tombstones | authenticated multi-role acceptance pending |
| Base44 private file storage | DEMO/SANDBOX architecture | response validated | private upload path, opaque `ProtectedEvidence`, anonymous signed-file denial | authorized retrieval and expiry must be proven with real sessions |
| VenueTerminal / NKS2 | Preview plus synthetic terminal test | response validated | unknown/inactive/untrusted/revoked fail closed; trusted synthetic terminal allowed before revocation | real venue devices require commissioning |
| GitHub source | `carloearl/glyphlock` main | connected | Base44 auto-commits are present on main | ending Batch 17 Actions run must be inspected |
| NUPS DJ gateway | Preview/source | response validated | canonical gateway, non-mutating capability probe, persistent session-state guards | real 30-minute continuity soak pending |
| Payment configuration | Current venue config | configured | venue-scoped provider configuration exists | Batch 17 must not make live charges; E2E payment certification is out of scope |
| Oracle/OHIP | Partner Sandbox | response validated | August 24, 2026 owner-only OAuth and read-only room-configuration request; sanitized 250-row response; no writes | zero authorized customer environments; Marketplace, production application/key, customer authorization, production validation, and Simphony validation remain separate gates |

Do not promote an integration because a credential, setting, logo or code path exists. `end-to-end verified` requires a successful real request, validated response and completed intended workflow in the stated environment.

