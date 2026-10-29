# GlyphLock: Twilio SHAKEN/STIR integration

## Current scope
Twilio's October 28, 2026 enrollment approval is a **provider approval, not proof that any phone number or product currently transmits A attestation**. Keep this integration separate from DCE sales, payments, identities and receipts.

### Phase 1: read-only audit
Run `node scripts/twilio-trust-audit.mjs` with secure local environment variables:
- `TWILIO_ACCOUNT_SID`: Twilio parent account SID (begins AC)
- `TWILIO_AUTH_TOKEN`: Twilio credential. Use a secret store; **never** commit it.
- `TWILIO_SHAKEN_STIR_BUNDLE_SID`: approved SHAKEN/STIR Trust Product (begins BU)

The script reads Twilio's Trust Hub Trust Product resource only. It makes **no changes** and places **no calls**.

Check in Twilio Console: Communications → Trust Hub → registered customer profiles and trust products; confirm the approved business profile, Trust Product, and phone-number assignment. Determine whether GlyphLock operates as a direct business caller or ISV/Reseller before expanding to customers.

### Phase 2: test evidence (manual)
1. Verify an enrolled Twilio-owned phone number is attached to **both** approved Business Profile and SHAKEN/STIR Trust Product.
2. With explicit authorization, place one controlled call to a consenting test number through the Twilio platform.
3. Inspect the outgoing call **StirStatus** status callback (where available), Twilio Call SID, timestamp, source and destination (mask stored phone numbers), and carrier outcomes.
4. Record a verified A attestation only when evidence shows it. A level is **not guaranteed** for external numbers or every route.
5. Restrict access to evidence. Apply retention, consent and legal review before recordings, transcripts, AI calling or customer-facing verification claims.

### Phase 3: integration boundary
Keep server-only credentials in a secret manager. Never send Twilio authentication credentials to a Vite browser bundle or store them in Base44 entities.
Define authenticated, tenant-scoped backend endpoints for number enrollment inspection, opt-in call controls, webhook signature validation, deduplication by CallSid/event, append-only audit metadata, rate limits and abuse prevention.
No automated outbound calling, forwarding, recordings or customer provisioning without separate approval and controls.

### Provider documentation
- https://www.twilio.com/docs/voice/trusted-calling-with-shakenstir/shakenstir-onboarding
- https://www.twilio.com/docs/voice/trusted-calling-with-shakenstir
- https://www.twilio.com/docs/voice/trusted-calling-with-shakenstir/shakenstir-onboarding/shakenstir-onboarding-in-the-twilio-console

## Change-control and rollback
This PR is read-only tooling plus documentation. No production runtime integration. Delete the files or revert the PR to roll back. Do not present it as live telecom verification until credentialed checks and test-call evidence exist.
