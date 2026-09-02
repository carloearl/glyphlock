const ACTIONS = new Set([
  'Subscribe',
  'ChangePlan',
  'ChangeQuantity',
  'Renew',
  'Suspend',
  'Unsubscribe',
  'Reinstate',
]);

const UPDATE_ACTIONS = new Set(['ChangePlan', 'ChangeQuantity']);
const ACTIVE_STATES = new Set(['ACTIVE', 'SUSPENDED']);

function response(status, body) {
  return {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'private, no-store',
    },
    body,
  };
}

function bearerToken(headers = {}) {
  const value = headers.authorization ?? headers.Authorization;
  if (typeof value !== 'string') return null;
  const match = value.match(/^Bearer\s+([^\s]+)$/i);
  return match?.[1] ?? null;
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeWebhookEvent(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, message: 'Webhook payload must be an object.' };
  }

  const id = payload.id;
  const subscriptionId = payload.subscriptionId ?? payload.subscription?.id;
  const action = payload.action;
  const timestamp = payload.timeStamp ?? payload.timestamp;
  const planId = payload.planId ?? payload.subscription?.planId ?? null;
  const quantity = payload.quantity ?? payload.subscription?.quantity ?? null;

  if (!nonEmptyString(id)) return { ok: false, message: 'Webhook id is required.' };
  if (!nonEmptyString(subscriptionId)) {
    return { ok: false, message: 'subscriptionId is required.' };
  }
  if (!ACTIONS.has(action)) return { ok: false, message: 'Unsupported webhook action.' };
  if (!nonEmptyString(timestamp) || !Number.isFinite(Date.parse(timestamp))) {
    return { ok: false, message: 'A valid webhook timestamp is required.' };
  }
  if (planId !== null && !nonEmptyString(planId)) {
    return { ok: false, message: 'planId must be a non-empty string when present.' };
  }
  if (quantity !== null && (!Number.isInteger(quantity) || quantity < 1)) {
    return { ok: false, message: 'quantity must be a positive integer when present.' };
  }
  if ((action === 'Subscribe' || action === 'ChangePlan') && !planId) {
    return { ok: false, message: `${action} requires planId.` };
  }
  if (action === 'ChangeQuantity' && quantity === null) {
    return { ok: false, message: 'ChangeQuantity requires quantity.' };
  }

  return {
    ok: true,
    value: {
      id,
      subscriptionId,
      action,
      timestamp: new Date(timestamp).toISOString(),
      planId,
      quantity,
      publisherId: nonEmptyString(payload.publisherId) ? payload.publisherId : null,
      offerId: nonEmptyString(payload.offerId) ? payload.offerId : null,
      operationStatus: nonEmptyString(payload.status) ? payload.status : null,
      isTest: payload.subscription?.isTest === true,
      sandboxType: nonEmptyString(payload.subscription?.sandboxType)
        ? payload.subscription.sandboxType
        : null,
    },
  };
}

function requireCurrent(current, event) {
  if (!current || current.subscriptionId !== event.subscriptionId) {
    throw Object.assign(new Error('Subscription entitlement was not found.'), {
      code: 'SUBSCRIPTION_NOT_FOUND',
      httpStatus: 409,
    });
  }
}

