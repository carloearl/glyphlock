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
      scan_data, // Parsed OCR data or manual entry
      id_scan_front_file,
      id_scan_back_file,
      transaction_id
    } = payload;

    // Upload ID images
    let id_scan_front_url = null;
    if (id_scan_front_file) {
      const front_upload = await base44.integrations.Core.UploadFile({ file: id_scan_front_file });
      id_scan_front_url = front_upload.file_url;
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
        last_visit_at: new Date().toISOString(),
        age_verified: true, // Assuming verification happens here
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
        customer_name: `${guestProfile.first_name} ${guestProfile.last_name}`.trim(),
        date_of_birth: guestProfile.dob,
        address: `${scan_data.address_line1 || ''}`,
        city: scan_data.city,
        state: guestProfile.license_state,
        zip: scan_data.zip_code,
        id_number: scan_data.id_number,
        id_state: guestProfile.license_state
      }
    });

  } catch (error) {
    console.error('ID scan error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});