import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * PUSH NOTIFICATION SERVICE
 * Sends real-time alerts to staff devices via email/SMS
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { recipient_email, subject, message, priority, notification_type } = await req.json();

    // Send via email
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: recipient_email,
      subject: `[${priority}] ${subject}`,
      body: `
        <h2>${subject}</h2>
        <p><strong>Priority:</strong> ${priority}</p>
        <p><strong>Type:</strong> ${notification_type}</p>
        <hr>
        <p>${message}</p>
        <hr>
        <small>GlyphLock N.U.P.S. Alert System</small>
      `
    });

    // Log notification
    await base44.asServiceRole.entities.AuditEvent.create({
      event_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      actor_id: user.email,
      actor_role: user.role,
      entity_type: 'Notification',
      action: 'SENT',
      severity: priority === 'CRITICAL' ? 'CRITICAL' : 'INFO',
      description: `Push notification sent to ${recipient_email}: ${subject}`
    });

    return Response.json({ sent: true });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});