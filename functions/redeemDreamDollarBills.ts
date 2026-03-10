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
      contractor_id,
      contractor_name,
      serial_numbers, // Array of bill serial numbers to redeem
      redemption_rate = 0.85,
      payment_method = 'cash'
    } = payload;

    // Fetch all bills by serial numbers
    const bills = await base44.asServiceRole.entities.DreamDollarBill.filter({
      serial_number: { $in: serial_numbers },
      venue_id
    });

    if (bills.length === 0) {
      return Response.json({ error: 'No valid bills found' }, { status: 404 });
    }

    // Validate bills
    const errors = [];
    const valid_bills = [];
    const duplicate_bills = [];

    for (const bill of bills) {
      if (bill.status === 'redeemed') {
        duplicate_bills.push({
          serial_number: bill.serial_number,
          redeemed_at: bill.redeemed_at,
          redeemed_by: bill.redeemed_by_contractor_id
        });
      } else if (bill.status === 'voided') {
        errors.push(`Bill ${bill.serial_number} is voided`);
      } else if (bill.status === 'disputed') {
        errors.push(`Bill ${bill.serial_number} is under dispute`);
      } else {
        valid_bills.push(bill);
      }
    }

    if (valid_bills.length === 0) {
      return Response.json({
        error: 'No valid bills to redeem',
        duplicates: duplicate_bills,
        errors
      }, { status: 400 });
    }

    // Calculate totals
    const total_face_value = valid_bills.reduce((sum, bill) => sum + bill.denomination, 0);
    const total_payout = total_face_value * redemption_rate;

    // Create payout record
    const payout_id = `PAYOUT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const payout = await base44.asServiceRole.entities.ContractorPayout.create({
      payout_id,
      contractor_id,
      contractor_name,
      venue_id,
      payout_date: new Date().toISOString().split('T')[0],
      payout_type: 'dream_dollar_redemption',
      bills_redeemed: valid_bills.map(bill => ({
        serial_number: bill.serial_number,
        denomination: bill.denomination,
        redemption_amount: bill.denomination * redemption_rate
      })),
      total_face_value,
      redemption_rate,
      total_payout,
      payment_method,
      paid_by: user.email,
      status: 'pending',
      tax_year: new Date().getFullYear()
    });

    // Update bills to redeemed status
    const now = new Date().toISOString();
    for (const bill of valid_bills) {
      await base44.asServiceRole.entities.DreamDollarBill.update(bill.id, {
        status: 'redeemed',
        redeemed_at: now,
        redeemed_by_contractor_id: contractor_id,
        redemption_payout_id: payout_id,
        redemption_percentage: redemption_rate,
        redemption_amount: bill.denomination * redemption_rate
      });
    }

    // Create audit log
    await base44.asServiceRole.entities.AuditEvent.create({
      event_id: crypto.randomUUID(),
      timestamp: now,
      actor_id: user.email,
      actor_role: user.role,
      venue_id,
      entity_type: 'ContractorPayout',
      entity_id: payout_id,
      action: 'CREATE',
      after_state: JSON.stringify({
        bills_count: valid_bills.length,
        total_face_value,
        total_payout
      }),
      description: `Dream Dollar redemption: ${valid_bills.length} bills, contractor ${contractor_name}`
    });

    return Response.json({
      success: true,
      payout,
      bills_redeemed: valid_bills.length,
      duplicates_detected: duplicate_bills.length,
      duplicate_bills,
      errors,
      total_face_value,
      total_payout
    });

  } catch (error) {
    console.error('Bill redemption error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});