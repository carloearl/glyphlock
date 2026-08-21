import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // ── W3-001 REMEDIATION: Authentication gate ──
    // No write may proceed without a live authenticated session.
    const liveUser = await base44.auth.me();
    if (!liveUser || !liveUser.email) {
      return Response.json({ error: 'Unauthorized: authentication required' }, { status: 401 });
    }

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

    // ── W3-001 REMEDIATION: Identity rebind + role check ──
    // Resolve NUPSUser by created_by (RLS pattern) to verify the live
    // session maps to an authorized staff record. Only MANAGER-class
    // roles or SOVEREIGN may witness a VIP contract signing.
    let nupsUsers = await base44.asServiceRole.entities.NUPSUser.filter({
      platform_email: String(liveUser.email).toLowerCase(), status: 'active'
    }, null, 1).catch(() => []);
    if (!nupsUsers?.length) {
      nupsUsers = await base44.asServiceRole.entities.NUPSUser.filter({
        username: String(liveUser.email).split('@')[0].toLowerCase(), status: 'active'
      }, null, 1).catch(() => []);
    }

    const nupsUser = (nupsUsers && nupsUsers.length > 0) ? nupsUsers[0] : null;
    const isSovereign = nupsUser && (nupsUser.sovereign_flag === true || nupsUser.role === 'SOVEREIGN');
    const MANAGER_CLASS_ROLES = new Set([
      'PLATFORM_ADMIN', 'VENUE_OWNER', 'VENUE_MANAGER', 'SOVEREIGN'
    ]);
    const roleAuthorized = isSovereign || (nupsUser && MANAGER_CLASS_ROLES.has(nupsUser.role));

    if (!roleAuthorized) {
      return Response.json({
        error: 'Forbidden: MANAGER-class role required to witness VIP contract signing',
        role: nupsUser?.role || 'none'
      }, { status: 403 });
    }

    // Identity metadata for audit trail
    const verification_timestamp = new Date().toISOString();
    const identityContext = {
      claimed_actor_id: liveUser.email,
      verified_actor_id: liveUser.id || liveUser.email,
      live_authenticated_email: liveUser.email,
      verification_timestamp,
      sovereign_override: !!isSovereign,
    };

    // ── W3-001 REMEDIATION: Mode resolution ──
    // Resolve from SystemConfig (per-venue → global → default REAL).
    const venue_id = tokenRecord.venue_id || null;
    if (!venue_id) return Response.json({ error: 'Contract token has no venue assignment' }, { status: 409 });
    const globalVenueRole = isSovereign || ['PLATFORM_ADMIN'].includes(nupsUser?.role);
    if (!globalVenueRole && nupsUser?.venue_id !== venue_id) {
      return Response.json({ error: 'Forbidden: contract belongs to another venue' }, { status: 403 });
    }
    const isProtectedReference = (value) => typeof value === 'string' && value.startsWith('protected:') && value.length > 'protected:'.length;
    if (!isProtectedReference(thumbprint_url) || !isProtectedReference(id_photo_url)) {
      return Response.json({ error: 'Thumbprint and government-ID evidence must use protected evidence references' }, { status: 400 });
    }
    if (id_photo_back_url && !isProtectedReference(id_photo_back_url)) {
      return Response.json({ error: 'ID back evidence must use a protected evidence reference' }, { status: 400 });
    }
    if (guest_photo_url && !isProtectedReference(guest_photo_url)) {
      return Response.json({ error: 'Guest photo evidence must use a protected evidence reference' }, { status: 400 });
    }
    if (!government_id_number || !date_of_birth) {
      return Response.json({ error: 'Government ID number and date of birth are required for canonical identity binding' }, { status: 400 });
    }
    let resolvedMode = 'REAL';
    if (venue_id) {
      try {
        const venueCfgRows = await base44.asServiceRole.entities.SystemConfig.filter({
          venue_id, config_key: 'venue'
        });
        if (venueCfgRows && venueCfgRows.length === 1 && venueCfgRows[0].mode) {
          resolvedMode = venueCfgRows[0].mode;
        }
      } catch { /* fall through to global */ }
    }
    if (resolvedMode === 'REAL') {
      try {
        const globalCfgRows = await base44.asServiceRole.entities.SystemConfig.filter({
          config_key: 'global'
        });
        if (globalCfgRows && globalCfgRows.length === 1 && globalCfgRows[0].mode) {
          resolvedMode = globalCfgRows[0].mode;
        }
      } catch { /* default REAL */ }
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

    // Mark token record as used — stamp mode
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
      mode: resolvedMode,
      metadata: {
        host_name,
        host_signature_hash: hostSignatureHash,
        manager_name,
        manager_signature_hash: managerSignatureHash,
        signatures_count: 3,
      },
    });

    // Bind the signed contract to the canonical minimized GuestProfile, then
    // create/update a VIPGuest workflow projection. Full government-ID numbers,
    // raw signatures, and protected media are not copied into VIPGuest.
    const normalizedGovernmentId = String(government_id_number).replace(/\s/g, '').trim().toUpperCase();
    const guestIdentityKey = (await sha256(normalizedGovernmentId)).slice(0, 24);
    const venue = (await base44.asServiceRole.entities.Venue.filter({ venue_id, status: 'active' }, null, 1).catch(() => []))?.[0]
      || await base44.asServiceRole.entities.Venue.get(venue_id).catch(() => null);
    if (!venue || venue.status === 'inactive') {
      return Response.json({ error: 'Contract venue is not active' }, { status: 409 });
    }
    const dob = new Date(date_of_birth);
    if (Number.isNaN(dob.getTime())) return Response.json({ error: 'Valid date of birth required' }, { status: 400 });
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const beforeBirthday = today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate());
    if (beforeBirthday) age -= 1;
    const minimumAge = Number(venue.minimum_age || venue.age_requirement || 21);
    if (age < minimumAge) return Response.json({ error: `Guest does not meet venue minimum age ${minimumAge}` }, { status: 403 });

    const nameParts = String(guest_name).trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts.shift() || String(guest_name).trim();
    const lastName = nameParts.join(' ');
    const profileIdTypeMap = {
      'Drivers License': 'drivers_license', drivers_license: 'drivers_license',
      'State ID': 'state_id', state_id: 'state_id', Passport: 'passport', passport: 'passport',
      'Military ID': 'military_id', military_id: 'military_id', 'Tribal ID': 'tribal_id', tribal_id: 'tribal_id'
    };
    const vipIdTypeMap = {
      drivers_license: 'Drivers License', 'Drivers License': 'Drivers License',
      state_id: 'State ID', 'State ID': 'State ID', passport: 'Passport', Passport: 'Passport',
      military_id: 'Military ID', 'Military ID': 'Military ID', tribal_id: 'Tribal ID', 'Tribal ID': 'Tribal ID'
    };
    let guestProfile = (await base44.asServiceRole.entities.GuestProfile.filter({ guest_id: guestIdentityKey, venue_id }, null, 1).catch(() => []))?.[0] || null;
    const profileData = {
      venue_id,
      first_name: firstName,
      last_name: lastName,
      dob: String(date_of_birth).split('T')[0],
      license_state: String(government_id_state || '').toUpperCase(),
      id_type: profileIdTypeMap[government_id_type] || 'drivers_license',
      last_initial: (lastName || firstName).slice(0, 1).toUpperCase(),
      license_last4: normalizedGovernmentId.slice(-4),
      age_verified: true,
      id_expired: false,
      last_visit_at: now,
      status: 'vip',
      mode: resolvedMode,
    };
    if (guestProfile) {
      guestProfile = await base44.asServiceRole.entities.GuestProfile.update(guestProfile.id, {
        ...profileData,
        visit_count: Math.max(1, Number(guestProfile.visit_count || 0) + 1),
      });
    } else {
      guestProfile = await base44.asServiceRole.entities.GuestProfile.create({
        guest_id: guestIdentityKey,
        ...profileData,
        first_visit_at: now,
        visit_count: 1,
      });
    }

    let guestRecord = (await base44.asServiceRole.entities.VIPGuest.filter({ venue_id, guest_profile_id: guestProfile.id }, null, 1).catch(() => []))?.[0]
      || (await base44.asServiceRole.entities.VIPGuest.filter({ venue_id, guest_id: guestIdentityKey }, null, 1).catch(() => []))?.[0]
      || null;
    const vipProjection = {
      guest_id: guestIdentityKey,
      guest_profile_id: guestProfile.id,
      venue_id,
      full_name: String(guest_name).trim(),
      date_of_birth: dob.toISOString(),
      phone: phone || undefined,
      id_type: vipIdTypeMap[government_id_type] || 'Drivers License',
      id_last4: normalizedGovernmentId.slice(-4),
      id_state: String(government_id_state || '').toUpperCase() || undefined,
      id_verified: true,
      id_verified_by: liveUser.email,
      id_verified_at: now,
      card_last4: card_last_four,
      card_type: card_type || 'Visa',
      status: 'in_building',
      current_location: 'VIP Area',
      check_in_time: now,
      last_visit: now,
      total_spent_tonight: guestRecord?.total_spent_tonight || 0,
      total_spend_lifetime: guestRecord?.total_spend_lifetime || 0,
      visit_count: guestRecord ? Number(guestRecord.visit_count || 0) + 1 : 1,
      vip_sessions_count: guestRecord?.vip_sessions_count || 0,
      first_visit: guestRecord?.first_visit || now,
      is_demo: resolvedMode !== 'REAL',
    };
    guestRecord = guestRecord
      ? await base44.asServiceRole.entities.VIPGuest.update(guestRecord.id, vipProjection)
      : await base44.asServiceRole.entities.VIPGuest.create(vipProjection);

    // Update contract record with the workflow projection reference.
    await base44.asServiceRole.entities.VIPContractRecord.update(tokenRecord.id, {
      guest_record_id: guestRecord.id,
      metadata: {
        ...(tokenRecord.metadata || {}),
        host_name,
        host_signature_hash: hostSignatureHash,
        manager_name,
        manager_signature_hash: managerSignatureHash,
        signatures_count: 3,
        guest_profile_id: guestProfile.id,
        guest_identity_key: guestIdentityKey,
      },
    });

    // ── W3-001 REMEDIATION: AuditEvent emission ──
    // Emit observational AuditEvent with packed identity metadata.
    try {
      await base44.asServiceRole.entities.AuditEvent.create({
        venue_id: venue_id || 'unknown',
        timestamp: now,
        event_type: 'ManagerApproval',
        event_category: 'identity',
        severity: 'high',
        mode: resolvedMode.toLowerCase(),
        session_id: `vipContractSign:${tokenRecord.id}`,
        source: 'door',
        entity_type: 'VIPContractRecord',
        entity_id: tokenRecord.id,
        identity_verified: true,
        retention_class: 'compliance',
        event_version: 1,
        notes: {
          action: 'vip_contract_signed',
          guest_name,
          serial_number,
          contract_hash: contractHash,
          ...identityContext,
        },
      });
    } catch { /* observational only — never block the business write */ }

    return Response.json({
      success: true,
      serial_number,
      guest_id: guestRecord.id,
      contract_id: tokenRecord.id,
      contract_hash: contractHash,
      mode: resolvedMode,
      message: 'Contract signed with biometric verification. Welcome to VIP.'
    });
  } catch (error) {
    console.error('VIP contract signing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});