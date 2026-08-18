/**
 * LEGACY STRIPE WEBHOOK HANDLER — DISABLED
 *
 * This duplicate handler previously accepted a parsed event without verifying
 * Stripe's signature against the exact raw request body. It is intentionally
 * fail-closed to prevent duplicate or forged payment state changes.
 *
 * Configure Stripe to send events only to the canonical `stripeWebhook`
 * function, which performs raw-body signature verification, replay protection,
 * subscription price validation, and NUPS payment reconciliation.
 */

export default async function handler() {
  return {
    success: false,
    disabled: true,
    status: 410,
    error: 'Legacy Stripe webhook handler is disabled. Use stripeWebhook.',
  };
}