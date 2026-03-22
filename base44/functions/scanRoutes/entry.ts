import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const SITE_URL = "https://glyphlock.io";

const httpProbe = async (path) => {
    const url = path.startsWith('http') ? path : `${SITE_URL}${path}`;
    try {
        const res = await fetch(url, { redirect: 'manual' });
        return { status_code: res.status };
    } catch (e) {
        return { status_code: 0 };
    }
};

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { scan_id } = await req.json();

        // Use service role
        const adminBase44 = base44.asServiceRole;

        // 1. Fetch Sitemap to discover routes
        let routes = [];
        try {
            // Invoke the sitemap function directly to get the XML
            // We can assume sitemapXml function exists
            const sitemapRes = await fetch(`${SITE_URL}/api/apps/functions/sitemapXml`);
            if (sitemapRes.ok) {
                const xml = await sitemapRes.text();
                // Extract <loc> URLs
                const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)];
                routes = matches.map(m => m[1].replace(SITE_URL, ""));
            } else {
                // Fallback to basic list if sitemap fails
                 routes = ["/", "/About", "/Contact", "/DreamTeam", "/GlyphBot"];
            }
        } catch (e) {
             routes = ["/", "/About", "/Contact", "/DreamTeam", "/GlyphBot"];
        }

        const counts = { ok: 0, warning: 0, critical: 0 };

        for (const path of routes) {
            // Clean path
            const cleanPath = path.trim();
            if (!cleanPath) continue;

            const probe = await httpProbe(cleanPath);
            
            let severity = "ok";
            let violations = [];
            let messages = [];
            let action = "none";

            // Check for 500s
            if (probe.status_code >= 500) {
                severity = "critical";
                violations.push("ROUTE_ERROR");
                messages.push("Page returns 500");
                action = "fix_route";
            }
            
            // Check for 404s on supposed sitemap routes
            if (probe.status_code === 404) {
                severity = "warning";
                violations.push("ROUTE_MISSING");
                messages.push("Route in sitemap but returns 404");
                action = "fix_route";
            }

            if (severity === "ok") counts.ok++;
            else if (severity === "warning") counts.warning++;
            else counts.critical++;

            await adminBase44.entities.RouteAuditRow.create({
                scan_run_id: scan_id,
                route_path: cleanPath,
                component_name: "Unknown", // Can't determine without FS access
                is_public: true, 
                http_status: probe.status_code,
                has_auth_guard: false, 
                violation_ids: JSON.stringify(violations),
                violation_messages: JSON.stringify(messages),
                severity,
                required_action: action
            });
        }

        return Response.json(counts);
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});