import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

export default async function sieOps(req) {
    const base44 = createClientFromRequest(req);
    const adminBase44 = base44.asServiceRole;

    try {
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { action, payload } = body;

        // MIDDLEWARE LAYER: Orchestrates data access bypassing strict RLS for auth'd users
        
        if (action === "get_dashboard") {
            // Fetch history and config in parallel
            const [history, configList] = await Promise.all([
                adminBase44.entities.ScanRun.list('-started_at', 20),
                adminBase44.entities.ScanConfig.list('-created_date', 1)
            ]);
            
            // Standardize response format (SDK returns array directly, not {data: []})
            // NOTE: Newer SDK versions might return {data, count} or just array. 
            // Based on prompt "base44.entities.Todo.list() will return the list of entities." it returns array.
            const historyRes = { data: Array.isArray(history) ? history : history.data || [] };
            const configRes = { data: Array.isArray(configList) ? configList : configList.data || [] };

            let config = configRes.data?.[0] || {
                schedule_type: "manual",
                trigger_on_deploy: false,
                trigger_on_sitemap: false,
                webhook_secret: crypto.randomUUID(),
                is_active: true
            };

            return Response.json({
                history: historyRes.data || [],
                config: config
            });
        }

        if (action === "get_scan_details") {
            const { scan_id } = payload;
            if (!scan_id) return Response.json({ error: "Missing scan_id" }, { status: 400 });

            // Fetch all audit rows for this scan (using filter, not list)
            const [nav, routes, sitemaps, backend] = await Promise.all([
                adminBase44.entities.NavAuditRow.filter({ scan_run_id: scan_id }, '-created_date', 100),
                adminBase44.entities.RouteAuditRow.filter({ scan_run_id: scan_id }, '-created_date', 100),
                adminBase44.entities.SitemapAuditRow.filter({ scan_run_id: scan_id }, '-created_date', 100),
                adminBase44.entities.BackendAuditRow.filter({ scan_run_id: scan_id }, '-created_date', 100)
            ]);

            // Handle SDK return types (Array or {data: Array})
            const getItems = (res) => Array.isArray(res) ? res : (res.data || []);

            return Response.json({
                nav: getItems(nav),
                routes: getItems(routes),
                sitemaps: getItems(sitemaps),
                backend: getItems(backend)
            });
        }

        if (action === "save_config") {
            const { config } = payload;
            let result;
            if (config.id) {
                result = await adminBase44.entities.ScanConfig.update(config.id, config);
            } else {
                result = await adminBase44.entities.ScanConfig.create(config);
            }
            return Response.json(result);
        }

        return Response.json({ error: "Invalid action" }, { status: 400 });

    } catch (e) {
        console.error("SIE Ops Error:", e);
        return Response.json({ error: e.message }, { status: 500 });
    }
}

Deno.serve(sieOps);