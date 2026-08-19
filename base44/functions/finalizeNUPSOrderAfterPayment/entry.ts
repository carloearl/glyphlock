import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

/**
 * Finalize a NUPS order and contract only after a trusted PaymentRecord proves
 * the money state. This is idempotent and intentionally uses the service role
 * so browser callers cannot manufacture paid records through direct entity
 * writes.
 */

const ALLOWED_ROLES = ['admin', 'manager', 'staff'];
const CONFIRMED_STATUSES = new Set(['CONFIRMED', 'EXTERNAL_CONFIRMED', 'CAPTURED']);

function cleanText(value, maximum = 500) {
  if (value == null) return null;
  return String(value).trim().slice(0, maximum) || null;
}

function cleanLastFour(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? digits.slice(-4) : null;
}

function cleanLineItems(items) {
  if (!Array.isArray(items)) return [];
  return items.slice(0, 5).map((item, index) => ({
    line_number: Number.isInteger(item?.line_number) ? item.line_number : index + 1,
    room_ent_dur_id: cleanText(item?.room_ent_dur_id || item?.room_number || item?.entertainer, 200),
    room_fee: Number(item?.room_fee) || 0,
    product: Number(item?.product) || 0,
    amount: Math.max(0, Number(item?.amount) || 0),
  }));
}

