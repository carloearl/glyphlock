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
- Status: **Setup complete** email received from Oracle; Developer Portal access is available. The next action is to create/assign the portal user role, sign in, and register the non-production NUPS application.
- Do not attach or copy this subscription into the separate Free Tier account `glyphlockdev`.

## Immediate portal registration

In the OHIP Partner Developer Portal:

1. Open **https://partner.hospitality-dev-portal.us-ashburn-1.ocs.oraclecloud.com/glyphlocknups/ui/** and sign in with the user assigned the appropriate OHIP Developer Portal role.
2. Open **Applications** → **Register Application**.
3. Application name: **GlyphLock NUPS**
4. Description:
   > High-verification venue-operations platform connecting identity and age verification, role-based workflows, transaction records, VIP operations, contract execution, and auditable venue activity.
5. Environment: **Non Production**
6. Contact:
   - First name: Carlo
   - Last name: Earl
   - Email: carloearl@glyphlock.com
   - Phone: 480-886-5588
   - Company: GlyphLock LLC
7. Subscribe only to the Hospitality API groups required for the first NUPS workflow. Do **not** select **API Catalog** unless using the Oracle Integration Cloud Hospitality Adapter.
8. Register and securely copy the application key. Never place it in browser code, a Base44 entity, chat, or source control.

## Partner Sandbox sequence

1. Open **Environments** and record the sandbox authentication scheme.
2. Record the Gateway URL, Client ID, Client Secret, Enterprise ID, Scope, and sandbox Hotel ID.
   - OCIM sandbox Hotel ID documented by Oracle: `OHIPSB02`
   - SSD sandbox Hotel ID documented by Oracle: `SAND01`
   - Use the value shown for the assigned environment; do not guess.
3. Add the values as Base44 server secrets:
   - `OHIP_GATEWAY_URL`
   - `OHIP_AUTH_SCHEME` (`OCIM` or `SSD`)
   - `OHIP_CLIENT_ID`
   - `OHIP_CLIENT_SECRET`
   - `OHIP_APP_KEY`
   - `OHIP_ENTERPRISE_ID`
   - `OHIP_HOTEL_ID`
4. Invoke `ohipReadiness` with `{ "action": "status" }`. It must report `configured: true`.
5. Use Oracle's current Postman collection to obtain one OAuth token.
6. Make one read-only, low-volume sandbox call and confirm:
   - HTTP 200
   - request visible in OHIP Analytics
   - `X-Request-Id` logged
   - no secret or token present in application logs
7. Only after that test, enable the NUPS backend-for-frontend adapter.

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

Partner sandbox access is not production authorization. For production OPERA Cloud environments:

1. Join Oracle PartnerNetwork at Member Level.
2. Publish NUPS in Oracle Cloud Marketplace under the OHIP product category.
3. Send the Marketplace listing ID / OPN reference to `hospitality-integrations_ww@oracle.com`.
4. Create a separate **Production** application and application key.
5. Connect only after the OPERA Cloud customer approves the environment.
6. Keep production credentials separate from sandbox credentials.

## Separate Simphony track

Simphony integration is a distinct program and must not be mixed into the OPERA Cloud/OHIP application. Continue that process with `fbgbu-integrations_ww@oracle.com` after the OHIP sandbox proof is stable.
