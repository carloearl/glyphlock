import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { Client } from "npm:@notionhq/client@2.2.14";

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { action, payload } = await req.json();

        // --- AI GENERATION (No Notion Auth Required) ---
        if (action === "generate_draft") {
             const adminBase44 = base44.asServiceRole;
             
             // Fetch recent context
             const [scans, logs] = await Promise.all([
                 adminBase44.entities.ScanRun.list({ sort: { started_at: -1 }, limit: 1 }),
                 adminBase44.entities.SystemAuditLog.list({ sort: { timestamp: -1 }, limit: 5 })
             ]);
             
             const latestScan = scans?.[0];
             
             let context = "Project: GlyphLock Security Platform\n";
             context += `Date: ${new Date().toLocaleDateString()}\n\n`;
             
             if (latestScan) {
                 context += `LATEST SYSTEM SCAN (${new Date(latestScan.started_at).toLocaleDateString()}):\n`;
                 context += `- Status: ${latestScan.status}\n`;
                 context += `- Security Critical Issues: ${latestScan.security_critical_count}\n`;
                 context += `- Global Health: ${latestScan.status === 'success' ? 'Optimal' : 'Needs Attention'}\n`;
             }
             
             if (logs && logs.length > 0) {
                 context += `\nRECENT SYSTEM ACTIVITY:\n`;
                 logs.forEach(l => context += `- ${l.action_type}: ${l.details}\n`);
             }

             const prompt = `You are a project manager for GlyphLock. Write a concise, professional project update based on the following system data:\n\n${context}\n\nFormat the content as a summary of current status, recent events, and general stability. Keep it under 200 words.`;

             const llmRes = await base44.integrations.Core.InvokeLLM({
                 prompt,
                 response_json_schema: {
                     type: "object",
                     properties: {
                         title: { type: "string", description: "A catchy title for the update, e.g., 'Weekly Security Report - Oct 25'" },
                         content: { type: "string", description: "The body of the update" }
                     }
                 }
             });

             return Response.json(llmRes);
        }

        // --- NOTION OPERATIONS (Require Auth) ---
        const accessToken = await base44.asServiceRole.connectors.getAccessToken("notion");
        
        if (!accessToken) {
            // Only fail if we are trying to do notion stuff
            return Response.json({ error: "Notion not connected", connected: false }, { status: 401 });
        }

        const notion = new Client({ auth: accessToken });

        if (action === "list_resources") {
            const response = await notion.search({
                filter: { value: 'page', property: 'object' },
                sort: { direction: 'descending', timestamp: 'last_edited_time' }
            });
            
            return Response.json({ 
                connected: true, 
                results: response.results
                    .filter(p => p.object === 'page' || p.object === 'database')
                    .map(p => {
                        let title = "Untitled";
                        if (p.properties?.title?.title?.[0]?.plain_text) title = p.properties.title.title[0].plain_text;
                        else if (p.properties?.Name?.title?.[0]?.plain_text) title = p.properties.Name.title[0].plain_text;
                        
                        return {
                            id: p.id,
                            title,
                            url: p.url,
                            type: p.object
                        };
                    })
            });
        }

        if (action === "post_update") {
            const { parentId, title, content } = payload;
            
            if (!parentId) return Response.json({ error: "Parent ID required" }, { status: 400 });

            // Create page
            const response = await notion.pages.create({
                parent: { page_id: parentId },
                properties: {
                    title: {
                        title: [
                            {
                                text: {
                                    content: title || `Update - ${new Date().toLocaleDateString()}`,
                                },
                            },
                        ],
                    },
                },
                children: [
                    {
                        object: 'block',
                        type: 'paragraph',
                        paragraph: {
                            rich_text: [
                                {
                                    type: 'text',
                                    text: {
                                        content: content,
                                    },
                                },
                            ],
                        },
                    },
                ],
            });

            return Response.json({ success: true, url: response.url });
        }

        return Response.json({ error: "Invalid action" }, { status: 400 });

    } catch (error) {
        console.error("Notion Error:", error);
        return Response.json({ 
            error: error.message, 
            details: error.body || "Unknown error" 
        }, { status: 500 });
    }
});