async function audit(db, eventType, resourceId, description, severity, actorEmail, metadata) {
  try {
    await db.SystemAuditLog.create({
      event_type: eventType,
      description,
      actor_email: actorEmail,
      resource_id: resourceId,
      status: severity === 'critical' || severity === 'high' ? 'alert' : 'success',
      severity,
      metadata,
    });
  } catch (error) {
    console.error('[finalizeNUPSOrderAfterPayment] Audit write failed:', error?.message || error);
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  let paymentRecord = null;
  let order = null;
  let venueId = null;
  let user = null;

  try {
    const base44 = createClientFromRequest(req);
    try {
      user = await base44.auth.me();
    } catch {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!ALLOWED_ROLES.includes(user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
      const sessionVenue = await base44.functions.invoke('getSessionVenueId', {});
      if (!sessionVenue?.data?.success) {
        return Response.json({ error: 'Venue access denied' }, { status: 403 });
      }
      venueId = sessionVenue.data.venue_id;
    } catch {
      return Response.json({ error: 'Venue access denied' }, { status: 403 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const orderNumber = cleanText(body?.order_number, 80);
    const customerName = cleanText(body?.order?.customer_name, 300);
    const processorReference = cleanText(body?.processor_reference, 300);
    const paymentRecordId = cleanText(body?.payment_record_id, 120);
    const expectedAmount = Number(body?.order?.grand_total);

    if (!orderNumber || !/^[A-Za-z0-9_-]{6,80}$/.test(orderNumber)) {
      return Response.json({ error: 'Invalid order_number' }, { status: 400 });
    }
    if (!customerName) {
      return Response.json({ error: 'customer_name is required' }, { status: 400 });
    }
    if (!Number.isFinite(expectedAmount) || expectedAmount <= 0 || expectedAmount > 50000) {
      return Response.json({ error: 'Invalid order total' }, { status: 400 });
    }
    if (!paymentRecordId && !processorReference) {
      return Response.json({ error: 'Payment proof reference is required' }, { status: 400 });
    }

    const db = base44.asServiceRole.entities;
    const records = paymentRecordId
      ? await db.PaymentRecord.filter({ record_id: paymentRecordId, venue_id: venueId }, null, 1)
      : await db.PaymentRecord.filter({ processor_reference: processorReference, venue_id: venueId }, null, 1);
    paymentRecord = records?.[0] || null;

    if (!paymentRecord) {
      return Response.json({ error: 'Payment proof not found' }, { status: 404 });
    }
    if (!CONFIRMED_STATUSES.has(paymentRecord.status)) {
      return Response.json({
        error: 'Payment is not confirmed',
        payment_status: paymentRecord.status,
      }, { status: 409 });
    }
    if (Math.abs(Number(paymentRecord.amount) - expectedAmount) > 0.01) {
      await audit(
        db,
        'NUPS_ORDER_AMOUNT_MISMATCH',
        paymentRecord.record_id,
        'Order finalization rejected because the payment amount did not match',
        'critical',
        user.email,
        {
          venue_id: venueId,
          order_number: orderNumber,
          payment_amount: paymentRecord.amount,
          order_amount: expectedAmount,
        },
      );
      return Response.json({ error: 'Payment amount does not match order total' }, { status: 409 });
    }

    const paymentOrderNumber = cleanText(paymentRecord.metadata?.order_number, 80);
    if (paymentOrderNumber && paymentOrderNumber !== orderNumber) {
      return Response.json({ error: 'Payment proof belongs to another order' }, { status: 409 });
    }

    const authoritativeProcessorReference = paymentRecord.processor_reference;
    const authoritativeApprovalCode = paymentRecord.approval_code;
    const authoritativeLastFour = cleanLastFour(paymentRecord.card_last_four);
    const orderPayload = {
      order_number: orderNumber,
      venue_id: venueId,
      status: 'signed',
      customer_name: customerName,
      customer_id_number: cleanText(body.order?.customer_id_number, 200),
      customer_address: cleanText(body.order?.customer_address, 500),
      customer_state: cleanText(body.order?.customer_state, 20),
      customer_zip: cleanText(body.order?.customer_zip, 20),
      purchaser_card_name: cleanText(body.order?.purchaser_card_name, 300),
      card_last_four: authoritativeLastFour ? `****${authoritativeLastFour}` : null,
      card_token: authoritativeProcessorReference,
      card_exp: paymentRecord.provider_code === 'stripe' ? null : cleanText(body.order?.card_exp, 20),
      processor_name: paymentRecord.provider_code === 'stripe'
        ? 'Stripe'
        : cleanText(body.order?.processor_name || paymentRecord.provider_code, 100),
      processor_reference: authoritativeProcessorReference,
      approval_code: authoritativeApprovalCode,
      manager_name: cleanText(body.order?.manager_name, 300),
      hostess_name: cleanText(body.order?.hostess_name, 300),
      line_items: cleanLineItems(body.order?.line_items),
      glyphbucks_value: 0,
      processing_surcharge: 0,
      waitress_tip: Math.max(0, Number(body.order?.waitress_tip) || 0),
      grand_total: Number(paymentRecord.amount),
      acknowledgments_checked: body.order?.acknowledgments_checked === true,
      customer_signature: cleanText(body.order?.customer_signature, 5000),
      thumbprint_url: cleanText(body.order?.thumbprint_url, 2000),
      guest_photo_url: cleanText(body.order?.guest_photo_url, 2000),
      id_photo_url: cleanText(body.order?.id_photo_url, 2000),
      id_photo_back_url: cleanText(body.order?.id_photo_back_url, 2000),
      signed_at: new Date().toISOString(),
    };

    const existingOrders = await db.GlyphBucksOrder.filter({
      order_number: orderNumber,
      venue_id: venueId,
    }, null, 1);
    if (existingOrders.length > 0) {
      order = existingOrders[0];
      if (order.processor_reference && order.processor_reference !== authoritativeProcessorReference) {
        return Response.json({ error: 'Order is already bound to another payment' }, { status: 409 });
      }
    } else {
      order = await db.GlyphBucksOrder.create(orderPayload);
    }

    const contractMetadata = {
      order_number: orderNumber,
      contract_type: 'nups_order',
      total_amount: Number(paymentRecord.amount),
      customer_signature: cleanText(body.contract?.customer_signature, 5000),
      manager_signature: null,
      hostess_signature: null,
      payment_record_id: paymentRecord.record_id,
      payment_approval_code: authoritativeApprovalCode,
      payment_processor_reference: authoritativeProcessorReference,
      payment_provider: paymentRecord.provider_code,
      mode: paymentRecord.mode,
    };

    const existingContracts = await db.VIPContractRecord.filter({
      serial_number: orderNumber,
      venue_id: venueId,
      record_type: 'signed_contract',
    }, null, 1);
    let contract = existingContracts?.[0] || null;
    if (contract) {
      const boundReference = contract.metadata?.payment_processor_reference;
      if (boundReference && boundReference !== authoritativeProcessorReference) {
        return Response.json({ error: 'Contract is already bound to another payment' }, { status: 409 });
      }
    } else {
      contract = await db.VIPContractRecord.create({
        token: crypto.randomUUID(),
        serial_number: orderNumber,
        record_type: 'signed_contract',
        guest_name: customerName,
        venue_id: venueId,
        card_last_four: authoritativeLastFour,
        thumbprint_url: cleanText(body.contract?.thumbprint_url, 2000),
        guest_photo_url: cleanText(body.contract?.guest_photo_url, 2000),
        id_photo_url: cleanText(body.contract?.id_photo_url, 2000),
        id_photo_back_url: cleanText(body.contract?.id_photo_back_url, 2000),
        signed_at: new Date().toISOString(),
        used: true,
        status: 'signed',
        issued_by: user.email,
        mode: paymentRecord.mode,
        metadata: contractMetadata,
      });
    }

    if (!paymentRecord.linked_order_id) {
      await db.PaymentRecord.update(paymentRecord.id, { linked_order_id: order.id });
    }

    await audit(
      db,
      'NUPS_ORDER_FINALIZED_AFTER_PAYMENT',
      paymentRecord.record_id,
      `NUPS order ${orderNumber} finalized from confirmed payment evidence`,
      'low',
      user.email,
      {
        venue_id: venueId,
        order_id: order.id,
        contract_id: contract.id,
        order_number: orderNumber,
        provider_code: paymentRecord.provider_code,
        mode: paymentRecord.mode,
      },
    );

    return Response.json({
      success: true,
      idempotent: existingOrders.length > 0 && existingContracts.length > 0,
      order_id: order.id,
      contract_id: contract.id,
      contract_metadata: contract.metadata || contractMetadata,
      payment_record_id: paymentRecord.record_id,
      processor_reference: authoritativeProcessorReference,
    });
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error(`[${errorId}] NUPS order finalization failed:`, error);

    if (paymentRecord?.record_id && user?.email) {
      try {
        const base44 = createClientFromRequest(req);
        await audit(
          base44.asServiceRole.entities,
          'PAYMENT_RECONCILIATION_REQUIRED',
          paymentRecord.record_id,
          'Payment was confirmed but NUPS order finalization failed',
          'critical',
          user.email,
          {
            venue_id: venueId,
            order_id: order?.id || null,
            processor_reference: paymentRecord.processor_reference,
            retry_payment_prohibited: true,
            error_id: errorId,
          },
        );
      } catch {
        // The error ID remains available to support even if audit storage fails.
      }
    }

    return Response.json({
      success: false,
      payment_confirmed: Boolean(paymentRecord?.record_id),
      processor_reference: paymentRecord?.processor_reference || null,
      error: paymentRecord?.record_id
        ? 'Payment confirmed but order finalization failed. Do not charge again.'
        : 'Order finalization failed',
      error_id: errorId,
    }, { status: 500 });
  }
});
