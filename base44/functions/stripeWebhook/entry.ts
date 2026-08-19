import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import Stripe from 'npm:stripe@14.14.0';

/**
 * Canonical Stripe webhook for GlyphLock subscriptions and NUPS payment state.
 * All Stripe-driven state changes enter through this signature-verified route.
 */

const SANDBOX_PLAN_PRICES = {
  creator: 'price_1U5wo5AOlRvharGOaHq8bkWs',
  professional: 'price_1U5wpWAOlRvharGOW3oA5U6B',
};

function stripeKeyMode(secretKey) {
  if (secretKey.startsWith('sk_test_') || secretKey.startsWith('rk_test_')) return 'test';
  if (secretKey.startsWith('sk_live_') || secretKey.startsWith('rk_live_')) return 'live';
  return 'unknown';
}

function pricePlanMap(stripeSecretKey) {
  const map = {};
  const creator = Deno.env.get('STRIPE_PRICE_CREATOR_MONTHLY');
  const professional = Deno.env.get('STRIPE_PRICE_PROFESSIONAL_MONTHLY');
  if (creator) map[creator] = 'creator';
  if (professional) map[professional] = 'professional';

  // Public sandbox Price IDs are accepted only while the configured Stripe
  // credential is explicitly a test key. Live and unknown keys fail closed and
  // require explicit live Price IDs above.
  if (stripeKeyMode(stripeSecretKey) === 'test') {
    map[SANDBOX_PLAN_PRICES.creator] = 'creator';
    map[SANDBOX_PLAN_PRICES.professional] = 'professional';
  }
  return map;
}

async function resolveStripeConnection(base44) {
  let stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecrets = [
    Deno.env.get('STRIPE_WEBHOOK_SECRET'),
    Deno.env.get('STRIPE_CONNECT_WEBHOOK_SECRET'),
  ].filter(Boolean);

  try {
    const connection = await base44.asServiceRole.connectors.getConnection('stripe');
    const config = connection?.connectionConfig || {};
    if (!stripeSecretKey && typeof connection?.accessToken === 'string') {
      stripeSecretKey = connection.accessToken;
    }
    for (const candidate of [
      config.webhook_secret,
      config.webhookSecret,
      config.connect_webhook_secret,
      config.signing_secret,
      config.endpoint_secret,
    ]) {
      if (typeof candidate === 'string' && candidate.length > 0) webhookSecrets.push(candidate);
    }
  } catch (error) {
    console.warn('[stripeWebhook] Stripe connector unavailable:', error?.message || 'not connected');
  }

  return {
    stripeSecretKey,
    webhookSecrets: [...new Set(webhookSecrets)],
  };
}

async function audit(db, eventType, resourceId, description, severity = 'low', metadata = {}) {
  try {
    await db.SystemAuditLog.create({
      event_type: eventType,
      description,
      resource_id: resourceId || null,
      metadata,
      status: severity === 'critical' || severity === 'high' ? 'alert' : 'success',
      severity,
    });
  } catch (error) {
    console.error('[stripeWebhook] Audit write failed:', error?.message || error);
  }
}

async function findUserByEmail(db, email) {
  if (!email) return null;
  const users = await db.User.filter({ email }, null, 1);
  return users?.[0] || null;
}

