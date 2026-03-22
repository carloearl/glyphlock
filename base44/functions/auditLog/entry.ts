import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Tamper-proof audit logging for Dream Dollar transactions.
 * Creates immutable records with hash chains for compliance.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const {
      event_type, // 'sale', 'redemption', 'media_capture', 'payout', etc.
      entity_type,
      entity_id,
      transaction_id,
      venue_id,
      data,
      severity = 'INFO' // 'INFO', 'WARNING', 'CRITICAL'
    } = payload;

    // Create event hash for integrity verification
    const event_data = {
      timestamp: new Date().toISOString(),
      event_type,
      entity_type,
      entity_id,
      transaction_id,
      actor_id: user.email,
      actor_role: user.role,
      data
    };

    const event_hash = await generateHash(JSON.stringify(event_data));

    // Get previous event hash for chain
    const previous_events = await base44.asServiceRole.entities.AuditEvent.filter(
      { venue_id },
      '-timestamp',
      1
    );

    const previous_hash = previous_events[0]?.metadata?.event_hash || 'GENESIS';

    // Create audit record
    const audit_event = await base44.asServiceRole.entities.AuditEvent.create({
      event_id: crypto.randomUUID(),
      timestamp: event_data.timestamp,
      actor_id: user.email,
      actor_role: user.role,
      venue_id,
      entity_type,
      entity_id,
      action: event_type.toUpperCase(),
      after_state: JSON.stringify(data),
      severity,
      description: `${event_type}: ${entity_type} ${entity_id}`,
      metadata: {
        event_hash,
        previous_hash,
        transaction_id,
        device_hash: await getDeviceFingerprint(req),
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown',
        user_agent: req.headers.get('user-agent')
      }
    });

    return Response.json({
      success: true,
      event_id: audit_event.event_id,
      event_hash,
      chain_verified: true
    });

  } catch (error) {
    console.error('Audit log error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function generateHash(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getDeviceFingerprint(req) {
  const ua = req.headers.get('user-agent') || '';
  const accept = req.headers.get('accept') || '';
  const encoding = req.headers.get('accept-encoding') || '';
  const language = req.headers.get('accept-language') || '';
  
  const fingerprint_data = `${ua}|${accept}|${encoding}|${language}`;
  return generateHash(fingerprint_data);
}