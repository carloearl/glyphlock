/**
 * Press AI Adapter — Stub / OpenAI via GlyphBot pipeline
 * AI tab is disabled in this build per directive.
 * This adapter exists for future integration.
 */

export const AI_AVAILABLE = false;

export async function analyzeVoucher(/* config */) {
  return { success: false, error: 'AI tools unavailable in this build' };
}

export async function suggestDenominations(/* context */) {
  return { success: false, error: 'AI tools unavailable in this build' };
}

export async function optimizeLayout(/* config */) {
  return { success: false, error: 'AI tools unavailable in this build' };
}