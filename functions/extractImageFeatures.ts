import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { image_url, enable_identity_lock } = await req.json();
    if (!image_url) {
      return Response.json({ error: 'image_url required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    // Fetch image
    const imageResponse = await fetch(image_url);
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const analysisPrompt = `Analyze this image and extract visual features in JSON format:
{
  "color_palette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  "lighting_signature": {
    "type": "natural/studio/dramatic/soft",
    "direction": "description",
    "temperature": "warm/cool/neutral",
    "intensity": 0-1
  },
  "texture_signature": {
    "primary": "description",
    "secondary": "description",
    "smoothness": 0-1
  },
  "composition_signature": {
    "rule_of_thirds": true/false,
    "symmetry": 0-1,
    "depth": "shallow/medium/deep",
    "focal_point": "description"
  },
  "visual_mood": "description",
  "style_entropy": 0-1,
  "has_face": true/false,
  "face_description": "if has_face, describe facial features, expression, lighting on face"
}

Provide ONLY the JSON, no additional text.`;

    const result = await model.generateContent([
      analysisPrompt,
      {
        inlineData: {
          mimeType: imageResponse.headers.get('content-type') || 'image/jpeg',
          data: imageBase64
        }
      }
    ]);

    const response = result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse feature extraction response');
    }
    
    const features = JSON.parse(jsonMatch[0]);

    // Generate face embedding placeholder (512-dim vector)
    // In production, use dedicated face recognition API
    let face_embedding = null;
    if (enable_identity_lock && features.has_face) {
      face_embedding = Array.from({ length: 512 }, () => Math.random() * 2 - 1);
    }

    // Hash image
    const hashBuffer = await crypto.subtle.digest('SHA-256', imageBuffer);
    const image_hash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Create ReferenceImage entity
    const refImage = await base44.entities.ReferenceImage.create({
      original_image_url: image_url,
      extracted_features: {
        ...features,
        face_embedding
      },
      identity_lock_config: {
        enabled: enable_identity_lock || false,
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
        identity_lock_enabled: enable_identity_lock || false
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