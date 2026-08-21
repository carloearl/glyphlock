import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const {
      transaction_id,
      contract_barcode,
      venue_id,
      media_type, // 'photo', 'video', 'signature_capture', 'thumbprint'
      verification_type, // 'customer_signing', 'customer_receiving_bills', etc.
      evidence_id,
      geolocation
    } = payload;

    if (!evidence_id || !venue_id) {
      return Response.json({ error: 'Protected evidence reference and venue are required' }, { status: 400 });
    }
    const E = base44.asServiceRole.entities;
    const evidence = await E.ProtectedEvidence.get(evidence_id).catch(() => null);
    if (!evidence || evidence.venue_id !== venue_id) {
      return Response.json({ error: 'Protected evidence not found for this venue' }, { status: 403 });
    }
    const email = String(user.email || '').toLowerCase();
    const nups = (await E.NUPSUser.filter({ platform_email: email, status: 'active' }, null, 1).catch(() => []))?.[0] || null;
    const global = ['PLATFORM_ADMIN','SOVEREIGN'].includes(nups?.role);
    if (!nups || (!global && nups.venue_id !== venue_id)) {
      return Response.json({ error: 'Cross-venue verification media access denied' }, { status: 403 });
    }
    const media_url = `protected:${evidence.id}`;
    const media_hash = evidence.content_hash || '';

    // Create VerificationMedia record
    const media_id = `MEDIA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const media = await E.VerificationMedia.create({
      media_id,
      transaction_id,
      contract_barcode,
      venue_id,
      media_type,
      media_url,
      media_hash,
      media_size_bytes: 0,
      capture_timestamp: new Date().toISOString(),
      captured_by: user.email,
      verification_type,
      upload_status: 'completed',
      upload_verified_at: new Date().toISOString(),
      geolocation: geolocation || null
    });

    // Update barcode registry scan count
    const barcode = await E.BarcodeRegistry.filter({
      barcode_id: contract_barcode
    });

    if (barcode.length > 0) {
      await E.BarcodeRegistry.update(barcode[0].id, {
        scan_count: (barcode[0].scan_count || 0) + 1,
        last_scanned_at: new Date().toISOString(),
        last_scanned_by: user.email
      });
    }

    // Create audit log
    await E.AuditEvent.create({
      event_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      actor_id: user.email,
      actor_role: user.role,
      venue_id,
      entity_type: 'VerificationMedia',
      entity_id: media_id,
      action: 'CREATE',
      after_state: JSON.stringify({ media_type, verification_type }),
      description: `Verification media captured: ${verification_type}`
    });

    return Response.json({
      success: true,
      media,
      upload_verified: true
    });

  } catch (error) {
    console.error('Media capture error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function calculateHash(file) {
  // Placeholder - implement SHA-256 hashing
  return `SHA256-${Date.now()}`;
}