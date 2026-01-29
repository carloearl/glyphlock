import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { GeminiAnalysisProvider } from './providers/geminiAnalysisProvider.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageUrl, opts = {} } = await req.json();
    if (!imageUrl) {
      return Response.json({ error: 'imageUrl required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    const provider = new GeminiAnalysisProvider(apiKey);
    const { features, image_hash } = await provider.extractImageFeatures(
      imageUrl,
      opts.enable_identity_lock || false
    );

    // Check for face if identity lock requested
    if (opts.enable_identity_lock && !features.has_face) {
      return Response.json({ 
        error: 'E001: No face detected',
        error_code: 'E001',
        details: 'Identity lock requires a clear face in the reference image'
      }, { status: 400 });
    }

    // Create ReferenceImage entity
    const refImage = await base44.entities.ReferenceImage.create({
      original_image_url: imageUrl,
      extracted_features: features,
      identity_lock_config: {
        enabled: opts.enable_identity_lock || false,
        similarity_threshold: 0.87
      },
      image_hash
    });

    // Audit
    await base44.entities.ImageGenAudit.create({
      action_type: 'feature_extraction',
      user_id: user.email,
      status: 'success',
      metadata: {
        reference_image_id: refImage.id,
        has_face: features.has_face,
        identity_lock_enabled: opts.enable_identity_lock || false
      }
    });

    return Response.json({
      reference_image_id: refImage.id,
      features,
      has_face: features.has_face
    });

  } catch (error) {
    console.error('Feature extraction error:', error);
    
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user) {
      await base44.entities.ImageGenAudit.create({
        action_type: 'feature_extraction',
        user_id: user.email,
        status: 'failed',
        error_details: error.message
      });
    }
    
    return Response.json({ 
      error: 'Feature extraction failed',
      details: error.message 
    }, { status: 500 });
  }
});