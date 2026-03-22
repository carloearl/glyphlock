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

Deno.serve(async (req) => {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    // ✅ SIGNATURE VERIFICATION: Reject invalid/missing signatures immediately
    if (!signature || !webhookSecret) {
      console.error('WEBHOOK_SIGNATURE_FAILURE: Missing signature or webhook secret');
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
      console.error('WEBHOOK_SIGNATURE_FAILURE:', sigError.message);
      
      // Log signature validation failure to audit trail
      try {
        const base44 = createClientFromRequest(req);
        await base44.asServiceRole.entities.AuditEvent.create({
          event_id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          actor_id: 'STRIPE_WEBHOOK',
          actor_role: 'system',
          venue_id: null,
          entity_type: 'StripeWebhook',
          entity_id: 'SIGNATURE_FAILURE',
          action: 'ACCESS',
          is_system_action: true,
          severity: 'CRITICAL',
          description: `Webhook signature validation failed: ${sigError.message}`
        });
      } catch {}
      
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);

    // ✅ IDEMPOTENCY: Check DB for already-processed webhook (survives cold starts)
    const existingEvent = await base44.asServiceRole.entities.AuditEvent.filter({
      entity_type: 'StripeWebhook',
      entity_id: event.id
    }, null, 1);

    if (existingEvent.length > 0) {
      // Already processed — acknowledge Stripe but skip DB writes
      return Response.json({ received: true, idempotent: true, event_id: event.id });
    }

    // Log webhook receipt (idempotency anchor)
    await base44.asServiceRole.entities.AuditEvent.create({
      event_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      actor_id: 'STRIPE_WEBHOOK',
      actor_role: 'system',
      venue_id: null,
      entity_type: 'StripeWebhook',
      entity_id: event.id,
      action: 'ACCESS',
      after_state: JSON.stringify({ type: event.type }),
      is_system_action: true,
      severity: 'INFO',
      description: `Webhook received: ${event.type}`
    });

    // Process event based on type
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
          await base44.asServiceRole.entities.User.update(users[0].id, {
            subscription_status: 'canceled',
            subscription_id: null,
            subscription_plan: null,
            cancel_at_period_end: false
          });
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

      // ═══ GLYPHBUCKS PAYMENT EVENTS ═══
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        
        if (paymentIntent.metadata?.order_type === 'glyphbucks_sale') {
          const order_number = paymentIntent.metadata?.order_number;
          
          // Find associated DreamPalaceOrder record if exists
          const orders = await base44.asServiceRole.entities.DreamPalaceOrder.filter({
            order_number
          }, null, 1);

          if (orders.length > 0) {
            await base44.asServiceRole.entities.DreamPalaceOrder.update(orders[0].id, {
              status: 'signed' // Payment confirmed — ready for fulfillment
            });
          }

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
            description: `GlyphBucks payment succeeded: ${order_number}, $${(paymentIntent.amount / 100).toFixed(2)}`
          });
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        
        if (paymentIntent.metadata?.order_type === 'glyphbucks_sale') {
          const order_number = paymentIntent.metadata?.order_number;
          const failure_reason = paymentIntent.last_payment_error?.message || 'Unknown error';
          
          // Update order status to FAILED
          const orders = await base44.asServiceRole.entities.DreamPalaceOrder.filter({
            order_number
          }, null, 1);

          if (orders.length > 0) {
            await base44.asServiceRole.entities.DreamPalaceOrder.update(orders[0].id, {
              status: 'draft' // Reset to draft — payment failed, retry needed
            });
          }

          // CRITICAL: Log payment failure for staff alert
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
              failure_reason
            }),
            is_system_action: true,
            severity: 'CRITICAL',
            description: `PAYMENT FAILED: GlyphBucks order ${order_number}, reason: ${failure_reason}`
          });
        }
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object;
        
        if (paymentIntent.metadata?.order_type === 'glyphbucks_sale') {
          const order_number = paymentIntent.metadata?.order_number;
          
          // Mark order as CANCELED
          const orders = await base44.asServiceRole.entities.DreamPalaceOrder.filter({
            order_number
          }, null, 1);

          if (orders.length > 0) {
            await base44.asServiceRole.entities.DreamPalaceOrder.update(orders[0].id, {
              status: 'archived' // Payment canceled — order voided
            });
          }

          // VOID any GlyphBucks batch created for this order
          const batches = await base44.asServiceRole.entities.GlyphBucksBatch.filter({
            order_number
          });

          for (const batch of batches) {
            await base44.asServiceRole.entities.GlyphBucksBatch.update(batch.id, {
              status: 'voided'
            });

            // VOID all bills in the batch
            const bills = await base44.asServiceRole.entities.GlyphBucksBill.filter({
              batch_id: batch.batch_id
            });

            for (const bill of bills) {
              await base44.asServiceRole.entities.GlyphBucksBill.update(bill.id, {
                status: 'voided',
                voided_at: new Date().toISOString(),
                voided_by: 'STRIPE_WEBHOOK',
                void_reason: 'Payment canceled by Stripe'
              });
            }
          }

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
              status: 'canceled',
              amount: paymentIntent.amount / 100,
              order_number,
              batches_voided: batches.length
            }),
            is_system_action: true,
            severity: 'WARNING',
            description: `PAYMENT CANCELED: GlyphBucks order ${order_number}, voided ${batches.length} batch(es)`
          });
        }
        break;
      }

      // ✅ UNHANDLED EVENTS: Log but do not error
      default: {
        await base44.asServiceRole.entities.AuditEvent.create({
          event_id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          actor_id: 'STRIPE_WEBHOOK',
          actor_role: 'system',
          venue_id: null,
          entity_type: 'StripeWebhook',
          entity_id: event.id,
          action: 'ACCESS',
          is_system_action: true,
          severity: 'INFO',
          description: `Unhandled webhook event: ${event.type}`
        });
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