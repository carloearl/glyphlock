import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * QWEN TTS 3.5 INTEGRATION
 * Alibaba Qwen text-to-speech with emotion, multilingual support
 */

const QWEN_API_ENDPOINT = 'https://dashscope.aliyuncs.com/api/v1/services/audio/tts';

const VOICE_MAPPING = {
  'qwen-neutral-female': 'zhinv_emo',
  'qwen-neutral-male': 'zhiyu_emo',
  'qwen-warm-female': 'zhinv_emo',
  'qwen-energetic-female': 'zhimi_emo',
  'qwen-professional-male': 'zhiyan_emo',
  'qwen-friendly-male': 'zhiyu_emo',
  'qwen-narrative-female': 'zhinv_emo',
  'qwen-calm-male': 'zhitian_emo'
};

const EMOTION_MAPPING = {
  'neutral': 'neutral',
  'excited': 'happy',
  'calm': 'calm',
  'confident': 'serious',
  'friendly': 'warm',
  'professional': 'serious',
  'empathetic': 'warm'
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const {
      text,
      voice = 'qwen-neutral-female',
      speed = 1.0,
      emotion = 'neutral',
      pitch = 1.0,
      format = 'mp3'
    } = await req.json();

    if (!text) {
      return Response.json({ error: 'text required' }, { status: 400 });
    }

    // Get Qwen API key from environment
    const apiKey = Deno.env.get('QWEN_API_KEY');
    if (!apiKey) {
      return Response.json({ 
        error: 'QWEN_API_KEY not configured',
        fallback: true 
      }, { status: 500 });
    }

    const qwenVoice = VOICE_MAPPING[voice] || 'zhinv_emo';
    const qwenEmotion = EMOTION_MAPPING[emotion] || 'neutral';

    // Call Qwen TTS API
    const response = await fetch(QWEN_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'enable'
      },
      body: JSON.stringify({
        model: 'cosyvoice-v1',
        input: {
          text
        },
        parameters: {
          voice: qwenVoice,
          emotion: qwenEmotion,
          rate: speed,
          pitch: pitch,
          format: format
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Qwen TTS API error:', error);
      return Response.json({ 
        error: 'Qwen TTS failed',
        details: error 
      }, { status: response.status });
    }

    const data = await response.json();

    // Qwen returns task ID for async processing
    if (data.output?.task_id) {
      // Poll for result
      const audioData = await pollQwenTask(apiKey, data.output.task_id);
      
      if (!audioData) {
        return Response.json({ error: 'Task timeout' }, { status: 408 });
      }

      // Log usage
      await base44.asServiceRole.entities.AuditEvent.create({
        event_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        actor_id: 'system',
        actor_role: 'tts_service',
        entity_type: 'TTSUsage',
        action: 'QWEN_TTS_GENERATED',
        severity: 'INFO',
        description: `Qwen TTS: ${text.length} chars, voice=${voice}, emotion=${emotion}`
      });

      return new Response(audioData, {
        status: 200,
        headers: {
          'Content-Type': `audio/${format}`,
          'X-Provider': 'qwen',
          'X-Voice': voice,
          'X-Emotion': emotion
        }
      });
    }

    // Synchronous response (direct audio)
    if (data.output?.audio) {
      const audioBuffer = Uint8Array.from(atob(data.output.audio), c => c.charCodeAt(0));
      
      return new Response(audioBuffer, {
        status: 200,
        headers: {
          'Content-Type': `audio/${format}`,
          'X-Provider': 'qwen',
          'X-Voice': voice
        }
      });
    }

    return Response.json({ error: 'No audio returned' }, { status: 500 });

  } catch (error) {
    console.error('Qwen TTS error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function pollQwenTask(apiKey, taskId, maxAttempts = 10) {
  const pollUrl = `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`;
  
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
    
    const response = await fetch(pollUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) continue;

    const data = await response.json();
    
    if (data.output?.task_status === 'SUCCEEDED' && data.output?.audio_url) {
      // Fetch audio from URL
      const audioResponse = await fetch(data.output.audio_url);
      return await audioResponse.arrayBuffer();
    }
    
    if (data.output?.task_status === 'FAILED') {
      throw new Error('Qwen task failed');
    }
  }
  
  return null; // Timeout
}