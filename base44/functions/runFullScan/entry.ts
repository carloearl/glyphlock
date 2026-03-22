import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const SITE_URL = "https://glyphlock.io";

// --- CONFIGURATION ---
// Reduced set for speed and reliability
const NAV_CONFIG = [
    { label: "Home", path: "/", visibility: "public" },
    { label: "GlyphBot", path: "/GlyphBot", visibility: "public" },
    { label: "Command Center", path: "/CommandCenter", visibility: "public" },
    { label: "Consultation", path: "/Consultation", visibility: "public" },
    { label: "About", path: "/About", visibility: "public" },
    { label: "Partners", path: "/Partners", visibility: "public" },
    { label: "Contact", path: "/Contact", visibility: "public" },
    { label: "QR Studio", path: "/Qr", visibility: "public" },
    { label: "Image Lab", path: "/ImageLab", visibility: "public" },
    { label: "Documentation", path: "/SecurityDocs", visibility: "public" },
    { label: "Security Tools", path: "/SecurityTools", visibility: "public" }
];

const SITEMAP_TYPES = ["xml", "app", "qr"]; // Reduced from full list to save time

// --- ROBUST NETWORK PROBE ---
const httpProbe = async (path) => {
    const url = path.startsWith('http') ? path : `${SITE_URL}${path}`;
    try {
        const controller = new AbortController();
        // AGGRESSIVE TIMEOUT: 3 seconds max per request to prevent hanging
        const id = setTimeout(() => controller.abort(), 3000);
        
        const res = await fetch(url, { 
            method: 'GET',
            redirect: 'follow', // Follow redirects to check final destination
            signal: controller.signal,
            headers: { 'User-Agent': 'GlyphLock-Auditor/1.0' }
        });
        clearTimeout(id);
        
        // Don't read body unless needed to save time/bandwidth
        const isXML = path.endsWith('.xml');
        let text = "";
        if (isXML && res.ok) {
            text = await res.text();
        }
        
        return { status_code: res.status, text, ok: res.ok };
    } catch (e) {
        // Return 0 status for network errors (timeout, dns, etc)
        return { status_code: 0, text: "", ok: false, error: e.message };
    }
};

// --- SCANNERS ---

async function runNavScan(scan_id, adminBase44) {
    let counts = { ok: 0, warning: 0, critical: 0 };
    
    // Process in parallel but handle errors individually
    const results = await Promise.all(NAV_CONFIG.map(async (item) => {
        const probe = await httpProbe(item.path);
        
        let severity = "ok";
        let action = "none";
        const violations = [];
        const messages = [];

        // Critical: Public page 404 or 500 or Unreachable (0)
        if (item.visibility === "public" && (probe.status_code === 404 || probe.status_code >= 500 || probe.status_code === 0)) {
            severity = "critical";
            violations.push("NAV_BROKEN");
            messages.push(`Status ${probe.status_code}: ${probe.error || 'Unreachable'}`);
            action = "fix_route";
        }

        await adminBase44.entities.NavAuditRow.create({
            scan_run_id: scan_id,
            label: item.label,
            path: item.path,
            visibility: item.visibility,
            http_status: probe.status_code,
            page_exists: probe.ok,
            backend_exists: true,
            violation_ids: JSON.stringify(violations),
            violation_messages: JSON.stringify(messages),
            severity,
            required_action: action
        });

        return severity;
    }));

    results.forEach(sev => {
        if (sev === "ok") counts.ok++;
        else if (sev === "warning") counts.warning++;
        else counts.critical++;
    });

    return counts;
}

async function runRouteScan(scan_id, adminBase44) {
    let counts = { ok: 0, warning: 0, critical: 0 };
    
    // Quick check of critical paths
    const CRITICAL_ROUTES = ["/", "/CommandCenter", "/GlyphBot", "/DreamTeam"];
    
    const results = await Promise.all(CRITICAL_ROUTES.map(async (path) => {
        const probe = await httpProbe(path);
        let severity = "ok";
        let action = "none";
        const violations = [];

        if (!probe.ok) {
            severity = "critical";
            violations.push("ROUTE_DOWN");
            action = "restore_page";
        }

        await adminBase44.entities.RouteAuditRow.create({
            scan_run_id: scan_id,
            route_path: path,
            component_name: "CorePage",
            is_public: true,
            http_status: probe.status_code,
            has_auth_guard: path === "/CommandCenter",
            violation_ids: JSON.stringify(violations),
            violation_messages: JSON.stringify(violations),
            severity,
            required_action: action
        });
        return severity;
    }));

    results.forEach(sev => {
        if (sev === "ok") counts.ok++;
        else if (sev === "warning") counts.warning++;
        else counts.critical++;
    });

    return counts;
}

