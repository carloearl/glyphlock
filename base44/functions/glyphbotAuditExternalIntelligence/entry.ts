import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const ALLOWED_PURPOSES = new Set([
  'audit',
  'fraud_investigation',
  'business_due_diligence',
  'identity_corroboration',
]);

const BLOCKED_PURPOSE_HINTS = [
  'employment',
  'tenant',
  'housing',
  'credit',
  'loan',
  'insurance',
  'hiring',
  'eligibility',
  'consumer_report',
];

const SUPPORTED_PROVIDERS = new Set(['beenverified']);

function normalize(value: unknown): string {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function providerConfiguration(provider: string) {
  if (provider !== 'beenverified') return { configured: false };

  // Intentionally no guessed endpoint, auth scheme, or request shape.
  // Populate these only from official BeenVerified commercial/API documentation.
  const apiUrl = Deno.env.get('BEENVERIFIED_API_URL')?.trim();
  const apiKey = Deno.env.get('BEENVERIFIED_API_KEY')?.trim();
  const contractVersion = Deno.env.get('BEENVERIFIED_API_CONTRACT_VERSION')?.trim();

  return {
    configured: Boolean(apiUrl && apiKey && contractVersion),
    apiUrlPresent: Boolean(apiUrl),
    apiKeyPresent: Boolean(apiKey),
    contractVersionPresent: Boolean(contractVersion),
  };
}

async function appendEvidence(base44: any, evidence: Record<string, unknown>) {
  return base44.asServiceRole.entities.AuditEvidence.create(evidence);
}

Deno.serve(async (req) => {
  const correlationId = crypto.randomUUID();

  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed', correlation_id: correlationId }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden', correlation_id: correlationId }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const operation = normalize(body.operation || 'lookup');
    const provider = normalize(body.provider || 'beenverified');
    const lookupType = normalize(body.lookup_type);
    const rawQuery = String(body.query ?? '').trim();
    const purpose = normalize(body.purpose || 'audit');
    const auditId = String(body.audit_id ?? '').trim();

    if (!SUPPORTED_PROVIDERS.has(provider)) {
      return Response.json({
        error: 'Unsupported provider',
        provider,
        correlation_id: correlationId,
      }, { status: 400 });
    }

    const configuration = providerConfiguration(provider);

    if (operation === 'status') {
      return Response.json({
        provider,
        status: configuration.configured ? 'configured' : 'unconfigured',
        configuration: {
          api_url_present: configuration.apiUrlPresent ?? false,
          api_key_present: configuration.apiKeyPresent ?? false,
          contract_version_present: configuration.contractVersionPresent ?? false,
        },
        policy: {
          eligibility_use_prohibited: true,
          provider_is_source_of_truth: false,
          raw_query_stored: false,
        },
        correlation_id: correlationId,
      });
    }

    if (!lookupType || !rawQuery) {
      return Response.json({
        error: 'lookup_type and query are required',
        correlation_id: correlationId,
      }, { status: 400 });
    }

    const normalizedQuery = normalize(rawQuery);
    const queryFingerprint = await sha256(`${provider}:${lookupType}:${normalizedQuery}`);
    const now = new Date().toISOString();
    const blockedByPurpose = !ALLOWED_PURPOSES.has(purpose) ||
      BLOCKED_PURPOSE_HINTS.some((hint) => purpose.includes(hint));

    const baseEvidence = {
      audit_id: auditId || undefined,
      correlation_id: correlationId,
      provider,
      lookup_type: lookupType,
      query_fingerprint: queryFingerprint,
      purpose: ALLOWED_PURPOSES.has(purpose) ? purpose : 'audit',
      retrieved_at: now,
      corroboration_status: 'unreviewed',
      policy: {
        eligibility_use_prohibited: true,
        raw_query_stored: false,
        provider_is_source_of_truth: false,
      },
      event_version: 1,
    };

    if (blockedByPurpose) {
      await appendEvidence(base44, {
        ...baseEvidence,
        status: 'blocked',
        corroboration_status: 'insufficient_evidence',
        error_code: 'PROHIBITED_DECISION_PURPOSE',
      });

      return Response.json({
        error: 'This external intelligence path cannot be used for employment, housing, credit, insurance, or other eligibility decisions.',
        code: 'PROHIBITED_DECISION_PURPOSE',
        correlation_id: correlationId,
      }, { status: 403 });
    }

    if (!configuration.configured) {
      await appendEvidence(base44, {
        ...baseEvidence,
        status: 'unconfigured',
        corroboration_status: 'insufficient_evidence',
        error_code: 'PROVIDER_NOT_CONFIGURED',
      });

      return Response.json({
        provider,
        status: 'unconfigured',
        code: 'PROVIDER_NOT_CONFIGURED',
        message: 'BeenVerified is registered as a GlyphBot Audit provider, but live lookup is disabled until official commercial API endpoint, credentials, and contract version are configured.',
        required_secrets: [
          'BEENVERIFIED_API_URL',
          'BEENVERIFIED_API_KEY',
          'BEENVERIFIED_API_CONTRACT_VERSION',
        ],
        correlation_id: correlationId,
      }, { status: 503 });
    }

    // Fail closed even after secrets exist. We do not invent BeenVerified's current
    // HTTP method, auth header, request schema, response schema, or permitted fields.
    // Replace this guard with a versioned adapter only after official API docs are obtained.
    await appendEvidence(base44, {
      ...baseEvidence,
      status: 'configured',
      corroboration_status: 'insufficient_evidence',
      error_code: 'PROVIDER_CONTRACT_ADAPTER_REQUIRED',
    });

    return Response.json({
      provider,
      status: 'configured',
      code: 'PROVIDER_CONTRACT_ADAPTER_REQUIRED',
      message: 'Provider credentials are present. Live requests remain intentionally disabled until the official BeenVerified API contract is implemented and version-pinned.',
      correlation_id: correlationId,
    }, { status: 501 });
  } catch (error) {
    console.error(`[${correlationId}] GlyphBot Audit external intelligence error`, error);
    return Response.json({
      error: 'External intelligence lookup failed',
      correlation_id: correlationId,
    }, { status: 500 });
  }
});
