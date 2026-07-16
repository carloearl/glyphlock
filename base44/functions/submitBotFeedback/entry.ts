// DACO 006-A-C2 — Public anonymous feedback write path for GlyphBot.
// Root cause fix: anonymous browsers cannot create entity records directly
// (default entity permissions), so BotFeedback + audit legs failed doubly
// silently. This function accepts unauthenticated calls, validates ALL input
// server-side, applies its own stamps (client is never trusted with stamps),
// rate-limits per conversation, and writes via service role.
// Product-domain law (R-006A-3): zero NUPS imports, no venue resolution.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Config over literals (MDL-23)
const CONFIG = {
  PRODUCT: 'glyphbot',
  SURFACES: ['glyphbot_main', 'glyphbot_jr_public'],
  RATINGS: ['up', 'down'],
  RESPONSE_PREVIEW_CHARS: 280,
  FEEDBACK_TEXT_MAX_CHARS: 1000,
  RATE_LIMIT_WINDOW_MS: 60_000,
  RATE_LIMIT_MAX_PER_CONVERSATION: 5,
};

function resolveAppEnv(req) {
  // Server-derived environment stamp from the calling page's origin.
  // No/unknown origin (server tests, tooling) defaults to 'preview' so
  // production analytics can never be contaminated by non-live traffic.
  const origin = req.headers.get('origin') || req.headers.get('referer') || '';
  if (!origin) return 'preview';
  try {
    const host = new URL(origin).hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('preview') || host.endsWith('.base44.app')) {
      return 'preview';
    }
    return 'production';
  } catch {
    return 'preview';
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Optional identity — anonymous raters are allowed and wanted (R-006A-2)
    let user = null;
    try { user = await base44.auth.me(); } catch { /* anonymous */ }
    const userRole = user?.role || 'anonymous';

    const body = await req.json().catch(() => ({}));
    const action = body.action === 'add_comment' ? 'add_comment' : 'create';
    const appEnv = resolveAppEnv(req);

    if (action === 'add_comment') {
      const recordId = String(body.recordId || '');
      if (!recordId) return Response.json({ ok: false, error: 'recordId required' }, { status: 400 });
      const existing = await base44.asServiceRole.entities.BotFeedback.get(recordId).catch(() => null);
      if (!existing || existing.product !== CONFIG.PRODUCT) {
        return Response.json({ ok: false, error: 'record not found' }, { status: 404 });
      }
      const value = await base44.asServiceRole.entities.BotFeedback.update(recordId, {
        feedback_text: String(body.feedbackText || '').slice(0, CONFIG.FEEDBACK_TEXT_MAX_CHARS),
      });
      return Response.json({ ok: true, value: { id: value.id } });
    }

    // --- create ---
    const rating = String(body.rating || '');
    const messageId = String(body.messageId || '');
    const personaId = String(body.personaId || '');
    const surface = CONFIG.SURFACES.includes(body.surface) ? body.surface : 'glyphbot_main';
    const conversationId = String(body.conversationId || `conv-${Date.now()}`).slice(0, 80);

    if (!CONFIG.RATINGS.includes(rating)) return Response.json({ ok: false, error: 'invalid rating' }, { status: 400 });
    if (!messageId || !personaId) return Response.json({ ok: false, error: 'messageId and personaId required' }, { status: 400 });

    // Server-side rate limit: per-conversation burst guard
    const windowStart = new Date(Date.now() - CONFIG.RATE_LIMIT_WINDOW_MS).toISOString();
    const recent = await base44.asServiceRole.entities.BotFeedback.filter(
      { conversation_id: conversationId, created_at: { $gte: windowStart } }, '-created_at', CONFIG.RATE_LIMIT_MAX_PER_CONVERSATION
    );
    if (recent.length >= CONFIG.RATE_LIMIT_MAX_PER_CONVERSATION) {
      return Response.json({ ok: false, error: 'rate limited' }, { status: 429 });
    }

    // Stamps are server-applied — client values for product/app_env/user_role ignored
    const record = await base44.asServiceRole.entities.BotFeedback.create({
      product: CONFIG.PRODUCT,
      surface,
      app_env: appEnv,
      conversation_id: conversationId,
      message_id: messageId.slice(0, 80),
      persona_id: personaId.slice(0, 40),
      rating,
      feedback_text: String(body.feedbackText || '').slice(0, CONFIG.FEEDBACK_TEXT_MAX_CHARS),
      response_preview: String(body.responseText || '').slice(0, CONFIG.RESPONSE_PREVIEW_CHARS),
      user_role: userRole,
      created_at: new Date().toISOString(),
    });

    // Audit visibility leg — service role, never blocks the response
    try {
      await base44.asServiceRole.entities.SystemAuditLog.create({
        event_type: 'BOT_FEEDBACK_SUBMITTED',
        description: `GlyphBot feedback '${rating}' on persona '${personaId}' via ${surface} (${appEnv})`,
        resource_id: record.id,
        metadata: {
          product: CONFIG.PRODUCT, surface, app_env: appEnv,
          conversation_id: conversationId, message_id: messageId,
          persona_id: personaId, rating, user_role: userRole,
        },
        status: 'success',
      });
    } catch { /* audit leg must never break feedback */ }

    return Response.json({ ok: true, value: { id: record.id } });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});