import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { createHash } from 'https://deno.land/std@0.106.0/hash/mod.ts';

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

    const hash = createHash('sha256');
    hash.update(scan_data.id_number + (venue_id || 'default'));
    const guest_id = hash.toString().slice(0, 24);

    let guestProfile = await base44.asServiceRole.entities.GuestProfile.get(guest_id).catch(() => null);

    const profileData = {
      venue_id,
      first_name: scan_data.full_name?.split(' ')[0],
      last_name: scan_data.full_name?.split(' ').slice(1).join(' '),
      dob: scan_data.date_of_birth,
      license_state: scan_data.id_state,
      id_scan_front_url: id_scan_front_url || undefined,
      last_visit_at: new Date().toISOString(),
      age_verified: true,
    };

    if (guestProfile) {
      guestProfile = await base44.asServiceRole.entities.GuestProfile.update(guest_id, {
        ...profileData,
        visit_count: (guestProfile.visit_count || 0) + 1,
      });
    } else {
      guestProfile = await base44.asServiceRole.entities.GuestProfile.create({
        guest_id,
        ...profileData,
        first_visit_at: new Date().toISOString(),
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
      },
    });
  } catch (error) {
    console.error('ID scan error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});