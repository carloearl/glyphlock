import { base44 } from '@/api/base44Client';

/**
 * TTS Service - Wrapper around textToSpeech backend function
 */

export async function generate(options) {
  try {
    const response = await base44.functions.invoke('textToSpeech', options);
    return response.data;
  } catch (error) {
    console.error('[TTS Service] Error:', error);
    return { 
      success: false, 
      error: error.message,
      fallback: true,
      audioUrl: generateFallbackUrl(options.text, options.voice)
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
  return `https://api.streamelements.com/kappa/v2/speech?voice=${voice}&text=${encodeURIComponent(text)}`;
}

export default { generate, getProviders, testProvider };