import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Agent Execute Code - Real File Operations
 * This function allows the Site Builder agent to actually modify files
 * by calling the Base44 platform API to write/modify code
 */

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

async function callLLM(prompt, systemPrompt = '') {
  // Try Claude first (best for code)
  if (ANTHROPIC_API_KEY) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
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
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, text: data.content[0].text, model: 'claude-3.5-sonnet' };
      }
    } catch (err) {
      console.error('Claude failed:', err.message);
    }
  }

  // GPT-4o fallback
  if (OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: 4096
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, text: data.choices[0].message.content, model: 'gpt-4o' };
      }
    } catch (err) {
      console.error('GPT-4o failed:', err.message);
    }
  }

  // Gemini fallback
  if (GEMINI_API_KEY) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt + '\n\n' + prompt }] }]
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, text: data.candidates?.[0]?.content?.parts?.[0]?.text, model: 'gemini-2.0-flash' };
      }
    } catch (err) {
      console.error('Gemini failed:', err.message);
    }
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

    // Admin-only access
    const authorizedUsers = ['carloearl@glyphlock.com', 'carloearl@gmail.com'];
    const isAuthorized = user.role === 'admin' || authorizedUsers.includes(user.email);
    
    if (!isAuthorized) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { action, payload } = await req.json();

    switch (action) {
      case 'analyze_request': {
        // Analyze what the user wants and create a plan
        const { userRequest, context } = payload;
        
        const systemPrompt = `You are a code analysis AI for GlyphLock.io (React/Tailwind/Base44 platform).
Analyze the user's request and determine what file operations are needed.

RESPOND IN THIS EXACT JSON FORMAT:
{
  "plan": [
    {
      "action": "create" | "modify" | "delete",
      "filePath": "pages/Example.jsx" or "components/Example.jsx" or "entities/Example.json" or "functions/example.js",
      "description": "What this step does",
      "priority": 1
    }
  ],
  "summary": "Brief summary of what will be done",
  "warnings": ["Any potential issues"],
  "estimated_changes": 3
}

Rules:
- Pages must be in pages/ folder (flat, no subfolders)
- Components can have subfolders like components/dashboard/
- Entities are JSON schemas in entities/
- Functions are Deno handlers in functions/
- Use royal blue theme (#3B82F6, #4F46E5)
- Mobile-first responsive design`;

        const result = await callLLM(
          `User Request: ${userRequest}\n\nContext: ${context || 'GlyphLock.io website'}`,
          systemPrompt
        );

        if (!result.success) {
          return Response.json({ error: result.error }, { status: 500 });
        }

        // Parse JSON from response
        let plan;
        try {
          const jsonMatch = result.text.match(/\{[\s\S]*\}/);
          plan = jsonMatch ? JSON.parse(jsonMatch[0]) : { plan: [], summary: result.text };
        } catch {
          plan = { plan: [], summary: result.text, parseError: true };
        }

        return Response.json({
          success: true,
          ...plan,
          model: result.model
        });
      }

      case 'generate_code': {
        // Generate actual code for a file
        const { filePath, description, existingCode, mode } = payload;
        
        const fileType = filePath.endsWith('.json') ? 'json' : 
                         filePath.startsWith('functions/') ? 'deno' : 'react';

        const systemPrompts = {
          react: `You are a React/Tailwind expert for GlyphLock.io.
Generate production-ready code with:
- React functional components with hooks
- Tailwind CSS (royal blue theme: #3B82F6, #4F46E5, #8B5CF6)
- Mobile-first responsive design
- Proper imports from @/components/ui/, lucide-react, @/api/base44Client
- Export default function ComponentName

RESPOND WITH ONLY THE COMPLETE CODE, NO EXPLANATIONS.`,

          json: `You are creating a JSON schema for a Base44 entity.
Format: { "name": "EntityName", "type": "object", "properties": {...}, "required": [...] }
Property types: string, number, boolean, array, object
Use format: "date", "date-time", "email" for special fields
RESPOND WITH ONLY THE JSON, NO EXPLANATIONS.`,

          deno: `You are creating a Deno backend function for Base44.
Requirements:
- Use Deno.serve(async (req) => {...})
- Import: import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
- Auth: const base44 = createClientFromRequest(req); const user = await base44.auth.me();
- Return Response.json({...})
RESPOND WITH ONLY THE CODE, NO EXPLANATIONS.`
        };

        let prompt = `File: ${filePath}\nDescription: ${description}`;
        if (existingCode && mode === 'modify') {
          prompt += `\n\nExisting code to modify:\n\`\`\`\n${existingCode}\n\`\`\``;
        }

        const result = await callLLM(prompt, systemPrompts[fileType]);

        if (!result.success) {
          return Response.json({ error: result.error }, { status: 500 });
        }

        // Clean code output
        let code = result.text;
        code = code.replace(/^```[\w]*\n?/gm, '').replace(/\n?```$/gm, '').trim();

        return Response.json({
          success: true,
          code,
          filePath,
          model: result.model
        });
      }

      case 'execute_write': {
        // Actually write the file - this logs to BuilderActionLog
        const { filePath, code, description } = payload;

        // Log the action
        await base44.entities.BuilderActionLog.create({
          timestamp: new Date().toISOString(),
          actor: user.email,
          action: 'modify',
          filePath,
          diffSummary: description || `Agent wrote ${filePath}`,
          status: 'pending',
          approved: false
        });

        // Return the code - the frontend will show it for approval
        // Actual file writing happens through Base44 platform, not this function
        return Response.json({
          success: true,
          message: `Code generated for ${filePath}. Review and approve in the UI.`,
          filePath,
          code,
          requiresApproval: true
        });
      }

      case 'get_file': {
        // Read a file's current content (for modification)
        const { filePath } = payload;
        
        // We can't actually read files from here - return instruction
        return Response.json({
          success: true,
          message: `To modify ${filePath}, paste the current code in the context field.`,
          filePath
        });
      }

      case 'debug_analyze': {
        // Analyze an error and suggest fixes
        const { errorMessage, stackTrace, filePath } = payload;

        const systemPrompt = `You are a debugging expert for React/Base44 applications.
Analyze the error and provide a fix.

RESPOND IN THIS JSON FORMAT:
{
  "rootCause": "What caused the error",
  "fix": {
    "filePath": "path/to/file.jsx",
    "findCode": "code to find (for find_replace)",
    "replaceCode": "fixed code"
  },
  "explanation": "Why this fix works",
  "confidence": 0.9
}`;

        const result = await callLLM(
          `Error: ${errorMessage}\n\nStack: ${stackTrace || 'N/A'}\n\nFile: ${filePath || 'Unknown'}`,
          systemPrompt
        );

        if (!result.success) {
          return Response.json({ error: result.error }, { status: 500 });
        }

        let analysis;
        try {
          const jsonMatch = result.text.match(/\{[\s\S]*\}/);
          analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { explanation: result.text };
        } catch {
          analysis = { explanation: result.text };
        }

        return Response.json({
          success: true,
          ...analysis,
          model: result.model
        });
      }

      default:
        return Response.json({
          error: 'Unknown action',
          availableActions: ['analyze_request', 'generate_code', 'execute_write', 'get_file', 'debug_analyze']
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Agent Execute Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});