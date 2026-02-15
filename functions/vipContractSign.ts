import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { 
      token, signature, guest_name, serial_number,
      date_of_birth, government_id_type, government_id_number, government_id_state,
      card_last_four, card_type, phone,
      id_photo_url, id_photo_back_url, thumbprint_url
    } = body;

    if (!token || !signature || !guest_name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!thumbprint_url) {
      return Response.json({ error: 'Thumbprint scan is required' }, { status: 400 });
    }

    if (!id_photo_url) {
      return Response.json({ error: 'Government ID photo is required' }, { status: 400 });
    }

    if (!card_last_four || card_last_four.length !== 4) {
      return Response.json({ error: 'Last 4 digits of card required' }, { status: 400 });
    }

    // Retrieve and validate token
    const tokens = await base44.asServiceRole.entities.SecureDataHistory.filter({
      action_id: token,
      action_type: "vip_contract_token"
    });

    if (tokens.length === 0) {
      return Response.json({ error: 'Invalid contract token' }, { status: 400 });
    }

    const tokenData = tokens[0];
    const metadata = tokenData.metadata;

    if (new Date() > new Date(metadata.expires_at)) {
      return Response.json({ error: 'Contract link has expired' }, { status: 400 });
    }

    if (metadata.used) {
      return Response.json({ error: 'Contract has already been signed' }, { status: 400 });
    }

    // Client details
    const clientIP = req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const now = new Date().toISOString();

    // Hash functions
    async function sha256(input) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Generate hashes for biometric data
    const signatureHash = await sha256(signature);
    const thumbprintHash = await sha256(`${thumbprint_url}:${guest_name}:${serial_number}`);
    const idHash = await sha256(`${government_id_number}:${guest_name}:${date_of_birth}`);
    const contractHash = await sha256(`${serial_number}:${guest_name}:${card_last_four}:${thumbprintHash}:${signatureHash}:${now}`);

    // Mark token as used
    await base44.asServiceRole.entities.SecureDataHistory.update(tokenData.id, {
      metadata: {
        ...metadata,
        used: true,
        signed_at: now,
        signed_by: guest_name,
        signature_ip: clientIP,
        serial_number,
        contract_hash: contractHash,
      }
    });

    // Create full VIP guest record with biometrics
    const guestRecord = await base44.asServiceRole.entities.VIPGuest.create({
      guest_name,
      date_of_birth,
      phone: phone || undefined,
      government_id_type,
      government_id_number,
      government_id_state: government_id_state || undefined,
      id_photo_url,
      id_photo_back_url: id_photo_back_url || undefined,
      card_last_four,
      card_type: card_type || 'Visa',
      payment_method_on_file: true,
      status: "in_building",
      current_location: "VIP Area",
      check_in_time: now,
      total_spent_tonight: 0,
      lifetime_spent: 0,
      visit_count: 1,
      contract_signed: true,
      contract_signed_date: now,
      contract_version: "2.0-biometric",
      contract_signature: signature,
      contract_signature_hash: signatureHash,
      contract_ip_address: clientIP,
      contract_device_fingerprint: userAgent,
      thumbprint_captured: true,
      thumbprint_hash: thumbprintHash,
      signature_image_url: undefined,
      verification_status: "verified",
      id_verified_date: now,
      membership_number: serial_number,
    });

    // Log full biometric contract signature audit trail
    await base44.asServiceRole.entities.SecureDataHistory.create({
      action_id: `vip_biometric_${serial_number}`,
      action_type: "vip_contract_signature",
      payload: JSON.stringify({
        serial_number,
        guest_name,
        card_last_four,
        card_type,
        government_id_type,
        government_id_state,
        thumbprint_captured: true,
        id_front_captured: true,
        id_back_captured: !!id_photo_back_url,
      }),
      user_id: guest_name,
      metadata: {
        serial_number,
        guest_record_id: guestRecord.id,
        signature_hash: signatureHash,
        thumbprint_hash: thumbprintHash,
        id_hash: idHash,
        contract_hash: contractHash,
        ip_address: clientIP,
        user_agent: userAgent,
        timestamp: now,
        booking_id: metadata.booking_id,
        contract_token: token,
        biometric_version: "2.0",
        thumbprint_url,
        id_photo_url,
        id_photo_back_url: id_photo_back_url || null,
      },
      status: "safe"
    });

    return Response.json({ 
      success: true,
      serial_number,
      guest_id: guestRecord.id,
      contract_hash: contractHash,
      message: 'Contract signed with biometric verification. Welcome to VIP.'
    });
  } catch (error) {
    console.error('VIP contract signing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});