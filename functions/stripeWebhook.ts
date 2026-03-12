import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@14.14.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
  apiVersion: '2023-10-16',
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

// Env-based price mapping
const PRICE_TO_PLAN = {
  [Deno.env.get('STRIPE_PRICE_CREATOR_MONTHLY')]: 'creator',
  [Deno.env.get('STRIPE_PRICE_PROFESSIONAL_MONTHLY')]: 'professional'
};

// IDEMPOTENCY: Track processed webhook IDs
const processedWebhooks = new Map(); // key: event.id, value: timestamp
const WEBHOOK_TTL_MS = 86400000; // 24 hours

Deno.serve(async (req) => {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    // SECURITY: Signature verification (critical — prevents spoofed webhooks)
    if (!signature || !webhookSecret) {
      return Response.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
    }

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (sigError) {
      // SECURITY: Log invalid signature attempt
      console.error('WEBHOOK SIGNATURE VALIDATION FAILED:', sigError.message);
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // IDEMPOTENCY: Check if webhook already processed
    const now = Date.now();
    if (processedWebhooks.has(event.id)) {
      return Response.json({ received: true, idempotent: true });
    }

    // Clean up expired webhook IDs from memory
    for (const [id, timestamp] of processedWebhooks.entries()) {
      if (now - timestamp > WEBHOOK_TTL_MS) {
        processedWebhooks.delete(id);
      }
    }

    // Mark webhook as processed
    processedWebhooks.set(event.id, now);

    const base44 = createClientFromRequest(req);

    switch (event.type) {
      // ═══ SUBSCRIPTION EVENTS (GlyphLock SaaS) ═══
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userEmail = session.customer_email || session.metadata?.userEmail;

        if (userEmail && session.subscription) {
          const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
          if (users.length > 0) {
            const subscription = await stripe.subscriptions.retrieve(session.subscription);
            const priceId = subscription.items.data[0]?.price?.id;
            
            let planName = PRICE_TO_PLAN[priceId] || session.metadata?.plan || 'unknown';

            await base44.asServiceRole.entities.User.update(users[0].id, {
              subscription_status: 'active',
              subscription_id: session.subscription,
              stripe_customer_id: session.customer,
              subscription_plan: planName,
              subscription_start_date: new Date(subscription.current_period_start * 1000).toISOString(),
              subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: false
            });

            // Email notification removed (sendgridClient not accessible)
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const users = await base44.asServiceRole.entities.User.filter({ 
          subscription_id: subscription.id 
        });
        
        if (users.length > 0) {
          await base44.asServiceRole.entities.User.update(users[0].id, {
            subscription_status: subscription.status,
            subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end || false
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const users = await base44.asServiceRole.entities.User.filter({ 
          subscription_id: subscription.id 
        });
        
        if (users.length > 0) {
          const userEmail = users[0].email;
          const planName = users[0].subscription_plan || 'your plan';

          await base44.asServiceRole.entities.User.update(users[0].id, {
            subscription_status: 'canceled',
            subscription_id: null,
            subscription_plan: null,
            cancel_at_period_end: false
          });

          // Email notification removed (sendgridClient not accessible)
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          const users = await base44.asServiceRole.entities.User.filter({ 
            subscription_id: invoice.subscription 
          });
          
          if (users.length > 0) {
            await base44.asServiceRole.entities.User.update(users[0].id, {
              subscription_status: 'active'
            });
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          const users = await base44.asServiceRole.entities.User.filter({ 
            subscription_id: invoice.subscription 
          });
          
          if (users.length > 0) {
            await base44.asServiceRole.entities.User.update(users[0].id, {
              subscription_status: 'past_due'
            });
          }
        }
        break;
      }

      // ═══ DREAM DOLLAR PAYMENT EVENTS ═══
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        
        // Check if this is a Dream Dollar transaction
        if (paymentIntent.metadata?.order_type === 'dream_dollar_sale') {
          const order_number = paymentIntent.metadata?.order_number;
          
          // Log successful payment (immutable audit trail)
          await base44.asServiceRole.entities.AuditEvent.create({
            event_id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            actor_id: 'STRIPE_WEBHOOK',
            actor_role: 'system',
            venue_id: paymentIntent.metadata?.venue_id || 'dream-palace-tempe',
            entity_type: 'PaymentIntent',
            entity_id: paymentIntent.id,
            action: 'UPDATE',
            after_state: JSON.stringify({
              status: 'succeeded',
              amount: paymentIntent.amount / 100,
              order_number
            }),
            is_system_action: true,
            severity: 'INFO',
            description: `Dream Dollar payment succeeded: ${order_number}, $${(paymentIntent.amount / 100).toFixed(2)}`
          });
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        
        if (paymentIntent.metadata?.order_type === 'dream_dollar_sale') {
          const order_number = paymentIntent.metadata?.order_number;
          
          // CRITICAL: Log payment failure for reconciliation
          await base44.asServiceRole.entities.AuditEvent.create({
            event_id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            actor_id: 'STRIPE_WEBHOOK',
            actor_role: 'system',
            venue_id: paymentIntent.metadata?.venue_id || 'dream-palace-tempe',
            entity_type: 'PaymentIntent',
            entity_id: paymentIntent.id,
            action: 'UPDATE',
            after_state: JSON.stringify({
              status: 'failed',
              amount: paymentIntent.amount / 100,
              order_number,
              failure_reason: paymentIntent.last_payment_error?.message || 'Unknown'
            }),
            is_system_action: true,
            severity: 'CRITICAL',
            description: `PAYMENT FAILED: Dream Dollar order ${order_number}, reason: ${paymentIntent.last_payment_error?.message || 'Unknown'}`
          });
        }
        break;
      }
    }

    return Response.json({ received: true, event_id: event.id });
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error(`[${errorId}] Webhook error:`, error);
    return Response.json({ error: 'Webhook processing failed', error_id: errorId }, { status: 400 });
  }
});