# GlyphLock partner execution register — September 1, 2026

Owner: GlyphLock LLC  
Primary product: NUPS  
Repository: `carloearl/glyphlock`  
Execution posture: proceed in parallel; do not wait for Oracle Simphony or a Cloudflare partnership reply

## Decision

Cloudflare, Oracle, Microsoft, and Salesforce are separate workstreams. A response delay in one program does not pause the others.

The next moves are primarily portal, credential, listing, and engineering actions—not another round of introductory email.

## Verified position

| Track | Verified status | Immediate next move | Email now? |
|---|---|---|---|
| Cloudflare | Technology-partner inquiry received only an automated acknowledgment. The Edge Guard validation job passed, but workflow run `32631854660` failed at inventory because the protected environment supplied no API token or account ID. | Add narrowly scoped Cloudflare credentials to the protected GitHub environment, rerun preflight, inspect the sanitized inventory, and permit deployment only if it returns `SAFE TO DEPLOY`. | No. The partnership application is optional to self-service deployment. |
| Oracle OHIP / Marketplace | OPN Level 0 is active. Oracle Cloud Marketplace program enrollment `1655445` is approved through August 24, 2028. OHIP Partner Sandbox OAuth and controlled read-only validation are complete. No Publisher account, listing record, production application, or authorized customer environment is evidenced. | Open Marketplace Publisher in the `glyphlocknups` OCI tenancy and create a **Lead Generation** listing draft for GlyphLock NUPS. Complete Publisher registration/IAM only if the Console blocks access. | No routine reply. Open Oracle Partner Assistance only for a specific Console or Publisher blocker. |
| Oracle Simphony | Formal request submitted August 25, 2026; Oracle stated it would review and respond within 10 business days. | Keep as a parallel waiting lane. It does not block OHIP, Publisher, listing, or NUPS work. | Not yet. |
| Microsoft | Microsoft stated that an Engagement Manager and technical support require ISV Success enrollment. No enrollment confirmation is present. | Join Microsoft AI Cloud Partner Program and Marketplace as required, enroll in **ISV Success**, then create separate DEV and PROD SaaS offers in Partner Center. | No. Complete enrollment first. |
| Salesforce | Partner Community Support confirmed ISV enrollment comes first and that an externally hosted MCP server can fit AgentExchange without making a managed package the primary architecture. GlyphLock sent a focused classification follow-up on September 1. | Complete ISV enrollment and build the governed read-only MCP server now; use the eventual Salesforce response to confirm the listing wrapper/workflow, not to decide whether engineering starts. | No duplicate follow-up. |

## Priority order

1. **Cloudflare credential unblock and safe preflight.** This is the only current operational blocker with a diagnosed cause.
2. **Oracle Publisher and Lead Generation listing draft.** This converts an approved program enrollment into a real marketplace asset without waiting for Simphony.
3. **Microsoft ISV Success enrollment and DEV SaaS offer.** Enrollment is the gate to Microsoft technical support and benefits.
4. **Salesforce external MCP implementation and ISV enrollment.** Build the server and its security boundary while Partner Support confirms the exact AgentExchange submission wrapper.

## Work that can proceed without partner approval

- Cloudflare Worker deployment through the protected GitHub Actions path.
- Oracle listing copy, screenshots, security summary, commercial model, and Lead Generation draft.
- Microsoft SaaS offer architecture, Entra application design, subscription landing page, webhook contract, and DEV offer preparation.
- Salesforce MCP tool contracts, authorization, tenant isolation, audit logging, rate limits, and local conformance tests.

## Human-controlled boundaries

Across every track:

- AI may read, compare, explain, and draft.
- Deterministic rules and authorized humans retain control over access, agreements, money movement, settlement, ledger entries, evidence finalization, permissions, deletion, and production claims.
- Raw identity documents, biometrics, card data, authentication secrets, tokens, and unnecessary guest PII never enter Salesforce, Microsoft listing metadata, Oracle listing assets, GitHub source, workflow artifacts, or Cloudflare logs.
- All production writes remain locked until authorization, idempotency, audit, retry, rollback, and human approval controls are verified.

## Completion evidence required

A track is not complete because an email was sent. Completion requires an externally verifiable record:

- Cloudflare: successful preflight artifact and successful live verification or an explicit blocked inventory decision.
- Oracle: Publisher account/access evidence and a listing draft/revision identifier.
- Microsoft: Partner Center/ISV Success enrollment status and DEV SaaS offer ID.
- Salesforce: ISV enrollment status, externally hosted MCP endpoint conformance evidence, and later an AgentExchange listing/submission identifier.
