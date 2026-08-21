import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

const ALLOWED_ROLES = new Set(['PLATFORM_ADMIN', 'VENUE_OWNER', 'VENUE_MANAGER', 'SOVEREIGN']);
const GLOBAL_ROLES = new Set(['PLATFORM_ADMIN', 'SOVEREIGN']);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) return Response.json({ error: 'Authentication required' }, { status: 401 });

    const E = base44.asServiceRole.entities;
    const email = String(user.email).toLowerCase();
    const nupsUser = (await E.NUPSUser.filter({ platform_email: email, status: 'active' }, null, 1).catch(() => []))?.[0]
      || (await E.NUPSUser.filter({ username: email.split('@')[0], status: 'active' }, null, 1).catch(() => []))?.[0]
      || null;
    if (!nupsUser || !ALLOWED_ROLES.has(nupsUser.role)) {
      return Response.json({ error: 'Manager-class NUPS identity required' }, { status: 403 });
    }

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const url = new URL(req.url);
    const searchType = String(body.type || body.search_type || url.searchParams.get('type') || '').trim();
    const searchValue = String(body.value || body.search_value || url.searchParams.get('value') || '').trim();
    const requestedVenue = String(body.venue_id || url.searchParams.get('venue_id') || '').trim();
    if (!searchType || !searchValue) return Response.json({ error: 'Search type and value are required' }, { status: 400 });

    const global = GLOBAL_ROLES.has(nupsUser.role);
    const venueId = global && requestedVenue ? requestedVenue : String(nupsUser.venue_id || '').trim();
    if (!venueId) return Response.json({ error: 'Authorized venue could not be resolved' }, { status: 403 });
    if (!global && requestedVenue && requestedVenue !== venueId) {
      return Response.json({ error: 'Cross-venue transaction search denied' }, { status: 403 });
    }
    const venue = (await E.Venue.filter({ venue_id: venueId, status: 'active' }, null, 1).catch(() => []))?.[0]
      || await E.Venue.get(venueId).catch(() => null);
    if (!venue || venue.status === 'inactive') return Response.json({ error: 'Authorized venue is not active' }, { status: 403 });
    const resolvedVenueId = venue.venue_id || venue.id;

    const first = async (entityName, filter) => {
      const entity = E[entityName];
      if (!entity?.filter) return null;
      return (await entity.filter(filter, null, 1).catch(() => []))?.[0] || null;
    };
    const list = async (entityName, filter, sort = null, limit = 200) => {
      const entity = E[entityName];
      if (!entity?.filter) return [];
      return await entity.filter(filter, sort, limit).catch(() => []);
    };
    const get = async (entityName, id) => {
      const entity = E[entityName];
      if (!entity?.get) return null;
      return await entity.get(id).catch(() => null);
    };

    let transactionId = null;
    let resolvedOrder = null;
    let resolvedBatch = null;
    let resolvedBill = null;

    if (searchType === 'transaction_id') {
      transactionId = searchValue;
    } else if (searchType === 'order_number') {
      resolvedOrder = await first('GlyphBucksOrder', { order_number: searchValue, venue_id: resolvedVenueId })
        || await first('DreamPalaceOrder', { order_number: searchValue, venue_id: resolvedVenueId });
      transactionId = resolvedOrder?.id || null;
    } else if (searchType === 'barcode') {
      resolvedBill = await first('GlyphBucksBill', { barcode_number: searchValue, venue_id: resolvedVenueId });
      const registry = resolvedBill ? null : await first('BarcodeRegistry', { barcode_id: searchValue, venue_id: resolvedVenueId });
      transactionId = resolvedBill?.transaction_id || registry?.transaction_id || null;
    } else if (searchType === 'serial') {
      resolvedBill = await first('GlyphBucksBill', { serial_number: searchValue, venue_id: resolvedVenueId })
        || await first('DreamDollarBill', { serial_number: searchValue, venue_id: resolvedVenueId });
      transactionId = resolvedBill?.transaction_id || null;
    } else if (searchType === 'approval_code') {
      resolvedBatch = await first('GlyphBucksBatch', { approval_code: searchValue, venue_id: resolvedVenueId })
        || await first('DreamDollarBatch', { approval_code: searchValue, venue_id: resolvedVenueId });
      transactionId = resolvedBatch?.transaction_id || null;
    } else {
      return Response.json({ error: 'Invalid search type' }, { status: 400 });
    }

    if (!transactionId) return Response.json({ error: 'Transaction not found' }, { status: 404 });

    if (!resolvedOrder) {
      const candidate = await get('GlyphBucksOrder', transactionId)
        || await get('DreamPalaceOrder', transactionId);
      if (candidate?.venue_id === resolvedVenueId) resolvedOrder = candidate;
    }
    if (!resolvedBatch) {
      resolvedBatch = await first('GlyphBucksBatch', { transaction_id: transactionId, venue_id: resolvedVenueId })
        || await first('DreamDollarBatch', { transaction_id: transactionId, venue_id: resolvedVenueId });
    }

    const [bills, identities, verificationMedia, evidenceRows, auditRows] = await Promise.all([
      list('GlyphBucksBill', { transaction_id: transactionId, venue_id: resolvedVenueId }),
      list('CustomerIdentity', { linked_transactions: { $elemMatch: transactionId }, venue_id: resolvedVenueId }, null, 1),
      list('VerificationMedia', { transaction_id: transactionId, venue_id: resolvedVenueId }),
      list('ChargebackEvidence', { transaction_id: transactionId, venue_id: resolvedVenueId }, '-package_generated_at', 1),
      list('AuditEvent', { entity_id: transactionId, venue_id: resolvedVenueId }, '-timestamp', 20),
    ]);

    const safeOrder = resolvedOrder ? {
      id: resolvedOrder.id,
      order_number: resolvedOrder.order_number,
      customer_name: resolvedOrder.customer_name,
      card_last_four: resolvedOrder.card_last_four || null,
      status: resolvedOrder.status,
      signed_at: resolvedOrder.signed_at || null,
      printed_at: resolvedOrder.printed_at || null,
    } : null;
    const safeBatch = resolvedBatch ? {
      id: resolvedBatch.id,
      batch_id: resolvedBatch.batch_id,
      total_face_value: resolvedBatch.total_face_value,
      total_charged: resolvedBatch.total_charged,
      approval_code: resolvedBatch.approval_code || null,
      processor_reference: resolvedBatch.processor_reference || null,
      status: resolvedBatch.status,
      issued_at: resolvedBatch.issued_at || null,
    } : null;
    const safeBills = bills.map((bill) => ({
      id: bill.id,
      serial_number: bill.serial_number,
      denomination: bill.denomination,
      status: bill.status,
      issued_at: bill.issued_at || null,
      redeemed_at: bill.redeemed_at || null,
    }));
    const safeVerificationMedia = verificationMedia.map((media) => ({
      id: media.id,
      media_id: media.media_id,
      verification_type: media.verification_type,
      media_type: media.media_type,
      protected_evidence_id: media.protected_evidence_id || null,
      has_legacy_reference: !!media.media_url,
      capture_timestamp: media.capture_timestamp,
      upload_status: media.upload_status,
    }));
    const safeEvidence = evidenceRows[0] ? {
      id: evidenceRows[0].id,
      evidence_id: evidenceRows[0].evidence_id,
      status: evidenceRows[0].status,
      package_generated_at: evidenceRows[0].package_generated_at,
    } : null;
    const safeAudit = auditRows.map((event) => ({
      id: event.id,
      event_type: event.event_type || event.action,
      severity: event.severity,
      timestamp: event.timestamp,
      description: event.description,
    }));

    await E.SystemAuditLog.create({
      event_type: 'TRANSACTION_LOOKUP',
      description: `Authorized transaction lookup in venue ${resolvedVenueId}`,
      actor_email: user.email,
      status: 'success',
      severity: 'low',
      metadata: { venue_id: resolvedVenueId, search_type: searchType, transaction_id: transactionId },
    }).catch(() => null);

    return Response.json({
      success: true,
      transaction_id: transactionId,
      search_type: searchType,
      venue_id: resolvedVenueId,
      records: {
        order: safeOrder,
        batch: safeBatch,
        bills: safeBills,
        identity: identities[0] ? { present: true, status: identities[0].status || null } : null,
        verification_media: safeVerificationMedia,
        evidence: safeEvidence,
        audit_logs: safeAudit,
      },
      summary: {
        bills_issued: safeBills.length,
        bills_redeemed: safeBills.filter((bill) => bill.status === 'redeemed').length,
        verification_media_count: safeVerificationMedia.length,
        has_id_scan: identities.length > 0,
        has_evidence_package: !!safeEvidence,
      },
    });
  } catch (error) {
    console.error('Transaction lookup error:', error);
    return Response.json({ error: error?.message || 'Transaction lookup failed' }, { status: 500 });
  }
});
