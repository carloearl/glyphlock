// GLYPHLOCK: Advanced TTS - Granular Voice Control
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

// Enhanced voice profiles with fine-tuned parameters
const ADVANCED_VOICES = {
  nova: { base: 'nova', warmth: 0.8, clarity: 0.9, energy: 0.7 },
  shimmer: { base: 'shimmer', warmth: 0.9, clarity: 0.8, energy: 0.8 },
  echo: { base: 'echo', warmth: 0.7, clarity: 0.85, energy: 0.6 },
  alloy: { base: 'alloy', warmth: 0.6, clarity: 0.95, energy: 0.75 },
  fable: { base: 'fable', warmth: 0.85, clarity: 0.75, energy: 0.9 },
  onyx: { base: 'onyx', warmth: 0.7, clarity: 0.9, energy: 0.65 }
};

// Emotion-to-parameter mapping
const EMOTION_PRESETS = {
  excited: { speed: 1.25, pitch_shift: 0.15, energy_boost: 0.2 },
  calm: { speed: 0.85, pitch_shift: -0.1, energy_boost: -0.15 },
  confident: { speed: 1.0, pitch_shift: -0.05, energy_boost: 0.1 },
  friendly: { speed: 1.1, pitch_shift: 0.08, energy_boost: 0.15 },
  professional: { speed: 0.95, pitch_shift: 0, energy_boost: 0 },
  empathetic: { speed: 0.9, pitch_shift: -0.08, energy_boost: -0.1 }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!OPENAI_API_KEY) {
      return Response.json({ error: 'OpenAI TTS not configured' }, { status: 503 });
    }

    const { 
      text,
      provider = 'openai',
      voice = 'nova',
      speed = 1.0,
      emotion = null,
      breathiness = 0.5,
      vocalFry = 0.3,
      customSpeed = null,
      context = 'general'
    } = await req.json();

    if (!text || typeof text !== 'string') {
      return Response.json({ error: 'Text is required' }, { status: 400 });
    }

    // Route to Qwen TTS if provider is qwen
    if (provider === 'qwen') {
      const qwenResponse = await base44.asServiceRole.functions.invoke('qwenTTS', {
        text,
        voice,
        speed: customSpeed || speed,
        emotion: emotion || 'neutral',
        pitch: 1.0
      });
      
      if (qwenResponse.status === 200) {
        return qwenResponse;
      }
      // Fallback to OpenAI if Qwen fails
      console.warn('Qwen TTS failed, falling back to OpenAI');
    }

    // Apply emotion preset if specified
    let finalSpeed = customSpeed || speed;
    if (emotion && EMOTION_PRESETS[emotion]) {
      finalSpeed *= EMOTION_PRESETS[emotion].speed;
    }

    // Clamp speed to OpenAI limits
    finalSpeed = Math.max(0.25, Math.min(4.0, finalSpeed));

    // Add SSML-like modulation hints (as text preprocessing)
    let processedText = text;
    
    // Add natural pauses based on breathiness
    if (breathiness > 0.6) {
      processedText = processedText.replace(/\. /g, '... ');
      processedText = processedText.replace(/\? /g, '?.. ');
    }

    // Add emphasis based on vocal fry (lowered pitch cues)
    if (vocalFry > 0.6) {
      processedText = processedText.replace(/\b(really|very|absolutely|definitely)\b/gi, '$1,');
    }

    console.log(`[Advanced TTS] voice=${voice}, speed=${finalSpeed.toFixed(2)}, emotion=${emotion || 'none'}, context=${context}`);

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'tts-1-hd',
        input: processedText.slice(0, 4096),
        voice: ADVANCED_VOICES[voice]?.base || voice,
        speed: finalSpeed,
        response_format: 'mp3'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Advanced TTS] Error:', error);
      return Response.json({ error: `TTS failed: ${response.status}` }, { status: response.status });
    }

    const audioBuffer = await response.arrayBuffer();

    console.log(`[Advanced TTS] Generated ${audioBuffer.byteLength} bytes`);

    // Store voice profile analytics
    await base44.asServiceRole.entities.VoiceProfile.create({
      user_id: user.email,
      voice,
      speed: finalSpeed,
      emotion,
      breathiness,
      vocalFry,
      context,
      text_length: text.length,
      audio_size: audioBuffer.byteLength
    }).catch(err => console.warn('Failed to log voice analytics:', err));

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=86400',
        'X-Voice-Profile': voice,
        'X-Emotion': emotion || 'neutral',
        'X-Speed': finalSpeed.toString()
      }
    });

  } catch (error) {
    console.error('[Advanced TTS] Fatal error:', error);
    return Response.json({ error: error.message || 'TTS failed' }, { status: 500 });
  }
});