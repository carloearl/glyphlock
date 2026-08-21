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
      venue_id,
      id_scan_front_url,
      scan_data: manualScanData,
      transaction_id,
    } = payload;

    if (!venue_id) {
      return Response.json({ error: 'Active venue is required.' }, { status: 400 });
    }

    const E = base44.asServiceRole.entities;
    const email = String(user.email || '').toLowerCase();
    const nupsUser = (await E.NUPSUser.filter({ platform_email: email, status: 'active' }, null, 1).catch(() => []))?.[0]
      || (await E.NUPSUser.filter({ username: email.split('@')[0], status: 'active' }, null, 1).catch(() => []))?.[0]
      || null;
    const global = ['PLATFORM_ADMIN', 'SOVEREIGN'].includes(nupsUser?.role);
    if (!nupsUser || (!global && nupsUser.venue_id !== venue_id)) {
      return Response.json({ error: 'Identity scan venue access denied.' }, { status: 403 });
    }

    if (!id_scan_front_url && !manualScanData) {
      return Response.json(
        { error: 'Provide id_scan_front_url (image to OCR) or scan_data (manual fields).' },
        { status: 400 }
      );
    }

    // Resolve the ID fields: either OCR the uploaded image, or use manually
    // supplied scan_data as-is.
    let scan_data = manualScanData;

    if (!scan_data && id_scan_front_url) {
      const ocr = await base44.integrations.Core.InvokeLLM({
        prompt:
          "You are an ID document OCR engine. Read the government-issued ID card in the image and extract the fields exactly as printed. Use ISO date format YYYY-MM-DD for dates. Use the 2-letter USPS code for id_state and state. If a field is not visible, return an empty string for it. Do not guess.",
        file_urls: [id_scan_front_url],
        response_json_schema: {
          type: 'object',
          properties: {
            full_name: { type: 'string' },
            date_of_birth: { type: 'string' },
            id_type: {
              type: 'string',
              enum: ['drivers_license', 'state_id', 'passport', 'military_id', 'tribal_id'],
            },
            id_number: { type: 'string' },
            id_state: { type: 'string' },
            id_expiration: { type: 'string' },
            address_line1: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            zip_code: { type: 'string' },
          },
          required: ['full_name', 'id_number'],
        },
      });
      scan_data = ocr || {};
    }

    if (!scan_data?.id_number) {
      return Response.json(
        { error: 'Could not read an ID number from the document. Re-scan with the ID flat and well-lit, or enter details manually.' },
        { status: 422 }
      );
    }

    const normalizedId = String(scan_data.id_number || '').replace(/\s/g, '').trim().toUpperCase();
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalizedId));
    const guest_id = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 24);

    let guestProfile = (await E.GuestProfile.filter({ guest_id, venue_id }, null, 1).catch(() => []))?.[0] || null;
    const fullName = String(scan_data.full_name || '').trim();
    const nameParts = fullName.split(/\s+/).filter(Boolean);
    const firstName = nameParts.shift() || fullName;
    const lastName = nameParts.join(' ');
    const dob = scan_data.date_of_birth ? new Date(scan_data.date_of_birth) : null;
    const now = new Date();
    let age = null;
    if (dob && !Number.isNaN(dob.getTime())) {
      age = now.getFullYear() - dob.getFullYear();
      const beforeBirthday = now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate());
      if (beforeBirthday) age -= 1;
    }
    const expiration = scan_data.id_expiration ? new Date(scan_data.id_expiration) : null;
    const profileData = {
      venue_id,
      first_name: firstName,
      last_name: lastName,
      dob: scan_data.date_of_birth,
      license_state: String(scan_data.id_state || '').toUpperCase(),
      id_type: scan_data.id_type || 'drivers_license',
      last_initial: (lastName || firstName).slice(0, 1).toUpperCase(),
      license_last4: normalizedId.slice(-4),
      id_expiration: scan_data.id_expiration || undefined,
      id_expired: !!(expiration && !Number.isNaN(expiration.getTime()) && expiration.getTime() < now.getTime()),
      last_visit_at: now.toISOString(),
      age_verified: typeof age === 'number' && age >= 21,
    };

    if (guestProfile) {
      guestProfile = await E.GuestProfile.update(guestProfile.id, {
        ...profileData,
        visit_count: (guestProfile.visit_count || 0) + 1,
      });
    } else {
      guestProfile = await E.GuestProfile.create({
        guest_id,
        ...profileData,
        first_visit_at: now.toISOString(),
        visit_count: 1,
        status: 'active',
      });
    }

    return Response.json({
      success: true,
      identity: guestProfile,
      autofill_data: {
        full_name: `${guestProfile.first_name || ''} ${guestProfile.last_name || ''}`.trim(),
        customer_name: `${guestProfile.first_name || ''} ${guestProfile.last_name || ''}`.trim(),
        date_of_birth: guestProfile.dob || '',
        id_type: scan_data.id_type || 'drivers_license',
        id_number: scan_data.id_number,
        id_state: guestProfile.license_state || '',
        id_expiration: scan_data.id_expiration || '',
        address_line1: scan_data.address_line1 || '',
        city: scan_data.city || '',
        state: scan_data.state || guestProfile.license_state || '',
        zip_code: scan_data.zip_code || '',
        identity_profile_ref: guestProfile.id || guestProfile.guest_id || guest_id,
        profile_ref: guestProfile.id || guestProfile.guest_id || guest_id,
        age_verified: !!guestProfile.age_verified,
        id_last4: String(scan_data.id_number || '').replace(/\s/g, '').slice(-4).toUpperCase(),
      },
    });
  } catch (error) {
    console.error('ID scan error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});