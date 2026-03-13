import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * VERIFICATION TOKEN GENERATOR
 * Creates secure tokens for protocol verification engagements
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const {
      organization_name,
      organization_email,
      organization_domain,
      engagement_type
    } = await req.json();

    if (!organization_name || !organization_email || !engagement_type) {
      return Response.json({
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Check cohort availability for founding_cohort
    if (engagement_type === 'founding_cohort') {
      const existing_cohort = await base44.asServiceRole.entities.VerificationToken.filter({
        engagement_type: 'founding_cohort',
        payment_status: { $in: ['pending', 'paid'] }
      });

      if (existing_cohort.length >= 5) {
        return Response.json({
          success: false,
          error: 'Founding Cohort is full (5/5 slots filled)',
          alternative: 'standard_verification'
        }, { status: 400 });
      }
    }

    // Determine engagement fee
    const engagement_fee = engagement_type === 'founding_cohort' ? 6500 : null;

    // Generate secure token
    const token_id = `VER-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().split('-')[0].toUpperCase()}`;

    // Create token record
    const token = await base44.asServiceRole.entities.VerificationToken.create({
      token_id,
      organization_name,
      organization_email,
      organization_domain,
      engagement_type,
      engagement_fee,
      payment_status: 'pending',
      verification_status: 'requested',
      alignment_tier: 'pending',
      credential_eligibility: 'pending',
      cohort_position: engagement_type === 'founding_cohort' ? existing_cohort.length + 1 : null
    });

    // Send confirmation email
    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'GlyphLock Protocol Verification',
      to: organization_email,
      subject: `Verification Engagement Request Received — ${token_id}`,
      body: `
        <h2>Protocol Verification Engagement</h2>
        <p><strong>Organization:</strong> ${organization_name}</p>
        <p><strong>Engagement Type:</strong> ${engagement_type === 'founding_cohort' ? 'Founding Cohort Verification ($6,500)' : 'Standard Verification'}</p>
        <p><strong>Token ID:</strong> ${token_id}</p>
        <hr>
        <h3>Next Steps:</h3>
        <ol>
          <li>Complete payment authorization (invoice will be sent separately)</li>
          <li>Submit required documentation package</li>
          <li>Schedule 90-minute verification session</li>
        </ol>
        <p>You will receive your verification report and alignment tier determination within 48 hours of session completion.</p>
        <hr>
        <small>GlyphLock Master Covenant Framework | ${new Date().getFullYear()}</small>
      `
    });

    // Log engagement request
    await base44.asServiceRole.entities.AuditEvent.create({
      event_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      actor_id: organization_email,
      actor_role: 'external_org',
      entity_type: 'VerificationToken',
      entity_id: token_id,
      action: 'CREATED',
      severity: 'INFO',
      description: `Verification engagement requested: ${organization_name} (${engagement_type})`
    });

    return Response.json({
      success: true,
      token_id,
      engagement_type,
      engagement_fee,
      cohort_position: token.cohort_position,
      message: 'Verification request submitted successfully'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});