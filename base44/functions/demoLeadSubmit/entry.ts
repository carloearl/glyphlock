import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { full_name, email, venue_name, session_token, user_agent } = body;

    if (!full_name || !email || !venue_name || !session_token) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Basic email validation
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(email)) {
      return Response.json({ error: "Invalid email format" }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const ip_address = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";

    // Create lead (service role — this is a public form, no auth required)
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
      action_log: [],
    });

    // Fire-and-log follow-up email via Core SendEmail
    let dispatchStatus = "SENT";
    let dispatchError = null;
    try {
      const subject = "Thanks for experiencing NUPS";
      const textBody = `Hi ${full_name},

Thanks for taking NUPS for a live drive.

What you just saw is the same platform operating at Dream Palace right now — built by GlyphLock to replace the patchwork of POS, schedule, compliance, and cash-handling tools that venue operators have been stitching together for years.

If NUPS looks like it could fit ${venue_name}, reply to this email and we will set up a 20-minute working session.

— Carlo Rodriguez
  Founder, GlyphLock LLC

---
GlyphLock LLC · Arizona · Multiple Patents Pending
To unsubscribe, reply with "unsubscribe".`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: "GlyphLock / NUPS",
        to: email,
        subject,
        body: textBody,
      });
    } catch (emailErr) {
      dispatchStatus = "FAILED";
      dispatchError = String(emailErr?.message || emailErr).slice(0, 500);
    }

    await base44.asServiceRole.entities.DemoLead.update(lead.id, {
      email_dispatch_status: dispatchStatus,
      ...(dispatchError ? { email_dispatch_error: dispatchError } : {}),
    });

    return Response.json({
      lead_id: lead.id,
      session_token: lead.session_token,
      email_dispatch_status: dispatchStatus,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});