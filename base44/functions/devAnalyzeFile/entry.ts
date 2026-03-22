import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Dev Engine - Analyze File
 * Uses AI to analyze code structure, detect issues, and suggest improvements
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

    const { filePath, fileContent } = await req.json();
    
    if (!filePath || !fileContent) {
      return Response.json({ error: 'filePath and fileContent required' }, { status: 400 });
    }

    // Use AI to analyze the file
    const analysisPrompt = `Analyze this code file and provide:
1. Summary of what the file does
2. Potential issues or bugs
3. Code quality assessment
4. Suggestions for improvement

File: ${filePath}

\`\`\`javascript
${fileContent}
\`\`\`

Provide a concise, structured analysis.`;

    // Call AI via Core.InvokeLLM
    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          issues: { 
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                severity: { type: 'string' },
                line: { type: 'number' },
                description: { type: 'string' }
              }
            }
          },
          quality_score: { type: 'number' },
          suggestions: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    });

    // SCHEMA VALIDATION - No guessing allowed
    const logEntry = {
      timestamp: new Date().toISOString(),
      actor: user.email,
      action: 'analyze',
      filePath: filePath,
      diffSummary: `AI analysis performed on ${filePath}`,
      status: 'applied'
    };

    // Validate required fields explicitly
    if (!logEntry.timestamp || !logEntry.actor || !logEntry.action || !logEntry.filePath) {
      throw new Error('SCHEMA VIOLATION: Missing required fields in log entry');
    }

    // Validate action enum
    const validActions = ['analyze', 'propose', 'modify', 'delete', 'rollback', 'backup'];
    if (!validActions.includes(logEntry.action)) {
      throw new Error(`SCHEMA VIOLATION: Invalid action "${logEntry.action}"`);
    }

    await base44.asServiceRole.entities.BuilderActionLog.create(logEntry);

    return Response.json({
      success: true,
      filePath: filePath,
      analysis: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return Response.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});