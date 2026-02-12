/**
 * GlyphBot TTS Client - Phase 7.1
 * Handles OpenAI TTS API communication via backend proxy
 */

import { base44 } from '@/api/base44Client';

/**
 * Synthesize speech using OpenAI TTS via backend function
 * @param {string} text - Text to synthesize
 * @param {Object} settings - TTS settings (voice, speed, emotion)
 * @returns {Promise<ArrayBuffer>} Audio data
 */
export async function synthesizeTTS(text, settings = {}) {
  if (!text || typeof text !== 'string') {
    throw new Error('[TTS Client] Invalid text provided');
  }

  // Extract settings
  const voice = settings.voice || 'alloy';
  const speed = Math.max(0.25, Math.min(4.0, settings.speed || 1.0));
  const emotion = settings.emotion || 'neutral';

  console.log('[TTS Client] Synthesizing:', { voice, speed, emotion, textLength: text.length });

  try {
    const response = await fetch('/.netlify/functions/textToSpeechOpenAI', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ text, voiceProfile: voice || 'nova', speed: speed || 1.0 })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const audioData = await response.arrayBuffer();
    console.log('[TTS Client] Audio fetched:', audioData.byteLength, 'bytes');
    
    return audioData;

  } catch (error) {
    console.error('[TTS Client] Failed:', error);
    throw new Error(`TTS failed: ${error.message}`);
  }
}

/**
 * Test if TTS backend is available
 * @returns {Promise<boolean>}
 */
export async function testTTSAvailability() {
  try {
    await synthesizeTTS('Test', { voice: 'nova', speed: 1.0 });
    return true;
  } catch (error) {
    console.warn('[TTS Client] TTS backend not available:', error.message);
    return false;
  }
}