async function retrieveSubscription(stripe, subscriptionId, connectedAccountId) {
  if (!subscriptionId) return null;
  return connectedAccountId
    ? await stripe.subscriptions.retrieve(subscriptionId, {}, { stripeAccount: connectedAccountId })
    : await stripe.subscriptions.retrieve(subscriptionId);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const base44 = createClientFromRequest(req);
  const { stripeSecretKey, webhookSecrets } = await resolveStripeConnection(base44);
  const signature = req.headers.get('stripe-signature');

  // Fail closed before constructing a Stripe client. Platform-account and
  // Connect endpoints use different signing secrets even when they share the
  // same URL, so verify against the complete server-side allowlist.
  if (!stripeSecretKey || webhookSecrets.length === 0) {
    console.error('[stripeWebhook] Stripe secrets are not configured');
    return Response.json({ error: 'Stripe webhook is not configured' }, { status: 503 });
  }
  if (!signature) {
    return Response.json({ error: 'Missing Stripe signature' }, { status: 401 });
  }

  const rawBody = await req.text();
  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

  let event = null;
  let verificationError = null;
  for (const webhookSecret of webhookSecrets) {
    try {
      event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
      break;
    } catch (error) {
      verificationError = error;
    }
  }

  if (!event) {
    console.error('[stripeWebhook] Signature verification failed:', verificationError?.message || verificationError);
    return Response.json({ error: 'Invalid Stripe signature' }, { status: 401 });
  }

  try {
    const db = base44.asServiceRole.entities;
    const connectedAccountId = event.account || null;

    // Durable success marker. We check only PROCESSED markers so a prior failed
    // attempt remains retryable by Stripe.
    const processed = await db.SystemAuditLog.filter({
      event_type: 'STRIPE_WEBHOOK_PROCESSED',
      resource_id: event.id,
    }, null, 1);

    if (processed.length > 0) {
      return Response.json({ received: true, idempotent: true, event_id: event.id });
    }

    const object = event.data.object;
    const plansByPrice = pricePlanMap(stripeSecretKey);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = object;
        if (session.mode !== 'subscription' || !session.subscription) break;

        const subscription = await retrieveSubscription(
          stripe,
          String(session.subscription),
          connectedAccountId,
        );
        const priceId = subscription?.items?.data?.[0]?.price?.id || null;
        const trustedPlan = priceId ? plansByPrice[priceId] : null;
        const claimedPlan = session.metadata?.plan ?? null;
        const expectedPriceId = session.metadata?.expectedPriceId || null;

        // Entitlements derive from the server-owned Stripe Price mapping, never
        // from mutable Checkout metadata supplied by a browser or stale client.
        if (!trustedPlan || (claimedPlan && claimedPlan !== trustedPlan) ||
            (expectedPriceId && expectedPriceId !== priceId)) {
          await audit(
            db,
            'STRIPE_ENTITLEMENT_REJECTED',
            session.id,
            'Checkout completed with an unrecognized or inconsistent subscription price',
            'critical',
            { price_id: priceId, claimed_plan: claimedPlan, connected_account_id: connectedAccountId },
          );
          break;
        }

        const userEmail = session.customer_details?.email || session.customer_email || session.metadata?.userEmail;
        const user = await findUserByEmail(db, userEmail);
        if (!user) {
          await audit(db, 'STRIPE_USER_NOT_FOUND', session.id, 'No GlyphLock user matched completed checkout', 'high', { user_email: userEmail });
          break;
        }

        await db.User.update(user.id, {
          subscription_status: subscription.status,
          subscription_id: subscription.id,
          stripe_customer_id: String(session.customer || subscription.customer || ''),
          subscription_plan: trustedPlan,
          subscription_start_date: subscription.current_period_start
            ? new Date(subscription.current_period_start * 1000).toISOString()
            : null,
          subscription_end_date: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null,
          cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
        });
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = object;
        const users = await db.User.filter({ subscription_id: subscription.id }, null, 1);
        if (!users.length) break;
        const priceId = subscription?.items?.data?.[0]?.price?.id || null;
        const trustedPlan = priceId ? plansByPrice[priceId] : null;
        const patch = {
          subscription_status: subscription.status,
          subscription_end_date: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null,
          cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
        };
        if (trustedPlan) patch.subscription_plan = trustedPlan;
        await db.User.update(users[0].id, patch);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = object;
        const users = await db.User.filter({ subscription_id: subscription.id }, null, 1);
        if (!users.length) break;
        await db.User.update(users[0].id, {
          subscription_status: 'canceled',
          subscription_id: null,
          subscription_plan: null,
          cancel_at_period_end: false,
        });
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = object;
        if (!invoice.subscription) break;
        const users = await db.User.filter({ subscription_id: String(invoice.subscription) }, null, 1);
        if (users.length) {
          await db.User.update(users[0].id, { subscription_status: 'active' });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = object;
        if (!invoice.subscription) break;
        const users = await db.User.filter({ subscription_id: String(invoice.subscription) }, null, 1);
        if (users.length) {
          await db.User.update(users[0].id, { subscription_status: 'past_due' });
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = object;
        const orderNumber = paymentIntent.metadata?.order_number;
        if (paymentIntent.metadata?.order_type === 'glyphbucks_sale' && orderNumber) {
          const orders = await db.GlyphBucksOrder.filter({ order_number: orderNumber }, null, 1);
          if (orders.length) {
            await db.GlyphBucksOrder.update(orders[0].id, { status: 'signed' });
          }
        }

        const consultationId = paymentIntent.metadata?.consultation_id;
        if (consultationId) {
          const consultations = await db.Consultation.filter({ consultation_id: consultationId }, null, 1);
          if (consultations.length) {
            await db.Consultation.update(consultations[0].id, {
              payment_status: 'paid',
              stripe_payment_intent_id: paymentIntent.id,
              amount_paid: paymentIntent.amount,
              payment_date: new Date().toISOString(),
            });
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = object;
        const orderNumber = paymentIntent.metadata?.order_number;
        if (paymentIntent.metadata?.order_type === 'glyphbucks_sale' && orderNumber) {
          const orders = await db.GlyphBucksOrder.filter({ order_number: orderNumber }, null, 1);
          if (orders.length) await db.GlyphBucksOrder.update(orders[0].id, { status: 'draft' });
        }
        const consultationId = paymentIntent.metadata?.consultation_id;
        if (consultationId) {
          const consultations = await db.Consultation.filter({ consultation_id: consultationId }, null, 1);
          if (consultations.length) {
            await db.Consultation.update(consultations[0].id, { payment_status: 'failed' });
          }
        }
        await audit(
          db,
          'STRIPE_PAYMENT_FAILED',
          paymentIntent.id,
          'Stripe payment intent failed',
          'high',
          {
            order_number: orderNumber || null,
            failure_code: paymentIntent.last_payment_error?.code || null,
            connected_account_id: connectedAccountId,
          },
        );
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = object;
        const orderNumber = paymentIntent.metadata?.order_number;
        if (paymentIntent.metadata?.order_type === 'glyphbucks_sale' && orderNumber) {
          const orders = await db.GlyphBucksOrder.filter({ order_number: orderNumber }, null, 1);
          if (orders.length) await db.GlyphBucksOrder.update(orders[0].id, { status: 'archived' });

          const batches = await db.GlyphBucksBatch.filter({ order_number: orderNumber }, null, 100);
          for (const batch of batches) {
            await db.GlyphBucksBatch.update(batch.id, { status: 'voided' });
            const bills = await db.GlyphBucksBill.filter({ batch_id: batch.batch_id }, null, 500);
            for (const bill of bills) {
              if (bill.status !== 'voided') {
                await db.GlyphBucksBill.update(bill.id, {
                  status: 'voided',
                  voided_at: new Date().toISOString(),
                  voided_by: 'STRIPE_WEBHOOK',
                  void_reason: 'Stripe payment canceled',
                });
              }
            }
          }
        }
        break;
      }

      case 'charge.refunded': {
        const charge = object;
        const paymentIntentId = charge.payment_intent ? String(charge.payment_intent) : null;
        if (!paymentIntentId) break;
        const records = await db.PaymentRecord.filter({ processor_reference: paymentIntentId }, null, 100);
        const fullRefund = Number(charge.amount_refunded || 0) >= Number(charge.amount || 0);
        for (const record of records) {
          await db.PaymentRecord.update(record.id, {
            status: fullRefund ? 'REFUNDED' : record.status,
            metadata: {
              ...(record.metadata || {}),
              stripe_refund_amount_cents: charge.amount_refunded || 0,
              stripe_fully_refunded: fullRefund,
              stripe_connected_account_id: connectedAccountId,
            },
          });
        }
        break;
      }

      case 'charge.dispute.created': {
        const dispute = object;
        await audit(
          db,
          'STRIPE_DISPUTE_CREATED',
          dispute.id,
          'Stripe dispute opened',
          'critical',
          {
            charge_id: dispute.charge || null,
            amount: dispute.amount || null,
            reason: dispute.reason || null,
            connected_account_id: connectedAccountId,
          },
        );
        break;
      }

      default:
        await audit(
          db,
          'STRIPE_WEBHOOK_UNHANDLED',
          event.id,
          `Unhandled Stripe event: ${event.type}`,
          'low',
          { connected_account_id: connectedAccountId },
        );
    }

    await audit(
      db,
      'STRIPE_WEBHOOK_PROCESSED',
      event.id,
      `Stripe webhook processed: ${event.type}`,
      'low',
      { event_type: event.type, connected_account_id: connectedAccountId },
    );

    return Response.json({ received: true, event_id: event.id });
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error(`[${errorId}] Stripe webhook processing failed:`, error);
    // A 5xx response tells Stripe to retry. Do not write a PROCESSED marker.
    return Response.json(
      { error: 'Stripe webhook processing failed', error_id: errorId },
      { status: 500 },
    );
  }
});