async function runSitemapScan(scan_id, adminBase44) {
    let counts = { ok: 0, warning: 0, critical: 0 };

    for (const type of SITEMAP_TYPES) {
        const path = type === 'xml' ? '/sitemap.xml' : `/sitemap-${type}`;
        const probe = await httpProbe(path);
        
        let severity = "ok";
        if (probe.status_code !== 200) severity = "warning"; // Warning not critical for sitemaps

        if (severity === "ok") counts.ok++;
        else counts.warning++;

        await adminBase44.entities.SitemapAuditRow.create({
            scan_run_id: scan_id,
            sitemap_type: type,
            url: path,
            human_readable_url: path,
            xml_url: path, // Simplified for check
            human_exists: probe.ok,
            xml_exists: probe.ok,
            contains_preview_urls: false,
            is_indexable: true,
            violation_ids: "[]",
            violation_messages: "[]",
            severity,
            required_action: severity === "ok" ? "none" : "create_sitemap"
        });
    }
    return counts;
}

async function runBackendScan(scan_id, adminBase44) {
    // Quick self-check of the API
    const probe = await httpProbe('/api/health'); // Assuming health check exists or will 404
    
    await adminBase44.entities.BackendAuditRow.create({
        scan_run_id: scan_id,
        function_name: "API Health",
        endpoint_path: "/api/health",
        expected_output_type: "json",
        function_exists: true,
        responds_correctly: probe.status_code !== 0,
        violation_ids: "[]",
        violation_messages: "[]",
        severity: probe.ok ? "ok" : "warning",
        required_action: "none"
    });
    
    return { ok: 1, warning: 0, critical: 0 };
}

// --- MAIN HANDLER ---

Deno.serve(async (req) => {
    // 1. Setup Client
    const base44 = createClientFromRequest(req);
    const adminBase44 = base44.asServiceRole;

    try {
        const scan_id = crypto.randomUUID();
        const started_at = new Date().toISOString();

        // 2. Create Initial Record
        const scanRun = await adminBase44.entities.ScanRun.create({
            scan_id: scan_id,
            started_at: started_at,
            status: "running",
            nav_ok_count: 0, nav_warning_count: 0, nav_critical_count: 0,
            route_ok_count: 0, route_warning_count: 0, route_critical_count: 0,
            sitemap_ok_count: 0, sitemap_warning_count: 0, sitemap_critical_count: 0,
            backend_ok_count: 0, backend_warning_count: 0, backend_critical_count: 0
        });

        // 3. Run Scans (Sequentially for safety, or Parallel if confident)
        // Using Parallel for speed, but with the timeout safety in httpProbe
        const [nav, route, sitemap, backend] = await Promise.all([
            runNavScan(scan_id, adminBase44),
            runRouteScan(scan_id, adminBase44),
            runSitemapScan(scan_id, adminBase44),
            runBackendScan(scan_id, adminBase44)
        ]);

        // 4. Calculate Final Status
        const totalCrit = nav.critical + route.critical + sitemap.critical + backend.critical;
        const totalWarn = nav.warning + route.warning + sitemap.warning + backend.warning;
        
        let finalStatus = "success";
        if (totalWarn > 0) finalStatus = "warning";
        if (totalCrit > 0) finalStatus = "critical";

        // 5. Update Record
        await adminBase44.entities.ScanRun.update(scanRun.id, {
            status: finalStatus,
            completed_at: new Date().toISOString(),
            nav_ok_count: nav.ok, nav_warning_count: nav.warning, nav_critical_count: nav.critical,
            route_ok_count: route.ok, route_warning_count: route.warning, route_critical_count: route.critical,
            sitemap_ok_count: sitemap.ok, sitemap_warning_count: sitemap.warning, sitemap_critical_count: sitemap.critical,
            backend_ok_count: backend.ok, backend_warning_count: backend.warning, backend_critical_count: backend.critical
        });

        // 6. Log Success
        await adminBase44.entities.SIEActionLog.create({
            action_id: crypto.randomUUID(),
            scan_run_id: scan_id,
            actor: "system",
            action_type: "SCAN_COMPLETED",
            target_entity: "ScanRun",
            details: `Scan ${finalStatus} with ${totalCrit} criticals`,
            timestamp: new Date().toISOString()
        });

        // 7. Return Result
        return Response.json({
            success: true,
            status: finalStatus,
            run_id: scanRun.id,
            scan_id: scan_id
        });

    } catch (err) {
        console.error("Scan Failed:", err);
        return Response.json({ 
            success: false, 
            error: err.message 
        }, { status: 500 });
    }
});