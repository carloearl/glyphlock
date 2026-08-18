import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Legacy client-price checkout endpoint — disabled.
 *
 * The former implementation accepted an arbitrary Stripe Price ID from the
 * browser. Subscription checkout now goes through `stripeCreateCheckout`,
 * where the browser supplies only an allowlisted plan key and the server owns
 * the Price ID, mode, metadata, and return URLs.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return Response.json(
    {
      error: 'Legacy checkout is disabled',
      replacement: 'stripeCreateCheckout',
    },
    { status: 410 },
  );
});