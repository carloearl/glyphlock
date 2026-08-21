# NUPS / GlyphLock INTEGRATIONS — Layer 3 Domain State

**Mapped:** 2026-08-20  
**Canonical app:** Base44 `697a087fb354faebb72df54b`

## Maturity vocabulary

Use exactly:

`configured → connected → authenticated → request succeeded → response validated → end-to-end verified`

Never infer a higher state from a lower state. Stored credentials alone mean **configured**.

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

At mapping time the Base44 connector catalog reports the following relevant connectors as **not connected**: Gmail, Google Sheets, Google Docs, Google Calendar, QuickBooks, Square, Supabase, GitHub API connector, Docusign, Slack, Microsoft 365 connectors, and others.

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

- Integration implementation: **configured-capable**
- Stored credential completeness: **not re-verified in this mapping**
- Current OAuth success: **not re-verified in this mapping**
- Current read-only OHIP response: **not re-verified in this mapping**
- End-to-end production customer environment: **not verified**

Historical UI/document claims must not override fresh runtime evidence. Use the OHIP readiness function when updating this state.

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

## Hardware

NUPS models hardware through `VenueHardware` and browser/backend workflows for scanners, printers, terminals, and related station devices.

Configured hardware inventory is not equivalent to physical connectivity. Hardware maturity should be tracked per venue/device as:

`configured → browser/device detected → request succeeded → output/input validated → E2E workflow verified`

No blanket E2E hardware claim was made during this mapping run.

## Updating this file

Whenever an integration is tested, record:

- venue/environment
- date/time
- exact maturity state reached
- non-secret evidence/reference
- failure stage if unsuccessful
- whether the test was read-only, funds-off, or live
