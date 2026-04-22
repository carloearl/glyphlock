import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const { lead_id, reason } = await req.json();
    if (!lead_id) return Response.json({ error: "Missing lead_id" }, { status: 400 });
    const base44 = createClientFromRequest(req);
    const status = reason === "completed" ? "COMPLETED" : "EXPIRED";
    await base44.asServiceRole.entities.DemoLead.update(lead_id, {
      session_status: status,
      session_ended_at: new Date().toISOString(),
    });
    return Response.json({ ok: true, status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});