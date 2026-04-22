import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const { lead_id, action, source_route, device_fingerprint } = await req.json();
    if (!lead_id || !action) {
      return Response.json({ error: "Missing lead_id or action" }, { status: 400 });
    }
    const base44 = createClientFromRequest(req);
    const lead = await base44.asServiceRole.entities.DemoLead.get(lead_id);
    if (!lead) return Response.json({ error: "Lead not found" }, { status: 404 });

    const entry = {
      timestamp: new Date().toISOString(),
      action: String(action).slice(0, 120),
      source_route: source_route || "unknown",
      device_fingerprint: device_fingerprint || "unknown",
    };
    const log = Array.isArray(lead.action_log) ? [...lead.action_log, entry] : [entry];
    await base44.asServiceRole.entities.DemoLead.update(lead_id, { action_log: log });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});