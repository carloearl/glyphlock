import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized - Please sign in' }, { status: 401 });
        }

        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), { 
            apiVersion: '2024-11-20.acacia' 
        });
        
        const { productId, priceId, mode } = await req.json();

        if (!priceId || !mode) {
            return Response.json({ error: 'Missing required payment parameters' }, { status: 400 });
        }

        const appHost = req.headers.get('x-forwarded-host') || req.headers.get('host');
        const protocol = req.headers.get('x-forwarded-proto') || 'https';
        const successUrl = `${protocol}://${appHost}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${protocol}://${appHost}/pricing`;

        const session = await stripe.checkout.sessions.create({
            line_items: [{ 
                price: priceId, 
                quantity: 1 
            }],
            mode: mode,
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer_email: user.email,
            client_reference_id: user.id,
            metadata: { 
                userId: user.id, 
                userEmail: user.email,
                userName: user.full_name || 'N/A',
                productId: productId || '', 
                priceId: priceId,
                timestamp: new Date().toISOString()
            },
            allow_promotion_codes: true,
            billing_address_collection: 'auto',
        });

        return Response.json({ 
            url: session.url,
            checkoutUrl: session.url,
            sessionId: session.id,
            success: true
        });

    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        return Response.json({ 
            error: error.message || 'Payment processing failed',
            success: false
        }, { status: 500 });
    }
});