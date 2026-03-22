import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { data } = await base44.functions.invoke("generateSitemapXML", { type: "interactive" });
    return new Response(data.xml, { headers: { "Content-Type": "application/xml" } });
});