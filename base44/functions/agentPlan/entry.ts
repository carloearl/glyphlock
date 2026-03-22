import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Agent Plan - Creates execution plan from user request
 * Part of OMEGA Agent System
 */

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

async function callLLM(prompt, systemPrompt) {
  // Claude first
  if (ANTHROPIC_API_KEY) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 8192,
          system: systemPrompt,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, text: data.content[0].text, model: 'claude-3.5-sonnet' };
      }
    } catch (e) { console.error('Claude failed:', e.message); }
  }

  // GPT-4o fallback
  if (OPENAI_API_KEY) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
          max_tokens: 4096
        })
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, text: data.choices[0].message.content, model: 'gpt-4o' };
      }
    } catch (e) { console.error('GPT-4o failed:', e.message); }
  }

  // Gemini fallback
  if (GEMINI_API_KEY) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt + '\n\n' + prompt }] }] })
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, text: data.candidates?.[0]?.content?.parts?.[0]?.text, model: 'gemini-2.0-flash' };
      }
    } catch (e) { console.error('Gemini failed:', e.message); }
  }

  return { success: false, error: 'All LLM providers failed' };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role-based access - admin only
    if (user.role !== 'admin') {
      return Response.json({ error: 'Admin role required for agent operations' }, { status: 403 });
    }

    const { userRequest, context, mode = 'build' } = await req.json();

    if (!userRequest) {
      return Response.json({ error: 'userRequest is required' }, { status: 400 });
    }

    const systemPrompt = `You are an AI planning agent for GlyphLock.io (React/Tailwind/Base44).

PLATFORM CAPABILITIES:
- Pages: React components in pages/ (flat structure)
- Components: React in components/ (can have subfolders)  
- Entities: JSON schemas in entities/
- Functions: Deno backend handlers in functions/
- Layout: Layout.js wrapper component

RESPOND WITH EXACTLY THIS JSON FORMAT:
{
  "summary": "Brief description of what will be built/changed",
  "riskLevel": "low" | "medium" | "high" | "critical",
  "requiresApproval": true,
  "executionPlan": [
    {
      "step": 1,
      "action": "create" | "modify" | "delete",
      "target": "pages/Example.jsx",
      "description": "What this step does",
      "status": "pending"
    }
  ],
  "warnings": ["Any potential issues or risks"],
  "dependencies": ["Any external dependencies needed"]
}

RULES:
- Be specific about file paths
- Estimate risk accurately (new files = low, modifying core = high)
- Include ALL necessary steps
- Consider mobile responsiveness
- Use GlyphLock royal blue theme (#3B82F6, #4F46E5, #8B5CF6)`;

    const result = await callLLM(
      `MODE: ${mode.toUpperCase()}\n\nUSER REQUEST:\n${userRequest}\n\nCONTEXT:\n${context || 'GlyphLock.io security platform'}`,
      systemPrompt
    );

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 500 });
    }

    // Parse JSON
    let plan;
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      plan = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      plan = null;
    }

    if (!plan) {
      return Response.json({ 
        error: 'Failed to parse plan',
        rawResponse: result.text 
      }, { status: 500 });
    }

    // Create AgentChangeSet record
    const changeSet = await base44.entities.AgentChangeSet.create({
      mode,
      status: 'planned',
      userRequest,
      summary: plan.summary,
      executionPlan: plan.executionPlan,
      riskLevel: plan.riskLevel || 'medium',
      requiresApproval: plan.requiresApproval !== false,
      model: result.model
    });

    // Log action
    await base44.entities.BuilderActionLog.create({
      timestamp: new Date().toISOString(),
      actor: user.email,
      action: 'propose',
      filePath: 'agent-plan',
      diffSummary: plan.summary,
      status: 'pending'
    });

    return Response.json({
      success: true,
      changeSetId: changeSet.id,
      plan,
      model: result.model
    });

  } catch (error) {
    console.error('Agent Plan Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});