function transitionEntitlement(current, event, occurredAt) {
  if (event.action === 'Subscribe') {
    if (current && current.status !== 'DISABLED') {
      throw Object.assign(new Error('Subscription is already provisioned.'), {
        code: 'SUBSCRIPTION_ALREADY_PROVISIONED',
        httpStatus: 409,
      });
    }
    return {
      subscriptionId: event.subscriptionId,
      status: 'ACTIVE',
      planId: event.planId,
      quantity: event.quantity ?? 1,
      isTest: event.isTest,
      sandboxType: event.sandboxType,
      lastMarketplaceAction: event.action,
      lastMarketplaceEventId: event.id,
      updatedAt: occurredAt,
    };
  }

  requireCurrent(current, event);

  if (event.action === 'ChangePlan') {
    if (current.status !== 'ACTIVE') {
      throw Object.assign(new Error('Only an active subscription can change plans.'), {
        code: 'INVALID_STATE_FOR_PLAN_CHANGE',
        httpStatus: 409,
      });
    }
    return {
      ...current,
      planId: event.planId,
      lastMarketplaceAction: event.action,
      lastMarketplaceEventId: event.id,
      updatedAt: occurredAt,
    };
  }

  if (event.action === 'ChangeQuantity') {
    if (current.status !== 'ACTIVE') {
      throw Object.assign(new Error('Only an active subscription can change quantity.'), {
        code: 'INVALID_STATE_FOR_QUANTITY_CHANGE',
        httpStatus: 409,
      });
    }
    return {
      ...current,
      quantity: event.quantity,
      lastMarketplaceAction: event.action,
      lastMarketplaceEventId: event.id,
      updatedAt: occurredAt,
    };
  }

  if (event.action === 'Renew') {
    if (current.status !== 'ACTIVE') {
      throw Object.assign(new Error('Only an active subscription can renew.'), {
        code: 'INVALID_STATE_FOR_RENEWAL',
        httpStatus: 409,
      });
    }
    return {
      ...current,
      lastMarketplaceAction: event.action,
      lastMarketplaceEventId: event.id,
      updatedAt: occurredAt,
    };
  }

  if (event.action === 'Suspend') {
    if (current.status !== 'ACTIVE') {
      throw Object.assign(new Error('Only an active subscription can be suspended.'), {
        code: 'INVALID_STATE_FOR_SUSPEND',
        httpStatus: 409,
      });
    }
    return {
      ...current,
      status: 'SUSPENDED',
      lastMarketplaceAction: event.action,
      lastMarketplaceEventId: event.id,
      updatedAt: occurredAt,
    };
  }

  if (event.action === 'Reinstate') {
    if (current.status !== 'SUSPENDED') {
      throw Object.assign(new Error('Only a suspended subscription can be reinstated.'), {
        code: 'INVALID_STATE_FOR_REINSTATE',
        httpStatus: 409,
      });
    }
    return {
      ...current,
      status: 'ACTIVE',
      lastMarketplaceAction: event.action,
      lastMarketplaceEventId: event.id,
      updatedAt: occurredAt,
    };
  }

  if (event.action === 'Unsubscribe') {
    if (!ACTIVE_STATES.has(current.status)) {
      throw Object.assign(new Error('Subscription is already disabled.'), {
        code: 'INVALID_STATE_FOR_UNSUBSCRIBE',
        httpStatus: 409,
      });
    }
    return {
      ...current,
      status: 'DISABLED',
      lastMarketplaceAction: event.action,
      lastMarketplaceEventId: event.id,
      updatedAt: occurredAt,
    };
  }

  throw Object.assign(new Error('Unsupported webhook action.'), {
    code: 'UNSUPPORTED_ACTION',
    httpStatus: 400,
  });
}

function safeError(error) {
  return {
    category: typeof error?.code === 'string' ? error.code : 'MARKETPLACE_EVENT_FAILED',
    status: Number.isInteger(error?.httpStatus) ? error.httpStatus : 500,
  };
}

