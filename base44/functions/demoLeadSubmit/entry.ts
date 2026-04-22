import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const SENDGRID_FROM_EMAIL = Deno.env.get("SENDGRID_FROM_EMAIL");

function buildEmailBody({ full_name, venue_name }) {
  const subject = "Thanks for experiencing NUPS";
  const text = `Hi ${full_name},

Thanks for taking NUPS for a live drive.

What you just saw is the same platform operating at Dream Palace right now — built by GlyphLock to replace the patchwork of POS, schedule, compliance, and cash-handling tools that venue operators have been stitching together for years.

If NUPS looks like it could fit ${venue_name}, reply to this email and we will set up a 20-minute working session.

— Carlo Rodriguez
  Founder, GlyphLock LLC

---
GlyphLock LLC · Arizona · USPTO Multiple Patents Pending
To unsubscribe, reply with "unsubscribe".`;

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#0a0a0b;font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif;color:#fafafa;">
  <div style="max-width:560px;margin:0 auto;padding:48px 32px;">
    <div style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#eab308;font-weight:600;margin-bottom:8px;">GlyphLock / NUPS</div>
    <h1 style="font-size:24px;font-weight:700;margin:0 0 24px;color:#fafafa;letter-spacing:-0.01em;">Thanks for experiencing NUPS</h1>
    <p style="font-size:15px;line-height:1.6;color:#d4d4d4;margin:0 0 16px;">Hi ${full_name},</p>
    <p style="font-size:15px;line-height:1.6;color:#d4d4d4;margin:0 0 16px;">Thanks for taking NUPS for a live drive.</p>
    <p style="font-size:15px;line-height:1.6;color:#d4d4d4;margin:0 0 16px;">What you just saw is the same platform operating at Dream Palace right now — built by GlyphLock to replace the patchwork of POS, schedule, compliance, and cash-handling tools that venue operators have been stitching together for years.</p>
    <p style="font-size:15px;line-height:1.6;color:#d4d4d4;margin:0 0 24px;">If NUPS looks like it could fit <strong style="color:#fafafa;">${venue_name}</strong>, reply to this email and we will set up a 20-minute working session.</p>
    <p style="font-size:15px;line-height:1.6;color:#d4d4d4;margin:0 0 4px;">— Carlo Rodriguez</p>
    <p style="font-size:13px;color:#a3a3a3;margin:0 0 32px;">Founder, GlyphLock LLC</p>
    <hr style="border:none;border-top:1px solid rgba(234,179,8,0.2);margin:0 0 16px;" />
    <p style="font-size:11px;letter-spacing:0.1em;color:#737373;margin:0;">GlyphLock LLC · Arizona · USPTO Multiple Patents Pending</p>
    <p style="font-size:11px;color:#737373;margin:4px 0 0;">To unsubscribe, reply with "unsubscribe".</p>
  </div>
</body></html>`;

  return { subject, text, html };
}

async function sendViaSendGrid({ to, full_name, venue_name }) {
  if (!SENDGRID_API_KEY) throw new Error("SENDGRID_API_KEY not set");
  if (!SENDGRID_FROM_EMAIL) throw new Error("SENDGRID_FROM_EMAIL not set");

  const { subject, text, html } = buildEmailBody({ full_name, venue_name });

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
      content: [
        { type: "text/plain", value: text },
        { type: "text/html", value: html },
      ],
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
    const body = await req.json();
    const { full_name, email, venue_name, session_token, user_agent, referral_source } = body;

    if (!full_name || !email || !venue_name || !session_token) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(email)) {
      return Response.json({ error: "Invalid email format" }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const ip_address = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";

    const lead = await base44.asServiceRole.entities.DemoLead.create({
      full_name,
      email,
      venue_name,
      session_token,
      session_status: "ACTIVE",
      session_started_at: new Date().toISOString(),
      ip_address,
      user_agent: user_agent || req.headers.get("user-agent") || "unknown",
      email_dispatch_status: "PENDING",
      email_transport: "NONE",
      referral_source: referral_source || null,
      action_log: [],
    });

    let transport = "SENDGRID";
    let status = "SENT";
    let detail = null;
    let sent_at = null;

    try {
      const result = await sendViaSendGrid({ to: email, full_name, venue_name });
      sent_at = new Date().toISOString();
      detail = result.provider_message_id ? `sendgrid_msg_id=${result.provider_message_id}` : "delivered";
    } catch (sgErr) {
      transport = "FAILED";
      status = "FAILED";
      detail = String(sgErr?.message || sgErr).slice(0, 500);
    }

    await base44.asServiceRole.entities.DemoLead.update(lead.id, {
      email_dispatch_status: status,
      email_transport: transport,
      email_dispatch_detail: detail,
      ...(sent_at ? { email_sent_at: sent_at } : {}),
      ...(status === "FAILED" ? { email_dispatch_error: detail } : {}),
    });

    // Non-blocking: return 200 even on email failure so prospect enters demo (per B.7)
    return Response.json({
      lead_id: lead.id,
      session_token: lead.session_token,
      email_dispatch_status: status,
      email_transport: transport,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});