import { base44 } from '@/api/base44Client';

/**
 * TTS Service - Wrapper around textToSpeech backend function
 */

export async function generate(options) {
  try {
    console.log('[TTS] Generating with OpenAI TTS:', options);
    
    const response = await base44.functions.invoke('textToSpeechOpenAI', {
      text: options.text,
      voiceProfile: options.voiceProfile || 'neutral_female',
      speed: options.speed || 1.0
    });
    
    if (!response?.data) {
      throw new Error('No audio data received');
    }
    
    // Backend returns MP3 audio buffer - create blob URL
    const blob = new Blob([response.data], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(blob);
    
    console.log('[TTS] OpenAI audio generated successfully');
    
    return {
      success: true,
      audioUrl,
      provider: 'openai',
      voice: options.voiceProfile
    };
  } catch (error) {
    console.error('[TTS Service] OpenAI TTS failed:', error);
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