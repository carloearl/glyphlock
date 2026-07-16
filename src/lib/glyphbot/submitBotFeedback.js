// DACO DIRECTIVE 006 Phase 1 — BotFeedback write service.
// All writes go through writeEntity() (standing architecture law):
// mode stamping, identity rebind (ID-01), MigrationAuditLog + AuditEvent +
// ActivityLog coverage. F-1's SystemAuditLog leg is emitted here explicitly.
// Failures are silent toward the chat UI — feedback must never break chat.

import { base44 } from '@/api/base44Client';
import { writeEntity } from '@/lib/nups/writeEntity';
import { getActiveVenueId } from '@/hooks/useActiveVenue';
import { getActiveMode } from '@/lib/nups/modeResolver';
import { FEEDBACK_CONFIG } from './feedbackConfig';

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

async function emitSystemAuditLog({ rating, personaId, operatingMode, conversationId, messageId, result }) {
  // F-1 dual logging — SystemAuditLog leg. Fire-and-forget.
  try {
    await base44.entities.SystemAuditLog.create({
      event_type: 'BOT_FEEDBACK_SUBMITTED',
      description: `GlyphBot feedback '${rating}' on persona '${personaId}' (${operatingMode})`,
      actor_email: result?.actor_email || undefined,
      resource_id: result?.value?.id || messageId,
      metadata: {
        conversation_id: conversationId,
        message_id: messageId,
        persona_id: personaId,
        rating,
        operating_mode: operatingMode,
        gateway_result: result?.result || 'unknown',
        gateway_audit_id: result?.audit_id || null,
      },
      status: result?.ok ? 'success' : 'failure',
    });
  } catch { /* audit leg must never surface in chat */ }
}

/**
 * Submit a thumbs up/down rating for a bot response.
 * Returns the gateway result ({ ok, value, ... }) or { ok:false, block_reason }.
 */
export async function submitBotFeedback({ conversationId, messageId, personaId, rating, feedbackText = '', responseText = '' }) {
  const venue_id = getActiveVenueId();
  if (!venue_id) {
    // §1.1 — no venue_id, no write (ID-01 lesson)
    console.warn('[BotFeedback] blocked: venue_id_required');
    return { ok: false, block_reason: 'venue_id_required' };
  }

  let user = null;
  try { user = await base44.auth.me(); } catch { /* unauthenticated rater */ }
  const actor = user
    ? { id: user.id, email: user.email, role: user.role || 'user' }
    : { email: 'anonymous', role: 'anonymous' };

  const operating_mode = await getActiveMode(venue_id);

  const data = {
    venue_id,
    operating_mode,
    conversation_id: conversationId || getOrCreateConversationId(personaId),
    message_id: String(messageId),
    persona_id: personaId,
    rating,
    feedback_text: (feedbackText || '').slice(0, FEEDBACK_CONFIG.FEEDBACK_TEXT_MAX_CHARS),
    response_preview: (responseText || '').slice(0, FEEDBACK_CONFIG.RESPONSE_PREVIEW_CHARS),
    user_role: user?.role || 'anonymous',
    created_at: new Date().toISOString(),
  };

  let result;
  try {
    result = await writeEntity({
      entity: 'BotFeedback',
      operation: 'create',
      data,
      actor,
      intent: 'DACO-006-P1 bot response feedback',
      venue_id,
    });
  } catch (e) {
    result = { ok: false, block_reason: `gateway_error: ${e.message}` };
  }

  await emitSystemAuditLog({
    rating, personaId, operatingMode: operating_mode,
    conversationId: data.conversation_id, messageId, result: { ...result, actor_email: actor.email },
  });

  return result;
}

/**
 * Attach a follow-up comment to an already-submitted down-vote.
 */
export async function attachFeedbackComment({ recordId, feedbackText, venueId }) {
  const venue_id = venueId || getActiveVenueId();
  if (!recordId || !venue_id) return { ok: false, block_reason: 'record_or_venue_missing' };

  let user = null;
  try { user = await base44.auth.me(); } catch { /* unauthenticated */ }
  const actor = user
    ? { id: user.id, email: user.email, role: user.role || 'user' }
    : { email: 'anonymous', role: 'anonymous' };

  try {
    return await writeEntity({
      entity: 'BotFeedback',
      operation: 'update',
      id: recordId,
      data: { feedback_text: (feedbackText || '').slice(0, FEEDBACK_CONFIG.FEEDBACK_TEXT_MAX_CHARS) },
      actor,
      intent: 'DACO-006-P1 feedback comment follow-up',
      venue_id,
    });
  } catch (e) {
    return { ok: false, block_reason: `gateway_error: ${e.message}` };
  }
}