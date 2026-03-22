import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Anthropic from 'npm:@anthropic-ai/sdk@0.18.0';

function generatePrompt(finding, context) {
  return `You are a security and performance expert for the GlyphLock platform. Analyze this ${finding.type} scan finding and provide a concrete, actionable remediation for a React/Base44 application.

Finding Details:
- Type: ${finding.type}
- Severity: ${finding.severity}
- Title: ${finding.title}
- Description: ${finding.description}
- Location: ${finding.location}

${context ? `Context:
- Framework: ${context.framework || 'React'}
- Language: ${context.language || 'JavaScript'}
- Platform: ${context.platform || 'Base44'}` : ''}

Provide your response in the following JSON format ONLY:
{
  "suggestion": "Brief, clear summary of what needs to be fixed (1-2 sentences)",
  "code_example": "Concrete code example showing the fix (if applicable)",
  "steps": ["Step 1: Specific action", "Step 2: Next action", "Step 3: Final step"],
  "estimated_effort": "low|medium|high",
  "priority": 1-10 (number based on severity and impact),
  "references": ["https://relevant-doc-1.com"]
}

Focus on:
1. Practical, immediately actionable advice
2. Specific file paths and code changes
3. Best practices for React and Base44 deployment
4. Security-first approach for GlyphLock's revenue-generating platform

Be concise but thorough.`;
}

function getFallbackRemediation(finding) {
  return {
    finding_id: finding.id,
    suggestion: 'Review documentation and apply security patches manually (AI temporarily unavailable).',
    code_example: '// TODO: Implement fix manually\n// Refer to security guidelines',
    steps: ['Analyze the issue context', 'Consult security best practices', 'Apply and verify fix'],
    estimated_effort: 'medium',
    priority: finding.severity === 'critical' ? 9 : 5,
    references: [],
    generated_at: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
    }

    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { finding, context } = await req.json();

        if (!finding) {
            return Response.json({ success: false, error: 'Finding data is required' });
        }

        const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
        if (!apiKey) {
            console.error("ANTHROPIC_API_KEY not set");
            return Response.json({ success: true, remediation: getFallbackRemediation(finding) });
        }

        const anthropic = new Anthropic({ apiKey });

        let remediation;
        try {
            const msg = await anthropic.messages.create({
                model: 'claude-3-haiku-20240307', // Efficient model for this task
                max_tokens: 1024,
                messages: [{ role: 'user', content: generatePrompt(finding, context) }],
            });
            const textContent = msg.content[0].text;
            const cleaned = textContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            const parsed = JSON.parse(cleaned);

            remediation = {
                finding_id: finding.id,
                suggestion: parsed.suggestion,
                code_example: parsed.code_example || '',
                steps: parsed.steps || [],
                estimated_effort: parsed.estimated_effort || 'medium',
                priority: parsed.priority || (finding.severity === 'critical' ? 9 : 6),
                references: parsed.references || [],
                generated_at: new Date().toISOString(),
            };
        } catch (error) {
            console.error("AI Error:", error);
            remediation = getFallbackRemediation(finding);
        }

        return Response.json({ success: true, remediation });

    } catch (error) {
        console.error('Function Error:', error);
        // Ensure we always return JSON, never throw to cause 500
        return Response.json({ 
            success: true, 
            remediation: getFallbackRemediation(finding || {id: 'unknown', severity: 'medium'}),
            note: "Service recovered from error"
        });
    }
});