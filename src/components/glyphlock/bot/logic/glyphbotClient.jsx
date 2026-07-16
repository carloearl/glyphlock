// DACO 007 Phase A — GlyphBot main client, now a thin adapter over the ONE
// brain orchestrator (A1). The legacy scattered call paths (puterLLM,
// glyphbotLLM broker, inline format directives) are retired from the call
// path. Persona instructions live in the persona registry (A2); model
// selection resolves from brainConfig (AC-A5). Return shape is preserved
// for existing GlyphBot UI consumers.

import { PERSONAS } from '../config';
import * as searchService from '../services/search';
import { askGlyphBot } from '@/lib/glyphbot/brain/orchestrator';

class GlyphBotClient {
  constructor() {
    this.defaultPersona = 'GENERAL';
    this.defaultOptions = {
      auditMode: false,
      realTime: false,
      tts: false,
    };
  }

  async sendMessage(messages, options = {}) {
    const finalOptions = { ...this.defaultOptions, ...options };
    const personaId = options.persona || this.defaultPersona;

    // Real-time web context (existing search service, unchanged)
    let realTimeContext = '';
    if (finalOptions.realTime) {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMsg) {
        try {
          const searchResult = await this.webSearch(lastUserMsg.content || lastUserMsg.text);
          if (searchResult.success && searchResult.summary) {
            realTimeContext = `\n\n[REAL-TIME WEB CONTEXT]\n${searchResult.summary}\n[END CONTEXT]\n`;
          }
        } catch (e) {
          console.warn('Real-time search failed:', e);
        }
      }
    }

    const enhancedMessages = messages.map((m, i) => ({
      role: m.role,
      content: (realTimeContext && m.role === 'user' && i === messages.length - 1)
        ? `${m.content || m.text}${realTimeContext}`
        : (m.content || m.text),
    }));

    const result = await askGlyphBot({
      personaId,
      messages: enhancedMessages,
      onChunk: options.onChunk || null,
    });

    const isAuditActive = finalOptions.auditMode || personaId === 'AUDIT' || personaId === 'AUDITOR';

    // Legacy-compatible return shape
    return {
      text: result.text,
      audit: null,
      model: result.model,
      promptVersion: 'brain-v1',
      realTimeUsed: !!realTimeContext,
      shouldSpeak: finalOptions.tts,
      providerUsed: 'glyphlock-brain',
      providerLabel: 'GlyphLock Brain',
      auditEngineActive: isAuditActive,
      jsonModeUsed: false,
      meta: { truncated: result.truncated },
    };
  }

  async webSearch(query, maxResults = 5) {
    return await searchService.query(query, maxResults);
  }

  async askWithRealTime(prompt, persona = 'GENERAL') {
    return this.sendMessage(
      [{ role: 'user', content: prompt }],
      { persona, realTime: true }
    );
  }

  async askWithTTS(prompt, persona = 'GENERAL') {
    return this.sendMessage(
      [{ role: 'user', content: prompt }],
      { persona, tts: true }
    );
  }

  async runIntegrityCheck() {
    return this.sendMessage(
      [{ role: 'user', content: 'Run system integrity check' }],
      {}
    );
  }

  async systemCheck() {
    return this.ping();
  }

  async getPersonas() {
    return PERSONAS;
  }

  async ping() {
    try {
      const result = await askGlyphBot({
        personaId: 'GENERAL',
        messages: [{ role: 'user', content: 'Reply with the single word: ok' }],
      });
      return !!result.text;
    } catch {
      return false;
    }
  }
}

const glyphbotClient = new GlyphBotClient();
export default glyphbotClient;

export { GlyphBotClient };