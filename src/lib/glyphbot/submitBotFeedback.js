// DACO 006-A — GlyphBot product-domain feedback write service.
// GlyphBot is a standalone GlyphLock product (R-006A-1): direct
// base44.entities writes, no NUPS gateway, no venue resolution, no identity
// rebind. Anonymous raters are allowed and wanted (R-006A-2). No imports
// from src/lib/nups/* or useActiveVenue (R-006A-3).
// SystemAuditLog visibility is retained. Failures are silent toward chat.

import { base44 } from '@/api/base44Client';
import { FEEDBACK_CONFIG, getAppEnv } from './feedbackConfig';

/**
 * Stable per-surface conversation id for the current browser session.
 */
export function getOrCreateConversationId(personaId = 'glyphbot') {
  const key = `bot_conversation_id_${personaId}`;
  try {
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(key, id);
    }
    return id;
  } catch {
    return `conv-${Date.now()}`;
  }
}

async function emitSystemAuditLog({ rating, personaId, surface, appEnv, conversationId, messageId, recordId, ok, userRole }) {
  // Audit visibility leg — fire-and-forget, never surfaces in chat.
  try {
    await base44.entities.SystemAuditLog.create({
      event_type: 'BOT_FEEDBACK_SUBMITTED',
      description: `GlyphBot feedback '${rating}' on persona '${personaId}' via ${surface} (${appEnv})`,
      resource_id: recordId || String(messageId),
      metadata: {
        product: FEEDBACK_CONFIG.PRODUCT,
        surface,
        app_env: appEnv,
        conversation_id: conversationId,
        message_id: String(messageId),
        persona_id: personaId,
        rating,
        user_role: userRole,
      },
      status: ok ? 'success' : 'failure',
    });
  } catch { /* audit leg must never surface in chat */ }
}

/**
 * Submit a thumbs up/down rating for a bot response.
 * Anonymous submissions proceed with user_role: "anonymous".
 */
export async function submitBotFeedback({ conversationId, messageId, personaId, surface = 'glyphbot_main', rating, feedbackText = '', responseText = '' }) {
  let user = null;
  try { user = await base44.auth.me(); } catch { /* anonymous rater — allowed */ }
  const userRole = user?.role || 'anonymous';
  const appEnv = getAppEnv();
  const convId = conversationId || getOrCreateConversationId(personaId);

  const data = {
    product: FEEDBACK_CONFIG.PRODUCT,
    surface,
    app_env: appEnv,
    conversation_id: convId,
    message_id: String(messageId),
    persona_id: personaId,
    rating,
    feedback_text: (feedbackText || '').slice(0, FEEDBACK_CONFIG.FEEDBACK_TEXT_MAX_CHARS),
    response_preview: (responseText || '').slice(0, FEEDBACK_CONFIG.RESPONSE_PREVIEW_CHARS),
    user_role: userRole,
    created_at: new Date().toISOString(),
  };

  let record = null;
  let ok = false;
  try {
    record = await base44.entities.BotFeedback.create(data);
    ok = true;
  } catch (e) {
    console.warn('[BotFeedback] write failed:', e.message);
  }

  await emitSystemAuditLog({
    rating, personaId, surface, appEnv,
    conversationId: convId, messageId, recordId: record?.id, ok, userRole,
  });

  return { ok, value: record };
}

/**
 * Attach a follow-up comment to an already-submitted down-vote.
 */
export async function attachFeedbackComment({ recordId, feedbackText }) {
  if (!recordId) return { ok: false };
  try {
    const value = await base44.entities.BotFeedback.update(recordId, {
      feedback_text: (feedbackText || '').slice(0, FEEDBACK_CONFIG.FEEDBACK_TEXT_MAX_CHARS),
    });
    return { ok: true, value };
  } catch (e) {
    console.warn('[BotFeedback] comment update failed:', e.message);
    return { ok: false };
  }
}