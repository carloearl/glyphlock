import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { GeminiAnalysisProvider } from './providers/geminiAnalysisProvider.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageUrl, rules = {} } = await req.json();
    if (!imageUrl) {
      return Response.json({ error: 'imageUrl required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    const provider = new GeminiAnalysisProvider(apiKey);
    const scores = await provider.validateGeneratedImage(imageUrl);

    // Apply identity similarity check if rules.identity_threshold provided
    if (rules.identity_threshold && rules.reference_face_embedding) {
      // Placeholder: in production, use actual face recognition API
      scores.identity_similarity = 0.85;
    }

    return Response.json({ scores });

  } catch (error) {
    console.error('Validation error:', error);
    return Response.json({ 
      error: 'Validation failed',
      details: error.message 
    }, { status: 500 });
  }
});