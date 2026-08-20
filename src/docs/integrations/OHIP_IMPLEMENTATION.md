# NUPS ↔ Oracle Hospitality Integration Platform (OHIP)

## Current position

- Oracle Store order: **49372025**
- Oracle onboarding order ID: **49372025-ONBOARDING-107857124-1786521969045**
- Subscription: **107857124**
- Service: **Oracle Hospitality Integration Cloud Service — 10,000 Transactions**
- Permanent Oracle Cloud account: **glyphlocknups**
- Region: **US East (Ashburn)**
- Developer Portal: **https://partner.hospitality-dev-portal.us-ashburn-1.ocs.oraclecloud.com/glyphlocknups/ui/**
- Oracle Customer Support Identifier (CSI): **133374457**
- Base44 production app: **Glyphlock** (`697a087fb354faebb72df54b`)
- Status: **Partner Sandbox technical validation complete.** The non-production NUPS application is registered, required server settings are present, Oracle OAuth succeeds, and controlled read-only OHIP requests return successfully.
- Partner Sandbox hotel: **OHIPSB02** (shared Oracle sandbox; never treat its data as production inventory).
- OPN status: **approved and active**. Oracle activated GlyphLock LLC’s Level 0 membership on August 19, 2026. OPN Company ID: **4-463913260838**; enrollment: **1654123**; term: **August 19, 2026–August 18, 2027**.
- Oracle Marketplace listing: **next workstream; not yet approved or published**. OPN activation clears the membership prerequisite but does not itself establish publisher approval, a listing OCID, supplier onboarding, or production access.
- Production OHIP application/customer environment: **not yet authorized**.
- Do not attach or copy this subscription into the separate Free Tier account `glyphlockdev`.

## Completed non-production registration

The following onboarding steps are complete and must not be repeated unless Oracle explicitly requires re-registration:

1. Permanent Cloud Account `glyphlocknups` created in the supported Ashburn region.
2. OHIP Partner Developer Portal access established.
3. **GlyphLock NUPS** non-production application registered.
4. Application key and sandbox credentials stored only as Base44 server secrets.
5. Sandbox Hotel ID configured as `OHIPSB02`.
6. `ohipReadiness` reports the required configuration present.
7. Oracle OAuth exchange succeeds.
8. Controlled read-only OHIP property/configuration request succeeds and returns sanitized data to the owner-only console.

Do not create a duplicate non-production application or duplicate OHIP subscription merely to advance the production process.

## Partner Sandbox sequence — completed baseline

The sequence below documents the completed baseline and remains the checklist for credential rotation or recovery. Do not repeat it during normal operation.

1. Confirm the assigned environment authentication scheme in **Environments**.
2. Confirm the Gateway URL, Client ID, Client Secret, Enterprise ID, Scope, and sandbox Hotel ID.
   - Current configured Partner Sandbox Hotel ID: `OHIPSB02`
   - SSD reference Hotel ID documented by Oracle: `SAND01`
   - Always use the value shown for the assigned environment; never infer a production Hotel ID from sandbox values.
3. Store the values only as Base44 server secrets:
   - `OHIP_GATEWAY_URL`
   - `OHIP_AUTH_SCHEME` (`OCIM` or `SSD`)
   - `OHIP_CLIENT_ID`
   - `OHIP_CLIENT_SECRET`
   - `OHIP_APP_KEY`
   - `OHIP_ENTERPRISE_ID`
   - `OHIP_HOTEL_ID`
4. Invoke `ohipReadiness` with `{ "action": "status" }`; current baseline is `configured: true`.
5. Obtain OAuth through the server-side client-credentials implementation; never expose tokens to the browser.
6. Run one read-only, low-volume sandbox call and confirm:
   - successful Oracle response
   - request/correlation ID captured when returned
   - latency/status telemetry recorded without payload PII
   - no secret or token present in application logs or frontend state
7. The NUPS backend-for-frontend adapter is enabled for controlled owner-initiated read-only validation.

## Architecture rules

- OHIP calls are backend-only. Browser and mobile clients call a NUPS Base44 backend-for-frontend, never Oracle directly.
- Mandatory API headers: `Authorization: Bearer <token>`, `x-app-key`, and `x-hotelid`.
- Include a GUID `X-Request-Id` on every request.
- Cache OAuth tokens and renew about two minutes before expiry. Do not request a token per API call.
- Start read-only and use a strict allow-list of operations and response fields.
- Use a tolerant reader: retain only fields NUPS needs.
- Keep sandbox event subscriptions off until a consumer is running.
- Do not log Client Secret, App Key, access tokens, identity documents, guest PII, or raw payment data.
- Store Oracle identifiers and secret values only in Base44 server secrets, never entities or frontend bundles.

## Cost controls

Oracle documents that Partner Sandbox API use is billable and that the 10,000-transaction plan does not enforce a hard stop. Before sustained testing:

- configure OHIP call-usage alerts;
- keep initial tests to one OAuth request plus a small number of read-only calls;
- avoid repeated polling;
- do not enable Business Events until the consumer is ready;
- record request counts in NUPS audit telemetry without storing payload PII.

## First integration slice

Build the lowest-risk proof first:

1. OAuth client-credentials flow if the sandbox is OCIM (use the scheme displayed in the portal).
2. Read-only property configuration/List of Values call.
3. Read-only reservation/profile lookup using synthetic sandbox data.
4. Map only NUPS-required identifiers.
5. Add write operations only after audit, idempotency, retry, and customer-approval controls are in place.

## Production path

Partner Sandbox validation proves transport/authentication only; it is not Oracle certification, endorsement, Marketplace approval, or production customer authorization.

1. **Oracle PartnerNetwork membership verified.** Preserve the August 19, 2026 approval and activation notice as the controlling evidence; the OHIP Store order, Cloud subscription, Support account, and OPERA Digital Learning activation are supporting systems, not the membership proof.
2. Prepare the NUPS Oracle Cloud Marketplace listing under the applicable OHIP/Hospitality category and complete the publisher-registration workflow. Do not describe the listing as published until Oracle accepts it and issues the listing record or OCID.
3. Provide the Marketplace listing ID and OPN reference to `hospitality-integrations_ww@oracle.com` when Oracle's process calls for them.
4. Register a separate **Production** OHIP application and application key.
5. Add/connect only an authorized OPERA Cloud customer environment after customer approval.
6. Store production credentials separately from Partner Sandbox credentials.
7. Re-run read-only validation against the authorized production Hotel ID before enabling any production write workflow.
8. Keep production writes locked until idempotency, audit, retry, authorization, and rollback controls are reviewed.

## Separate Simphony track

Simphony integration is a distinct program and must not be mixed into the OPERA Cloud/OHIP application. Continue that process with `fbgbu-integrations_ww@oracle.com` after the OHIP sandbox proof is stable.
