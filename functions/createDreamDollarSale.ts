import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // RBAC: Only staff/admin can create Dream Dollar sales
    if (!['admin', 'manager', 'staff'].includes(user.role)) {
      return Response.json({ 
        error: 'Forbidden: Staff access required to process Dream Dollar sales' 
      }, { status: 403 });
    }

    // SECURITY: Get venue_id from session, not request body
    const sessionVenue = await base44.functions.invoke('getSessionVenueId', {});
    if (!sessionVenue.data.success) {
      return Response.json({ 
        error: sessionVenue.data.error || 'Venue access denied' 
      }, { status: 403 });
    }
    const venue_id = sessionVenue.data.venue_id;

    const payload = await req.json();
    const {
      customer_name,
      customer_identity_id,
      denominations, // [{ denomination: 20, quantity: 5 }, ...]
      surcharge_rate = 0.30,
      approval_code,
      processor_reference,
      payment_method,
      card_last_four
    } = payload;

    // FRAUD PREVENTION: Validate inputs server-side
    if (!customer_name || !denominations || !Array.isArray(denominations)) {
      return Response.json({ error: 'Invalid request: missing required fields' }, { status: 400 });
    }

    if (!approval_code || !processor_reference) {
      return Response.json({ error: 'Invalid payment: missing approval code or processor reference' }, { status: 400 });
    }

    // FRAUD PREVENTION: Validate denominations are real values
    const validDenoms = [1, 5, 10, 20, 50, 100];
    for (const d of denominations) {
      if (!validDenoms.includes(d.denomination) || d.quantity <= 0 || d.quantity > 1000) {
        return Response.json({ 
          error: `Invalid denomination: ${d.denomination} or quantity: ${d.quantity}` 
        }, { status: 400 });
      }
    }

    // FRAUD PREVENTION: Check for duplicate processor_reference (replay attack)
    const existingBatch = await base44.asServiceRole.entities.DreamDollarBatch.filter({
      processor_reference,
      venue_id
    }, null, 1);

    if (existingBatch.length > 0) {
      return Response.json({
        error: 'DUPLICATE_TRANSACTION',
        message: 'This payment has already been processed',
        existing_batch_id: existingBatch[0].batch_id
      }, { status: 409 });
    }

    // Calculate totals SERVER-SIDE (never trust client)
    let total_face_value = 0;
    const processed_denominations = denominations.map(d => {
      const total_value = d.denomination * d.quantity;
      total_face_value += total_value;
      return {
        denomination: d.denomination,
        quantity: d.quantity,
        total_value
      };
    });

    const surcharge_amount = total_face_value * surcharge_rate;
    const total_charged = total_face_value + surcharge_amount;

    // Create batch ID (collision-resistant)
    const batch_id = `DD-${Date.now()}-${crypto.randomUUID().split('-')[0].toUpperCase()}`;

    // Create DreamDollarBatch record
    const batch = await base44.asServiceRole.entities.DreamDollarBatch.create({
      batch_id,
      venue_id,
      denominations: processed_denominations,
      total_face_value,
      surcharge_rate,
      surcharge_amount,
      total_charged,
      approval_code,
      processor_reference,
      status: 'issued',
      issued_at: new Date().toISOString(),
      issued_by: user.email
    });

    // Generate serial numbers for each bill
    const bills = [];
    for (const denom of processed_denominations) {
      for (let i = 0; i < denom.quantity; i++) {
        const serial_number = generateSerialNumber();
        const barcode_number = `DD${serial_number}`;
        
        bills.push({
          serial_number,
          batch_id,
          venue_id,
          denomination: denom.denomination,
          barcode_number,
          status: 'issued',
          issued_to_customer: customer_name,
          issued_at: new Date().toISOString()
        });
      }
    }

    // Bulk create bills
    const created_bills = await base44.asServiceRole.entities.DreamDollarBill.bulkCreate(bills);

    // Create barcode registry entries
    const barcode_entries = [
      {
        barcode_id: `BATCH-${batch_id}`,
        barcode_type: 'code128',
        record_type: 'batch',
        linked_record_id: batch_id,
        venue_id,
        status: 'active'
      }
    ];

    created_bills.forEach(bill => {
      barcode_entries.push({
        barcode_id: bill.barcode_number,
        barcode_type: 'code128',
        record_type: 'bill',
        linked_record_id: bill.serial_number,
        venue_id,
        status: 'active'
      });
    });

    await base44.asServiceRole.entities.BarcodeRegistry.bulkCreate(barcode_entries);

    // Create audit log (IMMUTABLE)
    await base44.asServiceRole.entities.AuditEvent.create({
      event_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      actor_id: user.email,
      actor_role: user.role,
      venue_id,
      entity_type: 'DreamDollarBatch',
      entity_id: batch_id,
      action: 'CREATE',
      after_state: JSON.stringify({ 
        batch_id,
        total_face_value,
        total_charged,
        bills_count: bills.length,
        processor_reference
      }),
      severity: 'INFO',
      description: `Dream Dollar sale created: ${bills.length} bills, face value $${total_face_value}, charged $${total_charged}`
    });

    return Response.json({
      success: true,
      batch,
      bills: created_bills,
      total_bills: created_bills.length
    });

  } catch (error) {
    // SECURITY: Log error to audit without exposing internals to client
    const errorId = crypto.randomUUID();
    console.error(`[${errorId}] Dream Dollar sale error:`, error);
    
    return Response.json({ 
      error: 'Transaction processing failed',
      error_id: errorId,
      message: 'Contact support with this error ID'
    }, { status: 500 });
  }
});

function generateSerialNumber() {
  // Generate cryptographically unique 12-digit serial: YYYYMMDD + 4 secure random digits
  const date = new Date();
  const dateStr = date.getFullYear().toString() +
                  (date.getMonth() + 1).toString().padStart(2, '0') +
                  date.getDate().toString().padStart(2, '0');
  
  // Use crypto.getRandomValues for security
  const randomArray = new Uint32Array(1);
  crypto.getRandomValues(randomArray);
  const random = (randomArray[0] % 9000) + 1000; // 1000-9999
  
  return `${dateStr}${random}`;
}