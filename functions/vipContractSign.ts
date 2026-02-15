import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { 
      token, signature, guest_name, serial_number,
      date_of_birth, government_id_type, government_id_number, government_id_state,
      card_last_four, card_type, phone,
      id_photo_url, id_photo_back_url, thumbprint_url, guest_photo_url,
      host_name, host_signature, manager_name, manager_signature
    } = body;

    if (!token || !signature || !guest_name) {
      return Response.json({ error: 'Missing required fields: token, signature, guest_name' }, { status: 400 });
    }
    if (!host_name || !host_signature) {
      return Response.json({ error: 'Host signature is required' }, { status: 400 });
    }
    if (!manager_name || !manager_signature) {
      return Response.json({ error: 'Manager signature is required' }, { status: 400 });
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

    // Retrieve and validate token from VIPContractRecord
    const records = await base44.asServiceRole.entities.VIPContractRecord.filter({
      token: token,
      record_type: "contract_token"
    });

    if (records.length === 0) {
      return Response.json({ error: 'Invalid contract token' }, { status: 400 });
    }

    const tokenRecord = records[0];

    if (tokenRecord.expires_at && new Date() > new Date(tokenRecord.expires_at)) {
      await base44.asServiceRole.entities.VIPContractRecord.update(tokenRecord.id, { status: "expired" });
      return Response.json({ error: 'Contract link has expired' }, { status: 400 });
    }

    if (tokenRecord.used) {
      return Response.json({ error: 'Contract has already been signed' }, { status: 400 });
    }

    const clientIP = req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const now = new Date().toISOString();

    // SHA-256 hash helper
    async function sha256(input) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    const signatureHash = await sha256(signature);
    const hostSignatureHash = await sha256(host_signature);
    const managerSignatureHash = await sha256(manager_signature);
    const thumbprintHash = await sha256(`${thumbprint_url}:${guest_name}:${serial_number}`);
    const idHash = await sha256(`${government_id_number}:${guest_name}:${date_of_birth}`);
    const contractHash = await sha256(`${serial_number}:${guest_name}:${card_last_four}:${thumbprintHash}:${signatureHash}:${hostSignatureHash}:${managerSignatureHash}:${now}`);

    // Mark token record as used
    await base44.asServiceRole.entities.VIPContractRecord.update(tokenRecord.id, {
      used: true,
      status: "signed",
      signed_at: now,
      serial_number,
      guest_name,
      card_last_four,
      card_type: card_type || "Visa",
      government_id_type,
      government_id_state: government_id_state || "",
      signature_hash: signatureHash,
      thumbprint_hash: thumbprintHash,
      thumbprint_url,
      id_hash: idHash,
      contract_hash: contractHash,
      id_photo_url,
      id_photo_back_url: id_photo_back_url || "",
      guest_photo_url: guest_photo_url || "",
      ip_address: clientIP,
      user_agent: userAgent,
      metadata: {
        host_name,
        host_signature_hash: hostSignatureHash,
        manager_name,
        manager_signature_hash: managerSignatureHash,
        signatures_count: 3,
      },
    });

    // Create VIPGuest record with full biometric data
    const guestRecord = await base44.asServiceRole.entities.VIPGuest.create({
      guest_name,
      date_of_birth,
      phone: phone || undefined,
      profile_photo_url: guest_photo_url || undefined,
      government_id_type,
      government_id_number,
      government_id_state: government_id_state || undefined,
      id_photo_url,
      id_photo_back_url: id_photo_back_url || undefined,
      profile_photo_url: guest_photo_url || undefined,
      card_last_four,
      card_type: card_type || "Visa",
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
      verification_status: "verified",
      id_verified_date: now,
      membership_number: serial_number,
    });

    // Update contract record with guest reference
    await base44.asServiceRole.entities.VIPContractRecord.update(tokenRecord.id, {
      guest_record_id: guestRecord.id,
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