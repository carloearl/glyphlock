import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * GlyphBot LLM Engine v11.0 — Omega Chain + Puter Integration
 * 
 * PRIORITY ORDER:
 * 1. Puter (FREE unlimited Gemini 2.5 Flash)
 * 2. Gemini Direct (if Puter fails)
 * 3. OpenAI GPT-4o-mini
 * 4. Claude Haiku
 * 5. OpenRouter (free models)
 * 6. Base44 Broker
 * 7. Local OSS Fallback
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
    envKey: null, // No key needed!
    priority: 1,
    isPrimary: true
  },
  GEMINI: {
    id: 'GEMINI',
    label: 'Gemini 2.0 Flash',
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
    label: 'Claude 3.5 Haiku',
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
    // Puter and LOCAL_OSS don't need keys
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
// PUTER - FREE UNLIMITED GEMINI (PRIMARY)
// =====================================================
async function callPuter(prompt) {
  console.log('[Puter] Calling FREE Gemini 2.5 Flash...');
  
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

  if (!response.ok) {
    const errText = await response.text();
    console.error('[Puter] Error:', errText);
    throw new Error(`Puter API error: ${response.status}`);
  }

  const data = await response.json();
  console.log('[Puter] Response:', JSON.stringify(data).slice(0, 400));
  
  const text = data.result?.message?.content || data.message?.content || data.content;
  if (!text) {
    console.error('[Puter] No text in response:', JSON.stringify(data));
    throw new Error('Puter: No text in response');
  }
  
  return text;
}

// =====================================================
// GEMINI DIRECT
// =====================================================
async function callGemini(prompt) {
  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) throw new Error('GEMINI_API_KEY not configured');
  
  console.log('[Gemini] Calling with key:', key.slice(0, 8) + '...');
  
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
  
  if (!response.ok) {
    const errBody = await response.text();
    console.error('[Gemini] Error:', errBody);
    throw new Error(`Gemini ${response.status}: ${errBody.slice(0, 300)}`);
  }
  
  const data = await response.json();
  console.log('[Gemini] Response:', JSON.stringify(data).slice(0, 400));
  
  if (data.candidates?.[0]?.finishReason === 'SAFETY') {
    throw new Error('Gemini: Content blocked by safety filters');
  }
  
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error('[Gemini] No text:', JSON.stringify(data));
    throw new Error('Gemini: No text in response');
  }
  
  return text;
}

// =====================================================
// OPENAI
// =====================================================
async function callOpenAI(prompt) {
  const key = Deno.env.get('OPENAI_API_KEY');
  if (!key) throw new Error('OPENAI_API_KEY not configured');
  
  console.log('[OpenAI] Calling with key:', key.slice(0, 8) + '...');
  
  const response = await fetchWithTimeout(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // GLYPHLOCK: Latest GPT-4o-mini with Dec 2024 knowledge
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 16384,
        temperature: 0.7
      })
    }
  );
  
  if (!response.ok) {
    const errBody = await response.text();
    console.error('[OpenAI] Error:', errBody);
    throw new Error(`OpenAI ${response.status}: ${errBody.slice(0, 300)}`);
  }
  
  const data = await response.json();
  console.log('[OpenAI] Response:', JSON.stringify(data).slice(0, 400));
  
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    console.error('[OpenAI] No text:', JSON.stringify(data));
    throw new Error('OpenAI: No content in response');
  }
  
  return text;
}

// =====================================================
// CLAUDE
// =====================================================
async function callClaude(prompt) {
  const key = Deno.env.get('ANTHROPIC_API_KEY');
  if (!key) throw new Error('ANTHROPIC_API_KEY not configured');
  
  console.log('[Claude] Calling with key:', key.slice(0, 8) + '...');
  
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
        model: 'claude-3-5-haiku-20241022', // GLYPHLOCK: Updated to Claude 3.5 Haiku
        max_tokens: 8192,
        messages: [{ role: 'user', content: prompt }]
      })
    }
  );
  
  if (!response.ok) {
    const errBody = await response.text();
    console.error('[Claude] Error:', errBody);
    throw new Error(`Claude ${response.status}: ${errBody.slice(0, 300)}`);
  }
  
  const data = await response.json();
  console.log('[Claude] Response:', JSON.stringify(data).slice(0, 400));
  
  const text = data.content?.[0]?.text;
  if (!text) {
    console.error('[Claude] No text:', JSON.stringify(data));
    throw new Error('Claude: No text in response');
  }
  
  return text;
}

