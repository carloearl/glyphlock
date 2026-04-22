/**
 * demoRequestWalkthrough — Captures a secondary lead from a preview page's
 * "Request Live Walkthrough" CTA. Creates a new DemoLead with referral_source
 * set, and dispatches the same SendGrid follow-up email as demoLeadSubmit.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const SENDGRID_FROM_EMAIL = Deno.env.get("SENDGRID_FROM_EMAIL");

async function sendViaSendGrid({ to, full_name, venue_name, note, referral_source }) {
  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
    throw new Error("SendGrid not configured");
  }
  const subject = "Thanks for requesting a NUPS walkthrough";
  const text = `Hi ${full_name},

Thanks for requesting a live walkthrough of the ${referral_source.replace(/-preview$/, "").replace(/-/g, " ")} module.

We'll reach out within one business day to book a 20-minute working session.

${note ? `Your note:\n"${note}"\n\n` : ""}— Carlo Rodriguez
  Founder, GlyphLock LLC

---
GlyphLock LLC · Arizona · USPTO Multiple Patents Pending`;

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to, name: full_name }] }],
      from: { email: SENDGRID_FROM_EMAIL, name: "GlyphLock / NUPS" },
      reply_to: { email: SENDGRID_FROM_EMAIL, name: "GlyphLock / NUPS" },
      subject,
      content: [{ type: "text/plain", value: text }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SendGrid ${res.status}: ${body.slice(0, 300)}`);
  }
  return { provider_message_id: res.headers.get("x-message-id") || null };
}

Deno.serve(async (req) => {
  try {
    const { full_name, email, note, referral_source, session_token, parent_lead_id } = await req.json();

    if (!full_name || !email || !referral_source) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(email)) {
      return Response.json({ error: "Invalid email format" }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const ip_address = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";

    // Create a new DemoLead for the walkthrough request. Preserve the active
    // session_token so ops can tie the walkthrough lead back to the original gate lead.
    const venue_name = note ? `(walkthrough request) ${String(note).slice(0, 60)}` : "(walkthrough request)";
    const walkthroughToken = `wt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    const lead = await base44.asServiceRole.entities.DemoLead.create({
      full_name,
      email,
      venue_name,
      session_token: session_token || walkthroughToken,
      referral_source,
      session_status: "ACTIVE",
      session_started_at: new Date().toISOString(),
      ip_address,
      user_agent: req.headers.get("user-agent") || "unknown",
      email_dispatch_status: "PENDING",
      email_transport: "NONE",
      action_log: [
        {
          timestamp: new Date().toISOString(),
          action: "walkthrough_request_submit",
          source_route: referral_source,
          device_fingerprint: "server",
        },
      ],
    });

    // Also append a note to the parent lead so ops can see the tie-back
    if (parent_lead_id) {
      try {
        const parent = await base44.asServiceRole.entities.DemoLead.get(parent_lead_id);
        if (parent) {
          const log = Array.isArray(parent.action_log) ? [...parent.action_log] : [];
          log.push({
            timestamp: new Date().toISOString(),
            action: `walkthrough_requested:${referral_source}`,
            source_route: referral_source,
            device_fingerprint: `child_lead=${lead.id}`,
          });
          await base44.asServiceRole.entities.DemoLead.update(parent_lead_id, { action_log: log });
        }
      } catch (_) { /* non-blocking */ }
    }

    let transport = "SENDGRID";
    let status = "SENT";
    let detail = null;
    let sent_at = null;

    try {
      const result = await sendViaSendGrid({
        to: email,
        full_name,
        venue_name,
        note: note || "",
        referral_source,
      });
      sent_at = new Date().toISOString();
      detail = result.provider_message_id ? `sendgrid_msg_id=${result.provider_message_id}` : "delivered";
    } catch (err) {
      transport = "FAILED";
      status = "FAILED";
      detail = String(err?.message || err).slice(0, 500);
    }

    await base44.asServiceRole.entities.DemoLead.update(lead.id, {
      email_dispatch_status: status,
      email_transport: transport,
      email_dispatch_detail: detail,
      ...(sent_at ? { email_sent_at: sent_at } : {}),
      ...(status === "FAILED" ? { email_dispatch_error: detail } : {}),
    });

    return Response.json({
      lead_id: lead.id,
      email_dispatch_status: status,
      email_transport: transport,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});