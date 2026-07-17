// DACO 007 Phase A — A1 single brain orchestrator.
// ALL GlyphBot persona LLM calls route through askGlyphBot(). No scattered
// InvokeLLM calls in components. Model/token/stream settings resolve from
// brainConfig (MDL-23). Product-domain law: zero NUPS imports (R-006A-3).
//
// STREAMING LIMITATION (A1, reported, not faked): Base44's Core.InvokeLLM
// returns complete responses — no token streaming API exists. Approved
// fallback implemented here: callers get an immediate call start (typing
// indicator) and a chunked progressive reveal via onChunk.

import { base44 } from '@/api/base44Client';
import { BRAIN_CONFIG, resolveModel } from './brainConfig';
import { buildSystemInstructions } from './personaRegistry';
import { renderKnowledgeContext } from './knowledgeBase';

/**
 * A4 — in-session memory. Keep full history within the char budget;
 * oldest messages are truncated into a running summary line block.
 */
function buildHistoryBlock(messages) {
  const budget = BRAIN_CONFIG.HISTORY_CHAR_BUDGET;
  const lines = messages.map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content || m.text || ''}`);

  let total = 0;
  let cut = lines.length; // index of first KEPT line
  for (let i = lines.length - 1; i >= 0; i--) {
    total += lines[i].length + 1;
    if (total > budget) break;
    cut = i;
  }

  const kept = lines.slice(cut);
  const dropped = lines.slice(0, cut);
  let summary = '';
  if (dropped.length > 0) {
    const max = BRAIN_CONFIG.SUMMARY_LINE_MAX_CHARS;
    summary = '[Earlier conversation summary]\n' + dropped.map((l) => l.slice(0, max)).join('\n') + '\n[End summary]\n\n';
  }
  return { transcript: summary + kept.join('\n'), truncated: dropped.length > 0 };
}

/**
 * Progressive reveal fallback — chunks the complete response to onChunk
 * at the cadence set in brainConfig. Resolves when fully revealed.
 */
export function streamReveal(fullText, onChunk) {
  const { CHUNK_CHARS, INTERVAL_MS } = BRAIN_CONFIG.STREAM_FALLBACK;
  return new Promise((resolve) => {
    let pos = 0;
    const tick = () => {
      pos = Math.min(pos + CHUNK_CHARS, fullText.length);
      onChunk(fullText.slice(0, pos));
      if (pos >= fullText.length) return resolve(fullText);
      setTimeout(tick, INTERVAL_MS);
    };
    tick();
  });
}

/**
 * THE single GlyphBot brain entry point.
 *
 * @param {string}   personaId    persona registry id (e.g. 'GENERAL', 'glyphbot_jr')
 * @param {Array}    messages     conversation history [{role, content|text}] incl. latest user msg
 * @param {string}   extraContext optional surface-specific context (e.g. Jr site knowledge)
 * @param {boolean}  webContext   authenticated web lookup — routes to the web-capable tier
 * @param {Array}    fileUrls     uploaded attachment URLs passed to the model (§3)
 * @param {Function} onChunk      optional (partialText) => void for progressive reveal
 * @returns {Promise<{text, model, personaId, truncated}>}
 */
export async function askGlyphBot({ personaId = 'GENERAL', messages = [], extraContext = '', webContext = false, fileUrls = [], onChunk = null }) {
  const knowledge = renderKnowledgeContext();
  const system = buildSystemInstructions(personaId, knowledge);
  const { transcript, truncated } = buildHistoryBlock(messages);
  const model = resolveModel(personaId, { webContext });

  const prompt = [
    system,
    extraContext ? `[SURFACE CONTEXT]\n${extraContext}\n[END SURFACE CONTEXT]` : '',
    `[CONVERSATION]\n${transcript}\n[END CONVERSATION]`,
    'Respond to the last user message as the Assistant. Output only your reply.',
  ].filter(Boolean).join('\n\n');

  const response = await base44.integrations.Core.InvokeLLM({
    prompt,
    model,
    add_context_from_internet: !!webContext,
    // §3 — attached files (image/PDF/text URLs) reach the model as input.
    file_urls: fileUrls && fileUrls.length > 0 ? fileUrls : undefined,
  });

  const text = typeof response === 'string' ? response : (response?.text || String(response));
  if (onChunk) await streamReveal(text, onChunk);

  return { text, model, personaId, truncated };
}

export default { askGlyphBot, streamReveal };