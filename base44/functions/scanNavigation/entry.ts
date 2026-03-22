import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const SITE_URL = "https://glyphlock.io"; // Canonical

// Hardcoded Navigation Config (Mirror of components/NavigationConfig.js)
const NAV_CONFIG = [
    { label: "Home", path: "/", visibility: "public" },
    { label: "Dream Team", path: "/DreamTeam", visibility: "public" },
    { label: "GlyphBot", path: "/GlyphBot", visibility: "public" },
    { label: "Media Hub", path: "/VideoUpload", visibility: "public" },
    { label: "Command Center", path: "/CommandCenter", visibility: "public" },
    { label: "Protocol Verification", path: "/Consultation", visibility: "public" },
    // From NAV_SECTIONS flattened
    { label: "About Us", path: "/About", visibility: "public" },
    { label: "Partners", path: "/Partners", visibility: "public" },
    { label: "Contact", path: "/Contact", visibility: "public" },
    { label: "Accessibility", path: "/Accessibility", visibility: "public" },
    { label: "QR Verification", path: "/Qr", visibility: "public" },
    { label: "Image Processing", path: "/ImageLab", visibility: "public" },
    { label: "NUPS Transaction Verification", path: "/NUPSLogin", visibility: "public" },
    { label: "Security Modules", path: "/SecurityTools", visibility: "public" },
    { label: "SDK Documentation", path: "/SDKDocs", visibility: "public" },
    { label: "Site Intelligence", path: "/Sie", visibility: "admin" },
    { label: "Master Covenant", path: "/GovernanceHub", visibility: "public" },
    { label: "Trust & Security", path: "/TrustSecurity", visibility: "public" },
    { label: "NIST Challenge", path: "/NISTChallenge", visibility: "public" },
    { label: "Case Studies", path: "/CaseStudies", visibility: "public" },
    { label: "Documentation", path: "/SecurityDocs", visibility: "public" },
    { label: "FAQ", path: "/FAQ", visibility: "public" },
    { label: "Roadmap", path: "/Roadmap", visibility: "public" },
    { label: "Site Map", path: "/SitemapXml", visibility: "public" },
    { label: "Security Settings", path: "/AccountSecurity", visibility: "public" }
];

const httpProbe = async (path) => {
    const url = path.startsWith('http') ? path : `${SITE_URL}${path}`;
    const start = Date.now();
    try {
        const res = await fetch(url, { redirect: 'manual' }); 
        return {
            status_code: res.status,
            response_time: Date.now() - start,
            accessible: res.status >= 200 && res.status < 400
        };
    } catch (e) {
        return {
            status_code: 0,
            response_time: Date.now() - start,
            accessible: false,
            error: e.message
        };
    }
};

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { scan_id } = await req.json();

        // Use service role for writing audit rows
        const adminBase44 = base44.asServiceRole;

        let counts = { ok: 0, warning: 0, critical: 0 };

        for (const item of NAV_CONFIG) {
            const probe = await httpProbe(item.path);
            
            // Rules
            const violations = [];
            const messages = [];
            let severity = "ok";
            let action = "none";

            // NAV_001
            if (item.visibility === "public" && probe.status_code === 404) {
                violations.push("NAV_001");
                messages.push(`Public nav item ${item.path} returns 404`);
                severity = "critical";
                action = "fix_route";
            }

            // NAV_010
            if (probe.status_code >= 500) {
                violations.push("NAV_010");
                messages.push("Server Error");
                severity = "critical";
                action = "fix_route";
            }

            if (severity === "ok") counts.ok++;
            else if (severity === "warning") counts.warning++;
            else counts.critical++;

            await adminBase44.entities.NavAuditRow.create({
                scan_run_id: scan_id,
                label: item.label,
                path: item.path,
                visibility: item.visibility,
                http_status: probe.status_code,
                page_exists: probe.status_code !== 404,
                backend_exists: true, 
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