import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const rawKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!rawKey) return Response.json({ error: 'No PERPLEXITY_API_KEY set' }, { status: 500 });

    const apiKey = rawKey.replace(/[^\x20-\x7E]/g, '').trim();

    const debugInfo = {
      keyLength: apiKey.length,
      keyPrefix: apiKey.slice(0, 8),
      keySuffix: apiKey.slice(-6),
      hasSpaces: apiKey.includes(' '),
      hasNewlines: rawKey.includes('\n') || rawKey.includes('\r'),
      rawLength: rawKey.length
    };

    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'user', content: 'Hello, respond with one word.' }
        ],
        max_tokens: 10
      })
    });

    const status = res.status;
    const responseText = await res.text();

    return Response.json({
      debug: debugInfo,
      perplexityStatus: status,
      perplexityResponse: responseText.slice(0, 500)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});