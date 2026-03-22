/**
 * Get Stripe Configuration
 * 
 * Returns Stripe publishable key (safe to expose to frontend)
 * 
 * @returns {object} Stripe configuration
 */

export default async function handler({}, { secrets }) {
  try {
    const publishableKey = secrets.STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      throw new Error('Stripe publishable key not configured');
    }

    return {
      success: true,
      publishableKey: publishableKey
    };

  } catch (error) {
    console.error('Failed to get Stripe config:', error);
    return {
      success: false,
      error: error.message
    };
  }
}