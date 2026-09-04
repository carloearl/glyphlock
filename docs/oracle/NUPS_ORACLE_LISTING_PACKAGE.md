# NUPS Oracle Marketplace Listing Package

Status: draft listing package — Oracle Cloud Marketplace program enrollment active; Publisher Account status still to be confirmed  
Evidence cutoff: September 3, 2026  
Owner: GlyphLock LLC  
Integration owner: carloearl@glyphlock.com

## Truth boundary

This package may state only that:

- GlyphLock's Oracle Hospitality Integration Cloud Service is provisioned.
- The OHIP Partner Sandbox integration path completed authenticated, controlled read-only requests.
- The August 24, 2026 owner-only room-configuration test reached **response validated** maturity: 250 rows scanned, 0 format-clean, 250 requiring review, and no writes.
- GlyphLock LLC's Oracle PartnerNetwork Level 0 membership is active for August 19, 2026 through August 18, 2027.
- Oracle approved and activated GlyphLock LLC's Cloud Services / Oracle Cloud Marketplace program enrollment `1655445` on August 25, 2026, active through August 24, 2028.
- GlyphLock submitted the formal Simphony Integration Partner Program request on August 25, 2026. Oracle stated that its Partner Integration Team would review OPN standing and respond within 10 business days if the request proceeds.

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
| Oracle Cloud Marketplace program enrollment | Approved and active August 25, 2026 · enrollment `1655445` · active through August 24, 2028 |
| Marketplace Publisher Account | **Not yet confirmed active** |
| Listing record | **Not created / not accepted** |
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
- Preferred Marketplace custom URL suffix: `glyphlock-nups` (reserve only if Oracle makes it available)
- Public product URL: `https://glyphlock.io/NUPSLanding`
- Public Oracle integration evidence: `https://glyphlock.io/CaseStudyOracleOHIP`
- Public support/contact URL: `https://glyphlock.io/Contact`
- Privacy Policy: `https://glyphlock.io/Privacy`
- Terms: `https://glyphlock.io/Terms`

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
- Oracle Cloud Marketplace program approval — August 25, 2026: Cloud Services / Oracle Cloud Marketplace enrollment `1655445` approved and activated through August 24, 2028.
- Oracle Simphony Integration Program confirmation — August 25, 2026: formal request submitted; Partner Integration Team review stated within 10 business days.
- Oracle OHIP Developer Portal migration announcement — September 2, 2026: UAT migration September 3, production migration September 8, completion September 10; existing integrations expected to remain unaffected while configuration changes are unavailable during migration windows.

## Assets to assemble before submission

- [ ] Approved company logo and product icon
- [ ] Product screenshots with no credentials, tokens, guest data, or raw Oracle payload
- [x] Public product URL and support URL
- [x] Privacy Policy and Terms URLs
- [ ] Support contact and escalation hours
- [ ] Architecture/data-flow diagram
- [ ] Security questionnaire responses
- [x] Read-only Partner Sandbox validation narrative
- [x] Customer use-case narrative that does not imply production authorization
- [ ] Commercial model and pricing text
- [ ] Oracle category and regional availability selections
- [x] Oracle Cloud Marketplace program enrollment confirmation — enrollment `1655445` approved and active
- [ ] Publisher Account activation confirmation
- [ ] Oracle-issued listing record and identifier; do not invent an OCID

## Submission gates

1. Confirm the separate Oracle Cloud Marketplace Publisher Account is active under GlyphLock's OPN company record.
2. Complete all required and recommended OCM application-listing sections using claims-safe NUPS copy and sanitized assets.
3. Submit the NUPS listing through the applicable Oracle Marketplace workflow while keeping publication status distinct from submission status.
4. Keep the Simphony listing language aligned to Oracle's rule that Simphony Cloud Marketplace publication follows successful Solution Validation.
5. Recheck every claim against current Oracle evidence before each submission or update.
6. Record a listing record, OCID, publication status, or validation status only after Oracle actually issues or confirms it.

## Production gates outside Marketplace submission

- Separate production application and application key.
- Production client credentials and gateway.
- Authorized OPERA Cloud customer environment.
- Verified production hotel ID.
- Controlled read-only production validation.
- Explicit review before enabling any production write workflow.

## Simphony boundary

Simphony is a separate validation workstream. GlyphLock submitted the formal Simphony Integration Partner Program request on August 25, 2026 and is still within Oracle's stated 10-business-day review window as of September 3. Approval, onboarding, sandbox access, Solution Validation, Marketplace publication, certification, and go-live must not be inferred from OHIP or Marketplace progress.

## Temporary Oracle operations note

Oracle announced an OHIP Developer Portal migration with UAT migration September 3, production migration September 8, and completion September 10, 2026. Oracle expects existing integrations and normal OHIP operations to continue, but the Developer Portal may be read-only during migration windows. Avoid configuration changes in the OHIP Developer Portal during those windows; this does not block OCM listing preparation or other non-portal documentation work.
