import { base44 } from '@/api/base44Client';

export async function synthesizeTTS(text, options = {}) {
  try {
    const response = await fetch('/.netlify/functions/textToSpeechOpenAI', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        text,
        voiceProfile: options.voice || 'nova',
        speed: options.speed || 1.0
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.arrayBuffer();
  } catch (error) {
    console.error('[TTS Client] Failed:', error);
    throw error;
  }
}

export default { synthesizeTTS };