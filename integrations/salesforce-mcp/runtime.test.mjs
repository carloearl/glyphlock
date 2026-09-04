import assert from 'node:assert/strict';
import test from 'node:test';
import { createMcpRuntime } from './runtime.mjs';

function makeRuntime(overrides = {}) {
  const auditEvents = [];
  const runtime = createMcpRuntime({
    authenticate: async (token) => token === 'valid-token'
      ? {
          clientRef: 'salesforce-test-client',
          tenantRef: 'tenant-1',
          venueRefs: ['venue-1'],
          allowedModes: ['SANDBOX'],
        }
      : null,
    authorize: async () => true,
    adapters: {
      nups_get_venue_status: async ({ arguments: input }) => ({
        venue_ref: input.venue_ref,
        business_date: input.business_date,
        mode: input.mode,
        shift_state: 'OPEN',
        open_workflow_counts: { agreements: 2 },
        exception_count: 1,
        last_closeout_state: 'NOT_STARTED',
        as_of: '2026-09-01T23:00:00.000Z',
        secret_value: 'must-not-leak',
      }),
      nups_get_agreement_evidence_status: async () => ({
        agreement_ref: 'agreement-1',
        venue_ref: 'venue-1',
        mode: 'SANDBOX',
        workflow_state: 'MANAGER_REVIEW',
        required_steps_complete: false,
        manager_signoff_state: 'PENDING',
        evidence_digest: 'sha256:abc',
        recorded_at: '2026-09-01T22:00:00.000Z',
        as_of: '2026-09-01T23:00:00.000Z',
        raw_signature: 'must-not-leak',
      }),
      nups_list_operational_exceptions: async () => ({
        venue_ref: 'venue-1',
        mode: 'SANDBOX',
        exceptions: [{
          exception_ref: 'ex-1',
          category: 'SIGNOFF',
          severity: 'MEDIUM',
          workflow_ref: 'agreement-1',
          state: 'OPEN',
          opened_at: '2026-09-01T22:00:00.000Z',
          required_human_role: 'manager',
          customer_name: 'must-not-leak',
        }],
        next_cursor: null,
        as_of: '2026-09-01T23:00:00.000Z',
      }),
    },
    audit: async (event) => auditEvents.push(event),
    now: (() => {
      const values = [
        new Date('2026-09-01T23:00:00.000Z'),
        new Date('2026-09-01T23:00:00.015Z'),
      ];
      return () => values.shift() ?? new Date('2026-09-01T23:00:00.015Z');
    })(),
    ...overrides,
  });
  return { runtime, auditEvents };
}

const authHeaders = { authorization: 'Bearer valid-token' };

test('requires a valid bearer token before discovery', async () => {
  const { runtime } = makeRuntime();
  const result = await runtime.handle({
    body: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
  });
  assert.equal(result.status, 401);
  assert.equal(result.body.error.message, 'Unauthorized.');
});

test('supports the Salesforce legacy initialize negotiation', async () => {
  const { runtime } = makeRuntime();
  const result = await runtime.handle({
    headers: authHeaders,
    body: {
      jsonrpc: '2.0',
      id: 2,
      method: 'initialize',
      params: { protocolVersion: '2024-11-05' },
    },
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.result.protocolVersion, '2024-11-05');
  assert.equal(result.body.result.serverInfo.name, 'glyphlock-nups-mcp');
});

test('returns only the approved tool catalog', async () => {
  const { runtime } = makeRuntime();
  const result = await runtime.handle({
    headers: authHeaders,
    body: { jsonrpc: '2.0', id: 3, method: 'tools/list' },
  });
  assert.deepEqual(
    result.body.result.tools.map((tool) => tool.name),
    [
      'nups_get_venue_status',
      'nups_get_agreement_evidence_status',
      'nups_list_operational_exceptions',
    ],
  );
});

test('rejects unknown input fields before adapter execution', async () => {
  let adapterCalled = false;
  const { runtime } = makeRuntime({
    adapters: {
      nups_get_venue_status: async () => {
        adapterCalled = true;
        return {};
      },
    },
  });
  const result = await runtime.handle({
    headers: authHeaders,
    body: {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'nups_get_venue_status',
        arguments: {
          venue_ref: 'venue-1',
          business_date: '2026-09-01',
          mode: 'SANDBOX',
          arbitrary_query: 'select *',
        },
      },
    },
  });
  assert.equal(result.status, 400);
  assert.equal(adapterCalled, false);
});

test('denies cross-venue access before adapter execution', async () => {
  let adapterCalled = false;
  const { runtime } = makeRuntime({
    adapters: {
      nups_get_venue_status: async () => {
        adapterCalled = true;
        return {};
      },
    },
  });
  const result = await runtime.handle({
    headers: authHeaders,
    body: {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'nups_get_venue_status',
        arguments: {
          venue_ref: 'venue-2',
          business_date: '2026-09-01',
          mode: 'SANDBOX',
        },
      },
    },
  });
  assert.equal(result.status, 403);
  assert.equal(adapterCalled, false);
});

test('sanitizes tool output and records a value-free audit envelope', async () => {
  const { runtime, auditEvents } = makeRuntime();
  const result = await runtime.handle({
    headers: { ...authHeaders, 'x-correlation-id': 'corr-1' },
    body: {
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: {
        name: 'nups_get_venue_status',
        arguments: {
          venue_ref: 'venue-1',
          business_date: '2026-09-01',
          mode: 'SANDBOX',
        },
      },
    },
  });
  assert.equal(result.status, 200);
  const output = result.body.result.structuredContent;
  assert.equal(output.secret_value, undefined);
  assert.match(output.authority_notice, /Informational only/);
  assert.deepEqual(auditEvents, [{
    correlationId: 'corr-1',
    clientRef: 'salesforce-test-client',
    tenantRef: 'tenant-1',
    venueRef: 'venue-1',
    tool: 'nups_get_venue_status',
    mode: 'SANDBOX',
    inputFields: ['business_date', 'mode', 'venue_ref'],
    decision: 'authorized',
    status: 'success',
    latencyMs: 15,
    recordCount: 1,
    errorCategory: null,
    occurredAt: '2026-09-01T23:00:00.015Z',
  }]);
  assert.equal(JSON.stringify(auditEvents).includes('valid-token'), false);
  assert.equal(Object.hasOwn(auditEvents[0], 'business_date'), false);
});

test('sanitizes nested exception records', async () => {
  const { runtime } = makeRuntime();
  const result = await runtime.handle({
    headers: authHeaders,
    body: {
      jsonrpc: '2.0',
      id: 7,
      method: 'tools/call',
      params: {
        name: 'nups_list_operational_exceptions',
        arguments: { venue_ref: 'venue-1', mode: 'SANDBOX' },
      },
    },
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.result.structuredContent.exceptions[0].customer_name, undefined);
});
