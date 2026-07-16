// DACO 007 Phase A — brain configuration (A1, A4, AC-A5).
// Config over literals (MDL-23): ALL model, token, and streaming settings
// resolve from here. No model names or budgets in the call path.
// Product-domain law (R-006A-3): zero NUPS imports.

export const BRAIN_CONFIG = {
  // Model tiers per persona class. Main personas get the best available tier;
  // Jr uses a faster tier (quality verified in AC-A3 quiz).
  MODELS: {
    DEFAULT: 'claude_sonnet_4_6',        // main GlyphBot personas — best tier
    FAST: 'gemini_3_flash',              // GlyphBot Jr — fast tier
    WEB: 'gemini_3_1_pro',               // only tier supporting internet context
  },

  // Which tier each persona resolves to. Unlisted personas → DEFAULT.
  PERSONA_MODEL_TIER: {
    glyphbot_jr: 'FAST',
  },

  // A4 — in-session memory budget. Full history within this character budget;
  // oldest-first truncation with a running summary line.
  HISTORY_CHAR_BUDGET: 24000,
  SUMMARY_LINE_MAX_CHARS: 160,          // per dropped message in the summary

  // A1 streaming fallback — Base44 InvokeLLM returns complete responses
  // (no token streaming). Approved fallback: immediate typing indicator +
  // chunked progressive reveal. These control the reveal cadence.
  STREAM_FALLBACK: {
    CHUNK_CHARS: 24,                    // characters revealed per tick
    INTERVAL_MS: 18,                    // tick interval
  },
};

/** Resolve the model for a persona (+ optional web-context override). */
export function resolveModel(personaId, { webContext = false } = {}) {
  if (webContext) return BRAIN_CONFIG.MODELS.WEB;
  const tier = BRAIN_CONFIG.PERSONA_MODEL_TIER[personaId] || 'DEFAULT';
  return BRAIN_CONFIG.MODELS[tier];
}