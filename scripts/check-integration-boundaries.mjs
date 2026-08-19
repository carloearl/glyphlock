import fs from 'node:fs';

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

const failures = [];

function requireText(file, text, label) {
  const source = read(file);
  if (!source.includes(text)) failures.push(`${label}: ${file} is missing ${JSON.stringify(text)}`);
}

function forbidText(file, text, label) {
  const source = read(file);
  if (source.includes(text)) failures.push(`${label}: ${file} still contains ${JSON.stringify(text)}`);
}

const glyphlockWebhook = 'base44/functions/glyphlockWebhook/entry.ts';
requireText(glyphlockWebhook, "if (!webhookSecret)", 'GlyphLock webhook must fail closed when its secret is absent');
requireText(glyphlockWebhook, "if (!signature || !timestamp)", 'GlyphLock webhook must require both signature headers');
requireText(glyphlockWebhook, "GLYPHLOCK_WEBHOOK_RECEIVED", 'GlyphLock webhook must retain replay protection');
forbidText(glyphlockWebhook, "if (webhookSecret && signature)", 'Optional webhook verification is prohibited');

const stripeWebhook = 'base44/functions/stripeWebhook/entry.ts';
requireText(stripeWebhook, 'constructEventAsync', 'Stripe webhook must verify the raw body signature');
requireText(stripeWebhook, 'STRIPE_CONNECT_WEBHOOK_SECRET', 'Stripe Connect events must use a distinct signing secret');
requireText(stripeWebhook, 'for (const webhookSecret of webhookSecrets)', 'Stripe webhook must verify against the platform and Connect secret allowlist');
requireText(stripeWebhook, 'STRIPE_WEBHOOK_PROCESSED', 'Stripe webhook must have durable idempotency');
requireText(stripeWebhook, 'trustedPlan', 'Stripe entitlements must derive from trusted server pricing');
requireText(stripeWebhook, 'event.account', 'Stripe Connect webhook context must be retained');
requireText(stripeWebhook, 'resolveStripeConnection', 'Stripe webhook must support the server-only Base44 connector');
requireText(stripeWebhook, "getConnection('stripe')", 'Stripe webhook connector access must remain server-side');
requireText(stripeWebhook, 'SANDBOX_PLAN_PRICES', 'Stripe webhook must recognize the trusted GlyphLock sandbox catalog');
requireText(stripeWebhook, "stripeKeyMode(stripeSecretKey) === 'test'", 'Sandbox prices must be gated to Stripe test credentials');
forbidText(stripeWebhook, "session.metadata?.plan ||", 'Stripe metadata must not grant entitlements');
forbidText(stripeWebhook, 'AuditEvent.create', 'Stripe webhook must not use the incompatible AuditEvent schema for idempotency');

const legacyStripeWebhook = 'base44/functions/stripe-webhook-handler/entry.ts';
requireText(legacyStripeWebhook, 'LEGACY STRIPE WEBHOOK HANDLER — DISABLED', 'Duplicate Stripe webhook handler must remain disabled');
requireText(legacyStripeWebhook, 'status: 410', 'Disabled Stripe webhook handler must fail closed');

const checkout = 'base44/functions/stripeCreateCheckout/entry.ts';
requireText(checkout, 'PLAN_PRICE_SECRETS', 'Subscription pricing must be server-owned');
requireText(checkout, 'SANDBOX_PLAN_PRICES', 'Checkout must contain the trusted GlyphLock sandbox catalog');
requireText(checkout, "stripeKeyMode(stripeSecretKey) === 'test'", 'Checkout sandbox prices must be gated to Stripe test credentials');
requireText(checkout, 'resolvePlanPrice', 'Checkout must resolve server-owned prices by Stripe environment');
requireText(checkout, 'resolveStripeSecretKey', 'Checkout must support server-side connector key resolution');
requireText(checkout, "getConnection('stripe')", 'Checkout connector access must remain server-side');
requireText(checkout, 'Unsupported subscription plan', 'Subscription plans must be allowlisted');
requireText(checkout, 'Client-controlled prices, line items, and checkout modes are not accepted', 'Legacy client pricing must be rejected');
requireText(checkout, 'expectedPriceId', 'Checkout must bind expected server price metadata');

const legacyCheckout = 'base44/functions/stripeCheckout/entry.ts';
requireText(legacyCheckout, 'Legacy client-price checkout endpoint — disabled', 'Arbitrary client Price checkout must remain disabled');
requireText(legacyCheckout, 'status: 410', 'Legacy checkout must fail closed');

const stripePoll = 'base44/functions/stripePoll/entry.ts';
requireText(stripePoll, 'ownsByReference', 'Checkout Session lookup must verify ownership');
requireText(stripePoll, 'ownsByEmail', 'Checkout Session lookup must support verified email ownership');
requireText(stripePoll, 'Checkout Session not found', 'Checkout Session IDOR must fail without disclosure');
requireText(stripePoll, 'trustedPlan', 'Checkout reconciliation must derive entitlements from trusted prices');
requireText(stripePoll, 'entitlementConfirmed', 'Checkout reconciliation must return an explicit entitlement result');
requireText(stripePoll, "getConnection('stripe')", 'Checkout reconciliation must support the server-only Stripe connector');

const stripeHealth = 'base44/functions/stripe-integration-health/entry.ts';
requireText(stripeHealth, 'EXPECTED_ACCOUNT_ID', 'Stripe health must bind to the intended GlyphLock account');
requireText(stripeHealth, 'REQUIRED_WEBHOOK_SECRET_COUNT = 2', 'Stripe health must require platform and Connect signing secrets');
requireText(stripeHealth, "{ error: 'Authentication required' }", 'Stripe health must return an explicit authentication failure');
requireText(stripeHealth, 'catalogReady && webhookReady && accountMatches && accountReadable', 'Stripe health must require the full integration boundary');

const paymentSuccess = 'src/pages/PaymentSuccess.jsx';
requireText(paymentSuccess, 'base44.functions.invoke("stripePoll"', 'Payment success page must verify with the server');
requireText(paymentSuccess, 'PAYMENT NOT CONFIRMED', 'Payment success page must have a non-success state');
requireText(paymentSuccess, 'data.entitlementConfirmed === true', 'Payment success page must require server reconciliation');
forbidText(paymentSuccess, 'paymentStatus === "paid"', 'Payment success page must not trust paid status without entitlement reconciliation');
forbidText(paymentSuccess, 'Your quantum-grade security is now activated', 'Browser redirect must not claim entitlement activation');

const supabaseProxy = 'base44/functions/supabaseProxy/entry.ts';
requireText(supabaseProxy, 'AUTHENTICATED_FUNCTIONS', 'Supabase proxy must use an explicit allowlist');
requireText(supabaseProxy, 'ADMIN_FUNCTIONS', 'Supabase proxy must enforce privileged routes');
requireText(supabaseProxy, 'Function is not registered for proxy access', 'Supabase proxy must deny unknown functions');
requireText(supabaseProxy, "supabaseUrl.protocol !== 'https:'", 'Supabase proxy must require TLS');

if (failures.length) {
  console.error('Integration boundary guard failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Integration boundary guard passed for Stripe, GlyphLock webhooks, payment redirects, and Supabase proxy controls.');