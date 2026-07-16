// GLYPHLOCK: OpenAI TTS - Premium Neural Voices
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

// Voice mapping: GlyphBot profiles → OpenAI voices
const VOICE_MAPPING = {
  neutral_female: 'nova',
  neutral_male: 'onyx',
  warm_female: 'shimmer',
  warm_male: 'echo',
  professional_female: 'alloy',
  professional_male: 'fable'
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!OPENAI_API_KEY) {
      return Response.json({ 
        error: 'OpenAI TTS not configured' 
      }, { status: 503 });
    }

    const { text, voiceProfile = 'neutral_female', speed = 1.0 } = await req.json();

    if (!text || typeof text !== 'string') {
      return Response.json({ error: 'Text is required' }, { status: 400 });
    }

    // Map profile to OpenAI voice
    const voice = VOICE_MAPPING[voiceProfile] || 'nova';
    
    // Normalize speed (OpenAI accepts 0.25 - 4.0)
    const normalizedSpeed = Math.max(0.25, Math.min(4.0, speed));

    console.log(`[OpenAI TTS] Generating audio: voice=${voice}, speed=${normalizedSpeed}, length=${text.length}`);

    // Call OpenAI TTS API
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'tts-1-hd', // Higher quality model
        input: text.slice(0, 4096), // Max 4096 chars per request
        voice,
        speed: normalizedSpeed,
        response_format: 'mp3'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[OpenAI TTS] Error:', error);
      return Response.json({ 
        error: `OpenAI TTS failed: ${response.status}` 
      }, { status: response.status });
    }

    // DACO DIRECTIVE 005 §3.1 — stream OpenAI audio through to the client.
    // Do NOT buffer the full file server-side; time-to-first-byte drops to
    // OpenAI's first chunk instead of full-generation time.
    console.log('[OpenAI TTS] Streaming audio response');

    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store'
      }
    });

  } catch (error) {
    console.error('[OpenAI TTS] Fatal error:', error);
    return Response.json({ 
      error: error.message || 'TTS generation failed' 
    }, { status: 500 });
  }
});