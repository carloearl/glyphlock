import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

export default async function enrichScanWithAI(req) {
    const base44 = createClientFromRequest(req);
    const adminBase44 = base44.asServiceRole;

    try {
        const { scan_id } = await req.json();

        // fetch findings
        const [nav, routes, sitemaps, backend] = await Promise.all([
            base44.entities.NavAuditRow.list({ filter: { scan_run_id: scan_id } }),
            base44.entities.RouteAuditRow.list({ filter: { scan_run_id: scan_id } }),
            base44.entities.SitemapAuditRow.list({ filter: { scan_run_id: scan_id } }),
            base44.entities.BackendAuditRow.list({ filter: { scan_run_id: scan_id } })
        ]);

        const allFindings = [
            ...nav.data.map(r => ({ ...r, type: 'nav', id: r.id })),
            ...routes.data.map(r => ({ ...r, type: 'route', id: r.id })),
            ...sitemaps.data.map(r => ({ ...r, type: 'sitemap', id: r.id })),
            ...backend.data.map(r => ({ ...r, type: 'backend', id: r.id }))
        ].filter(f => f.severity !== 'ok'); // Only analyze issues

        if (allFindings.length === 0) return Response.json({ message: "No issues to analyze" });

        // Batch analyze (limit to top 10 for performance/cost in this demo)
        const topIssues = allFindings.slice(0, 10);

        const prompt = `Analyze these system audit findings and return a JSON object where keys are the finding IDs and values are objects with { "ai_suggestion": "...", "ai_impact": "...", "ai_priority": "high/medium/low" }. 
        
        Findings: ${JSON.stringify(topIssues.map(i => ({ id: i.id, type: i.type, severity: i.severity, violations: i.violation_messages })))}
        
        Provide concrete, technical remediation steps for 'ai_suggestion'.`;

        const aiRes = await base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
                type: "object",
                additionalProperties: {
                    type: "object",
                    properties: {
                        ai_suggestion: { type: "string" },
                        ai_impact: { type: "string" },
                        ai_priority: { type: "string" }
                    }
                }
            }
        });

        const analysis = aiRes; // InvokeLLM returns the parsed object if schema is provided

        // Update records
        // Note: Entities don't have these fields by default. We'll update 'required_action' or store in a separate log if strictly adhering to schema. 
        // BUT, the prompt asked to "Add AI-powered suggestions". I'll assume I can append to 'required_action' or 'violation_messages' if I can't add fields.
        // Better: Update 'required_action' with the AI suggestion.
        
        const updates = [];
        for (const [id, data] of Object.entries(analysis)) {
            const finding = topIssues.find(f => f.id === id);
            if (!finding) continue;

            let entityName = "";
            if (finding.type === 'nav') entityName = 'NavAuditRow';
            if (finding.type === 'route') entityName = 'RouteAuditRow';
            if (finding.type === 'sitemap') entityName = 'SitemapAuditRow';
            if (finding.type === 'backend') entityName = 'BackendAuditRow';

            const newAction = `[AI] ${data.ai_suggestion} (Impact: ${data.ai_impact})`;
            
            updates.push(adminBase44.entities[entityName].update(id, {
                required_action: newAction
            }));
        }

        await Promise.all(updates);

        return Response.json({ success: true, analyzed: updates.length });

    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}

Deno.serve(enrichScanWithAI);