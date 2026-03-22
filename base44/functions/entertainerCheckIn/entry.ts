import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { signature, entertainer_id, location } = await req.json();

    if (!signature || !entertainer_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get client IP and user agent
    const clientIP = req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Create shift record with digital signature
    const shift = await base44.asServiceRole.entities.EntertainerShift.create({
      entertainer_id,
      stage_name: user.full_name,
      check_in_time: new Date().toISOString(),
      location: location || "Main Floor",
      status: "checked_in",
      shift_earnings: 0,
      vip_sessions: 0,
    });

    // Update entertainer contract status (skip if entertainer_id is a user ID, not an Entertainer record)
    try {
      await base44.asServiceRole.entities.Entertainer.update(entertainer_id, {
        contract_signed: true,
        contract_signature: signature,
        contract_signed_date: new Date().toISOString(),
        contract_ip_address: clientIP,
        status: "active"
      });
    } catch (updateErr) {
      // Entertainer record may not exist yet if user is self-checking in
      console.warn('Entertainer update skipped:', updateErr.message);
    }

    // Log signature for non-repudiation via SystemAuditLog
    const sigHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(signature))
      .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''));

    await base44.asServiceRole.entities.SystemAuditLog.create({
      event_type: "ENTERTAINER_CONTRACT_SIGNED",
      description: `Entertainer ${user.full_name || user.email} signed contract`,
      actor_email: user.email,
      resource_id: entertainer_id,
      ip_address: clientIP,
      status: "success",
      severity: "low",
      metadata: {
        signature_hash: sigHash,
        user_agent: userAgent,
        timestamp: new Date().toISOString(),
      }
    });

    return Response.json({ 
      success: true, 
      shift_id: shift.id,
      message: 'Check-in successful. Contract digitally signed.' 
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});