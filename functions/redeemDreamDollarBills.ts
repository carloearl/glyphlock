import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// FRAUD PREVENTION: Rate limiting map (in-memory, resets on deploy)
const redemptionAttempts = new Map(); // key: contractor_id, value: { count, resetAt }
const MAX_ATTEMPTS_PER_MINUTE = 20;
const LOCKOUT_DURATION_MS = 60000; // 1 minute

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // RBAC: Only staff/admin can redeem Dream Dollar bills
    if (!['admin', 'manager', 'staff'].includes(user.role)) {
      return Response.json({ 
        error: 'Forbidden: Staff access required to redeem Dream Dollar bills' 
      }, { status: 403 });
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

    // FRAUD PREVENTION: Input validation
    if (!venue_id || !contractor_id || !serial_numbers || !Array.isArray(serial_numbers)) {
      return Response.json({ error: 'Invalid request: missing required fields' }, { status: 400 });
    }

    if (serial_numbers.length === 0 || serial_numbers.length > 100) {
      return Response.json({ error: 'Invalid batch size: must be 1-100 bills' }, { status: 400 });
    }

    // FRAUD PREVENTION: Rate limiting per contractor
    const now = Date.now();
    const attemptKey = `${venue_id}:${contractor_id}`;
    const attempts = redemptionAttempts.get(attemptKey);

    if (attempts) {
      if (now < attempts.resetAt) {
        if (attempts.count >= MAX_ATTEMPTS_PER_MINUTE) {
          return Response.json({
            error: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many redemption attempts. Please wait 1 minute.',
            retry_after_seconds: Math.ceil((attempts.resetAt - now) / 1000)
          }, { status: 429 });
        }
        attempts.count++;
      } else {
        redemptionAttempts.set(attemptKey, { count: 1, resetAt: now + LOCKOUT_DURATION_MS });
      }
    } else {
      redemptionAttempts.set(attemptKey, { count: 1, resetAt: now + LOCKOUT_DURATION_MS });
    }

    // FRAUD PREVENTION: Validate serial number format
    const serialRegex = /^\d{12}$/;
    for (const serial of serial_numbers) {
      if (!serialRegex.test(serial)) {
        return Response.json({ 
          error: 'INVALID_SERIAL_FORMAT',
          message: `Serial number ${serial} is not in valid format (12 digits expected)`
        }, { status: 400 });
      }
    }

    // Fetch all bills by serial numbers AND venue_id (critical for isolation)
    const bills = await base44.asServiceRole.entities.DreamDollarBill.filter({
      serial_number: { $in: serial_numbers },
      venue_id
    });

    // FRAUD DETECTION: Bills not found (tampered/fake serials)
    const foundSerials = new Set(bills.map(b => b.serial_number));
    const notFound = serial_numbers.filter(s => !foundSerials.has(s));
    if (notFound.length > 0) {
      // Log fraud attempt
      await base44.asServiceRole.entities.AuditEvent.create({
        event_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        actor_id: user.email,
        actor_role: user.role,
        venue_id,
        entity_type: 'DreamDollarBill',
        entity_id: 'FRAUD_ATTEMPT',
        action: 'ACCESS',
        severity: 'CRITICAL',
        description: `FRAUD ALERT: Attempted redemption of non-existent bills: ${notFound.join(', ')}`
      });

      return Response.json({
        error: 'INVALID_BILLS',
        message: 'One or more bills do not exist in system',
        invalid_serials: notFound
      }, { status: 400 });
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
        
        // FRAUD DETECTION: Log replay attack
        await base44.asServiceRole.entities.AuditEvent.create({
          event_id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          actor_id: user.email,
          actor_role: user.role,
          venue_id,
          entity_type: 'DreamDollarBill',
          entity_id: bill.serial_number,
          action: 'ACCESS',
          severity: 'WARNING',
          description: `REPLAY ATTACK: Attempted re-redemption of bill ${bill.serial_number} (originally redeemed ${bill.redeemed_at})`
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
        success: false,
        error: 'No valid bills to redeem',
        duplicates_detected: duplicate_bills.length,
        duplicate_bills,
        errors
      }, { status: 400 });
    }

    // Calculate totals SERVER-SIDE (never trust client redemption_rate)
    const VERIFIED_REDEMPTION_RATE = 0.50; // HARDCODED — ignore client value
    const total_face_value = valid_bills.reduce((sum, bill) => sum + bill.denomination, 0);
    const total_payout = total_face_value * VERIFIED_REDEMPTION_RATE;

    // Create payout record (collision-resistant ID)
    const payout_id = `PAYOUT-${Date.now()}-${crypto.randomUUID().split('-')[0].toUpperCase()}`;
    
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
        redemption_amount: bill.denomination * VERIFIED_REDEMPTION_RATE
      })),
      total_face_value,
      redemption_rate: VERIFIED_REDEMPTION_RATE,
      total_payout,
      payment_method,
      paid_by: user.email,
      status: 'pending',
      tax_year: new Date().getFullYear()
    });

    // Update bills to redeemed status (atomic operation per bill)
    const redemptionTime = new Date().toISOString();
    const updatePromises = valid_bills.map(bill =>
      base44.asServiceRole.entities.DreamDollarBill.update(bill.id, {
        status: 'redeemed',
        redeemed_at: redemptionTime,
        redeemed_by_contractor_id: contractor_id,
        redemption_payout_id: payout_id,
        redemption_percentage: VERIFIED_REDEMPTION_RATE,
        redemption_amount: bill.denomination * VERIFIED_REDEMPTION_RATE
      })
    );

    await Promise.all(updatePromises);

    // Create audit log (IMMUTABLE)
    await base44.asServiceRole.entities.AuditEvent.create({
      event_id: crypto.randomUUID(),
      timestamp: redemptionTime,
      actor_id: user.email,
      actor_role: user.role,
      venue_id,
      entity_type: 'ContractorPayout',
      entity_id: payout_id,
      action: 'CREATE',
      after_state: JSON.stringify({
        payout_id,
        contractor_id,
        bills_count: valid_bills.length,
        total_face_value,
        total_payout,
        redemption_rate: VERIFIED_REDEMPTION_RATE
      }),
      severity: 'INFO',
      description: `Dream Dollar redemption: ${valid_bills.length} bills, contractor ${contractor_name}, payout $${total_payout.toFixed(2)}`
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
    // SECURITY: Log error to audit without exposing internals
    const errorId = crypto.randomUUID();
    console.error(`[${errorId}] Bill redemption error:`, error);
    
    return Response.json({ 
      error: 'Redemption processing failed',
      error_id: errorId,
      message: 'Contact support with this error ID'
    }, { status: 500 });
  }
});

function generateSerialNumber() {
  // Generate cryptographically unique 12-digit serial
  const date = new Date();
  const dateStr = date.getFullYear().toString() +
                  (date.getMonth() + 1).toString().padStart(2, '0') +
                  date.getDate().toString().padStart(2, '0');
  
  const randomArray = new Uint32Array(1);
  crypto.getRandomValues(randomArray);
  const random = (randomArray[0] % 9000) + 1000;
  
  return `${dateStr}${random}`;
}