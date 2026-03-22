import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), { 
            apiVersion: '2024-11-20.acacia' 
        });
        
        const { sessionId } = await req.json();

        if (!sessionId) {
            return Response.json({ error: 'Missing sessionId' }, { status: 400 });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['subscription']
        });

        let status = 'unknown';
        
        if (session.payment_status === 'paid') {
            status = 'active';
            if (session.mode === 'subscription' && session.subscription) {
                status = session.subscription.status;
            }
        } else if (session.status === 'open') {
            status = 'pending';
        } else if (session.status === 'complete' && session.payment_status !== 'paid') {
            status = 'completed_unpaid';
            if (session.mode === 'subscription' && session.subscription) {
                status = session.subscription.status;
            }
        } else if (session.status === 'expired') {
            status = 'expired';
        } else if (session.payment_status === 'unpaid') {
            status = 'unpaid';
        }

        return Response.json({ 
            status: status, 
            customerEmail: session.customer_details?.email, 
            amountTotal: session.amount_total, 
            currency: session.currency, 
            metadata: session.metadata 
        });

    } catch (error) {
        console.error("Stripe Poll Function Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});