// GLYPHLOCK VOICE SYSTEM - CANONICAL TTS BACKEND
// Single source of truth for all text-to-speech generation
// Uses OpenAI TTS-1-HD exclusively

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

// Voice mapping: GlyphBot profiles → OpenAI voices
const VOICE_MAPPING = {
  neutral_female: 'nova',
  neutral_male: 'onyx',
  warm_female: 'shimmer',
  warm_male: 'echo',
  professional_female: 'alloy',
  professional_male: 'fable',
  // Direct OpenAI voices also supported
  nova: 'nova',
  shimmer: 'shimmer',
  echo: 'echo',
  alloy: 'alloy',
  fable: 'fable',
  onyx: 'onyx'
};

Deno.serve(async (req) => {
  console.log('GLYPH VOICE BACKEND: function invoked');

  // Auth check — isolated so failures return 401, not 500
  let user;
  try {
    const base44 = createClientFromRequest(req);
    user = await base44.auth.me();
  } catch (authErr) {
    console.error('GLYPH VOICE BACKEND: auth failed', authErr.message);
    return Response.json({ success: false, error: 'Authentication required' }, { status: 401 });
  }

  if (!user) {
    console.error('GLYPH VOICE BACKEND: unauthorized - no user');
    return Response.json({ success: false, error: 'Authentication required' }, { status: 401 });
  }

  try {
    if (!OPENAI_API_KEY) {
      console.error('GLYPH VOICE BACKEND: OpenAI API key not configured');
      return Response.json({ 
        success: false,
        error: 'Voice system not configured - missing API key' 
      }, { status: 503 });
    }

    const { text, voice = 'nova', speed = 1.0, emotion = 'neutral' } = await req.json();

    if (!text || typeof text !== 'string') {
      console.error('GLYPH VOICE BACKEND: invalid input - no text');
      return Response.json({ success: false, error: 'Text is required' }, { status: 400 });
    }

    // Clean text
    const cleanText = text
      .replace(/[#*`🦕💠🦖🌟✨🔒⚡️💡🛡️•]/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .slice(0, 4096)
      .trim();

    if (!cleanText) {
      console.error('GLYPH VOICE BACKEND: text empty after cleaning');
      return Response.json({ success: false, error: 'No valid text to speak' }, { status: 400 });
    }

    // PHASE 3: Emotion-aware prompt engineering
    // OpenAI TTS-1-HD responds to bracketed stage directions in the input text
    const EMOTION_INSTRUCTIONS = {
      neutral: '',
      excited: '[Speaking with excitement and energy] ',
      calm: '[Speaking in a calm, soothing tone] ',
      confident: '[Speaking with authority and confidence] ',
      friendly: '[Speaking warmly and cheerfully] ',
      professional: '[Speaking in a formal, professional manner] ',
      empathetic: '[Speaking with empathy and understanding] ',
      energetic: '[Speaking with high energy and enthusiasm] ',
      authoritative: '[Speaking with commanding authority] ',
      whisper: '[Speaking softly in a whisper] ',
      intense: '[Speaking with intensity and urgency] '
    };
    const emotionPrefix = EMOTION_INSTRUCTIONS[emotion] || '';
    const finalText = (emotionPrefix + cleanText).slice(0, 4096);

    // Map profile to OpenAI voice
    const openaiVoice = VOICE_MAPPING[voice] || voice || 'nova';
    const normalizedSpeed = Math.max(0.25, Math.min(4.0, speed));

    console.log(`GLYPH VOICE BACKEND: calling OpenAI | voice=${openaiVoice} speed=${normalizedSpeed} emotion=${emotion} length=${finalText.length}`);

    // Call OpenAI TTS API
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'tts-1-hd',
        input: finalText,
        voice: openaiVoice,
        speed: normalizedSpeed,
        response_format: 'mp3'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GLYPH VOICE BACKEND: OpenAI error', response.status, errorText);
      return Response.json({ 
        success: false,
        error: `OpenAI TTS failed: ${response.status}`,
        details: errorText
      }, { status: response.status });
    }

    const audioBuffer = await response.arrayBuffer();
    const bytes = audioBuffer.byteLength;

    console.log(`GLYPH VOICE BACKEND: OpenAI response received | bytes=${bytes}`);

    // Encode as base64 JSON to avoid binary corruption through SDK
    const uint8 = new Uint8Array(audioBuffer);
    let binary = '';
    for (let i = 0; i < uint8.length; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    const base64Audio = btoa(binary);

    console.log(`GLYPH VOICE BACKEND: returning base64 audio | success=true bytes=${bytes} base64Length=${base64Audio.length}`);

    return Response.json({
      success: true,
      audio_base64: base64Audio,
      content_type: 'audio/mpeg',
      bytes: bytes,
      voice: openaiVoice
    });

  } catch (error) {
    console.error('GLYPH VOICE BACKEND: fatal error', error.message);
    return Response.json({ 
      success: false,
      error: error.message || 'TTS generation failed' 
    }, { status: 500 });
  }
});