// DACO DIRECTIVE 006 — T-3 / MDL-23 precedent: all limits resolve from
// config, never literals in code. Phase 1 feedback limits.

export const FEEDBACK_CONFIG = {
  // §1.1 — response_preview: first N chars of the rated bot response
  RESPONSE_PREVIEW_CHARS: 280,
  // §1.1 — feedback_text max length
  FEEDBACK_TEXT_MAX_CHARS: 1000,
  // §4 / F-2 — analytics include this mode only by default
  ANALYTICS_DEFAULT_MODE: 'REAL',
};