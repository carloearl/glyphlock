import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Anthropic from 'npm:@anthropic-ai/sdk@0.18.0';

function generatePrompt(finding, context) {
  // Reusing prompt logic from single function
  return `Analyze this ${finding.type} finding for GlyphLock (React/Base44 app):
  
Finding: ${finding.title}
Desc: ${finding.description}
Loc: ${finding.location}
Severity: ${finding.severity}

Respond with JSON ONLY:
{
  "suggestion": "Fix summary",
  "code_example": "Code snippet",
  "steps": ["Step 1", "Step 2"],
  "estimated_effort": "low|medium|high",
  "priority": 1-10
}`;
}

function getFallbackRemediation(finding) {
  return {
    finding_id: finding.id,
    suggestion: 'Manual review required',
    code_example: '// Review manual logs',
    steps: ['Check finding details'],
    estimated_effort: 'medium',
    priority: 5,
    generated_at: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });

    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const { findings, context } = await req.json();
        
        if (!findings || !Array.isArray(findings)) {
            return Response.json({ success: false, error: 'Findings array required' });
        }

        const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
        if (!apiKey) {
            return Response.json({ 
                success: true, 
                remediations: findings.map(f => getFallbackRemediation(f)) 
            });
        }

        const anthropic = new Anthropic({ apiKey });
        const remediations = [];
        const BATCH_SIZE = 5;

        // Process in batches
        for (let i = 0; i < findings.length; i += BATCH_SIZE) {
            const batch = findings.slice(i, i + BATCH_SIZE);
            
            const batchPromises = batch.map(async (finding) => {
                try {
                    const msg = await anthropic.messages.create({
                        model: 'claude-3-haiku-20240307',
                        max_tokens: 800,
                        messages: [{ role: 'user', content: generatePrompt(finding, context) }],
                    });

                    const textContent = msg.content[0].text;
                    const cleaned = textContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
                    const parsed = JSON.parse(cleaned);

                    return {
                        finding_id: finding.id,
                        suggestion: parsed.suggestion,
                        code_example: parsed.code_example || '',
                        steps: parsed.steps || [],
                        estimated_effort: parsed.estimated_effort || 'medium',
                        priority: parsed.priority || 5,
                        references: parsed.references || [],
                        generated_at: new Date().toISOString(),
                    };
                } catch (e) {
                    console.error(`Error processing finding ${finding.id}:`, e);
                    return getFallbackRemediation(finding);
                }
            });

            const batchResults = await Promise.all(batchPromises);
            remediations.push(...batchResults);

            // Rate limiting delay if more batches exist
            if (i + BATCH_SIZE < findings.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return Response.json({ success: true, remediations });

    } catch (error) {
        console.error('Bulk Remediation Error:', error);
        // Fallback for bulk too
        return Response.json({ 
            success: true, 
            remediations: findings.map(f => getFallbackRemediation(f)),
            note: "AI service unavailable, using fallback"
        });
    }
});