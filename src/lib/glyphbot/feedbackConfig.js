// DACO 006 / 006-A — config-driven limits (universal principle, T-3).
// GlyphBot is a standalone GlyphLock product — no NUPS imports here (R-006A-3).

export const FEEDBACK_CONFIG = {
  // response_preview: first N chars of the rated bot response
  RESPONSE_PREVIEW_CHARS: 280,
  // feedback_text max length
  FEEDBACK_TEXT_MAX_CHARS: 1000,
  // product domain stamp
  PRODUCT: 'glyphbot',
  // analytics include this environment only by default
  ANALYTICS_DEFAULT_ENV: 'production',
};

/**
 * Deployment environment stamp — replaces the NUPS venue-mode axis.
 * Preview/editor/local hosts stamp 'preview'; everything else 'production'.
 */
export function getAppEnv() {
  try {
    const host = window.location.hostname;
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.startsWith('preview') ||
      host.endsWith('.base44.app')
    ) {
      return 'preview';
    }
    return 'production';
  } catch {
    return 'production';
  }
}