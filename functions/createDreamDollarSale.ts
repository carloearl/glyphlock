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
      customer_name,
      customer_identity_id,
      denominations, // [{ denomination: 20, quantity: 5 }, ...]
      surcharge_rate = 0.30,
      approval_code,
      processor_reference,
      payment_method,
      card_last_four
    } = payload;

    // Calculate totals
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

    // Create batch ID
    const batch_id = `DD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

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

    // Create audit log
    await base44.asServiceRole.entities.AuditEvent.create({
      event_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      actor_id: user.email,
      actor_role: user.role,
      venue_id,
      entity_type: 'DreamDollarBatch',
      entity_id: batch_id,
      action: 'CREATE',
      after_state: JSON.stringify({ batch, bills_count: bills.length }),
      description: `Dream Dollar sale created: ${bills.length} bills, total value $${total_face_value}`
    });

    return Response.json({
      success: true,
      batch,
      bills: created_bills,
      total_bills: created_bills.length
    });

  } catch (error) {
    console.error('Dream Dollar sale error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateSerialNumber() {
  // Generate 12-digit serial: YYYYMMDD + 4 random digits
  const date = new Date();
  const dateStr = date.getFullYear().toString() +
                  (date.getMonth() + 1).toString().padStart(2, '0') +
                  date.getDate().toString().padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${dateStr}${random}`;
}