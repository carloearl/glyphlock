/**
 * COQUI TTS BACKEND INTEGRATION
 * Proxies requests to self-hosted Coqui TTS server
 * Requires COQUI_TTS_URL secret to be set
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, speaker_wav = null } = await req.json();

    if (!text || text.length === 0 || text.length > 500) {
      return Response.json({ 
        error: 'Text must be between 1-500 characters' 
      }, { status: 400 });
    }

    // Get Coqui TTS server URL from environment
    const coquiUrl = Deno.env.get('COQUI_TTS_URL');
    if (!coquiUrl) {
      return Response.json({ 
        error: 'COQUI_TTS_URL not configured',
        fallback: true 
      }, { status: 500 });
    }

    // Call Coqui TTS server
    const response = await fetch(`${coquiUrl}/speak`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        speaker_wav
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Coqui TTS API error:', error);
      return Response.json({ 
        error: 'TTS generation failed',
        details: error.detail 
      }, { status: response.status });
    }

    const data = await response.json();

    if (!data.audio_url) {
      return Response.json({ error: 'No audio URL returned' }, { status: 500 });
    }

    // Fetch the actual audio file
    const audioResponse = await fetch(`${coquiUrl}${data.audio_url}`);
    
    if (!audioResponse.ok) {
      return Response.json({ error: 'Failed to fetch audio' }, { status: 500 });
    }

    const audioBuffer = await audioResponse.arrayBuffer();

    // Log usage
    await base44.asServiceRole.entities.AuditEvent.create({
      event_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      actor_id: user.email,
      actor_role: user.role,
      entity_type: 'TTSUsage',
      action: 'COQUI_TTS_GENERATED',
      severity: 'INFO',
      description: `Coqui TTS: ${text.length} chars`
    });

    // Return audio file
    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'X-Provider': 'coqui',
        'X-Text-Length': text.length.toString()
      }
    });

  } catch (error) {
    console.error('Coqui TTS error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});