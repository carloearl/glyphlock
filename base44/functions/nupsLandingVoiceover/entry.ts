// NUPS BUYER DEMO — FIXED PUBLIC VOICEOVER
// Public by design, but NOT a general-purpose TTS endpoint.
// Only six hard-coded narration scenes are available, preventing arbitrary API use.

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const SCENES = [
  "NUPS is the operating and evidence layer for high-verification venue commerce. Every transaction begins with a verified identity and a role-scoped operator.",
  "When GlyphLock controls the payment path, NUPS can process natively through Stripe and bind the authorization, contract, receipt, and audit record together.",
  "When a venue keeps its existing processor and terminal, NUPS sits above that transaction, capturing the processor reference and approval evidence without forcing a processor migration.",
  "Terms, initials, signatures, services, and approvals remain attached to the same transaction record, whether the payment came through Stripe or an outside processor.",
  "If a dispute arrives, NUPS retrieves the linked identity, agreement, payment reference, receipt, consent, and audit history for operator review and evidence assembly.",
  "One venue operating system. Two payment paths. One defensible transaction record. This is NUPS by GlyphLock."
] as const;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  if (req.method !== 'GET') {
    return Response.json({ error: 'GET only' }, { status: 405 });
  }

  if (!OPENAI_API_KEY) {
    return Response.json({ error: 'Voiceover service not configured' }, { status: 503 });
  }

  const url = new URL(req.url);
  const scene = Number.parseInt(url.searchParams.get('scene') || '0', 10);
  if (!Number.isInteger(scene) || scene < 0 || scene >= SCENES.length) {
    return Response.json({ error: 'Invalid scene' }, { status: 400 });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1-hd',
        voice: 'onyx',
        input: SCENES[scene],
        speed: 1.02,
        response_format: 'mp3'
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error('[nupsLandingVoiceover] OpenAI failure', response.status, detail.slice(0, 300));
      return Response.json({ error: 'Voiceover generation failed' }, { status: 502 });
    }

    const audio = await response.arrayBuffer();
    return new Response(audio, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(audio.byteLength),
        'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'X-NUPS-Voice': 'onyx',
        'X-NUPS-Scene': String(scene)
      }
    });
  } catch (error) {
    console.error('[nupsLandingVoiceover] fatal', error);
    return Response.json({ error: 'Voiceover unavailable' }, { status: 500 });
  }
});
