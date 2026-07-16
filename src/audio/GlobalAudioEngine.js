// DACO DIRECTIVE 005 — GlobalAudioEngine (SINGLETON)
// The ONLY code path permitted to create, play, or destroy audio in GlyphBot.
// State machine: IDLE → FETCHING → PLAYING → IDLE  (any speak() interrupts first)
// R1: interrupt-before-play | R2: no speechSynthesis | R3: one output element | R4: generation token

import { resolvePersonaVoice } from './personaVoiceRegistry';

const TTS_ENDPOINT = '/.netlify/functions/textToSpeechOpenAI';

function cleanTextForSpeech(text) {
  return String(text)
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/[#*`🦕💠🦖🌟✨🔒⚡️💡🛡️•]/g, '')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

class GlobalAudioEngine {
  static _instance = null;
  static get() {
    if (!GlobalAudioEngine._instance) GlobalAudioEngine._instance = new GlobalAudioEngine();
    return GlobalAudioEngine._instance;
  }

  constructor() {
    this.state = 'IDLE';
    this._audio = null;          // single persistent HTMLAudioElement (R3)
    this._objectUrl = null;
    this._abort = null;          // AbortController for in-flight fetch
    this._generation = 0;        // R4 — race-condition kill switch
    this._listeners = new Set();
    this._personaConfig = null;  // persona-bound voice config (V-ISO)
    this._lastError = null;
  }

  // ---------- subscription (for thin hooks) ----------
  subscribe(fn) {
    this._listeners.add(fn);
    fn(this.snapshot());
    return () => this._listeners.delete(fn);
  }

  snapshot() {
    return {
      state: this.state,
      isSpeaking: this.state === 'PLAYING',
      isLoading: this.state === 'FETCHING',
      lastError: this._lastError,
      activeVoiceConfig: this._personaConfig,
    };
  }

  _emit() {
    const snap = this.snapshot();
    this._listeners.forEach((fn) => { try { fn(snap); } catch { /* listener error isolated */ } });
  }

  // ---------- core ----------
  _getAudio() {
    if (!this._audio) {
      this._audio = new Audio();
      this._audio.preload = 'auto';
    }
    return this._audio;
  }

  _interrupt() {
    // Synchronous flush (R1)
    try { this._abort?.abort(); } catch { /* already aborted */ }
    this._abort = null;
    if (this._audio) {
      try {
        this._audio.pause();
        this._audio.onended = null;
        this._audio.onerror = null;
        this._audio.onplaying = null;
        this._audio.removeAttribute('src');
        this._audio.load();
      } catch { /* element teardown best-effort */ }
    }
    if (this._objectUrl) {
      try { URL.revokeObjectURL(this._objectUrl); } catch { /* noop */ }
      this._objectUrl = null;
    }
    this.state = 'IDLE';
  }

  stop() {
    this._generation++;          // invalidate all in-flight continuations
    this._interrupt();
    this._emit();
  }

  reset() {
    this.stop();
    this._personaConfig = null;
    this._emit();
  }

  // V-ISO-1: called on agent/persona switch — flush + load new persona voice
  setPersona(personaId) {
    this.reset();
    this._personaConfig = resolvePersonaVoice(personaId);
    console.log('[GlobalAudioEngine] Persona set:', personaId, this._personaConfig);
    this._emit();
  }

  /**
   * Speak text. voiceConfig: { voiceProfile, speed, volume } — merged over persona config.
   * Returns true if playback started, false if interrupted/failed.
   */
  async speak(text, voiceConfig = {}) {
    const gen = ++this._generation;
    this._interrupt();           // R1: interrupt-before-play, synchronous

    const cleanText = cleanTextForSpeech(text || '');
    if (!cleanText || cleanText.length < 2) return false;

    const cfg = {
      voiceProfile: 'neutral_female',
      speed: 1.0,
      volume: 1.0,
      ...(this._personaConfig || {}),
      ...voiceConfig,
    };
    cfg.speed = Math.max(0.25, Math.min(4.0, Number(cfg.speed) || 1.0));
    cfg.volume = Math.max(0, Math.min(1, Number(cfg.volume ?? 1.0)));

    this.state = 'FETCHING';
    this._lastError = null;
    this._abort = new AbortController();
    this._emit();

    const t0 = performance.now();
    console.log('[GlobalAudioEngine] speak start', { gen, voiceProfile: cfg.voiceProfile, speed: cfg.speed });

    try {
      const response = await fetch(TTS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: this._abort.signal,
        body: JSON.stringify({
          text: cleanText.slice(0, 4096),
          voiceProfile: cfg.voiceProfile,
          speed: cfg.speed,
        }),
      });

      if (gen !== this._generation) return false;      // stale (R4)
      if (!response.ok) throw new Error(`TTS HTTP ${response.status}`);

      const audio = this._getAudio();
      audio.volume = cfg.volume;

      audio.onplaying = () => {
        if (gen !== this._generation) return;
        this.state = 'PLAYING';
        console.log(`[GlobalAudioEngine] time-to-first-audio: ${Math.round(performance.now() - t0)}ms (gen ${gen})`);
        this._emit();
      };
      audio.onended = () => {
        if (gen !== this._generation) return;
        this.state = 'IDLE';
        if (this._objectUrl) { try { URL.revokeObjectURL(this._objectUrl); } catch { /* noop */ } this._objectUrl = null; }
        this._emit();
      };
      audio.onerror = () => {
        if (gen !== this._generation) return;
        this.state = 'IDLE';
        this._lastError = 'Audio playback failed';
        this._emit();
      };

      const streamed = await this._attachStreaming(response, gen, audio);
      if (gen !== this._generation) return false;
      if (!streamed) return false;

      await audio.play();
      if (gen !== this._generation) { this._interrupt(); return false; }
      return true;
    } catch (error) {
      if (error?.name === 'AbortError') return false;  // interrupted — expected
      if (gen !== this._generation) return false;
      console.error('[GlobalAudioEngine] speak failed:', error);
      this._lastError = error?.message || 'TTS failed';
      this.state = 'IDLE';
      this._emit();
      return false;
    }
  }

  // §3.1 — streaming playback: MediaSource when supported, blob fallback.
  async _attachStreaming(response, gen, audio) {
    const canStream =
      typeof window !== 'undefined' &&
      window.MediaSource &&
      MediaSource.isTypeSupported('audio/mpeg') &&
      response.body;

    if (canStream) {
      const ms = new MediaSource();
      this._objectUrl = URL.createObjectURL(ms);
      audio.src = this._objectUrl;

      ms.addEventListener('sourceopen', () => {
        let sb;
        try { sb = ms.addSourceBuffer('audio/mpeg'); }
        catch { try { ms.endOfStream('decode'); } catch { /* noop */ } return; }

        const reader = response.body.getReader();
        const pump = async () => {
          try {
            for (;;) {
              const { done, value } = await reader.read();
              if (gen !== this._generation) { try { reader.cancel(); } catch { /* noop */ } return; }
              if (done) {
                if (ms.readyState === 'open') { try { ms.endOfStream(); } catch { /* noop */ } }
                return;
              }
              if (sb.updating) {
                await new Promise((res) => sb.addEventListener('updateend', res, { once: true }));
              }
              if (gen !== this._generation || ms.readyState !== 'open') return;
              sb.appendBuffer(value);
            }
          } catch { /* stream torn down mid-pump — interrupted */ }
        };
        pump();
      }, { once: true });

      return true;
    }

    // Fallback: buffer fully, then play (older Safari)
    const buf = await response.arrayBuffer();
    if (gen !== this._generation) return false;
    const blob = new Blob([buf], { type: 'audio/mpeg' });
    this._objectUrl = URL.createObjectURL(blob);
    audio.src = this._objectUrl;
    return true;
  }
}

export { GlobalAudioEngine };
export default GlobalAudioEngine;