// =====================================================
// OPENROUTER (Free models)
// =====================================================
async function callOpenRouter(prompt) {
  const key = Deno.env.get('OPENROUTER_API_KEY');
  if (!key) throw new Error('OPENROUTER_API_KEY not configured');
  
  console.log('[OpenRouter] Calling with key:', key.slice(0, 8) + '...');
  
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
  
  if (!response.ok) {
    const errBody = await response.text();
    console.error('[OpenRouter] Error:', errBody);
    throw new Error(`OpenRouter ${response.status}: ${errBody.slice(0, 300)}`);
  }
  
  const data = await response.json();
  console.log('[OpenRouter] Response:', JSON.stringify(data).slice(0, 400));
  
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    console.error('[OpenRouter] No text:', JSON.stringify(data));
    throw new Error('OpenRouter: No content in response');
  }
  
  return text;
}

// =====================================================
// LOCAL FALLBACK
// =====================================================
function callLocalOSS(prompt) {
  return `GlyphBot is currently in offline mode. All LLM providers are unavailable.

To restore functionality, check your API keys:
- Puter (free, no key needed) - primary
- GEMINI_API_KEY
- OPENAI_API_KEY
- ANTHROPIC_API_KEY
- OPENROUTER_API_KEY

Your message was received but cannot be processed.`;
}

// =====================================================
// UNIFIED CALLER
// =====================================================
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
// PROMPT CONSTRUCTION
// =====================================================
const SYSTEM_DIRECTIVE = `You are GlyphBot — Your AI Security Partner

Built by Carlo Rene Earl and the GlyphLock team. Powered by Dream Team AI (Alfred orchestrating Claude, Gemini, Copilot, Perplexity, and Cursor).

**What I Do:**
• Security audits with real web data
• Code reviews and vulnerability scans
• Blockchain and smart contract analysis
• Threat intelligence and pattern detection
• Business/person/agency investigations using live public records
• Technical debugging and optimization help

**How I Communicate:**
• Conversational and friendly, not corporate-robotic
• I speak like a knowledgeable teammate, not a manual
• Actionable advice with personality
• I use contractions, casual phrasing, and human warmth
• When I find issues, I explain them like I'm helping a friend

**For Audits:**
When you ask me to investigate something:
1. I search the web for real public information (not guessing)
2. I cite specific sources with URLs
3. I provide honest risk scores (0-100)
4. I structure findings clearly in JSON when needed
5. I tell you what I found AND how I found it

I'm here to help you secure your digital world. Let's talk.`;

const PERSONAS = {
  GENERAL: "Be helpful and conversational. Speak like a knowledgeable friend who happens to be great at security. Use natural language, not robotic commands.",
  SECURITY: "Deep dive into threats but explain them clearly. Be the security expert who makes complex things simple. Use analogies when helpful.",
  BLOCKCHAIN: "Break down smart contract risks in plain English. I understand DeFi but I explain it like you're my teammate, not a documentation page.",
  AUDIT: "Thorough forensic analysis with personality. Present findings like you're walking a client through results over coffee. Professional but warm.",
  DEBUGGER: "Bug hunting with a human touch. Show code, explain issues, suggest fixes — all in a friendly, encouraging tone.",
  ANALYTICS: "Data storytelling. Find patterns, explain insights, make predictions — but speak like a data analyst who loves teaching, not a statistics textbook."
};

