import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.14.0';
import { sendTransactionalEmail } from './helpers/sendgridClient.js';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
  apiVersion: '2023-10-16',
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

// GLYPHLOCK: Env-based price mapping (reverse lookup)
const PRICE_TO_PLAN = {
  [Deno.env.get('STRIPE_PRICE_CREATOR_MONTHLY')]: 'creator',
  [Deno.env.get('STRIPE_PRICE_PROFESSIONAL_MONTHLY')]: 'professional'
};

Deno.serve(async (req) => {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature || !webhookSecret) {
      return Response.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
    }

    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    const base44 = createClientFromRequest(req);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userEmail = session.customer_email || session.metadata?.userEmail;

        if (userEmail && session.subscription) {
          const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
          if (users.length > 0) {
            const subscription = await stripe.subscriptions.retrieve(session.subscription);
            const priceId = subscription.items.data[0]?.price?.id;
            
            // GLYPHLOCK: Map Stripe price ID to plan key using env-based mapping
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

            // GLYPHLOCK: Send subscription confirmation email
            const emailHtml = `
              <h2>Welcome to GlyphLock ${planName.charAt(0).toUpperCase() + planName.slice(1)}!</h2>
              <p>Hi ${users[0].full_name || 'there'},</p>
              <p>Your subscription is now active. You have full access to all ${planName} features.</p>
              <p><strong>Plan:</strong> ${planName.charAt(0).toUpperCase() + planName.slice(1)}</p>
              <p><strong>Status:</strong> Active</p>
              <p><strong>Next billing date:</strong> ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}</p>
              <br>
              <p>Manage your subscription at: <a href="https://glyphlock.io/manage-subscription">glyphlock.io/manage-subscription</a></p>
              <br>
              <p><strong>GlyphLock Security Team</strong></p>
            `;

            await sendTransactionalEmail({
              to: userEmail,
              subject: `Welcome to GlyphLock ${planName.charAt(0).toUpperCase() + planName.slice(1)}`,
              html: emailHtml
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
          const userEmail = users[0].email;
          const planName = users[0].subscription_plan || 'your plan';

          await base44.asServiceRole.entities.User.update(users[0].id, {
            subscription_status: 'canceled',
            subscription_id: null,
            subscription_plan: null,
            cancel_at_period_end: false
          });

          // GLYPHLOCK: Send cancellation confirmation email
          const emailHtml = `
            <h2>GlyphLock Subscription Cancelled</h2>
            <p>Hi ${users[0].full_name || 'there'},</p>
            <p>Your ${planName} subscription has been cancelled.</p>
            <p>You will retain access until the end of your current billing period.</p>
            <p>We're sorry to see you go. If you have feedback, we'd love to hear it.</p>
            <br>
            <p>To resubscribe anytime: <a href="https://glyphlock.io/pricing">glyphlock.io/pricing</a></p>
            <br>
            <p><strong>GlyphLock Security Team</strong></p>
          `;

          await sendTransactionalEmail({
            to: userEmail,
            subject: 'GlyphLock Subscription Cancelled',
            html: emailHtml
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
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 400 });
  }
});