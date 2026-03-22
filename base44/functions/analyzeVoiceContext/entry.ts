// GLYPHLOCK: AI Voice Analysis - Optimal Settings Recommender
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, context = 'general', targetEmotion = null } = await req.json();

    if (!text) {
      return Response.json({ error: 'Text is required' }, { status: 400 });
    }

    console.log(`[Voice Analysis] Analyzing: context=${context}, emotion=${targetEmotion}`);

    // Use Gemini to analyze text and recommend voice parameters
    const analysisPrompt = `Analyze this text and recommend optimal voice synthesis parameters:

TEXT: "${text}"
CONTEXT: ${context}
TARGET_EMOTION: ${targetEmotion || 'auto-detect'}

Return a JSON object with:
{
  "detected_emotion": "excited|calm|confident|friendly|professional|empathetic",
  "recommended_voice": "nova|shimmer|echo|alloy|fable|onyx",
  "speed": 0.8-1.4 (float),
  "breathiness": 0.0-1.0 (float, 0=none, 1=very breathy),
  "vocalFry": 0.0-1.0 (float, 0=none, 1=heavy fry),
  "energy_level": "low|medium|high",
  "reasoning": "brief explanation of recommendations",
  "emphasis_words": ["list", "of", "words", "to", "emphasize"]
}

Consider:
- Sentence structure (questions vs statements)
- Punctuation (exclamation marks, ellipses)
- Word choice (formal vs casual)
- Content type (greeting, explanation, call-to-action, storytelling)`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: analysisPrompt }]
          }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 500,
            responseMimeType: 'application/json'
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!analysisText) {
      throw new Error('No analysis returned from Gemini');
    }

    const analysis = JSON.parse(analysisText);

    console.log('[Voice Analysis] Recommendations:', analysis);

    // Log analysis for future ML training
    await base44.asServiceRole.entities.VoiceProfile.create({
      user_id: user.email,
      analysis_type: 'ai_recommendation',
      input_text: text.slice(0, 200),
      context,
      recommendations: analysis,
      timestamp: new Date().toISOString()
    }).catch(err => console.warn('Failed to log analysis:', err));

    return Response.json({
      success: true,
      analysis,
      suggested_params: {
        voice: analysis.recommended_voice,
        speed: analysis.speed,
        breathiness: analysis.breathiness,
        vocalFry: analysis.vocalFry,
        emotion: analysis.detected_emotion
      }
    });

  } catch (error) {
    console.error('[Voice Analysis] Error:', error);
    return Response.json({ 
      error: error.message,
      fallback: {
        voice: 'nova',
        speed: 1.0,
        breathiness: 0.5,
        vocalFry: 0.3,
        emotion: 'neutral'
      }
    }, { status: 500 });
  }
});