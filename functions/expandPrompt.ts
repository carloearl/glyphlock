import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt } = await req.json();
    if (!prompt || prompt.trim().length < 3) {
      return Response.json({ error: 'Prompt too short' }, { status: 400 });
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    // Use Gemini via REST API directly
    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    
    const expansionPrompt = `You are an expert image generation prompt engineer. Expand the following short prompt into:
1. A detailed natural language prompt (200-300 words) that captures visual details, mood, style, lighting, and composition
2. A structured specification with these exact fields: subject, style, lighting, camera, realism, mood, technical_details
3. A list of negative constraints (things to avoid)

Original prompt: "${prompt}"

Return ONLY valid JSON in this exact format:
{
  "expanded_prompt": "detailed natural language prompt here",
  "structured_spec": {
    "subject": "description",
    "style": "art style or aesthetic",
    "lighting": "lighting setup",
    "camera": "camera angle and lens",
    "realism": "photorealistic, stylized, etc",
    "mood": "emotional tone",
    "technical_details": "resolution, quality markers"
  },
  "negative_constraints": ["constraint1", "constraint2", "constraint3"]
}`;

    const response = await fetch(`${endpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: expansionPrompt }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse expansion response');
    }
    
    const expansion = JSON.parse(jsonMatch[0]);

    // Create PromptSpec entity
    const promptSpec = await base44.entities.PromptSpec.create({
      original_prompt: prompt,
      expanded_prompt: expansion.expanded_prompt,
      structured_spec: expansion.structured_spec,
      negative_constraints: expansion.negative_constraints || [],
      generation_parameters: {
        seed: Math.floor(Math.random() * 2147483647),
        delta_strength: 0.5,
        steps: 30,
        guidance_scale: 7.5
      }
    });

    // Audit
    await base44.entities.ImageGenAudit.create({
      action_type: 'prompt_expansion',
      user_id: user.email,
      status: 'success',
      metadata: {
        prompt_spec_id: promptSpec.id,
        original_length: prompt.length,
        expanded_length: expansion.expanded_prompt.length
      }
    });

    return Response.json({
      prompt_spec_id: promptSpec.id,
      expansion
    });

  } catch (error) {
    console.error('Prompt expansion error:', error);
    return Response.json({ 
      error: 'Prompt expansion failed',
      details: error.message 
    }, { status: 500 });
  }
});