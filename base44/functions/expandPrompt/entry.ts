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

    // Use Base44's InvokeLLM as fallback for prompt expansion
    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert image generation prompt engineer. Expand the following short prompt into a detailed description for AI image generation.

Original prompt: "${prompt}"

Provide:
1. A detailed natural language prompt (200-300 words) with visual details, mood, style, lighting, composition
2. A structured breakdown: subject, style, lighting, camera, realism, mood, technical_details
3. Negative constraints (things to avoid)

Return ONLY valid JSON:
{
  "expanded_prompt": "detailed prompt",
  "structured_spec": {
    "subject": "...",
    "style": "...",
    "lighting": "...",
    "camera": "...",
    "realism": "...",
    "mood": "...",
    "technical_details": "..."
  },
  "negative_constraints": ["blurry", "low quality", "watermark"]
}`,
      response_json_schema: {
        type: "object",
        properties: {
          expanded_prompt: { type: "string" },
          structured_spec: {
            type: "object",
            properties: {
              subject: { type: "string" },
              style: { type: "string" },
              lighting: { type: "string" },
              camera: { type: "string" },
              realism: { type: "string" },
              mood: { type: "string" },
              technical_details: { type: "string" }
            }
          },
          negative_constraints: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    const expansion = llmResponse;

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