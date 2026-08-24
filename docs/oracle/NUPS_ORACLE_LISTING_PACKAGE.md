# NUPS Oracle Marketplace Listing Package

Status: draft — not submitted  
Evidence cutoff: August 24, 2026  
Owner: GlyphLock LLC  
Integration owner: carloearl@glyphlock.com

## Truth boundary

This package may state only that:

- GlyphLock's Oracle Hospitality Integration Cloud Service is provisioned.
- The OHIP Partner Sandbox integration path completed authenticated, controlled read-only requests.
- The August 24, 2026 owner-only room-configuration test reached **response validated** maturity: 250 rows scanned, 0 format-clean, 250 requiring review, and no writes.
- GlyphLock LLC's Oracle PartnerNetwork Level 0 membership is active for August 19, 2026 through August 18, 2027.
- Oracle invited GlyphLock to proceed through Simphony integration validation.

This package must not state or imply Oracle certification, production approval, Marketplace listing acceptance, Oracle endorsement, a completed Simphony integration, or an executed commercial or strategic partnership.

## Oracle identifiers

| Record | Value |
|---|---|
| Oracle Cloud account | `glyphlocknups` |
| OHIP subscription | `107857124` |
| Customer Support Identifier | `133374457` |
| OHIP application | `17363` |
| OPN company ID | `4-463913260838` |
| OPN enrollment | `1654123` |
| OPN level | Level 0 |
| OPN term | August 19, 2026–August 18, 2027 |
| Listing OCID | **Pending — do not invent** |
| Production application/key | **Not issued / not verified** |
| Authorized customer environment | **None shown as of August 24, 2026** |

## Draft listing identity

- Product name: GlyphLock NUPS
- Company: GlyphLock LLC
- Category: Hospitality venue operations and controlled Oracle Hospitality interoperability
- Deployment posture: Server-side integration; owner-controlled readiness console; production writes disabled
- Current Oracle environment: Partner Sandbox only
- Current maturity: **response validated**
- Production maturity: **locked**

## Draft short description

GlyphLock NUPS is a venue-operations platform that connects identity and role controls, operational workflows, transactions, digital contracts, and auditable activity. Its OHIP integration is implemented server-side and has completed authenticated, controlled read-only Partner Sandbox validation. Production access, customer authorization, production validation, and all write workflows remain locked.

## Draft capability statement

Current OHIP capability is limited to controlled read-only configuration validation. Credentials and tokens remain server-side. The browser receives only sanitized status and mapping output; it does not receive guest, reservation, payment, token, or raw Oracle payload data. A separate production application, application key, production credentials and gateway, verified production hotel ID, and an authorized OPERA Cloud customer environment are required before production validation can begin.

## Security and privacy summary

- Exact integration-owner access is required for the OHIP readiness function and console.
- Gateway URLs must use HTTPS.
- Secret completeness checks expose names/status only, never secret values.
- Sandbox validation uses read-only requests.
- No production writes are enabled.
- Mapping preview does not create or update NUPS or Oracle records.
- Public terms and privacy copy distinguish sandbox evidence from Oracle approval.

## Evidence inventory

- Oracle email: “Setup Complete. You're ready to go.” — August 12, 2026.
- Oracle email: “OHIP Journey” — August 12, 2026.
- Historical technical record — August 12, 2026: OCIM OAuth, read-only OHIP request, HTTP success, 921 ms.
- Oracle email: “Oracle PartnerNetwork Application Approved” — August 19, 2026.
- PartnerHelp reference `260818-000062` — eOPN activation evidence.
- Oracle email: “Re: GlyphLock NUPS - Simphony integration inquiry” — August 20, 2026.
- Oracle transaction/invoice `102669026` — August 21, 2026; payment record only.
- Owner-provided portal screenshots — August 24, 2026: application, subscriptions, Partner Sandbox environments, and zero customer environments.
- Owner-only Base44 readiness screenshot — August 24, 2026: sanitized 250-row mapping preview, no writes.

## Assets to assemble before submission

- [ ] Approved company logo and product icon
- [ ] Product screenshots with no credentials, tokens, guest data, or raw Oracle payload
- [ ] Public product URL and support URL
- [ ] Privacy Policy and Terms URLs
- [ ] Support contact and escalation hours
- [ ] Architecture/data-flow diagram
- [ ] Security questionnaire responses
- [ ] Read-only Partner Sandbox validation narrative
- [ ] Customer use-case narrative that does not imply production authorization
- [ ] Commercial model and pricing text
- [ ] Oracle category and regional availability selections
- [ ] Publisher registration confirmation
- [ ] Oracle-issued listing record and OCID

## Submission gates

1. Oracle Marketplace publisher registration completed.
2. Oracle confirms the correct Hospitality Partnerships/Marketplace workflow.
3. Listing form requirements and required legal/commercial documents are known.
4. All claims are rechecked against current Oracle evidence.
5. Oracle issues a listing record/OCID; record it here only after issuance.

## Production gates outside Marketplace submission

- Separate production application and application key.
- Production client credentials and gateway.
- Authorized OPERA Cloud customer environment.
- Verified production hotel ID.
- Controlled read-only production validation.
- Explicit review before enabling any production write workflow.

## Simphony boundary

Simphony is a separate validation workstream. A temporary Simphony sandbox or onboarding procedure must come from the Simphony Integrations Team. Simphony validation, certification, and go-live must not be inferred from OHIP or Marketplace progress.
