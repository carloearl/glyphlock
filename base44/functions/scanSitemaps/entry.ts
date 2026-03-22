import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const SITE_URL = "https://glyphlock.io";

const SITEMAP_TYPES = ["xml", "app", "qr", "images", "interactive", "dynamic"];

const httpProbe = async (path) => {
    const url = `${SITE_URL}${path}`;
    try {
        const res = await fetch(url);
        const text = await res.text();
        return { status_code: res.status, text };
    } catch (e) {
        return { status_code: 0, text: "" };
    }
};

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { scan_id } = await req.json();
        
        // Use service role
        const adminBase44 = base44.asServiceRole;
        
        const counts = { ok: 0, warning: 0, critical: 0 };

        for (const type of SITEMAP_TYPES) {
            // Note: sitemap-xml isn't a type, it's just sitemap.xml. But we follow the pattern.
            // Actually, mapped endpoints are likely:
            // /sitemap.xml (general)
            // /sitemap-qr.xml
            // etc.
            
            let humanPath = `/sitemap-${type}`;
            let xmlPath = `/sitemap-${type}.xml`;
            
            if (type === "xml") {
                 humanPath = "/SitemapXml"; // Matches the page we created
                 xmlPath = "/sitemap.xml";
            }

            const humanProbe = await httpProbe(humanPath);
            const xmlProbe = await httpProbe(xmlPath);

            let severity = "ok";
            let violations = [];
            let messages = [];
            let action = "none";

            // SITEMAP_001
            if (humanProbe.status_code !== 200) {
                severity = "critical";
                violations.push("SITEMAP_001");
                messages.push(`Missing human page: ${humanPath}`);
                action = "implement_page";
            }

            // SITEMAP_002
            if (xmlProbe.status_code !== 200) {
                severity = "critical";
                violations.push("SITEMAP_002");
                messages.push(`Missing XML endpoint: ${xmlPath}`);
                if (action === "none") action = "implement_backend";
            }

            // SITEMAP_003
            if (xmlProbe.text.includes("/editor/preview") || xmlProbe.text.includes("/apps/")) {
                severity = "critical";
                violations.push("SITEMAP_003");
                messages.push("Preview URLs leak in XML");
                action = "fix_backend_function";
            }

            if (severity === "ok") counts.ok++;
            else if (severity === "warning") counts.warning++;
            else counts.critical++;

            await adminBase44.entities.SitemapAuditRow.create({
                scan_run_id: scan_id,
                sitemap_type: type,
                url: humanPath,
                human_readable_url: humanPath,
                xml_url: xmlPath,
                human_exists: humanProbe.status_code === 200,
                xml_exists: xmlProbe.status_code === 200,
                contains_preview_urls: violations.includes("SITEMAP_003"),
                is_indexable: true, // Assumption
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