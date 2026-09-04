# NUPS Oracle Marketplace Listing Package

Status: Oracle Cloud Marketplace program enrollment approved; Publisher access and listing draft are the next gates  
Evidence cutoff: September 1, 2026  
Owner: GlyphLock LLC  
Integration owner: carloearl@glyphlock.com

## Truth boundary

This package may state only that:

- GlyphLock's Oracle Hospitality Integration Cloud Service is provisioned.
- The OHIP Partner Sandbox integration path completed authenticated, controlled read-only requests.
- The August 24, 2026 owner-only room-configuration test reached **response validated** maturity: 250 rows scanned, 0 format-clean, 250 requiring review, and no writes.
- GlyphLock LLC's Oracle PartnerNetwork Level 0 membership is active for August 19, 2026 through August 18, 2027.
- GlyphLock LLC's Oracle Cloud Marketplace program enrollment `1655445` was approved and activated on August 25, 2026 and is active through August 24, 2028.
- GlyphLock submitted the separate Simphony Integration Partner Program request and is awaiting Oracle's review.

This package must not state or imply Oracle certification, production approval, Publisher approval, Marketplace listing acceptance, Oracle endorsement, a completed Simphony integration, or an executed commercial or strategic partnership.

## Oracle identifiers

| Record | Value |
|---|---|
| Oracle Cloud account | `glyphlocknups` |
| Region | US East (Ashburn) |
| OHIP subscription | `107857124` |
| Customer Support Identifier | `133374457` |
| OHIP non-production application | `17363` |
| Partner Sandbox hotel | `OHIPSB02` |
| OPN company ID | `4-463913260838` |
| OPN enrollment | `1654123` |
| OPN level | Level 0 |
| OPN term | August 19, 2026–August 18, 2027 |
| Oracle Cloud Marketplace program | Approved and active |
| Marketplace enrollment | `1655445` |
| Marketplace term | August 25, 2026–August 24, 2028 |
| Marketplace Publisher registration | **Not yet confirmed** |
| Listing record/revision | **Not yet created or evidenced** |
| Listing OCID or identifier | **Pending — do not invent** |
| Production OHIP application/key | **Not issued or verified** |
| Authorized customer environment | **None evidenced as of September 1, 2026** |

## Listing classification

NUPS is externally hosted SaaS and currently has no OCI-deployable image, container, Helm chart, or Resource Manager stack.

The working Marketplace classification is therefore:

- **Application Listing — Lead Generation Only**
- created through **Marketplace Publisher in the OCI Console**
- no deployable artifact in the first listing revision

Do not create an OCI Application Listing merely to appear more advanced. That listing type is for an offering with an OCI-deployable artifact. Reclassify only when Oracle's Console workflow or review team provides evidence that another type is required for this Hospitality/OHIP use case.

## Immediate Console sequence

1. Sign in to the `glyphlocknups` OCI tenancy in US East (Ashburn).
2. Open the OCI Console navigation menu.
3. Select **Marketplace → Publisher → Listings**.
4. Select the compartment that will own GlyphLock Marketplace records.
5. If Publisher or Listings is unavailable, complete Publisher account registration and the required IAM policy/role assignment; open Oracle Partner Assistance only with the exact blocked screen or error.
6. Select **Create Listing → Lead Generation**.
7. Use internal listing name `glyphlock-nups` if available.
8. Create the first draft revision and record the listing/revision identifier.
9. Complete listing copy, media, support, legal, security, pricing, and regional fields.
10. Submit the revision for Oracle review only after the claims and assets pass internal review.

This sequence proceeds independently of the Simphony review.

## Draft listing identity

- Product name: GlyphLock NUPS
- Company: GlyphLock LLC
- Category: Hospitality venue operations and controlled Oracle Hospitality interoperability
- Listing model: Lead Generation
- Deployment posture: externally hosted SaaS; server-side integration; owner-controlled readiness console; production writes disabled
- Current Oracle environment: Partner Sandbox only
- Current maturity: **response validated**
- Production maturity: **locked**
- Preferred listing slug or internal ID: `glyphlock-nups` when available
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
- Listing screenshots and documents must contain no credentials, tokens, real guest data, identity documents, signatures, biometric data, or payment-card data.

## Evidence inventory

- Oracle email: “Setup Complete. You're ready to go.” — August 12, 2026.
- Oracle email: “OHIP Journey” — August 12, 2026.
- Historical technical record — August 12, 2026: OCIM OAuth, read-only OHIP request, HTTP success, 921 ms.
- Oracle email: OPN base membership approved and activated — August 19, 2026.
- PartnerHelp reference `260818-000062` — eOPN activation evidence.
- Oracle email: Simphony integration path guidance — August 20, 2026.
- Oracle transaction/invoice `102669026` — August 21, 2026; payment record only.
- Owner-provided portal screenshots — August 24, 2026: application, subscriptions, Partner Sandbox environments, and zero customer environments.
- Owner-only Base44 readiness evidence — August 24, 2026: sanitized 250-row mapping preview, no writes.
- Oracle email: Oracle Cloud Marketplace program application approved and activated — August 25, 2026; enrollment `1655445`; term through August 24, 2028.
- Oracle email: OCI account creation delay notice — August 26, 2026.
- GlyphLock response: `glyphlocknups` access restored and self-service onboarding continuing — August 27, 2026.

## Assets to assemble before submission

- [ ] Approved company logo and product icon in Oracle-supported dimensions
- [ ] Product screenshots with no credentials, tokens, guest data, identity records, or raw Oracle payload
- [x] Public product URL and support URL
- [x] Privacy Policy and Terms URLs
- [ ] Support contact and escalation hours
- [ ] Architecture/data-flow diagram
- [ ] Security questionnaire responses
- [x] Read-only Partner Sandbox validation narrative
- [x] Customer use-case narrative that does not imply production authorization
- [ ] Commercial model and pricing text
- [ ] Oracle category and regional availability selections
- [x] Marketplace program approval confirmation — enrollment `1655445`
- [ ] Publisher registration/access confirmation
- [ ] Listing and revision identifier
- [ ] Oracle-issued listing record or OCID; do not invent an identifier

## Listing submission gates

1. Marketplace Publisher is accessible in the `glyphlocknups` OCI tenancy.
2. Publisher registration and required IAM policy are confirmed.
3. A Lead Generation listing and first revision are created.
4. Required legal, support, security, commercial, media, category, and regional fields are complete.
5. All claims are rechecked against current Oracle evidence and the GlyphLock public-claims policy.
6. The listing revision is submitted for Oracle review.
7. Only Oracle-issued listing and revision identifiers are recorded.

## Production gates outside Marketplace submission

- Separate production OHIP application and application key.
- Production client credentials and gateway.
- Authorized OPERA Cloud customer environment.
- Verified production hotel ID.
- Controlled read-only production validation.
- Explicit review before enabling any production write workflow.

## Simphony boundary

Simphony is a separate validation workstream. A temporary Simphony sandbox or onboarding procedure must come from the Simphony Integrations Team. Simphony validation, certification, Marketplace publication, and go-live must not be inferred from OHIP or Oracle Cloud Marketplace program progress.
