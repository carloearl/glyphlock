# GlyphLock NUPS — Salesforce AgentExchange external MCP execution plan

Status: ISV enrollment not yet evidenced; listing classification confirmation pending  
Primary architecture: externally hosted, read-only MCP server  
Target catalog: Salesforce API Catalog / Agentforce Registry / AgentExchange

## Settled points

Salesforce Partner Community Support has already confirmed:

- Salesforce ISV partner enrollment comes before AgentExchange publication.
- The standard managed-package path exists but is not automatically required for an externally hosted MCP server.
- AgentExchange supports externally hosted MCP servers.
- Listing, legal agreement, security review, and publication requirements still apply.
- Partner Business Development routing is appropriate after a listing is created/submitted.

GlyphLock sent a focused follow-up on September 1, 2026 asking Salesforce to confirm the exact listing classification and Partner Console workflow for the externally hosted MCP architecture. Do not reopen the settled questions above.

## Action now

Proceed with two parallel lanes:

1. Complete Salesforce ISV partner enrollment.
2. Build and verify the external MCP server independently of the remaining listing-classification answer.

The Salesforce response should determine the submission wrapper and listing workflow. It should not decide whether the governed MCP server is engineered.

## Server contract

Proposed identity:

- Server name: `glyphlock-nups-mcp`
- Display name: `GlyphLock NUPS Evidence and Operations`
- Endpoint: `/mcp`
- Transport: Streamable HTTP
- Authentication: OAuth 2.0 client credentials
- Required protocol methods: `initialize`, `tools/list`, `tools/call`
- Initial mode: read-only

The initial tool catalog is defined in `integrations/salesforce-mcp/tool-contracts.json`.

## Initial tools

1. `nups_get_venue_status`
   - returns a sanitized venue/business-date operational snapshot;
   - no raw guest, employee, entertainer, agreement, or payment records.
2. `nups_get_agreement_evidence_status`
   - returns workflow state, required-step completion, manager-signoff state, and an evidence digest;
   - no ID images, signatures, biometric templates, or raw evidence attachments.
3. `nups_list_operational_exceptions`
   - returns sanitized unresolved workflow exceptions and the human role required to resolve them;
   - cannot resolve, approve, delete, or mutate the exception.

## Non-negotiable security boundary

The MCP server must not expose or accept:

- raw identity documents;
- biometric data or templates;
- payment-card numbers, magnetic-stripe data, CVV, or authentication secrets;
- raw signature images;
- unrestricted record search;
- arbitrary SQL, entity, URL, file, or function execution;
- owner creation, role approval, PIN assignment, money movement, settlement, ledger mutation, evidence finalization, or deletion.

Each OAuth client must map to an allowed GlyphLock tenant and venue scope. Tool calls are denied by default when the tenant, venue, role, environment mode, or requested record is outside that scope.

## Authorization and audit requirements

Every tool call must record a sanitized audit event containing:

- request/correlation ID;
- OAuth client identity or stable client reference;
- tenant and venue references;
- tool name;
- REAL, DEMO, or SANDBOX mode;
- input-field names but not secret or raw sensitive values;
- authorization decision;
- response status and latency;
- returned record count;
- error category when applicable.

Do not log bearer tokens, client secrets, identity images, biometrics, signatures, payment credentials, or raw agreement evidence.

## Runtime controls

- HTTPS only.
- OAuth client-credentials token validation.
- Explicit tool allowlist.
- JSON Schema validation with `additionalProperties: false`.
- Per-client and per-venue rate limits.
- Bounded response size and pagination.
- Bounded upstream timeouts and retries.
- No automatic retry for an authorization denial.
- No cross-mode or cross-venue fallback.
- No production writes.
- Health/readiness endpoint must reveal status only, never secret values.

## Salesforce registration sequence

After a conformance endpoint is deployed:

1. In a Salesforce test org, open Setup → API Catalog → MCP Server.
2. Import/register the external MCP server.
3. Configure OAuth 2.0 client credentials and the token endpoint without exposing secrets in source.
4. Allowlist only the three approved tools.
5. Confirm Salesforce completes initialization and tool discovery.
6. Create a test Agentforce agent that can call only the approved read-only tools.
7. Verify positive, denied-scope, invalid-token, rate-limit, timeout, and oversized-response cases.
8. Record the Salesforce MCP server/connection identifiers.
9. After ISV enrollment and classification confirmation, create the AgentExchange listing through the exact Partner Console workflow Salesforce identifies.
10. Submit the listing and request Partner Business Development routing for architecture fit and go-to-market review.

## Conformance acceptance criteria

- `initialize`, `tools/list`, and `tools/call` pass against a supported MCP client.
- OAuth client credentials are required; anonymous calls fail closed.
- Each tool rejects unknown fields and unauthorized venues/modes.
- REAL, DEMO, and SANDBOX data never mix.
- Responses contain only the documented sanitized fields.
- Duplicate requests do not create duplicate audit records beyond the explicit attempt log.
- Raw sensitive data never appears in responses, logs, traces, or Salesforce records.
- Tools cannot mutate NUPS, DCE, settlement, ledger, permission, or evidence state.
- A Salesforce test org can discover and invoke the three allowed tools.
- Listing copy distinguishes MCP compatibility, Salesforce registration, security-review status, and AgentExchange publication status.

## Publication truth boundary

Until Salesforce issues the relevant records, public language may state only that GlyphLock is pursuing Salesforce ISV enrollment and implementing an externally hosted MCP integration path.

Do not state or imply:

- Salesforce certification;
- AgentExchange publication;
- security-review approval;
- managed-package approval;
- Partner Business Development acceptance;
- Salesforce endorsement.
