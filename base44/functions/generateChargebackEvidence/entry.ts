import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const payload = await req.json();
    const {
      transaction_id,
      dispute_id,
      venue_id
    } = payload;

    // Fetch all related records
    const [order, batch, identity, verification_media] = await Promise.all([
      base44.asServiceRole.entities.GlyphBucksOrder.filter({ order_number: transaction_id }).then(r => r[0]).catch(() => null),
      base44.asServiceRole.entities.POSBatch.filter({ batch_id: transaction_id }).then(r => r[0]).catch(() => null),
      base44.asServiceRole.entities.CustomerIdentity.filter({ transaction_id }).then(r => r[0]).catch(() => null),
      base44.asServiceRole.entities.VerificationMedia.filter({ transaction_id }).catch(() => [])
    ]);

    if (!order) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Compile evidence URLs
    const receipt_url = order.signed_hardcopy_url || null;
    const contract_url = order.signed_hardcopy_url || null;
    const id_scan_urls = identity ? [identity.id_scan_front_url, identity.id_scan_back_url].filter(Boolean) : [];
    const verification_media_urls = verification_media.map(m => m.media_url);

    // Generate evidence package ID
    const evidence_id = `EVIDENCE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create ChargebackEvidence record
    const evidence = await base44.asServiceRole.entities.ChargebackEvidence.create({
      evidence_id,
      transaction_id,
      dispute_id,
      venue_id,
      package_generated_at: new Date().toISOString(),
      generated_by: user.email,
      receipt_url,
      contract_url,
      id_scan_urls,
      verification_media_urls,
      approval_code: order.approval_code,
      processor_reference: batch?.processor_reference,
      status: 'draft',
      notes: `Evidence package for transaction ${transaction_id}`
    });

    // TODO: Generate PDF compilation of all evidence
    // const pdf_result = await compilePDFEvidence(evidence);
    // await base44.asServiceRole.entities.ChargebackEvidence.update(evidence.id, {
    //   evidence_pdf_url: pdf_result.url,
    //   evidence_hash: pdf_result.hash
    // });

    // Create audit log
    await base44.asServiceRole.entities.AuditEvent.create({
      event_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      actor_id: user.email,
      actor_role: user.role,
      venue_id,
      entity_type: 'ChargebackEvidence',
      entity_id: evidence_id,
      action: 'CREATE',
      after_state: JSON.stringify({
        transaction_id,
        dispute_id,
        evidence_items: id_scan_urls.length + verification_media_urls.length + 2
      }),
      description: `Chargeback evidence package generated for transaction ${transaction_id}`
    });

    return Response.json({
      success: true,
      evidence,
      summary: {
        receipt: !!receipt_url,
        contract: !!contract_url,
        id_scans: id_scan_urls.length,
        verification_media: verification_media_urls.length,
        approval_code: !!order.approval_code
      }
    });

  } catch (error) {
    console.error('Evidence generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});