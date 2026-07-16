// DACO 006-A / 006-A-C2 — GlyphBot product-domain feedback write service.
// C2 root-cause fix: anonymous browsers cannot create entity records directly,
// so ALL writes now route through the public rate-limited backend function
// `submitBotFeedback` (server-side validation + stamps + service-role write
// + audit leg). No NUPS imports (R-006A-3). Failures stay silent toward chat.

import { base44 } from '@/api/base44Client';

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

/**
 * Submit a thumbs up/down rating for a bot response.
 * Anonymous submissions proceed — the backend stamps user_role server-side.
 */
export async function submitBotFeedback({ conversationId, messageId, personaId, surface = 'glyphbot_main', rating, feedbackText = '', responseText = '' }) {
  const convId = conversationId || getOrCreateConversationId(personaId);
  try {
    const res = await base44.functions.invoke('submitBotFeedback', {
      action: 'create',
      conversationId: convId,
      messageId: String(messageId),
      personaId,
      surface,
      rating,
      feedbackText,
      responseText,
    });
    return { ok: !!res.data?.ok, value: res.data?.value || null };
  } catch (e) {
    console.warn('[BotFeedback] write failed:', e.message);
    return { ok: false, value: null };
  }
}

/**
 * Attach a follow-up comment to an already-submitted down-vote.
 */
export async function attachFeedbackComment({ recordId, feedbackText }) {
  if (!recordId) return { ok: false };
  try {
    const res = await base44.functions.invoke('submitBotFeedback', {
      action: 'add_comment',
      recordId,
      feedbackText,
    });
    return { ok: !!res.data?.ok, value: res.data?.value || null };
  } catch (e) {
    console.warn('[BotFeedback] comment update failed:', e.message);
    return { ok: false };
  }
}