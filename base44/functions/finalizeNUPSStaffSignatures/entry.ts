import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

/**
 * Venue-scoped post-service signature finalization for a paid NUPS order.
 * Identity remains observational until ID-01 clears, but the authenticated
 * actor, venue, order, contract, timestamp, and before/after state are audited.
 */

const ALLOWED_ROLES = ['admin', 'manager', 'staff'];

function cleanSignature(value) {
  return String(value || '').trim().slice(0, 500);
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
    console.error('[finalizeNUPSStaffSignatures] Audit write failed:', error?.message || error);
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    let user;
    try {
      user = await base44.auth.me();
    } catch {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!ALLOWED_ROLES.includes(user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let venueId;
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

    const orderId = String(body?.order_id || '').trim();
    const contractId = String(body?.contract_id || '').trim();
    const managerSignature = cleanSignature(body?.manager_signature);
    const hostessSignature = cleanSignature(body?.hostess_signature);

    if (!orderId || !contractId) {
      return Response.json({ error: 'order_id and contract_id are required' }, { status: 400 });
    }
    if (!managerSignature || !hostessSignature) {
      return Response.json({ error: 'Manager and hostess signatures are required' }, { status: 400 });
    }
    if (managerSignature.toLowerCase() === hostessSignature.toLowerCase()) {
      return Response.json({ error: 'Manager and hostess signatures must be distinct' }, { status: 422 });
    }

    const db = base44.asServiceRole.entities;
    const orders = await db.GlyphBucksOrder.filter({ id: orderId, venue_id: venueId }, null, 1);
    const contracts = await db.VIPContractRecord.filter({ id: contractId, venue_id: venueId }, null, 1);
    const order = orders?.[0] || null;
    const contract = contracts?.[0] || null;

    if (!order || !contract) {
      return Response.json({ error: 'Order or contract not found' }, { status: 404 });
    }
    if (order.status !== 'signed' || contract.status !== 'signed') {
      return Response.json({ error: 'Order and contract must be signed before staff finalization' }, { status: 409 });
    }
    if (contract.serial_number !== order.order_number) {
      return Response.json({ error: 'Contract does not belong to this order' }, { status: 409 });
    }
    if (
      contract.metadata?.payment_processor_reference &&
      contract.metadata.payment_processor_reference !== order.processor_reference
    ) {
      return Response.json({ error: 'Order and contract payment evidence do not match' }, { status: 409 });
    }

    const previousManager = order.manager_signature || contract.metadata?.manager_signature || null;
    const previousHostess = order.hostess_signature || contract.metadata?.hostess_signature || null;
    if (previousManager || previousHostess) {
      const same = previousManager === managerSignature && previousHostess === hostessSignature;
      if (!same) {
        return Response.json({ error: 'Staff signatures are already finalized' }, { status: 409 });
      }
      return Response.json({
        success: true,
        idempotent: true,
        order_id: order.id,
        contract_id: contract.id,
        contract_metadata: contract.metadata || {},
      });
    }

    const signedAt = new Date().toISOString();
    await db.GlyphBucksOrder.update(order.id, {
      manager_signature: managerSignature,
      hostess_signature: hostessSignature,
    });

    const contractMetadata = {
      ...(contract.metadata || {}),
      manager_signature: managerSignature,
      hostess_signature: hostessSignature,
      staff_signed_at: signedAt,
      signature_actor_ref: user.email,
      identity_verified: false,
    };
    await db.VIPContractRecord.update(contract.id, { metadata: contractMetadata });

    await audit(
      db,
      'NUPS_ORDER_STAFF_SIGNATURES_CAPTURED',
      order.order_number,
      `Manager and hostess signatures finalized for NUPS order ${order.order_number}`,
      'low',
      user.email,
      {
        venue_id: venueId,
        order_id: order.id,
        contract_id: contract.id,
        processor_reference: order.processor_reference || null,
        staff_signed_at: signedAt,
        identity_verified: false,
      },
    );

    return Response.json({
      success: true,
      order_id: order.id,
      contract_id: contract.id,
      contract_metadata: contractMetadata,
    });
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error(`[${errorId}] Staff signature finalization failed:`, error);
    return Response.json({
      success: false,
      error: 'Staff signature finalization failed',
      error_id: errorId,
    }, { status: 500 });
  }
});