function buildPrompt(messages, persona = 'GENERAL', auditMode = false, realTime = false) {
  const personaInstruction = PERSONAS[persona] || PERSONAS.GENERAL;
  
  const conversation = messages.map(m => 
    `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
  ).join('\n\n');
  
  let prompt = `${SYSTEM_DIRECTIVE}\n\nMODE: ${personaInstruction}\n\n`;
  
  if (auditMode) {
    prompt += `[🔴 CRITICAL AUDIT MODE - MANDATORY COMPREHENSIVE SEARCH]

YOU ARE A SECURITY INVESTIGATOR. Execute REAL web searches and scrape PUBLIC DATA.

TARGET EXTRACTION:
${messages[messages.length - 1]?.content || 'No target specified'}

MANDATORY DATA SOURCES - SEARCH ALL:

📊 BUSINESS AUDITS:
1. USPTO Trademark Search (https://tmsearch.uspto.gov) - Search company name for registered trademarks
2. Copyright.gov Registry (https://cocatalog.loc.gov) - Search for copyrighted works, logos, brands
3. Secretary of State Business Registry - Search articles of organization, incorporation date, registered agent
4. Better Business Bureau (BBB) - Rating, complaints, accreditation status
5. SEC EDGAR (https://www.sec.gov/edgar) - If public company, pull 10-K, 10-Q filings
6. Domain WHOIS - Registration date, owner, history
7. Google News - Recent mentions, lawsuits, controversies
8. Pacer.gov - Federal court cases (if accessible via search)
9. State Court Records - Legal disputes, judgments
10. Google Reviews + Yelp - Customer feedback patterns

👤 PERSON AUDITS:
1. LinkedIn Profile - Career history, endorsements, connections
2. Company Registrations - Secretary of State filings under their name
3. USPTO Inventor Search - Patents held
4. Court Records - Search name + state for legal issues
5. Google News - Articles mentioning the person
6. Social Media - Twitter/X, Facebook, Instagram presence
7. Domain Ownership - WHOIS search for domains registered to them
8. Professional Licenses - State licensing boards (lawyers, doctors, etc.)

🏛️ AGENCY AUDITS:
1. Official .gov website - Verify legitimacy, check last update
2. FOIA.gov - Search for FOIA requests related to agency
3. OIG.gov - Inspector General reports on the agency
4. USASpending.gov - Budget and spending records
5. Congressional Hearings - Search C-SPAN, Congress.gov for oversight hearings
6. Watchdog.net - Non-profit oversight database
7. Google News - Scandals, investigations, reforms

SEARCH EXECUTION RULES:
- Perform AT LEAST 5 searches per target type
- Use EXACT search operators: "company name" site:uspto.gov
- Scrape actual content from result pages, don't just cite the homepage
- Cross-reference 3+ sources for EVERY major finding
- If API access blocked, describe what WOULD be found if searched manually

OUTPUT FORMAT (STRICT JSON):
{
  "target": "exact name searched",
  "targetType": "business|person|agency",
  "overallGrade": "A-F (based on findings)",
  "riskScore": 0-100,
  "summary": "2-3 sentence executive summary citing sources",
  "technicalFindings": [
    {
      "title": "Trademark Status",
      "area": "Intellectual Property",
      "severity": "LOW|MEDIUM|HIGH|CRITICAL",
      "description": "Details with [Source](url)",
      "businessImpact": "What this means",
      "recommendation": "Action to take"
    }
  ],
  "businessRisks": [
    {
      "title": "Risk name",
      "likelihood": "Low|Medium|High",
      "impact": "Financial|Reputational|Legal",
      "notes": "Explanation with sources"
    }
  ],
  "fixPlan": [
    {
      "order": 1,
      "title": "Action item",
      "effort": "Low|Medium|High",
      "owner": "Who should handle this"
    }
  ],
  "sources": [
    {"name": "Source Name", "url": "https://...", "dateAccessed": "2025-12-10"}
  ]
}

FAIL CRITERIA:
- Generic responses without real data = INVALID
- No source URLs = INVALID
- Hallucinated data = INVALID
- "I don't have access" = INVALID (YOU DO - USE WEB SEARCH)

BEGIN AUDIT NOW.
`;
  }
  
  if (realTime) {
    prompt += `[🌐 LIVE WEB SEARCH ENABLED - Current date: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}]
You have access to REAL-TIME web search. USE IT aggressively to find current information.

CRITICAL INSTRUCTIONS FOR LIVE MODE:
- You MUST search the web FIRST before responding to ANY query
- Pull REAL data from Google Search, News, Maps - NOT from your training data
- ALWAYS cite specific URLs and sources in your response
- Current date is ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
- If you claim "I don't have access to real-time data" - YOU ARE LYING. YOU DO.
- Use multiple search queries if needed to get comprehensive results
- Scrape actual websites, don't hallucinate information

`;
  }
  
  prompt += `${conversation}\n\nAssistant:`;
  
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
// MAIN HANDLER
// =====================================================
Deno.serve(async (req) => {
  const startTime = Date.now();
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      messages, 
      persona = 'GENERAL', 
      auditMode = false,
      realTime = false,
      provider: requestedProvider = 'AUTO',
      autoProvider = true
    } = body;
    
    console.log('[GlyphBot LLM] Request received:', {
      messageCount: messages?.length,
      persona,
      auditMode,
      realTime,
      requestedProvider,
      autoProvider
    });
    
    // Handle ping
    if (messages?.length === 1 && messages[0].content === "ping") {
      return Response.json({ 
        status: "ok", 
        text: "pong",
        providers: getProviderChain()
      });
    }
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'Invalid messages array' }, { status: 400 });
    }

    // Sanitize messages
    const sanitizedMessages = messages.map(m => ({
      ...m,
      content: sanitizeInput(m.content)
    }));

    // GLYPHLOCK: FORCE web search for realTime or auditMode using Base44 InvokeLLM
    if (realTime || auditMode) {
      console.log('[GlyphBot LLM] 🌐 LIVE MODE ACTIVE - Forcing Base44 web search with Gemini/Claude/GPT');
      
      const lastUserMsg = sanitizedMessages[sanitizedMessages.length - 1];
      const conversationContext = sanitizedMessages.slice(0, -1).map(m => 
        `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
      ).join('\n\n');
      
      const enhancedPrompt = buildPrompt(sanitizedMessages, persona, auditMode, realTime);
      
      try {
        // GLYPHLOCK: Base44 InvokeLLM uses latest Gemini/Claude/GPT with REAL web search
        const llmResult = await base44.integrations.Core.InvokeLLM({
          prompt: enhancedPrompt,
          add_context_from_internet: true // CRITICAL: Enables Google Search, news, maps, real-time data
        });
        
        const totalLatency = Date.now() - startTime;
        
        // Parse audit results if in audit mode
        let resultText = llmResult;
        if (auditMode && typeof llmResult === 'string') {
          // Try to extract JSON if LLM returned it in markdown code blocks
          const jsonMatch = llmResult.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[1]);
              resultText = JSON.stringify(parsed);
            } catch {
              resultText = llmResult;
            }
          }
        }
        
        // Audit log
        base44.entities.SystemAuditLog.create({
          event_type: 'GLYPHBOT_LLM_CALL',
          description: `LLM via Base44 Broker (Web Search)`,
          actor_email: user.email,
          resource_id: 'glyphbot',
          metadata: { persona, provider: 'BASE44_WEB_SEARCH', latencyMs: totalLatency, auditMode, realTime },
          status: 'success'
        }).catch(() => {});
        
        return Response.json({
          text: resultText,
          model: 'Gemini 2.0 Flash + Live Web Search',
          providerUsed: 'BASE44_WEB_SEARCH',
          providerLabel: 'Gemini 2.0 (Live Search)',
          realTimeUsed: true,
          latencyMs: totalLatency,
          meta: {
            providerUsed: 'BASE44_WEB_SEARCH',
            providerLabel: 'Gemini 2.0 (Live Search)',
            availableProviders: getProviderChain(),
            providerStats: { ...providerStats },
            webSearchUsed: true,
            searchProvider: 'Google/Gemini'
          }
        });
      } catch (webSearchError) {
        console.error('[GlyphBot LLM] Web search failed, falling back to standard chain:', webSearchError);
        // Continue to standard provider chain below
      }
    }

    // Build prompt
    const prompt = buildPrompt(sanitizedMessages, persona, auditMode, realTime);

    // Get provider order
    const enabledProviders = getEnabledProviders();
    let providerOrder = [];
    
    console.log('[GlyphBot LLM] Enabled providers:', enabledProviders.map(p => p.id));
    
    if (requestedProvider && requestedProvider !== 'AUTO' && !autoProvider) {
      // User explicitly selected a provider
      const requested = enabledProviders.find(p => p.id === requestedProvider);
      if (requested) {
        console.log('[GlyphBot LLM] Using explicit provider:', requestedProvider);
        providerOrder = [requested, ...enabledProviders.filter(p => p.id !== requestedProvider)];
      } else {
        console.log('[GlyphBot LLM] Requested provider not available, using default chain');
        providerOrder = enabledProviders;
      }
    } else {
      // Auto mode - use priority order
      console.log('[GlyphBot LLM] Using auto provider chain');
      providerOrder = enabledProviders;
    }

    // Try providers in order
    let result = null;
    let usedProvider = null;
    let lastError = null;

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
        const errorMsg = error.message || String(error);
        
        updateStats(provider.id, false, latency, errorMsg);
        lastError = errorMsg;
        
        console.error(`[GlyphBot] FAILED: ${provider.id} - ${errorMsg}`);
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

    // Mobile-optimized response (reduce payload size)
    const isMobileRequest = req.headers.get('user-agent')?.match(/Mobile|Android|iPhone/i);
    
    return Response.json({
      text: result,
      model: usedProvider.label,
      providerUsed: usedProvider.id,
      providerLabel: usedProvider.label,
      latencyMs: totalLatency,
      meta: isMobileRequest ? {
        providerUsed: usedProvider.id,
        availableProviders: getProviderChain().slice(0, 3)
      } : {
        providerUsed: usedProvider.id,
        providerLabel: usedProvider.label,
        availableProviders: getProviderChain(),
        providerStats: { ...providerStats }
      }
    });

  } catch (error) {
    console.error('[GlyphBot] Fatal error:', error);
    return Response.json({ 
      error: error.message,
      text: 'GlyphBot error. Please try again.',
      providerUsed: 'ERROR',
      meta: { providerStats: { ...providerStats } }
    }, { status: 500 });
  }
});