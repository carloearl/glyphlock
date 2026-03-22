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
      scan_data, // Parsed OCR data or manual entry
      id_scan_front_file,
      id_scan_back_file,
      transaction_id
    } = payload;

    // Upload ID images
    let id_scan_front_url = null;
    let id_scan_back_url = null;

    if (id_scan_front_file) {
      const front_upload = await base44.integrations.Core.UploadFile({
        file: id_scan_front_file
      });
      id_scan_front_url = front_upload.file_url;
    }

    if (id_scan_back_file) {
      const back_upload = await base44.integrations.Core.UploadFile({
        file: id_scan_back_file
      });
      id_scan_back_url = back_upload.file_url;
    }

    // Create CustomerIdentity record
    const identity_id = `ID-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const identity = await base44.asServiceRole.entities.CustomerIdentity.create({
      identity_id,
      customer_name: scan_data.full_name,
      date_of_birth: scan_data.date_of_birth,
      id_type: scan_data.id_type,
      id_number: scan_data.id_number, // Should be encrypted in production
      id_state: scan_data.id_state,
      id_expiration: scan_data.id_expiration,
      address_line1: scan_data.address_line1,
      address_line2: scan_data.address_line2 || null,
      city: scan_data.city,
      state: scan_data.state,
      zip_code: scan_data.zip_code,
      id_scan_front_url,
      id_scan_back_url,
      scan_timestamp: new Date().toISOString(),
      scanned_by: user.email,
      venue_id,
      linked_transactions: transaction_id ? [transaction_id] : []
    });

    // Create audit log
    await base44.asServiceRole.entities.AuditEvent.create({
      event_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      actor_id: user.email,
      actor_role: user.role,
      venue_id,
      entity_type: 'CustomerIdentity',
      entity_id: identity_id,
      action: 'CREATE',
      after_state: JSON.stringify({ customer_name: scan_data.full_name }),
      description: `Customer ID scanned: ${scan_data.full_name}`
    });

    return Response.json({
      success: true,
      identity,
      autofill_data: {
        customer_name: identity.customer_name,
        date_of_birth: identity.date_of_birth,
        address: `${identity.address_line1}${identity.address_line2 ? ' ' + identity.address_line2 : ''}`,
        city: identity.city,
        state: identity.state,
        zip: identity.zip_code,
        id_number: identity.id_number,
        id_state: identity.id_state
      }
    });

  } catch (error) {
    console.error('ID scan error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});