import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Puter.js LLM Backend - Free Unlimited Gemini Access
 * Uses Puter's "User-Pays" model for free AI access
 */

const PUTER_API_URL = 'https://api.puter.com/ai/chat';

async function callPuterAI(prompt, model = 'gemini-2.5-flash') {
  console.log(`[PuterLLM] Calling model: ${model}`);
  
  // Puter.js backend API call
  const response = await fetch('https://api.puter.com/drivers/call', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      interface: 'puter-chat-completion',
      driver: 'ai-chat',
      method: 'complete',
      args: {
        messages: [{ role: 'user', content: prompt }],
        model: model
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('[PuterLLM] Error:', errText);
    throw new Error(`Puter API error: ${response.status}`);
  }

  const data = await response.json();
  console.log('[PuterLLM] Response:', JSON.stringify(data).slice(0, 300));
  
  return data.result?.message?.content || data.message?.content || data.content || JSON.stringify(data);
}

// Fallback to direct Gemini if Puter fails
async function callGeminiDirect(prompt) {
  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) throw new Error('GEMINI_API_KEY not set');

  console.log('[PuterLLM] Falling back to direct Gemini API');
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 4096, temperature: 0.7 }
      })
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error('[Gemini Direct] Error:', err);
    throw new Error(`Gemini error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
}

// System prompt for GlyphBot
const SYSTEM_PROMPT = `You are GlyphBot, an elite AI security assistant by GlyphLock Security LLC.
Be direct, professional, and security-focused. No fluff.`;

Deno.serve(async (req) => {
  const startTime = Date.now();
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { messages, model = 'gemini-2.5-flash' } = body;

    if (!messages || messages.length === 0) {
      return Response.json({ error: 'No messages provided' }, { status: 400 });
    }

    // Build prompt from messages
    const conversationText = messages.map(m => 
      `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
    ).join('\n\n');
    
    const fullPrompt = `${SYSTEM_PROMPT}\n\n${conversationText}\n\nAssistant:`;

    let result;
    let providerUsed = 'puter';

    try {
      // Try Puter first
      result = await callPuterAI(fullPrompt, model);
    } catch (puterError) {
      console.error('[PuterLLM] Puter failed:', puterError.message);
      
      // Fallback to direct Gemini
      try {
        result = await callGeminiDirect(fullPrompt);
        providerUsed = 'gemini-direct';
      } catch (geminiError) {
        console.error('[PuterLLM] Gemini fallback failed:', geminiError.message);
        
        // Last resort - Base44 broker
        try {
          const brokerResult = await base44.integrations.Core.InvokeLLM({
            prompt: fullPrompt,
            add_context_from_internet: false
          });
          result = typeof brokerResult === 'string' ? brokerResult : JSON.stringify(brokerResult);
          providerUsed = 'base44-broker';
        } catch (brokerError) {
          result = 'All AI providers are currently unavailable. Please try again.';
          providerUsed = 'error';
        }
      }
    }

    const latencyMs = Date.now() - startTime;

    return Response.json({
      text: result,
      model: model,
      providerUsed: providerUsed,
      providerLabel: providerUsed === 'puter' ? 'Puter (Free Gemini)' : providerUsed,
      latencyMs: latencyMs,
      meta: {
        availableModels: [
          'gemini-2.5-flash',
          'gemini-2.5-pro', 
          'gemini-2.0-flash',
          'gemini-3-pro-preview'
        ]
      }
    });

  } catch (error) {
    console.error('[PuterLLM] Fatal error:', error);
    return Response.json({ 
      error: error.message,
      text: 'GlyphBot error. Please try again.'
    }, { status: 500 });
  }
});