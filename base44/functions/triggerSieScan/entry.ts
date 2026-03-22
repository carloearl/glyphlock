import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

export default async function triggerSieScan(req) {
    const base44 = createClientFromRequest(req);
    const adminBase44 = base44.asServiceRole;

    try {
        const { secret, type } = await req.json();

        // Verify Secret
        const configs = await adminBase44.entities.ScanConfig.list({ limit: 1 });
        const config = configs.data[0];

        if (!config || config.webhook_secret !== secret) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!config.is_active) {
            return Response.json({ error: "Scanning disabled" }, { status: 400 });
        }

        // Trigger Full Scan
        // We reuse runFullScan logic by calling it internally or just invoking it
        // Since runFullScan expects a request, we can just call it via SDK
        const scanRes = await adminBase44.functions.invoke("runFullScan");

        // Update last run
        await adminBase44.entities.ScanConfig.update(config.id, {
            last_run: new Date().toISOString()
        });

        return Response.json({ 
            success: true, 
            scan_id: scanRes.data.scan_id, 
            trigger: type || "manual_webhook" 
        });

    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}

Deno.serve(triggerSieScan);