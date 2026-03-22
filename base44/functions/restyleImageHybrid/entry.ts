import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { ImageGenerationProvider } from './providers/imageGenerationProvider.js';
import { GeminiAnalysisProvider } from './providers/geminiAnalysisProvider.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      inputImageUrl,
      promptSpec,
      references = [],
      params = {}
    } = await req.json();

    if (!inputImageUrl) {
      return Response.json({ error: 'inputImageUrl required' }, { status: 400 });
    }
    if (!promptSpec) {
      return Response.json({ error: 'promptSpec required' }, { status: 400 });
    }

    // Rate limit
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const recentGens = await base44.entities.ImageGenAudit.filter({
      user_id: user.email,
      action_type: { $in: ['generate', 'regenerate', 'restyle', 'reinterpret'] },
      created_date: { $gte: oneHourAgo }
    });
    if (recentGens.length >= 20) {
      return Response.json({ error: 'Rate limit: 20 generations/hour' }, { status: 429 });
    }

    const engine = Deno.env.get('IMAGE_GEN_ENGINE') || 'base44';
    const engineApiKey = Deno.env.get('IMAGE_GEN_API_KEY');
    
    if (engine !== 'base44' && !engineApiKey) {
      return Response.json({ error: `${engine.toUpperCase()}_API_KEY not configured` }, { status: 500 });
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    const geminiProvider = new GeminiAnalysisProvider(geminiKey);
    const imageProvider = new ImageGenerationProvider(engine, engineApiKey, base44);

    let finalPrompt = promptSpec.expanded_prompt;
    if (references.length > 0) {
      const features = blendFeatures(references);
      finalPrompt += `\n\nStyle: ${features.visual_mood}. Colors: ${features.color_palette.join(', ')}.`;
    }

    const deltaStrength = params.delta_strength || 0.7;
    const generationSeed = params.seed || Math.floor(Math.random() * 2147483647);

    // Restyle with validation
    const attempts = [];
    let bestAttempt = null;

    for (let attemptNum = 1; attemptNum <= 3; attemptNum++) {
      try {
        const { image_url, metadata } = await imageProvider.imageToImage(inputImageUrl, finalPrompt, {
          delta_strength: deltaStrength,
          seed: generationSeed + (attemptNum - 1),
          guidance_scale: params.guidance_scale || 7.5
        });

        const validationScores = await geminiProvider.validateGeneratedImage(image_url);

        const attempt = {
          attempt: attemptNum,
          seed: generationSeed + (attemptNum - 1),
          image_url,
          validation_scores: validationScores,
          status: validationScores.overall >= 0.7 ? 'success' : 'retry',
          timestamp: new Date().toISOString(),
          engine,
          metadata
        };

        attempts.push(attempt);

        if (validationScores.overall >= 0.7) {
          bestAttempt = attempt;
          break;
        }

        bestAttempt = attempt;

      } catch (error) {
        attempts.push({
          attempt: attemptNum,
          seed: generationSeed + (attemptNum - 1),
          status: 'error',
          error_message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    if (!bestAttempt) {
      bestAttempt = attempts[attempts.length - 1];
    }

    // Create new InteractiveImage for restyled version
    const imageData = {
      name: `Restyled: ${promptSpec.original_prompt.substring(0, 50)}`,
      fileUrl: bestAttempt.image_url,
      prompt: promptSpec.original_prompt,
      style: promptSpec.structured_spec?.style || 'default',
      generationSettings: {
        aspectRatio: params.aspect_ratio || '1:1',
        modelStrength: params.model_strength || 70,
        qualityMode: params.quality_mode || 'Standard',
        negativePrompt: params.negative_prompt || '',
        seed: generationSeed,
        deltaStrength,
        engine
      },
      reference_image_ids: references.map(r => r.id),
      prompt_spec_id: promptSpec.id,
      generation_history: attempts,
      final_image_url: bestAttempt.image_url,
      generation_seed: generationSeed,
      status: 'draft',
      source: 'generated',
      ownerEmail: user.email
    };

    const interactiveImage = await base44.entities.InteractiveImage.create(imageData);

    // Create attempt records
    for (const attempt of attempts) {
      await base44.entities.ImageGenAttempt.create({
        interactive_image_id: interactiveImage.id,
        attempt_number: attempt.attempt,
        engine: attempt.engine || engine,
        seed: attempt.seed,
        status: attempt.status,
        input_params: { ...params, delta_strength: deltaStrength, input_image_url: inputImageUrl },
        validation_scores: attempt.validation_scores || {},
        output_url: attempt.image_url || null,
        error_message: attempt.error_message || null
      });
    }

    // Audit
    await base44.entities.ImageGenAudit.create({
      image_id: interactiveImage.id,
      action_type: 'restyle',
      user_id: user.email,
      attempt_number: attempts.length,
      validation_scores: bestAttempt.validation_scores || {},
      status: bestAttempt.status === 'success' ? 'success' : 'retry',
      metadata: {
        seed: generationSeed,
        delta_strength: deltaStrength,
        engine,
        input_image_url: inputImageUrl
      }
    });

    return Response.json({
      image_id: interactiveImage.id,
      image_url: bestAttempt.image_url,
      attempts,
      best_attempt: bestAttempt,
      seed: generationSeed,
      engine
    });

  } catch (error) {
    console.error('Restyle error:', error);
    return Response.json({ 
      error: 'Restyle failed',
      details: error.message 
    }, { status: 500 });
  }
});

function blendFeatures(references) {
  const allColors = references.flatMap(ref => ref.extracted_features?.color_palette || []);
  const moods = references.map(ref => ref.extracted_features?.visual_mood || 'neutral');
  
  return {
    color_palette: allColors.slice(0, 5),
    visual_mood: moods[0] || 'neutral'
  };
}