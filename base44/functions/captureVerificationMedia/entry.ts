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
      media_file,
      geolocation
    } = payload;

    // Upload media file
    const upload_result = await base44.integrations.Core.UploadFile({
      file: media_file
    });

    const media_url = upload_result.file_url;

    // Calculate file hash (in production, do this server-side)
    const media_hash = await calculateHash(media_file);

    // Create VerificationMedia record
    const media_id = `MEDIA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const media = await base44.asServiceRole.entities.VerificationMedia.create({
      media_id,
      transaction_id,
      contract_barcode,
      venue_id,
      media_type,
      media_url,
      media_hash,
      media_size_bytes: media_file.size,
      capture_timestamp: new Date().toISOString(),
      captured_by: user.email,
      verification_type,
      upload_status: 'completed',
      upload_verified_at: new Date().toISOString(),
      geolocation: geolocation || null
    });

    // Update barcode registry scan count
    const barcode = await base44.asServiceRole.entities.BarcodeRegistry.filter({
      barcode_id: contract_barcode
    });

    if (barcode.length > 0) {
      await base44.asServiceRole.entities.BarcodeRegistry.update(barcode[0].id, {
        scan_count: (barcode[0].scan_count || 0) + 1,
        last_scanned_at: new Date().toISOString(),
        last_scanned_by: user.email
      });
    }

    // Create audit log
    await base44.asServiceRole.entities.AuditEvent.create({
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