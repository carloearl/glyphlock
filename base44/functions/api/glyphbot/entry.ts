import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * GlyphBot Unified API v12.0 — LLM + TTS in One
 * 
 * UNIFIED RESPONSE FORMAT:
 * {
 *   success: true,
 *   type: "llm" | "tts",
 *   text: "..." | null,
 *   audioUrl: null | "https://...",
 *   providerUsed: "PUTER",
 *   providerLabel: "Puter (Free Gemini)",
 *   latencyMs: 182,
 *   meta: { providerStats, availableProviders }
 * }
 */

const TIMEOUT_MS = 30000;

// =====================================================
// PROVIDER REGISTRY
// =====================================================
const PROVIDERS = {
  AUTO: { id: 'AUTO', label: 'Auto (Omega Chain)', priority: 0 },
  PUTER: {
    id: 'PUTER',
    label: 'Puter (Free Gemini)',
    envKey: null,
    priority: 1,
    isPrimary: true
  },
  GEMINI: {
    id: 'GEMINI',
    label: 'Gemini 2.5 Flash',
    envKey: 'GEMINI_API_KEY',
    priority: 2
  },
  OPENAI: {
    id: 'OPENAI',
    label: 'GPT-4o-mini',
    envKey: 'OPENAI_API_KEY',
    priority: 3
  },
  CLAUDE: {
    id: 'CLAUDE',
    label: 'Claude Haiku',
    envKey: 'ANTHROPIC_API_KEY',
    priority: 4
  },
  OPENROUTER: {
    id: 'OPENROUTER',
    label: 'OpenRouter',
    envKey: 'OPENROUTER_API_KEY',
    priority: 5
  },
  LOCAL_OSS: {
    id: 'LOCAL_OSS',
    label: 'Local Fallback',
    envKey: null,
    priority: 999
  }
};

// TTS VOICES
const TTS_VOICES = {
  alloy: 'Alloy (Neutral)',
  echo: 'Echo (Precise)',
  fable: 'Fable (Expressive)',
  onyx: 'Onyx (Deep)',
  nova: 'Nova (Warm)',
  shimmer: 'Shimmer (Bright)'
};

// =====================================================
// PROVIDER STATS
// =====================================================
const providerStats = {};

function initStats(id) {
  if (!providerStats[id]) {
    providerStats[id] = {
      id,
      label: PROVIDERS[id]?.label || id,
      totalCalls: 0,
      successCount: 0,
      failureCount: 0,
      lastLatencyMs: 0,
      lastErrorType: null,
      lastUsedAt: null
    };
  }
  return providerStats[id];
}

function updateStats(id, success, latencyMs, errorType = null) {
  const stats = initStats(id);
  stats.totalCalls++;
  stats.lastLatencyMs = latencyMs;
  stats.lastUsedAt = new Date().toISOString();
  if (success) {
    stats.successCount++;
    stats.lastErrorType = null;
  } else {
    stats.failureCount++;
    stats.lastErrorType = errorType;
  }
}

function getEnabledProviders() {
  const result = [];
  for (const [key, p] of Object.entries(PROVIDERS)) {
    if (key === 'AUTO') continue;
    if (key === 'PUTER' || key === 'LOCAL_OSS') {
      result.push(p);
      continue;
    }
    if (p.envKey && Deno.env.get(p.envKey)) {
      result.push(p);
    }
  }
  return result.sort((a, b) => a.priority - b.priority);
}

function getProviderChain() {
  return getEnabledProviders().map(p => ({
    id: p.id,
    label: p.label,
    priority: p.priority,
    enabled: true,
    stats: providerStats[p.id] || null
  }));
}

// =====================================================
// TIMEOUT WRAPPER
// =====================================================
async function fetchWithTimeout(url, options, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

// =====================================================
// LLM PROVIDERS
// =====================================================
async function callPuter(prompt) {
  const response = await fetchWithTimeout(
    'https://api.puter.com/drivers/call',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        interface: 'puter-chat-completion',
        driver: 'ai-chat',
        method: 'complete',
        args: {
          messages: [{ role: 'user', content: prompt }],
          model: 'gemini-2.5-flash'
        }
      })
    }
  );

  if (!response.ok) throw new Error(`Puter API error: ${response.status}`);
  const data = await response.json();
  const text = data.result?.message?.content || data.message?.content || data.content;
  if (!text) throw new Error('Puter: No text in response');
  return text;
}

async function callGemini(prompt) {
  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) throw new Error('GEMINI_API_KEY not configured');
  
  const response = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 8192, temperature: 0.7 }
      })
    }
  );
  
  if (!response.ok) throw new Error(`Gemini ${response.status}`);
  const data = await response.json();
  if (data.candidates?.[0]?.finishReason === 'SAFETY') {
    throw new Error('Gemini: Content blocked by safety filters');
  }
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini: No text in response');
  return text;
}