export function createMarketplaceWebhookProcessor({
  verifyBearerToken,
  verifyOperation,
  claimEvent,
  releaseEvent,
  loadEntitlement,
  saveEntitlement,
  completeOperation,
  audit,
  now = () => new Date(),
}) {
  const required = {
    verifyBearerToken,
    verifyOperation,
    claimEvent,
    releaseEvent,
    loadEntitlement,
    saveEntitlement,
    completeOperation,
    audit,
  };
  for (const [name, value] of Object.entries(required)) {
    if (typeof value !== 'function') throw new TypeError(`${name} is required.`);
  }

  return {
    async handle({ headers = {}, payload, requestContext = {} }) {
      const token = bearerToken(headers);
      if (!token) return response(401, { error: 'Unauthorized.' });

      const validation = normalizeWebhookEvent(payload);
      if (!validation.ok) return response(400, { error: validation.message });
      const event = validation.value;

      let claims;
      try {
        claims = await verifyBearerToken(token, {
          expectedAudience: requestContext.expectedAudience,
          requestContext,
        });
      } catch {
        return response(401, { error: 'Unauthorized.' });
      }
      if (!claims || typeof claims !== 'object') {
        return response(401, { error: 'Unauthorized.' });
      }

      let operation;
      try {
        operation = await verifyOperation({ event, claims, requestContext });
      } catch {
        return response(403, { error: 'Marketplace operation verification failed.' });
      }
      if (!operation || operation.authorized !== true) {
        return response(403, { error: 'Marketplace operation verification failed.' });
      }

      const claimed = await claimEvent({
        eventId: event.id,
        subscriptionId: event.subscriptionId,
        action: event.action,
      });
      if (!claimed) {
        return response(200, {
          accepted: true,
          duplicate: true,
          eventId: event.id,
          subscriptionId: event.subscriptionId,
        });
      }

      const startedAt = now();
      let outcome = 'failed';
      let errorCategory = null;
      let nextEntitlement = null;

      try {
        const current = await loadEntitlement(event.subscriptionId);
        nextEntitlement = transitionEntitlement(current, event, startedAt.toISOString());
        await saveEntitlement({
          previous: current,
          next: nextEntitlement,
          event,
          operation,
        });

        if (UPDATE_ACTIONS.has(event.action)) {
          await completeOperation({
            subscriptionId: event.subscriptionId,
            operationId: event.id,
            status: 'Success',
            event,
          });
        }
        outcome = 'success';
      } catch (error) {
        const safe = safeError(error);
        errorCategory = safe.category;

        if (UPDATE_ACTIONS.has(event.action)) {
          try {
            await completeOperation({
              subscriptionId: event.subscriptionId,
              operationId: event.id,
              status: 'Failure',
              event,
              errorCategory,
            });
          } catch {
            errorCategory = `${errorCategory}_AND_OPERATION_PATCH_FAILED`;
          }
        }

        await releaseEvent({
          eventId: event.id,
          subscriptionId: event.subscriptionId,
          action: event.action,
          errorCategory,
        });

        const completedAt = now();
        try {
          await audit({
            eventId: event.id,
            subscriptionId: event.subscriptionId,
            action: event.action,
            planId: event.planId,
            quantity: event.quantity,
            outcome,
            errorCategory,
            latencyMs: Math.max(0, completedAt.getTime() - startedAt.getTime()),
            occurredAt: completedAt.toISOString(),
            tokenClaims: {
              audience: claims.aud ?? null,
              applicationId: claims.appid ?? claims.azp ?? null,
            },
          });
        } catch {
          return response(503, { error: 'Marketplace audit recording failed closed.' });
        }

        return response(safe.status, {
          error: 'Marketplace event could not be applied.',
          category: errorCategory,
        });
      }

      const completedAt = now();
      try {
        await audit({
          eventId: event.id,
          subscriptionId: event.subscriptionId,
          action: event.action,
          planId: event.planId,
          quantity: event.quantity,
          outcome,
          errorCategory,
          latencyMs: Math.max(0, completedAt.getTime() - startedAt.getTime()),
          occurredAt: completedAt.toISOString(),
          tokenClaims: {
            audience: claims.aud ?? null,
            applicationId: claims.appid ?? claims.azp ?? null,
          },
        });
      } catch {
        return response(503, { error: 'Marketplace audit recording failed closed.' });
      }

      return response(200, {
        accepted: true,
        duplicate: false,
        eventId: event.id,
        subscriptionId: event.subscriptionId,
        entitlement: {
          status: nextEntitlement.status,
          planId: nextEntitlement.planId,
          quantity: nextEntitlement.quantity,
        },
      });
    },
  };
}

export { ACTIONS, normalizeWebhookEvent, transitionEntitlement };
