import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { threat_id, recipients, alert_type, severity } = await req.json();

    if (!threat_id || !recipients || recipients.length === 0) {
      return Response.json({ error: 'Threat ID and recipients are required' }, { status: 400 });
    }

    // Get threat details
    const threats = await base44.entities.HotzoneThreat.filter({ id: threat_id });
    if (!threats || threats.length === 0) {
      return Response.json({ error: 'Threat not found' }, { status: 404 });
    }

    const threat = threats[0];

    // Send email alerts
    const emailResults = [];
    for (const recipient of recipients) {
      try {
        await base44.integrations.Core.SendEmail({
          from_name: 'GlyphLock Security Alert',
          to: recipient,
          subject: `🚨 Security Alert: ${threat.threat_type} - ${threat.severity.toUpperCase()}`,
          body: `
SECURITY ALERT NOTIFICATION

Incident ID: ${threat_id}
Threat Type: ${threat.threat_type}
Severity: ${threat.severity.toUpperCase()}
Status: ${threat.status}

Location: ${threat.hotspot_name}
Description: ${threat.description}

Detection Method: ${threat.detection_method}
Detected: ${threat.created_date}

Priority: ${threat.priority}/10

RECOMMENDED ACTIONS:
${threat.resolution_notes || 'Please review the threat details in the Security Operations Center.'}

---
This is an automated alert from GlyphLock Security System.
For immediate assistance, contact your security team.
          `
        });
        
        emailResults.push({ recipient, status: 'sent' });
      } catch (error) {
        emailResults.push({ recipient, status: 'failed', error: error.message });
      }
    }

    return Response.json({
      success: true,
      alert_id: `alert_${Date.now()}`,
      threat_id: threat_id,
      recipients_notified: emailResults.filter(r => r.status === 'sent').length,
      failed: emailResults.filter(r => r.status === 'failed').length,
      details: emailResults
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});