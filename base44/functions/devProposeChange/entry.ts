import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Dev Engine - Propose Change
 * Uses AI to generate code modifications based on user request
 * ADMIN ONLY
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin check
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { filePath, fileContent, changeDescription } = await req.json();
    
    if (!filePath || !fileContent || !changeDescription) {
      return Response.json({ 
        error: 'filePath, fileContent, and changeDescription required' 
      }, { status: 400 });
    }

    // Use AI to propose the change
    const proposalPrompt = `You are a code modification assistant. Generate a specific code change.

Current File: ${filePath}

Current Content:
\`\`\`javascript
${fileContent}
\`\`\`

Requested Change: ${changeDescription}

Provide:
1. The modified code (complete file)
2. A unified diff showing the changes
3. Explanation of what changed and why
4. Risk assessment (LOW/MEDIUM/HIGH)

Return as JSON with structure:
{
  "modifiedCode": "...",
  "diff": "...",
  "explanation": "...",
  "risk": "LOW|MEDIUM|HIGH",
  "filesAffected": ["..."]
}`;

    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: proposalPrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          modifiedCode: { type: 'string' },
          diff: { type: 'string' },
          explanation: { type: 'string' },
          risk: { type: 'string' },
          filesAffected: { 
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    });

    // SCHEMA VALIDATION - Create proposal log entry (pending approval)
    const logEntry = {
      timestamp: new Date().toISOString(),
      actor: user.email,
      action: 'propose',
      filePath: filePath,
      diffSummary: changeDescription,
      status: 'pending',
      approved: false
    };

    // Validate required fields explicitly
    if (!logEntry.timestamp || !logEntry.actor || !logEntry.action || !logEntry.filePath) {
      throw new Error('SCHEMA VIOLATION: Missing required fields in proposal log');
    }

    const createdLog = await base44.asServiceRole.entities.BuilderActionLog.create(logEntry);

    return Response.json({
      success: true,
      proposalId: createdLog.id,
      filePath: filePath,
      proposal: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Proposal error:', error);
    return Response.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});