import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// W3-007: Server-side surcharge rate — NEVER accept from client payload.
// Client-controlled surcharge_rate flows to total_charged → GlyphBucksBatch
// → postGlyphBucksToLedger automation → JournalEntry. Must be server-fixed.
const SURCHARGE_RATE = 0.30;

const SOVEREIGN_EMAILS = new Set(['carloearl@glyphlock.com', 'carloearl@gmail.com']);
const SALE_GRANT_ROLES = new Set([
  'HOSTESS', 'DOORMAN', 'DOOR_GIRL', 'BARTENDER', 'SECURITY',
  'MANAGER', 'ADMINISTRATOR', 'OWNER',
]);
const SALE_ACCOUNT_ROLE_BY_GRANT = {
  HOSTESS: 'HOSTESS',
  DOORMAN: 'DOORMAN',
  DOOR_GIRL: 'DOOR_GIRL',
  BARTENDER: 'BARTENDER',
  SECURITY: 'SECURITY',
  MANAGER: 'VENUE_MANAGER',
  ADMINISTRATOR: 'PLATFORM_ADMIN',
  OWNER: 'VENUE_OWNER',
};

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

async function requireRealSaleAuthority(base44, user, venue_id) {
  const email = normalizeEmail(user?.email);
  if (!email || !venue_id) return null;
  if (SOVEREIGN_EMAILS.has(email)) {
    return { account: { role: 'SOVEREIGN', platform_email: email, venue_id, status: 'active', access_mode: 'REAL' }, grant: null };
  }

  const grants = await base44.asServiceRole.entities.NUPSAccessRequest.filter({ email, status: 'APPROVED', venue_id, mode: 'REAL' }, '-created_date', 500);
  for (const grant of (grants || [])) {
    if (
      grant.email?.toLowerCase() !== email
      || grant.status !== 'APPROVED'
      || grant.venue_id !== venue_id
      || grant.mode !== 'REAL'
      || !grant.nups_user_id
      || !SALE_GRANT_ROLES.has(grant.granted_role)
    ) continue;
    const account = await base44.asServiceRole.entities.NUPSUser.get(grant.nups_user_id).catch(() => null);
    const accountMode = account?.access_mode || (account?.is_demo ? 'DEMO' : 'REAL');
    if (
      account?.status !== 'active'
      || accountMode !== 'REAL'
      || normalizeEmail(account.platform_email) !== email
      || account.venue_id !== venue_id
      || account.id !== grant.nups_user_id
      || account.role !== SALE_ACCOUNT_ROLE_BY_GRANT[grant.granted_role]
    ) continue;
    return { account, grant };
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let user;
    try {
      user = await base44.auth.me();
    } catch (_) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let venue_id;
    try {
      const sessionVenue = await base44.functions.invoke('getSessionVenueId', {});
      if (!sessionVenue?.data?.success) {
        return Response.json({ 
          error: sessionVenue?.data?.error || 'Venue access denied' 
        }, { status: 403 });
      }
      venue_id = sessionVenue.data.venue_id;
    } catch (_) {
      return Response.json({ error: 'Venue access denied' }, { status: 403 });
    }

    const saleAuthority = await requireRealSaleAuthority(base44, user, venue_id);
    if (!saleAuthority) {
      return Response.json({ error: 'Forbidden: active REAL venue grant required' }, { status: 403 });
    }

    const payload = await req.json();
    const {
      customer_name,
      customer_identity_id,
      denominations,
      approval_code,
      processor_reference,
      payment_method,
      card_last_four
    } = payload;

    if (!customer_name || !denominations || !Array.isArray(denominations)) {
      return Response.json({ error: 'Invalid request: missing required fields' }, { status: 400 });
    }

    if (!approval_code || !processor_reference) {
      return Response.json({ error: 'Invalid payment: missing approval code or processor reference' }, { status: 400 });
    }

    const validDenoms = [1, 5, 10, 20, 50, 100];
    for (const d of denominations) {
      if (!validDenoms.includes(d.denomination) || d.quantity <= 0 || d.quantity > 1000) {
        return Response.json({ 
          error: `Invalid denomination: ${d.denomination} or quantity: ${d.quantity}` 
        }, { status: 400 });
      }
    }

    const existingBatch = await base44.asServiceRole.entities.GlyphBucksBatch.filter({
      processor_reference,
      venue_id,
      mode: 'REAL'
    }, null, 1);

    if (existingBatch.length > 0) {
      return Response.json({
        error: 'DUPLICATE_TRANSACTION',
        message: 'This payment has already been processed',
        existing_batch_id: existingBatch[0].batch_id
      }, { status: 409 });
    }

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

    // W3-007: surcharge_rate is server-fixed — never from payload
    const expected_surcharge = total_face_value * SURCHARGE_RATE;
    const expected_total_charged = total_face_value + expected_surcharge;

    // W3-008B: Verify against PaymentRecord (provider-agnostic proof layer).
    // PaymentRecord is created by createPaymentRecord after any provider adapter
    // (Stripe, Clover, manual external, cash) verifies the payment. This replaces
    // the Stripe-hardcoded GlyphBucksOrder-only check. PaymentRecord is THE proof.
    let surcharge_amount;
    let total_charged;
    let confirmedRecord = null;
    try {
      const records = await base44.asServiceRole.entities.PaymentRecord.filter({
        processor_reference,
        venue_id,
        mode: 'REAL',
        status: { $in: ['CONFIRMED', 'EXTERNAL_CONFIRMED', 'CAPTURED'] }
      }, null, 1);
      confirmedRecord = records?.[0] || null;
    } catch (_) { /* fall through to not-found error */ }

    if (!confirmedRecord || !confirmedRecord.id) {
      // W3-008B: Fallback to legacy GlyphBucksOrder path for backward compatibility
      // during migration. New payments should route through PaymentRecord.
      let legacyOrder = null;
      try {
        const orders = await base44.asServiceRole.entities.GlyphBucksOrder.filter({
          card_token: processor_reference,
          venue_id,
          mode: 'REAL',
          status: 'COMPLETE'
        }, null, 1);
        legacyOrder = orders?.[0] || null;
      } catch (_) { /* fall through to not-found error */ }

      if (!legacyOrder || !legacyOrder.id) {
        return Response.json({
          error: 'PAYMENT_NOT_CONFIRMED',
          message: 'No confirmed PaymentRecord or GlyphBucksOrder found for this processor reference. Payment must be verified via createPaymentRecord before creating GlyphBucks.'
        }, { status: 400 });
      }

      // Legacy path — validate against GlyphBucksOrder grand_total
      const order_total = legacyOrder.grand_total || 0;
      if (Math.abs(order_total - expected_total_charged) > 0.01) {
        return Response.json({
          error: 'PAYMENT_AMOUNT_MISMATCH',
          message: `Order total ($${order_total}) does not match expected charge ($${expected_total_charged}). Denominations may have been altered.`
        }, { status: 400 });
      }

      surcharge_amount = expected_surcharge;
      total_charged = order_total;
      // Continue with legacy path below — set variables for the rest of the function
      // The code after this block uses surcharge_amount and total_charged

    } else {

      // W3-008B: Primary path — validate against PaymentRecord (provider-agnostic)
      const record_total = confirmedRecord.amount || 0;
      if (Math.abs(record_total - expected_total_charged) > 0.01) {
        return Response.json({
          error: 'PAYMENT_AMOUNT_MISMATCH',
          message: `PaymentRecord amount ($${record_total}) does not match expected charge ($${expected_total_charged}). Denominations may have been altered.`
        }, { status: 400 });
      }

      surcharge_amount = expected_surcharge;
      total_charged = record_total;

    }

    // This is the production sale endpoint. Its authority and all referenced
    // payment evidence are explicitly bound to REAL mode above.
    const resolvedMode = 'REAL';

    const batch_id = `GB-${Date.now()}-${crypto.randomUUID().split('-')[0].toUpperCase()}`;

    let batch;
    try {
      batch = await base44.asServiceRole.entities.GlyphBucksBatch.create({
      batch_id,
      venue_id,
      denominations: processed_denominations,
      total_face_value,
      surcharge_rate: SURCHARGE_RATE,
      surcharge_amount,
      total_charged,
      approval_code,
      processor_reference,
      status: 'issued',
      issued_at: new Date().toISOString(),
      issued_by: user.email,
      mode: resolvedMode
      });
    } catch (dbError) {
      await base44.asServiceRole.entities.SystemAuditLog.create({
        event_type: 'GLYPHBUCKS_RECONCILIATION_NEEDED',
        entity_type: 'GlyphBucksBatch',
        entity_id: processor_reference,
        actor_id: user.email,
        venue_id,
        severity: 'critical',
        description: `RECONCILIATION_NEEDED: Payment succeeded (${processor_reference}) but batch creation failed. Charged: $${total_charged}, Error: ${dbError.message}`,
        status: 'alert',
        timestamp: new Date().toISOString()
      });

      throw new Error('CRITICAL: Payment processed but record creation failed. Contact support immediately with code: ' + processor_reference);
    }

    const bills = [];
    for (const denom of processed_denominations) {
      for (let i = 0; i < denom.quantity; i++) {
        const serial_number = generateSerialNumber();
        const barcode_number = `GB${serial_number}`;
        
        bills.push({
          serial_number,
          batch_id,
          venue_id,
          denomination: denom.denomination,
          barcode_number,
          status: 'issued',
          issued_to_customer: customer_name,
          issued_at: new Date().toISOString(),
          mode: resolvedMode
        });
      }
    }

    let created_bills;
    try {
      created_bills = await base44.asServiceRole.entities.GlyphBucksBill.bulkCreate(bills);
    } catch (billError) {
      await base44.asServiceRole.entities.GlyphBucksBatch.delete(batch.id);
      
      await base44.asServiceRole.entities.SystemAuditLog.create({
        event_type: 'GLYPHBUCKS_BATCH_ROLLBACK',
        entity_type: 'GlyphBucksBill',
        entity_id: batch_id,
        actor_id: user.email,
        venue_id,
        severity: 'critical',
        description: `BATCH ROLLBACK: Bill creation failed, batch ${batch_id} deleted. Payment: ${processor_reference}, Error: ${billError.message}`,
        status: 'alert',
        timestamp: new Date().toISOString()
      });

      throw new Error('Bill generation failed — batch rolled back. Payment may need refund. Code: ' + processor_reference);
    }

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

    await base44.asServiceRole.entities.SystemAuditLog.create({
      event_type: 'GLYPHBUCKS_SALE_CREATED',
      entity_type: 'GlyphBucksBatch',
      entity_id: batch_id,
      actor_id: user.email,
      venue_id,
      severity: 'low',
      description: `GlyphBucks sale created: ${bills.length} bills, face value $${total_face_value}, charged $${total_charged}`,
      metadata: {
        batch_id,
        total_face_value,
        total_charged,
        bills_count: bills.length,
        processor_reference
      },
      status: 'success',
      timestamp: new Date().toISOString()
    });

    return Response.json({
      success: true,
      batch,
      bills: created_bills,
      total_bills: created_bills.length
    });

  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error(`[${errorId}] GlyphBucks sale error:`, error);
    
    return Response.json({ 
      error: 'Transaction processing failed',
      error_id: errorId,
      message: 'Contact support with this error ID'
    }, { status: 500 });
  }
});

function generateSerialNumber() {
  const date = new Date();
  const dateStr = date.getFullYear().toString() +
                  (date.getMonth() + 1).toString().padStart(2, '0') +
                  date.getDate().toString().padStart(2, '0');
  
  const randomArray = new Uint32Array(1);
  crypto.getRandomValues(randomArray);
  const random = (randomArray[0] % 9000) + 1000;
  
  return `${dateStr}${random}`;
}