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

    // Auditor personas ALWAYS browse the web — audits are useless without live
    // public data, so web access is implied even when the Live toggle is off.
    const auditPersona = personaId === 'AUDITOR' || personaId === 'AUDIT';

    // The DEEP multi-source sweep (LLM query expansion + site dorks + 40
    // results) is expensive, so it stays gated to audit mode / auditor persona.
    const wantsDeep = !!finalOptions.auditMode || auditPersona;

    // EVERY main persona gets live internet grounding by default, so an
    // ordinary question ("who is X", "what happened with Y") returns real web
    // answers like any other chatbot — no toggle required. Jr stays on the fast
    // tier for site help and doesn't need general web access.
    const wantsWeb = wantsDeep || !!finalOptions.realTime || personaId !== 'glyphbot_jr';

    // Built-in keyless public-record scraper (Wikipedia, GDELT, CourtListener,
    // SEC EDGAR, Wikidata, Federal Register, OpenFEC, USASpending, etc.) runs on
    // EVERY web-enabled search — no external API key required — so public
    // business/entity info is pulled directly on any query, not just Live/Audit.
    let realTimeContext = '';
    if (wantsWeb) {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMsg) {
        try {
          const deep = wantsDeep;
          const searchResult = await this.webSearch(
            lastUserMsg.content || lastUserMsg.text,
            deep ? 40 : 5,
            { deep }
          );
          if (searchResult.success && searchResult.summary) {
            realTimeContext = `\n\n[REAL-TIME WEB CONTEXT — ${searchResult.results?.length || 0} sources, ${searchResult.subQueries?.length || 1} queries, incl. site-specific dorks]\nThis live web intelligence is AUTHORITATIVE — prioritize it over internal/model knowledge. Cite these URLs.\n${searchResult.summary}\n[END CONTEXT]\n`;
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
      // When web is wanted (Live toggle, audit mode, or an auditor persona),
      // route to the web-capable model with live internet context enabled —
      // not just the pre-fetched search summary. This makes People/Business/
      // Agency audits actually research the web instead of answering from memory.
      webContext: wantsWeb,
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
      meta: { truncated: result.truncated, webUsed: wantsWeb },
    };
  }

  async webSearch(query, maxResults = 5, options = {}) {
    return await searchService.query(query, maxResults, options);
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