/**
 * GlyphLock Voice Engine
 * Unified voice synthesis controller with full provider support
 */

import { generateAudio, applyAudioEffects, TTS_PROVIDERS } from './ttsEngine';

export class VoiceEngine {
  constructor() {
    this.currentAudio = null;
    this.settings = this.loadSettings();
  }

  loadSettings() {
    try {
      return {
        provider: localStorage.getItem('voice_provider') || 'openai',
        voice: localStorage.getItem('voice_id') || 'alloy',
        speed: Number(localStorage.getItem('voice_speed')) || 1.0,
        pitch: Number(localStorage.getItem('voice_pitch')) || 1.0,
        volume: Number(localStorage.getItem('voice_volume')) || 1.0,
        bass: Number(localStorage.getItem('voice_bass')) || 0,
        treble: Number(localStorage.getItem('voice_treble')) || 0,
        mid: Number(localStorage.getItem('voice_mid')) || 0,
        stability: Number(localStorage.getItem('voice_stability')) || 0.5,
        similarity: Number(localStorage.getItem('voice_similarity')) || 0.75,
        style: Number(localStorage.getItem('voice_style')) || 0.0,
        useSpeakerBoost: localStorage.getItem('voice_speaker_boost') !== 'false',
        effects: {
          echo: localStorage.getItem('voice_echo') === 'true',
          delay: localStorage.getItem('voice_delay') === 'true',
          gate: localStorage.getItem('voice_gate') !== 'false',
          enhance: localStorage.getItem('voice_enhance') !== 'false',
          humanize: localStorage.getItem('voice_humanize') === 'true'
        }
      };
    } catch {
      return this.getDefaultSettings();
    }
  }

  getDefaultSettings() {
    return {
      provider: 'openai',
      voice: 'alloy',
      speed: 1.0,
      pitch: 1.0,
      volume: 1.0,
      bass: 0,
      treble: 0,
      mid: 0,
      stability: 0.5,
      similarity: 0.75,
      style: 0.0,
      useSpeakerBoost: true,
      effects: {
        echo: false,
        delay: false,
        gate: true,
        enhance: true,
        humanize: false
      }
    };
  }

  saveSettings(settings) {
    this.settings = { ...this.settings, ...settings };
    try {
      Object.keys(settings).forEach(key => {
        if (key === 'effects') {
          Object.keys(settings.effects).forEach(effect => {
            localStorage.setItem(`voice_${effect}`, String(settings.effects[effect]));
          });
        } else {
          localStorage.setItem(`voice_${key}`, String(settings[key]));
        }
      });
    } catch (error) {
      console.error('Failed to save voice settings:', error);
    }
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = '';
      this.currentAudio = null;
    }
    window.speechSynthesis?.cancel();
  }

  async speak(text, customSettings = {}) {
    try {
      this.stop();

      const cleanText = text.replace(/[#*`🦕💠🦖🌟✨]/gu, '').trim();
      if (!cleanText) return;

      const finalSettings = { ...this.settings, ...customSettings };

      const audioUrl = await generateAudio(
        finalSettings.provider,
        finalSettings.voice,
        cleanText,
        {
          speed: finalSettings.speed,
          pitch: finalSettings.pitch,
          volume: finalSettings.volume,
          bass: finalSettings.bass,
          treble: finalSettings.treble,
          mid: finalSettings.mid,
          stability: finalSettings.stability,
          similarity: finalSettings.similarity,
          style: finalSettings.style,
          useSpeakerBoost: finalSettings.useSpeakerBoost,
          effects: finalSettings.effects
        }
      );

      if (audioUrl) {
        const audio = new Audio(audioUrl);
        this.currentAudio = audio;
        audio.playbackRate = finalSettings.speed;

        applyAudioEffects(audio, {
          bass: finalSettings.bass,
          treble: finalSettings.treble,
          mid: finalSettings.mid,
          volume: finalSettings.volume,
          ...finalSettings.effects
        });

        await audio.play();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Voice engine error:', error);
      return false;
    }
  }

  async testVoice(customSettings = {}) {
    const testText = "Hello! This is a test of the GlyphBot voice system with all effects and settings applied.";
    return this.speak(testText, customSettings);
  }

  getAvailableProviders() {
    return TTS_PROVIDERS;
  }
}

export default new VoiceEngine();