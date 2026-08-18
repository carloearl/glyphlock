import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * musicSearch — Searches for free/CC-licensed music via Jamendo public API
 * Falls back to LLM-curated results if Jamendo is unavailable.
 * 
 * POST payload: { query: string, limit?: number }
 * Returns: { tracks: [{ id, title, artist, duration, audio_url, image_url, album, genre }] }
 */

// Jamendo public API client ID — free tier, no secret needed
const JAMENDO_CLIENT_ID = "2c9a11b4";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const query = body.query || '';
    const limit = Math.min(body.limit || 20, 50);

    if (!query.trim()) {
      return Response.json({ error: 'Query is required' }, { status: 400 });
    }

    // Try Jamendo API first — real free music with real audio
    try {
      const jamendoUrl = `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=${limit}&search=${encodeURIComponent(query)}&include=musicinfo&audioformat=mp32`;
      
      const jamRes = await fetch(jamendoUrl, { signal: AbortSignal.timeout(8000) });
      
      if (jamRes.ok) {
        const jamData = await jamRes.json();
        
        if (jamData.results && jamData.results.length > 0) {
          const tracks = jamData.results.map(t => ({
            id: `jam-${t.id}`,
            title: t.name || 'Unknown Title',
            artist: t.artist_name || 'Unknown Artist',
            album: t.album_name || '',
            duration: parseInt(t.duration) || 0,
            audio_url: t.audio || t.audiodownload || '',
            image_url: t.album_image || t.image || '',
            genre: t.musicinfo?.tags?.genres?.[0] || '',
            license: `Jamendo — ${t.license_ccurl || 'CC'}`,
            source: 'jamendo',
          }));

          return Response.json({ tracks, source: 'jamendo' });
        }
      }
    } catch (jamErr) {
      // Jamendo failed or timed out — fall through to LLM fallback
      console.log('Jamendo API unavailable, using LLM fallback:', jamErr.message);
    }

    // Fallback: Use LLM to generate realistic track listings
    // Each track uses a numbered SoundHelix sample — we label them honestly
    const llmResult = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a music librarian. A user searched for: "${query}".
Return exactly ${limit} track entries. These will be paired with royalty-free sample audio loops (SoundHelix), so label them as sample/demo tracks.

CRITICAL RULES:
- title MUST be descriptive of the mood/genre matching the query (e.g. "Chill Lo-Fi Beat #3", "Deep House Groove")
- artist MUST be "SoundHelix Library" for all tracks (since the audio comes from SoundHelix samples)
- For audio_url, use exactly: https://www.soundhelix.com/examples/mp3/SoundHelix-Song-{N}.mp3 where {N} is 1-16
- Vary the N numbers across tracks
- duration should be between 180-420 seconds
- genre should match the search query
- For image_url use: https://picsum.photos/seed/{title-slug}/300/300`,
      response_json_schema: {
        type: "object",
        properties: {
          tracks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                artist: { type: "string" },
                duration: { type: "integer" },
                audio_url: { type: "string" },
                image_url: { type: "string" },
                album: { type: "string" },
                genre: { type: "string" },
              },
              required: ["id", "title", "artist", "duration", "audio_url"]
            }
          }
        },
        required: ["tracks"]
      }
    });

    const tracks = (llmResult?.tracks || []).map(t => ({
      ...t,
      license: "Royalty-Free Sample",
      source: 'sample-library',
    }));

    return Response.json({ tracks, source: 'sample-library' });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});