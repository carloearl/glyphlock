import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * musicSearch — Searches for free/CC-licensed music via the Free Music Archive (Jamendo) API
 * and returns playable audio URLs with metadata.
 * 
 * POST payload: { query: string, limit?: number }
 * Returns: { tracks: [{ id, title, artist, duration, audio_url, image_url }] }
 */

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

    // Use Jamendo API (free, no key required for basic search, CC-licensed music)
    const jamendoUrl = `https://api.jamendo.com/v3.0/tracks/?client_id=b6747d04&format=json&limit=${limit}&namesearch=${encodeURIComponent(query)}&include=musicinfo&audioformat=mp32`;
    
    const response = await fetch(jamendoUrl);
    
    if (!response.ok) {
      // Fallback: use Free Music Archive search
      const fmaUrl = `https://freemusicarchive.org/api/get/tracks.json?api_key=60BLHNQCAOUFPIBZ&search=${encodeURIComponent(query)}&limit=${limit}`;
      const fmaRes = await fetch(fmaUrl);
      
      if (!fmaRes.ok) {
        return Response.json({ 
          tracks: [],
          message: 'Music search temporarily unavailable' 
        });
      }
      
      const fmaData = await fmaRes.json();
      const tracks = (fmaData.dataset || []).map(t => ({
        id: String(t.track_id),
        title: t.track_title || 'Unknown',
        artist: t.artist_name || 'Unknown Artist',
        duration: parseInt(t.track_duration) || 0,
        audio_url: t.track_file || t.track_listen_url || '',
        image_url: t.track_image_file || '',
        license: t.license_title || 'CC',
      })).filter(t => t.audio_url);
      
      return Response.json({ tracks });
    }

    const data = await response.json();
    
    const tracks = (data.results || []).map(t => ({
      id: String(t.id),
      title: t.name || 'Unknown',
      artist: t.artist_name || 'Unknown Artist',
      duration: parseInt(t.duration) || 0,
      audio_url: t.audio || t.audiodownload || '',
      image_url: t.image || t.album_image || '',
      license: t.license_ccurl || 'CC',
      album: t.album_name || '',
    })).filter(t => t.audio_url);

    return Response.json({ tracks });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});