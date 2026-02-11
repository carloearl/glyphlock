import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, size = '1024x1024', quality = 'standard' } = await req.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      return Response.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // Call OpenAI DALL-E 3
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt.substring(0, 4000),
        n: 1,
        size: size,
        quality: quality
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return Response.json({ 
        error: errorData.error?.message || 'Image generation failed',
        details: errorData
      }, { status: response.status });
    }

    const data = await response.json();
    
    return Response.json({ 
      url: data.data[0].url,
      revised_prompt: data.data[0].revised_prompt
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return Response.json({ 
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
});