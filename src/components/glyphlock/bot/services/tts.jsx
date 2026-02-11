import { base44 } from '@/api/base44Client';

/**
 * TTS Service - Wrapper around textToSpeech backend function
 */

export async function generate(options) {
  try {
    console.log('[TTS] Invoking backend with options:', options);
    const response = await base44.functions.invoke('textToSpeechOpenAI', {
      text: options.text,
      voice: options.voice || 'alloy',
      speed: options.speed || 1.0
    });
    
    console.log('[TTS] Backend response:', response);
    
    if (response?.data?.audioUrl) {
      return {
        success: true,
        audioUrl: response.data.audioUrl,
        provider: 'openai'
      };
    }
    
    throw new Error('No audio URL in response');
  } catch (error) {
    console.error('[TTS Service] Error:', error);
    return { 
      success: false, 
      error: error.message,
      fallback: true,
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