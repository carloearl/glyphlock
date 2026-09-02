# GlyphLock NUPS — Microsoft ISV Success and Marketplace execution plan

Status: enrollment not yet evidenced  
Target program: Microsoft ISV Success  
Target offer type: Microsoft Marketplace **SaaS offer**  
Product owner: GlyphLock LLC

## Current gate

Microsoft's ISV Success team stated that an Engagement Manager and technical support require ISV Success enrollment. No Partner Center, Marketplace publisher, or ISV Success completion notice is present in the business mailbox as of September 1, 2026.

The next move is enrollment—not another reply to the introductory email.

## Enrollment profile

Use these consistent facts in Partner Center:

- Company: GlyphLock LLC
- Product: GlyphLock NUPS
- Product class: B2B venue-operations and evidence platform
- Availability model: externally available SaaS intended for repeat sale
- Development status: active development and live venue validation
- Microsoft integration plan: Microsoft Entra ID, Microsoft Marketplace SaaS subscription lifecycle, and later controlled Fabric/Power BI reporting interoperability
- Public product URL: `https://glyphlock.io/NUPSLanding`
- Support/contact URL: `https://glyphlock.io/Contact`
- Privacy Policy: `https://glyphlock.io/Privacy`
- Terms: `https://glyphlock.io/Terms`

## Portal sequence

1. Sign in to Partner Center with GlyphLock's work account.
2. Join or verify the Microsoft AI Cloud Partner Program.
3. Accept the Microsoft Partner Agreement and Microsoft Marketplace publisher agreement.
4. Complete organization verification using GlyphLock LLC's exact legal name, business address, domain, and authorized contact.
5. Enroll in ISV Success and record the application/status identifier.
6. After enrollment is active, request the Engagement Manager and technical consultation Microsoft already offered through the program.
7. Create separate Marketplace offers:
   - DEV offer for private end-to-end testing;
   - PROD offer for final publication.

## Offer classification

NUPS is externally hosted SaaS. The primary listing should therefore be a **SaaS offer**, not an Azure Application offer that requires a deployable Azure artifact.

Target offer identity:

- Offer alias: `GlyphLock NUPS`
- Proposed immutable offer ID: `glyphlock-nups`
- Publisher: GlyphLock LLC
- Category: business operations / hospitality operations, subject to the choices available in Partner Center
- Public listing language: evidence-first venue operations; do not imply Microsoft certification, co-sell status, or production integration before those records exist

## Commercial sequence

The target is a transactable SaaS offer, but the DEV offer must prove the subscription lifecycle before PROD is submitted.

Do not choose prices or billing dimensions until the commercial model is approved. Candidate plan structure should separate venue size or enabled modules rather than meter identity, biometric, agreement, or payment records.

## Required engineering slice

Implement the following server-side surfaces before a transactable PROD offer is submitted:

1. **Microsoft Entra application registration**
   - separate application/client identifiers for DEV and PROD where practical;
   - client secrets or certificates stored only as server secrets;
   - no browser exposure of credentials.
2. **Marketplace landing endpoint**
   - proposed route: `/api/marketplace/microsoft/landing`;
   - receives the Marketplace activation token;
   - resolves the purchased subscription through the Microsoft SaaS Fulfillment API;
   - maps the Microsoft subscription to a GlyphLock organization and venue only after authorized onboarding.
3. **Connection webhook**
   - proposed route: `/api/marketplace/microsoft/webhook`;
   - validates Microsoft's authorization header;
   - accepts lifecycle events idempotently;
   - records a sanitized audit event before changing entitlement state.
4. **Subscription lifecycle adapter**
   - resolve;
   - activate;
   - plan/quantity change;
   - suspend;
   - reinstate;
   - unsubscribe;
   - operation-status reconciliation.
5. **Entitlement boundary**
   - Marketplace controls commercial entitlement only;
   - it does not create owners, approve roles, move money, alter ledger entries, finalize evidence, or bypass NUPS venue/session isolation.
6. **Operational controls**
   - idempotency key for every lifecycle event;
   - bounded retries and dead-letter/recovery queue;
   - signature/token validation;
   - tenant and venue mapping review;
   - no raw Microsoft token in logs;
   - separate DEV and PROD secrets and audit evidence.

## DEV acceptance criteria

- Microsoft AI Cloud Partner Program and Marketplace agreements accepted.
- Organization verification complete.
- ISV Success status active or an exact actionable review state recorded.
- DEV SaaS offer ID created.
- Private preview audience configured.
- Entra app registration completed.
- Landing endpoint resolves a test subscription.
- Webhook validates and records test lifecycle events.
- Activate, change, suspend, reinstate, and unsubscribe flows pass end to end.
- Duplicate events do not create duplicate entitlements or audit records.
- No secrets, tokens, identity documents, biometric data, payment-card data, or raw agreement evidence appear in logs or listing assets.

## PROD submission gates

- DEV acceptance criteria pass.
- Pricing and plans are approved by GlyphLock.
- Support hours and escalation contact are published.
- Listing screenshots contain no real guest, staff, entertainer, agreement, or payment data.
- Terms, privacy, support, and product URLs are live.
- Claims are checked against the public-claims policy.
- PROD offer has a distinct configuration and is not pointed at DEV secrets or endpoints.

## Microsoft relationship follow-up

Reply to the Microsoft ISV Success team only after enrollment produces one of these records:

- active enrollment and request for Engagement Manager assignment; or
- a specific verification/error state requiring their intervention.

Do not send another broad fit-review message.