async function callOpenAI(prompt) {
  const key = Deno.env.get('OPENAI_API_KEY');
  if (!key) throw new Error('OPENAI_API_KEY not configured');
  
  const response = await fetchWithTimeout(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4096,
        temperature: 0.7
      })
    }
  );
  
  if (!response.ok) throw new Error(`OpenAI ${response.status}`);
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenAI: No content in response');
  return text;
}

async function callClaude(prompt) {
  const key = Deno.env.get('ANTHROPIC_API_KEY');
  if (!key) throw new Error('ANTHROPIC_API_KEY not configured');
  
  const response = await fetchWithTimeout(
    'https://api.anthropic.com/v1/messages',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      })
    }
  );
  
  if (!response.ok) throw new Error(`Claude ${response.status}`);
  const data = await response.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error('Claude: No text in response');
  return text;
}

async function callOpenRouter(prompt) {
  const key = Deno.env.get('OPENROUTER_API_KEY');
  if (!key) throw new Error('OPENROUTER_API_KEY not configured');
  
  const response = await fetchWithTimeout(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': 'https://glyphlock.io',
        'X-Title': 'GlyphBot'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4096
      })
    }
  );
  
  if (!response.ok) throw new Error(`OpenRouter ${response.status}`);
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenRouter: No content in response');
  return text;
}

function callLocalOSS(prompt) {
  return `GlyphBot is currently in offline mode. All LLM providers are unavailable.`;
}

async function callProvider(providerId, prompt) {
  switch (providerId) {
    case 'PUTER': return await callPuter(prompt);
    case 'GEMINI': return await callGemini(prompt);
    case 'OPENAI': return await callOpenAI(prompt);
    case 'CLAUDE': return await callClaude(prompt);
    case 'OPENROUTER': return await callOpenRouter(prompt);
    case 'LOCAL_OSS': return callLocalOSS(prompt);
    default: throw new Error(`Unknown provider: ${providerId}`);
  }
}

// =====================================================
// TTS (OpenAI)
// =====================================================
async function synthesizeTTS(text, voice = 'nova', speed = 1.0) {
  const key = Deno.env.get('OPENAI_API_KEY');
  if (!key) throw new Error('OPENAI_API_KEY not configured for TTS');

  const response = await fetchWithTimeout(
    'https://api.openai.com/v1/audio/speech',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: voice,
        input: text,
        speed: speed
      })
    }
  );

  if (!response.ok) throw new Error(`OpenAI TTS ${response.status}`);
  
  // Return audio data as ArrayBuffer
  return await response.arrayBuffer();
}

// =====================================================
// PROMPT CONSTRUCTION
// =====================================================
const SYSTEM_DIRECTIVE = `You are GlyphBot, an elite AI security assistant by GlyphLock Security LLC.

Be direct, professional, security-focused. No fluff.
- Respond concisely without preamble
- Use professional tone
- Prioritize security best practices
- Reject harmful code execution
- Flag suspicious inputs`;

const PERSONAS = {
  GENERAL: "Respond as a helpful security expert.",
  SECURITY: "Focus on threats, vulnerabilities, secure patterns.",
  BLOCKCHAIN: "Focus on smart contracts, DeFi security, crypto.",
  AUDIT: "Provide forensic analysis with risk scores.",
  DEBUGGER: "Identify bugs, propose fixes.",
  ANALYTICS: "Analyze patterns, data-driven insights."
};

