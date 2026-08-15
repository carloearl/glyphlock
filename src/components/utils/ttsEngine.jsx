/**
 * GlyphLock Universal TTS Engine
 * Modular multi-provider voice synthesis system
 */

import { base44 } from '@/api/base44Client';

export const TTS_PROVIDERS = {
  openai: {
    label: 'OpenAI Voice',
    voices: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
    supportsSpeed: true,
    supportsPitch: false,
    supportsEmotion: false
  },
  elevenlabs: {
    label: 'ElevenLabs (Celebrity)',
    voices: ['Rachel', 'Domi', 'Bella', 'Antoni', 'Elli', 'Josh', 'Arnold', 'Adam', 'Sam', 'Charlotte'],
    supportsSpeed: true,
    supportsPitch: false,
    supportsEmotion: true
  },
  google: {
    label: 'Google Cloud TTS',
    voices: [
      'en-US-Neural2-A',
      'en-US-Neural2-C',
      'en-US-Neural2-D',
      'en-US-Neural2-F',
      'en-US-Neural2-J',
      'en-US-Wavenet-A',
      'en-US-Wavenet-B',
      'en-US-Wavenet-C',
      'en-US-Wavenet-D'
    ],
    supportsSpeed: true,
    supportsPitch: true,
    supportsEmotion: false
  },
  microsoft: {
    label: 'Microsoft Azure Neural',
    voices: [
      'en-US-JennyNeural',
      'en-US-GuyNeural',
      'en-US-AriaNeural',
      'en-US-DavisNeural',
      'en-US-JaneNeural',
      'en-US-JasonNeural',
      'en-US-SaraNeural',
      'en-US-TonyNeural'
    ],
    supportsSpeed: true,
    supportsPitch: true,
    supportsEmotion: true
  },
  streamelements: {
    label: 'StreamElements (Free)',
    voices: ['Joanna', 'Matthew', 'Amy', 'Brian', 'Emma', 'Justin', 'Kendra', 'Kimberly'],
    supportsSpeed: false,
    supportsPitch: false,
    supportsEmotion: false
  },
  coqui: {
    label: 'Coqui (Open Source)',
    voices: ['default', 'jenny', 'p273', 'ljspeech'],
    supportsSpeed: true,
    supportsPitch: true,
    supportsEmotion: false
  }
};

/**
 * Get available voices for a provider
 */
export async function getVoicesForProvider(provider) {
  const config = TTS_PROVIDERS[provider];
  if (!config) return [];
  return config.voices;
}

/**
 * Main TTS generation function
 * Returns audio URL ready for playback
 */
export async function generateAudio(provider, voiceId, text, settings = {}) {
  // Clean text
  const cleanText = text
    .replace(/[#*`🦕💠🦖🌟✨]/gu, '')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanText) {
    throw new Error('No text to synthesize');
  }

  const defaultSettings = {
    speed: 1.0,
    pitch: 1.0,
    naturalness: 0.8,
    volume: 1.0,
    bass: 0,
    treble: 0,
    mid: 0,
    warmth: 0.5,
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

  const finalSettings = { ...defaultSettings, ...settings, effects: { ...defaultSettings.effects, ...(settings.effects || {}) } };

  try {
    const response = await fetch('/.netlify/functions/textToSpeechOpenAI', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        text: cleanText,
        voiceProfile: voiceId || 'nova',
        speed: finalSettings.speed || 1.0
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error(`TTS Error:`, error);
    throw error;
  }
}



/**
 * StreamElements (Free fallback)
 */
function generateStreamElements(voice, text) {
  return `https://api.streamelements.com/kappa/v2/speech?voice=${voice || 'Matthew'}&text=${encodeURIComponent(text)}`;
}

/**
 * Apply audio effects using Web Audio API
 */
export function applyAudioEffects(audioElement, effects = {}) {
  if (!audioElement || !window.AudioContext) return;

  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaElementSource(audioElement);
    
    let currentNode = source;

    // Bass boost
    if (effects.bass && effects.bass !== 0) {
      const bassFilter = audioContext.createBiquadFilter();
      bassFilter.type = 'lowshelf';
      bassFilter.frequency.value = 200;
      bassFilter.gain.value = effects.bass;
      currentNode.connect(bassFilter);
      currentNode = bassFilter;
    }
    
    // Treble boost
    if (effects.treble && effects.treble !== 0) {
      const trebleFilter = audioContext.createBiquadFilter();
      trebleFilter.type = 'highshelf';
      trebleFilter.frequency.value = 3000;
      trebleFilter.gain.value = effects.treble;
      currentNode.connect(trebleFilter);
      currentNode = trebleFilter;
    }
    
    // Mid range
    if (effects.mid && effects.mid !== 0) {
      const midFilter = audioContext.createBiquadFilter();
      midFilter.type = 'peaking';
      midFilter.frequency.value = 1000;
      midFilter.Q.value = 1;
      midFilter.gain.value = effects.mid;
      currentNode.connect(midFilter);
      currentNode = midFilter;
    }
    
    // Volume/Gain
    if (effects.volume && effects.volume !== 1.0) {
      const gainNode = audioContext.createGain();
      gainNode.gain.value = effects.volume;
      currentNode.connect(gainNode);
      currentNode = gainNode;
    }
    
    currentNode.connect(audioContext.destination);
  } catch (error) {
    console.error('Audio effects error:', error);
  }
}

export default {
  TTS_PROVIDERS,
  getVoicesForProvider,
  generateAudio,
  applyAudioEffects
};