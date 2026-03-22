import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Agent Generate - Generates actual code for each step in the plan
 * Part of OMEGA Agent System
 */

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

async function callLLM(prompt, systemPrompt) {
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

  if (OPENAI_API_KEY) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
          max_tokens: 8192
        })
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, text: data.choices[0].message.content, model: 'gpt-4o' };
      }
    } catch (e) { console.error('GPT-4o failed:', e.message); }
  }

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

function getSystemPrompt(fileType) {
  const prompts = {
    page: `You are a React expert for GlyphLock.io.
Generate a complete, production-ready page component with:
- React functional component with hooks
- Tailwind CSS styling (royal blue: #3B82F6, #4F46E5, #8B5CF6)
- Mobile-first responsive design
- Proper imports: @/components/ui/, lucide-react, @/api/base44Client
- Export default function PageName
OUTPUT ONLY THE CODE, NO EXPLANATIONS.`,

    component: `You are a React expert for GlyphLock.io.
Generate a reusable component with:
- React functional component
- Tailwind CSS styling
- Props interface clearly defined
- Mobile responsive
OUTPUT ONLY THE CODE, NO EXPLANATIONS.`,

    entity: `You are creating a JSON schema for Base44.
Format: { "name": "EntityName", "type": "object", "properties": {...}, "required": [...] }
Types: string, number, boolean, array, object
Formats: "date", "date-time", "email"
OUTPUT ONLY THE JSON, NO EXPLANATIONS.`,

    function: `You are creating a Deno backend function for Base44.
Required structure:
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  // ... logic
  return Response.json({ success: true, data: ... });
});
OUTPUT ONLY THE CODE, NO EXPLANATIONS.`
  };
  return prompts[fileType] || prompts.component;
}

function detectFileType(path) {
  if (path.startsWith('pages/')) return 'page';
  if (path.startsWith('components/')) return 'component';
  if (path.startsWith('entities/')) return 'entity';
  if (path.startsWith('functions/')) return 'function';
  return 'component';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin role required' }, { status: 403 });
    }

    const { changeSetId } = await req.json();

    if (!changeSetId) {
      return Response.json({ error: 'changeSetId is required' }, { status: 400 });
    }

    // Get the change set
    const changeSets = await base44.entities.AgentChangeSet.filter({ id: changeSetId });
    const changeSet = changeSets[0];

    if (!changeSet) {
      return Response.json({ error: 'ChangeSet not found' }, { status: 404 });
    }

    const executionPlan = changeSet.executionPlan || [];
    const generatedChanges = [];
    const runtimeModules = [];

    // Generate code for each step
    for (const step of executionPlan) {
      if (step.action === 'delete') {
        generatedChanges.push({
          path: step.target,
          action: 'delete',
          contentBefore: null,
          contentAfter: null,
          patchInstructions: `Delete file: ${step.target}`
        });
        continue;
      }

      const fileType = detectFileType(step.target);
      const systemPrompt = getSystemPrompt(fileType);

      const result = await callLLM(
        `Generate code for: ${step.target}\n\nDescription: ${step.description}\n\nContext: ${changeSet.userRequest}`,
        systemPrompt
      );

      if (!result.success) {
        generatedChanges.push({
          path: step.target,
          action: step.action,
          error: result.error
        });
        continue;
      }

      // Clean code
      let code = result.text;
      code = code.replace(/^```[\w]*\n?/gm, '').replace(/\n?```$/gm, '').trim();

      generatedChanges.push({
        path: step.target,
        action: step.action,
        contentBefore: null,
        contentAfter: code,
        patchInstructions: `${step.action === 'create' ? 'Create new file' : 'Replace content'}: ${step.target}`
      });

      // Create runtime module record
      const module = await base44.entities.AgentRuntimeModule.create({
        name: step.target.split('/').pop().replace(/\.\w+$/, ''),
        moduleType: fileType,
        targetPath: step.target,
        content: code,
        version: 1,
        active: false, // Not active until deployed
        linkedChangeSetId: changeSetId,
        hash: await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code))
          .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''))
      });

      runtimeModules.push(module);
    }

    // Update change set
    await base44.entities.AgentChangeSet.update(changeSetId, {
      status: 'generated',
      changes: generatedChanges,
      rollbackAvailable: true
    });

    // Log action
    await base44.entities.BuilderActionLog.create({
      timestamp: new Date().toISOString(),
      actor: user.email,
      action: 'modify',
      filePath: `changeset-${changeSetId}`,
      diffSummary: `Generated ${generatedChanges.length} files`,
      status: 'pending'
    });

    return Response.json({
      success: true,
      changeSetId,
      changes: generatedChanges,
      moduleIds: runtimeModules.map(m => m.id),
      totalGenerated: generatedChanges.filter(c => !c.error).length
    });

  } catch (error) {
    console.error('Agent Generate Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});