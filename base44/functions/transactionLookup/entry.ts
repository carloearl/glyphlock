import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const search_type = url.searchParams.get('type'); // 'transaction_id', 'barcode', 'approval_code', 'serial', etc.
    const search_value = url.searchParams.get('value');
    const venue_id = url.searchParams.get('venue_id');

    if (!search_type || !search_value) {
      return Response.json({ error: 'Missing search parameters' }, { status: 400 });
    }

    let transaction_id = null;
    let search_results = {};

    // Resolve transaction_id based on search type
    switch (search_type) {
      case 'transaction_id':
        transaction_id = search_value;
        break;

      case 'order_number':
        const order = await base44.asServiceRole.entities.DreamPalaceOrder.filter({
          order_number: search_value,
          venue_id
        });
        transaction_id = order[0]?.id;
        search_results.order = order[0];
        break;

      case 'barcode':
        const barcode_record = await base44.asServiceRole.entities.BarcodeRegistry.filter({
          barcode_id: search_value
        });
        transaction_id = barcode_record[0]?.transaction_id;
        search_results.barcode = barcode_record[0];
        break;

      case 'serial':
        const bill = await base44.asServiceRole.entities.DreamDollarBill.filter({
          serial_number: search_value,
          venue_id
        });
        transaction_id = bill[0]?.transaction_id;
        search_results.bill = bill[0];
        break;

      case 'approval_code':
        const batch_by_approval = await base44.asServiceRole.entities.DreamDollarBatch.filter({
          approval_code: search_value,
          venue_id
        });
        transaction_id = batch_by_approval[0]?.transaction_id;
        search_results.batch = batch_by_approval[0];
        break;

      default:
        return Response.json({ error: 'Invalid search type' }, { status: 400 });
    }

    if (!transaction_id) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Fetch all linked records
    const [
      order,
      batch,
      bills,
      identity,
      verification_media,
      evidence,
      audit_logs
    ] = await Promise.all([
      base44.asServiceRole.entities.DreamPalaceOrder.filter({ id: transaction_id }).then(r => r[0]),
      base44.asServiceRole.entities.DreamDollarBatch.filter({ transaction_id }),
      base44.asServiceRole.entities.DreamDollarBill.filter({ transaction_id }),
      base44.asServiceRole.entities.CustomerIdentity.filter({
        linked_transactions: { $elemMatch: transaction_id }
      }),
      base44.asServiceRole.entities.VerificationMedia.filter({ transaction_id }),
      base44.asServiceRole.entities.ChargebackEvidence.filter({ transaction_id }),
      base44.asServiceRole.entities.AuditEvent.filter({
        entity_id: transaction_id
      }, '-timestamp', 20)
    ]);

    return Response.json({
      success: true,
      transaction_id,
      search_type,
      search_value,
      records: {
        order,
        batch: batch[0] || null,
        bills,
        identity: identity[0] || null,
        verification_media,
        evidence: evidence[0] || null,
        audit_logs
      },
      summary: {
        bills_issued: bills.length,
        bills_redeemed: bills.filter(b => b.status === 'redeemed').length,
        verification_media_count: verification_media.length,
        has_id_scan: !!identity[0],
        has_evidence_package: !!evidence[0]
      }
    });

  } catch (error) {
    console.error('Transaction lookup error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});