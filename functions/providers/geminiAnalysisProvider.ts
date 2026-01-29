/**
 * GEMINI ANALYSIS PROVIDER
 * Handles: prompt expansion, reference feature extraction, validation scoring
 * Never handles actual image generation
 */

export class GeminiAnalysisProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';
  }

  async expandPrompt(originalPrompt) {
    const prompt = `You are an expert image generation prompt engineer. Expand the following short prompt into a detailed description for AI image generation.

Original prompt: "${originalPrompt}"

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
}`;

    const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Failed to parse expansion response');
    }

    return JSON.parse(jsonMatch[0]);
  }

  async extractImageFeatures(imageUrl, enableIdentityLock = false) {
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

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

    const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: analysisPrompt },
            {
              inline_data: {
                mime_type: imageResponse.headers.get('content-type') || 'image/jpeg',
                data: imageBase64
              }
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini vision error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Failed to parse features');
    }

    const features = JSON.parse(jsonMatch[0]);

    // Generate face embedding placeholder if identity lock requested
    let face_embedding = null;
    if (enableIdentityLock && features.has_face) {
      face_embedding = Array.from({ length: 512 }, () => Math.random() * 2 - 1);
    }

    // Hash image
    const hashBuffer = await crypto.subtle.digest('SHA-256', imageBuffer);
    const image_hash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return {
      features: { ...features, face_embedding },
      image_hash
    };
  }

  async validateGeneratedImage(imageUrl) {
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

    const validationPrompt = `Analyze this AI-generated image and rate it on these criteria (0.0-1.0 scale):
- face_anatomy: facial structure realism (1.0 if no face)
- hand_anatomy: hand realism (1.0 if no hands visible)
- realism: overall photorealism and coherence
- composition: visual composition quality
- lighting: lighting quality and consistency
- overall: weighted average of all scores

Return ONLY JSON with these exact keys.`;

    const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: validationPrompt },
            {
              inline_data: {
                mime_type: imageResponse.headers.get('content-type') || 'image/jpeg',
                data: imageBase64
              }
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini validation error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Failed to parse validation response');
    }

    return JSON.parse(jsonMatch[0]);
  }
}