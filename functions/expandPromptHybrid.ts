import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { GeminiAnalysisProvider } from './providers/geminiAnalysisProvider.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, opts = {} } = await req.json();
    if (!prompt || prompt.trim().length < 3) {
      return Response.json({ error: 'Prompt too short' }, { status: 400 });
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    const provider = new GeminiAnalysisProvider(apiKey);
    const expansion = await provider.expandPrompt(prompt);

    // Create PromptSpec entity
    const promptSpec = await base44.entities.PromptSpec.create({
      original_prompt: prompt,
      expanded_prompt: expansion.expanded_prompt,
      structured_spec: expansion.structured_spec,
      negative_constraints: expansion.negative_constraints || [],
      generation_parameters: {
        seed: opts.seed || Math.floor(Math.random() * 2147483647),
        delta_strength: opts.delta_strength || 0.5,
        steps: opts.steps || 30,
        guidance_scale: opts.guidance_scale || 7.5
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