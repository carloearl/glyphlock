export async function generate(options) {
  try {
    const response = await fetch('/.netlify/functions/textToSpeechOpenAI', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        text: options.text,
        voiceProfile: options.voiceProfile || 'neutral_female',
        speed: options.speed || 1.0
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    
    audio.load();
    await audio.play();
    audio.onended = () => URL.revokeObjectURL(url);
    
    return { success: true, audioUrl: url, provider: 'openai', voice: options.voiceProfile };
  } catch (error) {
    console.error('[TTS] Failed:', error);
    return { success: false, error: error.message, audioUrl: null };
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