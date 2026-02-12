import { base44 } from '@/api/base44Client';

/**
 * TTS Service - Wrapper around textToSpeech backend function
 */

export async function generate(options) {
  try {
    console.log('[TTS] Using OpenAI TTS with settings:', options);
    
    const user = await base44.auth.me();
    if (!user) throw new Error('Not authenticated');

    const appUrl = window.location.origin;
    const functionUrl = `${appUrl}/.netlify/functions/textToSpeechOpenAI`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        text: options.text,
        voiceProfile: options.voiceProfile || 'neutral_female',
        speed: options.speed || 1.0
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TTS failed: ${response.status} ${errorText}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    
    console.log('[TTS] OpenAI audio ready:', audioBlob.size, 'bytes');
    
    return {
      success: true,
      audioUrl,
      provider: 'openai',
      voice: options.voiceProfile
    };
  } catch (error) {
    console.error('[TTS] OpenAI failed:', error);
    return { 
      success: false, 
      error: error.message,
      audioUrl: null
    };
  }
}

export async function getProviders() {
  // Returns available TTS providers
  return ['openai', 'elevenlabs', 'google', 'microsoft', 'coqui', 'streamelements'];
}

export async function testProvider(provider, voice) {
  const testText = "Hello, this is a voice test.";
  return await generate({
    text: testText,
    provider,
    voice,
    speed: 1.0,
    pitch: 1.0
  });
}

function generateFallbackUrl(text, voice = 'Matthew') {
  // NO WEB SPEECH API FALLBACK - force proper TTS only
  return null;
}

export default { generate, getProviders, testProvider };