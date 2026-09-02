import assert from 'node:assert/strict';
import test from 'node:test';
import { createMarketplaceWebhookProcessor } from './lifecycle.mjs';

function event(action, overrides = {}) {
  return {
    id: `event-${action}`,
    subscriptionId: 'subscription-1',
    action,
    timeStamp: '2026-09-01T23:00:00.000Z',
    planId: 'plan-standard',
    quantity: 5,
    publisherId: 'glyphlock',
    offerId: 'glyphlock-nups-dev',
    subscription: {
      id: 'subscription-1',
      planId: 'plan-standard',
      quantity: 5,
      isTest: true,
      sandboxType: 'Test',
      purchaser: { emailId: 'must-not-be-audited@example.com' },
    },
    futureMicrosoftField: { accepted: true },
    ...overrides,
  };
}

function makeProcessor({ current = null, overrides = {} } = {}) {
  const state = {
    entitlement: current,
    claimed: new Set(),
    saved: [],
    completed: [],
    released: [],
    audited: [],
    verifyCalls: [],
  };

  const processor = createMarketplaceWebhookProcessor({
    verifyBearerToken: async (token, options) => {
      if (token !== 'valid-token') throw new Error('bad token');
      assert.equal(options.expectedAudience, 'entra-app-id');
      return { aud: 'entra-app-id', appid: 'marketplace-resource-id' };
    },
    verifyOperation: async ({ event: input }) => {
      state.verifyCalls.push(input.id);
      return { authorized: true, marketplaceStatus: 'InProgress' };
    },
    claimEvent: async ({ eventId }) => {
      if (state.claimed.has(eventId)) return false;
      state.claimed.add(eventId);
      return true;
    },
    releaseEvent: async (record) => {
      state.claimed.delete(record.eventId);
      state.released.push(record);
    },
    loadEntitlement: async () => state.entitlement,
    saveEntitlement: async ({ next }) => {
      state.entitlement = next;
      state.saved.push(next);
    },
    completeOperation: async (record) => state.completed.push(record),
    audit: async (record) => state.audited.push(record),
    now: (() => {
      const values = [
        new Date('2026-09-01T23:00:00.000Z'),
        new Date('2026-09-01T23:00:00.020Z'),
      ];
      return () => values.shift() ?? new Date('2026-09-01T23:00:00.020Z');
    })(),
    ...overrides,
  });

  return { processor, state };
}

const requestContext = { expectedAudience: 'entra-app-id' };
const headers = { authorization: 'Bearer valid-token' };

test('requires Microsoft bearer authorization', async () => {
  const { processor } = makeProcessor();
  const result = await processor.handle({ payload: event('Subscribe'), requestContext });
  assert.equal(result.status, 401);
});

test('accepts future payload fields while validating the documented core', async () => {
  const { processor, state } = makeProcessor();
  const result = await processor.handle({
    headers,
    payload: event('Subscribe'),
    requestContext,
  });
  assert.equal(result.status, 200);
  assert.equal(state.entitlement.status, 'ACTIVE');
  assert.equal(state.entitlement.planId, 'plan-standard');
  assert.equal(state.audited.length, 1);
  assert.equal(JSON.stringify(state.audited).includes('must-not-be-audited'), false);
  assert.equal(JSON.stringify(state.audited).includes('valid-token'), false);
});

test('idempotently acknowledges a duplicate event without a second save', async () => {
  const { processor, state } = makeProcessor();
  const payload = event('Subscribe');
  const first = await processor.handle({ headers, payload, requestContext });
  const second = await processor.handle({ headers, payload, requestContext });
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(second.body.duplicate, true);
  assert.equal(state.saved.length, 1);
});

test('verifies operation before claiming the event', async () => {
  let claimCalled = false;
  const { processor } = makeProcessor({
    overrides: {
      verifyOperation: async () => ({ authorized: false }),
      claimEvent: async () => {
        claimCalled = true;
        return true;
      },
    },
  });
  const result = await processor.handle({
    headers,
    payload: event('Subscribe'),
    requestContext,
  });
  assert.equal(result.status, 403);
  assert.equal(claimCalled, false);
});

test('applies an active plan change and patches operation success', async () => {
  const { processor, state } = makeProcessor({
    current: {
      subscriptionId: 'subscription-1',
      status: 'ACTIVE',
      planId: 'plan-basic',
      quantity: 2,
    },
  });
  const result = await processor.handle({
    headers,
    payload: event('ChangePlan', { planId: 'plan-premium' }),
    requestContext,
  });
  assert.equal(result.status, 200);
  assert.equal(state.entitlement.planId, 'plan-premium');
  assert.deepEqual(
    state.completed.map(({ status }) => status),
    ['Success'],
  );
});

test('suspends and reinstates without changing plan or quantity', async () => {
  const initial = {
    subscriptionId: 'subscription-1',
    status: 'ACTIVE',
    planId: 'plan-standard',
    quantity: 5,
  };
  const first = makeProcessor({ current: initial });
  const suspended = await first.processor.handle({
    headers,
    payload: event('Suspend'),
    requestContext,
  });
  assert.equal(suspended.status, 200);
  assert.equal(first.state.entitlement.status, 'SUSPENDED');

  const second = makeProcessor({ current: first.state.entitlement });
  const reinstated = await second.processor.handle({
    headers,
    payload: event('Reinstate'),
    requestContext,
  });
  assert.equal(reinstated.status, 200);
  assert.equal(second.state.entitlement.status, 'ACTIVE');
  assert.equal(second.state.entitlement.planId, 'plan-standard');
  assert.equal(second.state.entitlement.quantity, 5);
});

test('disables entitlement on unsubscribe', async () => {
  const { processor, state } = makeProcessor({
    current: {
      subscriptionId: 'subscription-1',
      status: 'SUSPENDED',
      planId: 'plan-standard',
      quantity: 5,
    },
  });
  const result = await processor.handle({
    headers,
    payload: event('Unsubscribe'),
    requestContext,
  });
  assert.equal(result.status, 200);
  assert.equal(state.entitlement.status, 'DISABLED');
});

test('patches an update operation as failure and releases idempotency claim', async () => {
  const { processor, state } = makeProcessor({
    current: {
      subscriptionId: 'subscription-1',
      status: 'ACTIVE',
      planId: 'plan-standard',
      quantity: 5,
    },
    overrides: {
      saveEntitlement: async () => {
        throw Object.assign(new Error('write failed'), { code: 'ENTITLEMENT_WRITE_FAILED' });
      },
    },
  });
  const payload = event('ChangeQuantity', { quantity: 10 });
  const result = await processor.handle({ headers, payload, requestContext });
  assert.equal(result.status, 500);
  assert.deepEqual(state.completed.map(({ status }) => status), ['Failure']);
  assert.equal(state.released.length, 1);
  assert.equal(state.claimed.has(payload.id), false);
});