function buildPrompt(messages, persona = 'GENERAL', auditMode = false) {
  const personaInstruction = PERSONAS[persona] || PERSONAS.GENERAL;
  
  const conversation = messages.map(m => 
    `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
  ).join('\n\n');
  
  let prompt = `${SYSTEM_DIRECTIVE}\n\n${personaInstruction}\n\n${conversation}`;
  
  if (auditMode) {
    prompt += `\n\n[AUDIT MODE: Provide structured security analysis]`;
  }
  
  return prompt;
}

function sanitizeInput(text) {
  if (!text || typeof text !== 'string') return '';
  const dangerous = /(<script|javascript:|on\w+\s*=|eval\(|exec\()/i;
  if (dangerous.test(text)) {
    throw new Error('Input contains potentially harmful content');
  }
  return text.slice(0, 8000);
}

// =====================================================
// UNIFIED RESPONSE BUILDER
// =====================================================
function buildResponse(type, data, providerUsed, providerLabel, latencyMs) {
  return {
    success: true,
    type,
    text: data.text || null,
    audioUrl: data.audioUrl || null,
    audioData: data.audioData || null,
    providerUsed,
    providerLabel,
    latencyMs,
    meta: {
      providerUsed,
      providerLabel,
      availableProviders: getProviderChain(),
      providerStats: { ...providerStats }
    }
  };
}

// =====================================================
// MAIN HANDLER
// =====================================================
Deno.serve(async (req) => {
  const startTime = Date.now();
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized', success: false }, { status: 401 });
    }

    const body = await req.json();
    const { 
      mode = 'llm', // 'llm' or 'tts'
      messages, 
      text,
      persona = 'GENERAL', 
      auditMode = false,
      provider: requestedProvider = 'AUTO',
      voice = 'nova',
      speed = 1.0
    } = body;

    // ============================================
    // MODE: TTS
    // ============================================
    if (mode === 'tts') {
      if (!text || typeof text !== 'string') {
        return Response.json({ 
          error: 'Text required for TTS', 
          success: false 
        }, { status: 400 });
      }

      try {
        const audioData = await synthesizeTTS(text, voice, speed);
        const totalLatency = Date.now() - startTime;
        
        updateStats('OPENAI_TTS', true, totalLatency);

        // Return audio directly as binary
        return new Response(audioData, {
          status: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioData.byteLength.toString(),
            'X-Provider-Used': 'OPENAI_TTS',
            'X-Provider-Label': 'OpenAI TTS',
            'X-Latency-Ms': totalLatency.toString()
          }
        });

      } catch (error) {
        const totalLatency = Date.now() - startTime;
        updateStats('OPENAI_TTS', false, totalLatency, error.message);
        
        return Response.json({
          success: false,
          type: 'tts',
          error: error.message,
          providerUsed: 'OPENAI_TTS',
          providerLabel: 'OpenAI TTS',
          latencyMs: totalLatency,
          meta: {
            providerStats: { ...providerStats }
          }
        }, { status: 500 });
      }
    }

    // ============================================
    // MODE: LLM
    // ============================================
    
    // Handle ping
    if (messages?.length === 1 && messages[0].content === "ping") {
      return Response.json(buildResponse(
        'llm',
        { text: 'pong' },
        'PING',
        'System Check',
        Date.now() - startTime
      ));
    }
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ 
        error: 'Invalid messages array', 
        success: false 
      }, { status: 400 });
    }

    // Sanitize messages
    const sanitizedMessages = messages.map(m => ({
      ...m,
      content: sanitizeInput(m.content)
    }));

    // Build prompt
    const prompt = buildPrompt(sanitizedMessages, persona, auditMode);

    // Get provider order
    const enabledProviders = getEnabledProviders();
    let providerOrder = [];
    
    if (requestedProvider && requestedProvider !== 'AUTO') {
      const requested = enabledProviders.find(p => p.id === requestedProvider);
      if (requested) {
        providerOrder = [requested, ...enabledProviders.filter(p => p.id !== requestedProvider)];
      } else {
        providerOrder = enabledProviders;
      }
    } else {
      providerOrder = enabledProviders;
    }

    // Try providers in order
    let result = null;
    let usedProvider = null;

    for (const provider of providerOrder) {
      const providerStart = Date.now();
      
      try {
        console.log(`[GlyphBot] Trying: ${provider.id}`);
        result = await callProvider(provider.id, prompt);
        const latency = Date.now() - providerStart;
        
        updateStats(provider.id, true, latency);
        usedProvider = provider;
        
        console.log(`[GlyphBot] SUCCESS: ${provider.id} (${latency}ms)`);
        break;
        
      } catch (error) {
        const latency = Date.now() - providerStart;
        updateStats(provider.id, false, latency, error.message);
        console.error(`[GlyphBot] FAILED: ${provider.id} - ${error.message}`);
        continue;
      }
    }

    // Last resort: Base44 broker
    if (!result) {
      try {
        console.log('[GlyphBot] Trying Base44 broker...');
        const brokerStart = Date.now();
        
        result = await base44.integrations.Core.InvokeLLM({
          prompt: prompt,
          add_context_from_internet: false
        });
        
        const latency = Date.now() - brokerStart;
        updateStats('BASE44_BROKER', true, latency);
        usedProvider = { id: 'BASE44_BROKER', label: 'Base44 Broker' };
        
        console.log(`[GlyphBot] SUCCESS: Base44 Broker (${latency}ms)`);
        
      } catch (brokerError) {
        console.error('[GlyphBot] Base44 broker failed:', brokerError.message);
        result = callLocalOSS(prompt);
        usedProvider = { id: 'LOCAL_OSS', label: 'Local Fallback' };
      }
    }

    const totalLatency = Date.now() - startTime;

    // Audit log (fire and forget)
    base44.entities.SystemAuditLog.create({
      event_type: 'GLYPHBOT_LLM_CALL',
      description: `LLM via ${usedProvider.label}`,
      actor_email: user.email,
      resource_id: 'glyphbot',
      metadata: { persona, provider: usedProvider.id, latencyMs: totalLatency },
      status: 'success'
    }).catch(() => {});

    return Response.json(buildResponse(
      'llm',
      { text: result },
      usedProvider.id,
      usedProvider.label,
      totalLatency
    ));

  } catch (error) {
    console.error('[GlyphBot] Fatal error:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      type: 'error',
      text: null,
      audioUrl: null,
      providerUsed: 'ERROR',
      latencyMs: Date.now() - startTime,
      meta: { providerStats: { ...providerStats } }
    }, { status: 500 });
  }
});