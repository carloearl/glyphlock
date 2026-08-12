import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

/**
 * archiveAudioSearch — keyless music search via the Internet Archive.
 *
 * No API key required. Returns full-length, directly streamable MP3 URLs for
 * public-domain / Creative Commons audio items.
 *
 * POST { query: string, maxResults?: number, kiosk_session?: string }
 * → { items: [{ id, title, artist, stream_url, page_url }], count }
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    let authorized = false;
    const user = await base44.auth.me().catch(() => null);
    if (user) authorized = true;

    if (!authorized && body?.kiosk_session) {
      try {
        const validationResponse = await base44.functions.invoke('nupsClockIn', {
          action: 'validateSession',
          kiosk_session: body.kiosk_session,
          allowed_roles: ['DJ'],
        });
        const validation = validationResponse?.data || validationResponse || {};
        authorized = validation.valid === true;
      } catch (_) {
        authorized = false;
      }
    }

    if (!authorized) {
      return Response.json({ error: 'NUPS DJ session or Base44 login required.' }, { status: 401 });
    }

    const query = String(body?.query || '').trim();
    if (!query) return Response.json({ error: 'Query is required' }, { status: 400 });

    const maxResults = Math.min(Math.max(parseInt(body?.maxResults) || 10, 1), 20);

    const searchParams = new URLSearchParams({
      q: `${query} AND mediatype:(audio)`,
      'fl[]': 'identifier',
      rows: String(maxResults),
      page: '1',
      output: 'json',
    });
    searchParams.append('fl[]', 'title');
    searchParams.append('fl[]', 'creator');

    const searchRes = await fetch(
      `https://archive.org/advancedsearch.php?${searchParams.toString()}`,
      { signal: AbortSignal.timeout(12000) }
    );
    if (!searchRes.ok) {
      return Response.json({ error: `Archive search HTTP ${searchRes.status}` }, { status: 502 });
    }
    const searchData = await searchRes.json();
    const docs = searchData?.response?.docs || [];

    // Resolve the first playable MP3 inside each item.
    const items = [];
    for (const doc of docs) {
      const identifier = doc?.identifier;
      if (!identifier) continue;
      try {
        const metaRes = await fetch(`https://archive.org/metadata/${identifier}`, {
          signal: AbortSignal.timeout(8000),
        });
        if (!metaRes.ok) continue;
        const meta = await metaRes.json();
        const audio = (meta?.files || []).find((f: any) =>
          /\.(mp3|ogg|m4a)$/i.test(String(f?.name || ''))
        );
        if (!audio) continue;
        items.push({
          id: `${identifier}/${audio.name}`,
          title: String(doc.title || identifier).slice(0, 120),
          artist: Array.isArray(doc.creator)
            ? doc.creator[0]
            : String(doc.creator || 'Internet Archive'),
          stream_url: `https://archive.org/download/${identifier}/${encodeURIComponent(audio.name)}`,
          page_url: `https://archive.org/details/${identifier}`,
        });
      } catch (_) {
        continue;
      }
    }

    return Response.json({ items, count: items.length });
  } catch (error) {
    return Response.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
});